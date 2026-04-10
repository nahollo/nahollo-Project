package com.nahollo.homelab.canvas;

import java.time.Instant;

public record CanvasSnapshot(
	String id,
	String label,
	Instant savedAt,
	int[] pixels
) {
}
