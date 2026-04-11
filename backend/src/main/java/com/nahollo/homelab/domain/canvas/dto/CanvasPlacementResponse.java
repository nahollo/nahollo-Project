package com.nahollo.homelab.domain.canvas.dto;

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

