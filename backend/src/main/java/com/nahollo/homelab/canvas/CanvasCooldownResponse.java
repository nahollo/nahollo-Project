package com.nahollo.homelab.canvas;

import java.time.Instant;

public record CanvasCooldownResponse(
	boolean canPlace,
	long remainingSeconds,
	Instant nextPlaceAt,
	Instant serverNow
) {
}
