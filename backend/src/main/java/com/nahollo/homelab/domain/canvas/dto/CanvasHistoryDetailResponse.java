package com.nahollo.homelab.domain.canvas.dto;

import java.time.Instant;
import java.util.List;

public record CanvasHistoryDetailResponse(
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
	String timelapseUrl,
	int[] pixels
) {
}

