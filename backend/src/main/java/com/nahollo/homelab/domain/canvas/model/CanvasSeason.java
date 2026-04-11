package com.nahollo.homelab.domain.canvas.model;

import java.time.Instant;
import java.util.UUID;

import com.nahollo.homelab.domain.canvas.dto.CanvasSeasonSummary;

public record CanvasSeason(
	UUID id,
	String seasonCode,
	String title,
	String status,
	int width,
	int height,
	Instant startsAt,
	Instant endsAt,
	Instant archivedAt
) {
	public CanvasSeasonSummary toSummary() {
		return new CanvasSeasonSummary(seasonCode, title, status, startsAt, endsAt);
	}
}
