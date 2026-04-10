package com.nahollo.homelab.game;

import java.time.Instant;

public record GameScore(
	String nickname,
	long score,
	Instant createdAt
) {
}
