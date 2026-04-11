package com.nahollo.homelab.domain.canvas.infrastructure.websocket;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

import com.nahollo.homelab.domain.canvas.dto.CanvasPixelUpdate;

import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
public class CanvasWebSocketHandler extends TextWebSocketHandler {

	private final Set<WebSocketSession> sessions = ConcurrentHashMap.newKeySet();
	private final JdbcTemplate jdbcTemplate;
	private final AtomicLong lastObservedEventId = new AtomicLong(0L);
	private volatile boolean initializationDone;

	public CanvasWebSocketHandler(JdbcTemplate jdbcTemplate) {
		this.jdbcTemplate = jdbcTemplate;
	}

	@Override
	public void afterConnectionEstablished(WebSocketSession session) {
		ensureInitialized();
		sessions.add(session);
	}

	@Override
	public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
		sessions.remove(session);
	}

	public void broadcast(CanvasPixelUpdate update) {
		lastObservedEventId.accumulateAndGet(update.eventId(), Math::max);
		TextMessage message = new TextMessage(toJson(update));

		sessions.removeIf(session -> !session.isOpen());
		for (WebSocketSession session : sessions) {
			try {
				session.sendMessage(message);
			} catch (Exception exception) {
				sessions.remove(session);
			}
		}
	}

	private String toJson(CanvasPixelUpdate update) {
		return "{"
			+ "\"eventId\":" + update.eventId()
			+ ","
			+ "\"type\":\"" + escape(update.type()) + "\""
			+ ",\"seasonCode\":\"" + escape(update.seasonCode()) + "\""
			+ ",\"x\":" + update.x()
			+ ",\"y\":" + update.y()
			+ ",\"color\":" + update.color()
			+ ",\"painter\":\"" + escape(update.painter()) + "\""
			+ ",\"paintedAt\":\"" + update.paintedAt() + "\""
			+ ",\"overwrittenCount\":" + update.overwrittenCount()
			+ "}";
	}

	private String escape(String value) {
		if (value == null) {
			return "";
		}

		return value
			.replace("\\", "\\\\")
			.replace("\"", "\\\"")
			.replace("\n", "\\n")
			.replace("\r", "\\r")
			.replace("\t", "\\t");
	}

	@Scheduled(fixedDelayString = "${app.canvas.event-sync-interval-ms:800}")
	public void syncExternalDatabaseUpdates() {
		ensureInitialized();

		if (sessions.isEmpty()) {
			return;
		}

		long sinceId = lastObservedEventId.get();
		try {
			var updates = jdbcTemplate.query(
				"""
				SELECT e.id, s.season_code, e.x, e.y, e.new_color_int, e.nickname, e.placed_at,
				       (
				         SELECT COUNT(*)
				         FROM canvas_pixel_events ce
				         WHERE ce.season_id = e.season_id
				           AND ce.x = e.x
				           AND ce.y = e.y
				           AND ce.id <= e.id
				       ) AS overwritten_count
				FROM canvas_pixel_events e
				JOIN canvas_seasons s ON s.id = e.season_id
				WHERE e.id > ?
				ORDER BY e.id ASC
				LIMIT 300
				""",
				(resultSet, rowNum) -> mapPixelUpdate(resultSet),
				sinceId
			);

			for (CanvasPixelUpdate update : updates) {
				broadcast(update);
			}
		} catch (DataAccessException exception) {
			// Ignore DB-sync errors to avoid impacting the main request flow.
		}
	}

	private void ensureInitialized() {
		if (initializationDone) {
			return;
		}

		try {
			Long latest = jdbcTemplate.queryForObject(
				"SELECT COALESCE(MAX(id), 0) FROM canvas_pixel_events",
				Long.class
			);
			lastObservedEventId.set(latest == null ? 0L : latest);
			initializationDone = true;
		} catch (DataAccessException exception) {
			// Table may not exist yet during startup; retry on next schedule.
		}
	}

	private CanvasPixelUpdate mapPixelUpdate(ResultSet resultSet) throws SQLException {
		return new CanvasPixelUpdate(
			resultSet.getLong("id"),
			"pixel_updated",
			resultSet.getString("season_code"),
			resultSet.getInt("x"),
			resultSet.getInt("y"),
			resultSet.getInt("new_color_int"),
			resultSet.getString("nickname"),
			readInstant(resultSet, "placed_at"),
			resultSet.getInt("overwritten_count")
		);
	}

	private Instant readInstant(ResultSet resultSet, String columnName) throws SQLException {
		Timestamp timestamp = resultSet.getTimestamp(columnName);
		return timestamp == null ? null : timestamp.toInstant();
	}
}

