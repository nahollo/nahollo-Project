package com.nahollo.homelab.canvas;

import java.time.Instant;

public record CanvasPlacementResponse(
	boolean success,
	String code,
	long remainingSeconds,
	Instant nextPlaceAt,
	Instant serverNow,
	CanvasPixelUpdate update
) {
}
