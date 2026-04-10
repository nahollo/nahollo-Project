package com.nahollo.homelab.canvas;

import java.time.Instant;

public record CanvasSeasonSummary(
	String seasonCode,
	String title,
	String status,
	Instant startsAt,
	Instant endsAt
) {
}
