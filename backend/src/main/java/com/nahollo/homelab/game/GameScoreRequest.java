package com.nahollo.homelab.game;

import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record GameScoreRequest(
	@Size(max = 20)
	String nickname,
	@PositiveOrZero
	long score
) {
}
