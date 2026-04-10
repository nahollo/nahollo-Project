package com.nahollo.homelab.canvas;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CanvasPixelPlacementRequest(
	@NotNull
	@Min(0)
	@Max(511)
	Integer x,
	@NotNull
	@Min(0)
	@Max(511)
	Integer y,
	@NotNull
	@Min(0)
	@Max(16777215)
	Integer color,
	@Size(max = 32)
	String nickname
) {
}
