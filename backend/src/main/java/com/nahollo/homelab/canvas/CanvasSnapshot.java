package com.nahollo.homelab.canvas;

import java.time.Instant;
import java.util.List;

public record CanvasSnapshot(
	String seasonCode,
	String title,
	Instant startsAt,
	Instant endsAt,
	Instant archivedAt,
	int width,
	int height,
	int pixelCount,
	int participantCount,
	List<Integer> dominantColors,
	int[] thumbnailPixels
) {
}
