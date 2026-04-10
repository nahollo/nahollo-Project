package com.nahollo.homelab.canvas;

import java.time.Instant;

public record CanvasPixel(
	int colorIndex,
	String painter,
	Instant paintedAt
) {
}
