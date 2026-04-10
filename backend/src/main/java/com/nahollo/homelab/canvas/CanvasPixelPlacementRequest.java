package com.nahollo.homelab.canvas;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CanvasPixelPlacementRequest(
	@NotNull
	@Min(0)
	@Max(127)
	Integer x,
	@NotNull
	@Min(0)
	@Max(127)
	Integer y,
	@NotNull
	@Min(0)
	@Max(31)
	Integer colorIndex
) {
}
