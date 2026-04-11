package com.nahollo.homelab.domain.canvas.dto;

import java.time.Instant;

public record CanvasStateResponse(
	CanvasSeasonSummary season,
	int width,
	int height,
	int[] pixels,
	Instant serverNow,
	String liveStatus,
	int placedCount,
	long latestEventId
) {
}

