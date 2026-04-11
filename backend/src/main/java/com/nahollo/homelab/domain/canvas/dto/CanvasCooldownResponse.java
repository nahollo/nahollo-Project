package com.nahollo.homelab.domain.canvas.dto;

import java.time.Instant;

public record CanvasCooldownResponse(
	boolean canPlace,
	long remainingSeconds,
	Instant nextPlaceAt,
	Instant serverNow
) {
}

