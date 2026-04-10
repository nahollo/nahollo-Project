package com.nahollo.homelab.canvas;

import java.time.Instant;

public record CanvasPixelUpdate(
	int x,
	int y,
	int colorIndex,
	String painter,
	Instant paintedAt
) {
}
