package com.nahollo.homelab.game;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/game/ranking")
public class GameRankingController {

	private final GameRankingService gameRankingService;

	public GameRankingController(GameRankingService gameRankingService) {
		this.gameRankingService = gameRankingService;
	}

	@GetMapping("/{type}")
	public List<GameScore> ranking(@PathVariable String type) {
		return gameRankingService.read(GameRankingService.GameType.fromPath(type));
	}

	@PostMapping("/{type}")
	public List<GameScore> record(@PathVariable String type, @Valid @RequestBody GameScoreRequest request) {
		return gameRankingService.record(GameRankingService.GameType.fromPath(type), request);
	}
}
