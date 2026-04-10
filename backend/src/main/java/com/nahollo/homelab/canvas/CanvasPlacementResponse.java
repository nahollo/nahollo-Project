package com.nahollo.homelab.canvas;

public record CanvasPlacementResponse(
	boolean success,
	long remainingSeconds,
	CanvasPixelUpdate update
) {
}
