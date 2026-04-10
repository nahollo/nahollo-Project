package com.nahollo.homelab.canvas;

import java.time.Instant;

public record CanvasPixelMetaResponse(
	int x,
	int y,
	String nickname,
	int color,
	Instant placedAt,
	int overwrittenCount
) {
}
