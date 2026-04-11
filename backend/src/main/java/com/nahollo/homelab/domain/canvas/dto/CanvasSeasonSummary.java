package com.nahollo.homelab.domain.canvas.dto;

import java.time.Instant;

public record CanvasSeasonSummary(
	String seasonCode,
	String title,
	String status,
	Instant startsAt,
	Instant endsAt
) {
}

