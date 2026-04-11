package com.nahollo.homelab.domain.game.model;

import java.time.Instant;

public record GameScore(
	String nickname,
	long score,
	Instant createdAt
) {
}

