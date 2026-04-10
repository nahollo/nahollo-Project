package com.nahollo.homelab.canvas;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Arrays;
import java.util.Deque;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.stereotype.Service;

@Service
public class CanvasService {

	private static final int CANVAS_SIZE = 128;
	private static final long COOLDOWN_SECONDS = Duration.ofMinutes(5).getSeconds();
	private static final int SNAPSHOT_INTERVAL = 64;
	private static final int MAX_SNAPSHOTS = 8;

	private final CanvasPixel[] pixels = new CanvasPixel[CANVAS_SIZE * CANVAS_SIZE];
	private final Map<String, Instant> lastPaintByIp = new ConcurrentHashMap<>();
	private final Deque<CanvasSnapshot> history = new ArrayDeque<>();
	private final AtomicInteger paintCounter = new AtomicInteger();

	public CanvasService() {
		Arrays.setAll(pixels, ignored -> new CanvasPixel(0, null, null));
		history.addFirst(snapshot("Genesis"));
	}

	public synchronized List<CanvasPixel> readCanvas() {
		return Arrays.stream(pixels)
			.map(pixel -> new CanvasPixel(pixel.colorIndex(), pixel.painter(), pixel.paintedAt()))
			.toList();
	}

	public synchronized List<CanvasSnapshot> readHistory() {
		return history.stream()
			.map(snapshot -> new CanvasSnapshot(
				snapshot.id(),
				snapshot.label(),
				snapshot.savedAt(),
				Arrays.copyOf(snapshot.pixels(), snapshot.pixels().length)
			))
			.toList();
	}

	public CanvasCooldownResponse readCooldown(String ipAddress) {
		return new CanvasCooldownResponse(remainingSeconds(ipAddress, Instant.now()));
	}

	public synchronized CanvasPlacementResponse placePixel(CanvasPixelPlacementRequest request, String ipAddress, String nickname) {
		Instant now = Instant.now();
		long remainingSeconds = remainingSeconds(ipAddress, now);

		if (remainingSeconds > 0) {
			return new CanvasPlacementResponse(false, remainingSeconds, null);
		}

		int index = request.y() * CANVAS_SIZE + request.x();
		String painter = (nickname == null || nickname.isBlank()) ? "Anonymous" : nickname.strip();
		CanvasPixelUpdate update = new CanvasPixelUpdate(request.x(), request.y(), request.colorIndex(), painter, now);

		pixels[index] = new CanvasPixel(update.colorIndex(), update.painter(), update.paintedAt());
		lastPaintByIp.put(ipAddress, now);

		int currentPaintCount = paintCounter.incrementAndGet();
		if (currentPaintCount % SNAPSHOT_INTERVAL == 0) {
			history.addFirst(snapshot("Auto snapshot #" + (currentPaintCount / SNAPSHOT_INTERVAL)));
			while (history.size() > MAX_SNAPSHOTS) {
				history.removeLast();
			}
		}

		return new CanvasPlacementResponse(true, COOLDOWN_SECONDS, update);
	}

	private long remainingSeconds(String ipAddress, Instant now) {
		Instant lastPaintAt = lastPaintByIp.get(ipAddress);
		if (lastPaintAt == null) {
			return 0;
		}

		long elapsed = Duration.between(lastPaintAt, now).getSeconds();
		if (elapsed >= COOLDOWN_SECONDS) {
			return 0;
		}

		return COOLDOWN_SECONDS - elapsed;
	}

	private CanvasSnapshot snapshot(String label) {
		int[] snapshotPixels = Arrays.stream(pixels)
			.mapToInt(CanvasPixel::colorIndex)
			.toArray();

		return new CanvasSnapshot(
			UUID.randomUUID().toString(),
			label,
			Instant.now(),
			snapshotPixels
		);
	}
}
