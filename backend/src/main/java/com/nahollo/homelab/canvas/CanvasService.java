package com.nahollo.homelab.canvas;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class CanvasService {

	private static final int CANVAS_SIZE = 512;
	private static final int DEFAULT_COLOR = 0xF8F6F0;
	private static final int THUMBNAIL_SIZE = 64;
	private static final long COOLDOWN_SECONDS = Duration.ofMinutes(5).getSeconds();
	private static final ZoneId SEASON_ZONE = ZoneId.of("Asia/Seoul");

	private final JdbcTemplate jdbcTemplate;
	private final TransactionTemplate transactionTemplate;
	private final String ipSalt;
	private final Object seasonLifecycleLock = new Object();

	public CanvasService(
		JdbcTemplate jdbcTemplate,
		PlatformTransactionManager transactionManager,
		@Value("${app.canvas.ip-salt:nahollo-canvas}") String ipSalt
	) {
		this.jdbcTemplate = jdbcTemplate;
		this.transactionTemplate = new TransactionTemplate(transactionManager);
		this.ipSalt = ipSalt;
	}

	public CanvasStateResponse readCurrent() {
		CanvasSeasonRecord season = ensureCurrentSeason();
		return new CanvasStateResponse(
			season.toSummary(),
			season.width(),
			season.height(),
			loadPixels(season.id()),
			Instant.now(),
			"live",
			countEvents(season.id())
		);
	}

	public CanvasCooldownResponse readCooldown(String ipAddress) {
		ensureCurrentSeason();
		Instant now = Instant.now();
		String ipHash = hashIp(ipAddress);

		try {
			CooldownRecord cooldown = jdbcTemplate.queryForObject(
				"""
				SELECT next_place_at, last_place_at
				FROM canvas_cooldowns
				WHERE ip_hash = ?
				""",
				(resultSet, rowNum) -> new CooldownRecord(
					readInstant(resultSet, "next_place_at"),
					readInstant(resultSet, "last_place_at")
				),
				ipHash
			);

			long remaining = cooldown == null ? 0 : Math.max(0, Duration.between(now, cooldown.nextPlaceAt()).getSeconds());
			Instant nextPlaceAt = cooldown == null ? now : cooldown.nextPlaceAt();
			return new CanvasCooldownResponse(remaining <= 0, remaining, nextPlaceAt, now);
		} catch (EmptyResultDataAccessException exception) {
			return new CanvasCooldownResponse(true, 0, now, now);
		}
	}

	public CanvasPixelMetaResponse readPixelMeta(int x, int y) {
		CanvasSeasonRecord season = ensureCurrentSeason();

		PixelRow pixel = jdbcTemplate.queryForObject(
			"""
			SELECT color_int, nickname, placed_at
			FROM canvas_pixels
			WHERE season_id = ? AND x = ? AND y = ?
			""",
			(resultSet, rowNum) -> new PixelRow(
				resultSet.getInt("color_int"),
				resultSet.getString("nickname"),
				readInstant(resultSet, "placed_at")
			),
			season.id(),
			x,
			y
		);

		Integer overwrittenCount = jdbcTemplate.queryForObject(
			"""
			SELECT COUNT(*)
			FROM canvas_pixel_events
			WHERE season_id = ? AND x = ? AND y = ?
			""",
			Integer.class,
			season.id(),
			x,
			y
		);

		String nickname = pixel.nickname() == null || pixel.nickname().isBlank() ? "Anonymous" : pixel.nickname();
		return new CanvasPixelMetaResponse(x, y, nickname, pixel.color(), pixel.placedAt(), overwrittenCount == null ? 0 : overwrittenCount);
	}

	public List<CanvasSnapshot> readHistory(int page, int size) {
		ensureCurrentSeason();
		int offset = page * size;

		List<CanvasSeasonRecord> seasons = jdbcTemplate.query(
			"""
			SELECT id, season_code, title, status, width, height, starts_at, ends_at, archived_at
			FROM canvas_seasons
			WHERE status = 'archived'
			ORDER BY starts_at DESC
			LIMIT ? OFFSET ?
			""",
			this::mapSeasonRecord,
			size,
			offset
		);

		return seasons.stream().map(this::mapHistorySnapshot).toList();
	}

	public CanvasHistoryDetailResponse readHistoryDetail(String seasonCode) {
		ensureCurrentSeason();
		CanvasSeasonRecord season = findSeasonByCode(seasonCode);
		if (season == null) {
			throw new IllegalArgumentException("해당 시즌을 찾을 수 없습니다.");
		}

		HistoryAssetRecord asset = findHistoryAsset(season.id());
		List<Integer> dominantColors = asset == null ? dominantColorsForSeason(season.id()) : asset.dominantColors();
		int pixelCount = asset == null ? countEvents(season.id()) : asset.pixelCount();
		int participantCount = asset == null ? countParticipants(season.id()) : asset.participantCount();

		return new CanvasHistoryDetailResponse(
			season.seasonCode(),
			season.title(),
			season.startsAt(),
			season.endsAt(),
			season.archivedAt(),
			season.width(),
			season.height(),
			pixelCount,
			participantCount,
			dominantColors,
			null,
			loadPixels(season.id())
		);
	}

	public CanvasPlacementResponse placePixel(CanvasPixelPlacementRequest request, String ipAddress) {
		CanvasSeasonRecord season = ensureCurrentSeason();
		Instant now = Instant.now();

		if (!"live".equalsIgnoreCase(season.status()) || now.isAfter(season.endsAt())) {
			return new CanvasPlacementResponse(false, "SEASON_CLOSED", 0, now, now, null);
		}

		return transactionTemplate.execute(status -> placePixelTransactional(season, request, ipAddress, now));
	}

	private CanvasPlacementResponse placePixelTransactional(
		CanvasSeasonRecord season,
		CanvasPixelPlacementRequest request,
		String ipAddress,
		Instant now
	) {
		String ipHash = hashIp(ipAddress);
		String nickname = normalizeNickname(request.nickname());

		CooldownRecord cooldown = findCooldownForUpdate(ipHash);
		if (cooldown != null && now.isBefore(cooldown.nextPlaceAt())) {
			long remaining = Math.max(0, Duration.between(now, cooldown.nextPlaceAt()).getSeconds());
			return new CanvasPlacementResponse(false, "COOLDOWN_ACTIVE", remaining, cooldown.nextPlaceAt(), now, null);
		}

		PixelLockRow currentPixel = jdbcTemplate.queryForObject(
			"""
			SELECT color_int, version
			FROM canvas_pixels
			WHERE season_id = ? AND x = ? AND y = ?
			FOR UPDATE
			""",
			(resultSet, rowNum) -> new PixelLockRow(resultSet.getInt("color_int"), resultSet.getInt("version")),
			season.id(),
			request.x(),
			request.y()
		);

		int newColor = request.color();
		jdbcTemplate.update(
			"""
			UPDATE canvas_pixels
			SET color_int = ?, nickname = ?, placed_at = ?, placed_by_ip_hash = ?, version = ?
			WHERE season_id = ? AND x = ? AND y = ?
			""",
			newColor,
			nickname,
			Timestamp.from(now),
			ipHash,
			currentPixel.version() + 1,
			season.id(),
			request.x(),
			request.y()
		);

		jdbcTemplate.update(
			"""
			INSERT INTO canvas_pixel_events (season_id, x, y, prev_color_int, new_color_int, nickname, ip_hash, placed_at, request_id)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
			""",
			season.id(),
			request.x(),
			request.y(),
			currentPixel.color(),
			newColor,
			nickname,
			ipHash,
			Timestamp.from(now),
			UUID.randomUUID()
		);

		Instant nextPlaceAt = now.plusSeconds(COOLDOWN_SECONDS);
		int updated = jdbcTemplate.update(
			"""
			UPDATE canvas_cooldowns
			SET next_place_at = ?, last_place_at = ?, updated_at = ?
			WHERE ip_hash = ?
			""",
			Timestamp.from(nextPlaceAt),
			Timestamp.from(now),
			Timestamp.from(now),
			ipHash
		);
		if (updated == 0) {
			jdbcTemplate.update(
				"""
				INSERT INTO canvas_cooldowns (ip_hash, next_place_at, last_place_at, updated_at)
				VALUES (?, ?, ?, ?)
				""",
				ipHash,
				Timestamp.from(nextPlaceAt),
				Timestamp.from(now),
				Timestamp.from(now)
			);
		}

		Integer overwrittenCount = jdbcTemplate.queryForObject(
			"""
			SELECT COUNT(*)
			FROM canvas_pixel_events
			WHERE season_id = ? AND x = ? AND y = ?
			""",
			Integer.class,
			season.id(),
			request.x(),
			request.y()
		);

		CanvasPixelUpdate update = new CanvasPixelUpdate(
			"pixel_updated",
			season.seasonCode(),
			request.x(),
			request.y(),
			newColor,
			nickname,
			now,
			overwrittenCount == null ? 1 : overwrittenCount
		);

		return new CanvasPlacementResponse(true, "OK", COOLDOWN_SECONDS, nextPlaceAt, now, update);
	}

	private CanvasSeasonRecord ensureCurrentSeason() {
		synchronized (seasonLifecycleLock) {
			Instant now = Instant.now();
			CanvasSeasonRecord liveSeason = findLiveSeason();

			if (liveSeason != null && now.isAfter(liveSeason.endsAt())) {
				archiveSeason(liveSeason, now);
				liveSeason = null;
			}

			YearMonth currentMonth = YearMonth.from(ZonedDateTime.ofInstant(now, SEASON_ZONE));
			CanvasSeasonRecord currentSeason = findSeasonByCode(currentMonth.toString());
			if (currentSeason == null) {
				currentSeason = createSeason(currentMonth);
			}

			if (!"live".equalsIgnoreCase(currentSeason.status())) {
				jdbcTemplate.update("UPDATE canvas_seasons SET status = 'live' WHERE id = ?", currentSeason.id());
				currentSeason = findSeasonByCode(currentMonth.toString());
			}

			return currentSeason;
		}
	}

	private CanvasSeasonRecord createSeason(YearMonth month) {
		UUID seasonId = UUID.randomUUID();
		ZonedDateTime startsAt = month.atDay(1).atStartOfDay(SEASON_ZONE);
		ZonedDateTime endsAt = month.atEndOfMonth().atTime(23, 59, 59).atZone(SEASON_ZONE);
		String title = month.getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH).toUpperCase(Locale.ENGLISH) + " " + month.getYear();

		jdbcTemplate.update(
			"""
			INSERT INTO canvas_seasons (id, season_code, title, width, height, status, starts_at, ends_at, created_at)
			VALUES (?, ?, ?, ?, ?, 'live', ?, ?, ?)
			""",
			seasonId,
			month.toString(),
			title,
			CANVAS_SIZE,
			CANVAS_SIZE,
			Timestamp.from(startsAt.toInstant()),
			Timestamp.from(endsAt.toInstant()),
			Timestamp.from(Instant.now())
		);

		List<Object[]> rows = new ArrayList<>(CANVAS_SIZE * CANVAS_SIZE);
		for (int y = 0; y < CANVAS_SIZE; y += 1) {
			for (int x = 0; x < CANVAS_SIZE; x += 1) {
				rows.add(new Object[] { seasonId, x, y, DEFAULT_COLOR, 0 });
			}
		}
		jdbcTemplate.batchUpdate(
			"""
			INSERT INTO canvas_pixels (season_id, x, y, color_int, version)
			VALUES (?, ?, ?, ?, ?)
			""",
			rows
		);

		return findSeasonByCode(month.toString());
	}

	private void archiveSeason(CanvasSeasonRecord season, Instant archivedAt) {
		int[] pixels = loadPixels(season.id());
		int pixelCount = countEvents(season.id());
		int participantCount = countParticipants(season.id());
		List<Integer> dominantColors = dominantColorsForSeason(season.id());
		String thumbnailPixels = serializeIntArray(generateThumbnail(pixels, season.width(), season.height(), THUMBNAIL_SIZE));
		String dominantColorText = serializeList(dominantColors);

		Integer existing = jdbcTemplate.queryForObject(
			"SELECT COUNT(*) FROM canvas_history_assets WHERE season_id = ?",
			Integer.class,
			season.id()
		);

		if (existing != null && existing > 0) {
			jdbcTemplate.update(
				"""
				UPDATE canvas_history_assets
				SET thumbnail_pixels = ?, pixel_count = ?, participant_count = ?, dominant_colors = ?, generated_at = ?
				WHERE season_id = ?
				""",
				thumbnailPixels,
				pixelCount,
				participantCount,
				dominantColorText,
				Timestamp.from(archivedAt),
				season.id()
			);
		} else {
			jdbcTemplate.update(
				"""
				INSERT INTO canvas_history_assets (season_id, thumbnail_pixels, pixel_count, participant_count, dominant_colors, generated_at)
				VALUES (?, ?, ?, ?, ?, ?)
				""",
				season.id(),
				thumbnailPixels,
				pixelCount,
				participantCount,
				dominantColorText,
				Timestamp.from(archivedAt)
			);
		}

		jdbcTemplate.update(
			"UPDATE canvas_seasons SET status = 'archived', archived_at = ? WHERE id = ?",
			Timestamp.from(archivedAt),
			season.id()
		);
	}

	private CanvasSeasonRecord findLiveSeason() {
		List<CanvasSeasonRecord> seasons = jdbcTemplate.query(
			"""
			SELECT id, season_code, title, status, width, height, starts_at, ends_at, archived_at
			FROM canvas_seasons
			WHERE status = 'live'
			ORDER BY starts_at DESC
			""",
			this::mapSeasonRecord
		);
		return seasons.isEmpty() ? null : seasons.get(0);
	}

	private CanvasSeasonRecord findSeasonByCode(String seasonCode) {
		try {
			return jdbcTemplate.queryForObject(
				"""
				SELECT id, season_code, title, status, width, height, starts_at, ends_at, archived_at
				FROM canvas_seasons
				WHERE season_code = ?
				""",
				this::mapSeasonRecord,
				seasonCode
			);
		} catch (EmptyResultDataAccessException exception) {
			return null;
		}
	}

	private HistoryAssetRecord findHistoryAsset(UUID seasonId) {
		try {
			return jdbcTemplate.queryForObject(
				"""
				SELECT thumbnail_pixels, pixel_count, participant_count, dominant_colors
				FROM canvas_history_assets
				WHERE season_id = ?
				""",
				(resultSet, rowNum) -> new HistoryAssetRecord(
					deserializeIntArray(resultSet.getString("thumbnail_pixels")),
					resultSet.getInt("pixel_count"),
					resultSet.getInt("participant_count"),
					deserializeIntList(resultSet.getString("dominant_colors"))
				),
				seasonId
			);
		} catch (EmptyResultDataAccessException exception) {
			return null;
		}
	}

	private CooldownRecord findCooldownForUpdate(String ipHash) {
		try {
			return jdbcTemplate.queryForObject(
				"""
				SELECT next_place_at, last_place_at
				FROM canvas_cooldowns
				WHERE ip_hash = ?
				FOR UPDATE
				""",
				(resultSet, rowNum) -> new CooldownRecord(
					readInstant(resultSet, "next_place_at"),
					readInstant(resultSet, "last_place_at")
				),
				ipHash
			);
		} catch (EmptyResultDataAccessException exception) {
			return null;
		}
	}

	private CanvasSnapshot mapHistorySnapshot(CanvasSeasonRecord season) {
		HistoryAssetRecord asset = findHistoryAsset(season.id());
		return new CanvasSnapshot(
			season.seasonCode(),
			season.title(),
			season.startsAt(),
			season.endsAt(),
			season.archivedAt(),
			season.width(),
			season.height(),
			asset == null ? countEvents(season.id()) : asset.pixelCount(),
			asset == null ? countParticipants(season.id()) : asset.participantCount(),
			asset == null ? dominantColorsForSeason(season.id()) : asset.dominantColors(),
			asset == null ? generateThumbnail(loadPixels(season.id()), season.width(), season.height(), THUMBNAIL_SIZE) : asset.thumbnailPixels()
		);
	}

	private int[] loadPixels(UUID seasonId) {
		int[] pixels = new int[CANVAS_SIZE * CANVAS_SIZE];
		Arrays.fill(pixels, DEFAULT_COLOR);

		jdbcTemplate.query(
			"""
			SELECT x, y, color_int
			FROM canvas_pixels
			WHERE season_id = ?
			ORDER BY y ASC, x ASC
			""",
			resultSet -> {
				int x = resultSet.getInt("x");
				int y = resultSet.getInt("y");
				pixels[y * CANVAS_SIZE + x] = resultSet.getInt("color_int");
			},
			seasonId
		);

		return pixels;
	}

	private int countEvents(UUID seasonId) {
		Integer count = jdbcTemplate.queryForObject(
			"SELECT COUNT(*) FROM canvas_pixel_events WHERE season_id = ?",
			Integer.class,
			seasonId
		);
		return count == null ? 0 : count;
	}

	private int countParticipants(UUID seasonId) {
		Integer count = jdbcTemplate.queryForObject(
			"SELECT COUNT(DISTINCT ip_hash) FROM canvas_pixel_events WHERE season_id = ?",
			Integer.class,
			seasonId
		);
		return count == null ? 0 : count;
	}

	private List<Integer> dominantColorsForSeason(UUID seasonId) {
		return jdbcTemplate.query(
			"""
			SELECT color_int
			FROM canvas_pixels
			WHERE season_id = ?
			GROUP BY color_int
			ORDER BY COUNT(*) DESC, color_int ASC
			LIMIT 4
			""",
			(resultSet, rowNum) -> resultSet.getInt("color_int"),
			seasonId
		);
	}

	private CanvasSeasonRecord mapSeasonRecord(ResultSet resultSet, int rowNum) throws SQLException {
		return new CanvasSeasonRecord(
			resultSet.getObject("id", UUID.class),
			resultSet.getString("season_code"),
			resultSet.getString("title"),
			resultSet.getString("status"),
			resultSet.getInt("width"),
			resultSet.getInt("height"),
			readInstant(resultSet, "starts_at"),
			readInstant(resultSet, "ends_at"),
			readInstant(resultSet, "archived_at")
		);
	}

	private Instant readInstant(ResultSet resultSet, String columnName) throws SQLException {
		Timestamp timestamp = resultSet.getTimestamp(columnName);
		return timestamp == null ? null : timestamp.toInstant();
	}

	private String normalizeNickname(String nickname) {
		if (nickname == null || nickname.trim().isBlank()) {
			return "Anonymous";
		}

		String normalized = nickname.trim();
		return normalized.length() > 32 ? normalized.substring(0, 32) : normalized;
	}

	private String hashIp(String ipAddress) {
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			byte[] hashed = digest.digest((ipSalt + ":" + ipAddress).getBytes(StandardCharsets.UTF_8));
			return HexFormat.of().formatHex(hashed);
		} catch (NoSuchAlgorithmException exception) {
			throw new IllegalStateException("SHA-256 해시를 사용할 수 없습니다.", exception);
		}
	}

	private int[] generateThumbnail(int[] pixels, int width, int height, int thumbnailSize) {
		int[] thumbnail = new int[thumbnailSize * thumbnailSize];
		for (int ty = 0; ty < thumbnailSize; ty += 1) {
			for (int tx = 0; tx < thumbnailSize; tx += 1) {
				int sourceX = Math.min(width - 1, (int) Math.floor((tx / (double) thumbnailSize) * width));
				int sourceY = Math.min(height - 1, (int) Math.floor((ty / (double) thumbnailSize) * height));
				thumbnail[ty * thumbnailSize + tx] = pixels[sourceY * width + sourceX];
			}
		}
		return thumbnail;
	}

	private String serializeList(List<Integer> values) {
		return values.stream().map(String::valueOf).collect(Collectors.joining(","));
	}

	private String serializeIntArray(int[] values) {
		return Arrays.stream(values).mapToObj(String::valueOf).collect(Collectors.joining(","));
	}

	private List<Integer> deserializeIntList(String raw) {
		if (raw == null || raw.isBlank()) {
			return List.of();
		}

		return Arrays.stream(raw.split(","))
			.filter(token -> !token.isBlank())
			.map(Integer::parseInt)
			.toList();
	}

	private int[] deserializeIntArray(String raw) {
		if (raw == null || raw.isBlank()) {
			return new int[0];
		}

		return Arrays.stream(raw.split(","))
			.filter(token -> !token.isBlank())
			.mapToInt(Integer::parseInt)
			.toArray();
	}

	private record CanvasSeasonRecord(
		UUID id,
		String seasonCode,
		String title,
		String status,
		int width,
		int height,
		Instant startsAt,
		Instant endsAt,
		Instant archivedAt
	) {
		private CanvasSeasonSummary toSummary() {
			return new CanvasSeasonSummary(seasonCode, title, status, startsAt, endsAt);
		}
	}

	private record PixelRow(int color, String nickname, Instant placedAt) {
	}

	private record PixelLockRow(int color, int version) {
	}

	private record CooldownRecord(Instant nextPlaceAt, Instant lastPlaceAt) {
	}

	private record HistoryAssetRecord(int[] thumbnailPixels, int pixelCount, int participantCount, List<Integer> dominantColors) {
	}
}
