package com.nahollo.homelab.canvas;

import java.time.Instant;

public record CanvasPixelUpdate(
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
