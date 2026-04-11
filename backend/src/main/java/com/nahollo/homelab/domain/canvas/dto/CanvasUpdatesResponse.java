package com.nahollo.homelab.domain.canvas.dto;

import java.util.List;

public record CanvasUpdatesResponse(
	long latestEventId,
	List<CanvasPixelUpdate> updates
) {
}

