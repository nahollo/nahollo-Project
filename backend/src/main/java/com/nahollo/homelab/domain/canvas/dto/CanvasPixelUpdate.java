package com.nahollo.homelab.domain.canvas.dto;

import java.time.Instant;

public record CanvasPixelUpdate(
	long eventId,
	String type,
	String seasonCode,
	int x,
	int y,
	int color,
	String painter,
	Instant paintedAt,
	int overwrittenCount
) {
}

