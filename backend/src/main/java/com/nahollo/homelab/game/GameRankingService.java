package com.nahollo.homelab.game;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;

@Service
public class GameRankingService {

	private static final int MAX_ENTRIES = 10;

	private final EnumMap<GameType, List<GameScore>> rankings = new EnumMap<>(GameType.class);

	public GameRankingService() {
		for (GameType type : GameType.values()) {
			rankings.put(type, new ArrayList<>());
		}
	}

	public synchronized List<GameScore> read(GameType type) {
		return List.copyOf(rankings.get(type));
	}

	public synchronized List<GameScore> record(GameType type, GameScoreRequest request) {
		List<GameScore> scores = rankings.get(type);
		scores.add(new GameScore(
			normalizeNickname(request.nickname()),
			request.score(),
			Instant.now()
		));

		scores.sort(Comparator
			.comparingLong(GameScore::score)
			.reversed()
			.thenComparing(GameScore::createdAt));

		if (scores.size() > MAX_ENTRIES) {
			scores.subList(MAX_ENTRIES, scores.size()).clear();
		}

		return List.copyOf(scores);
	}

	private String normalizeNickname(String nickname) {
		if (nickname == null || nickname.isBlank()) {
			return "Anonymous";
		}

		return nickname.strip();
	}

	public enum GameType {
		TYPING,
		JUMP;

		public static GameType fromPath(String value) {
			return switch (value.toLowerCase(Locale.ROOT)) {
				case "typing" -> TYPING;
				case "jump" -> JUMP;
				default -> throw new IllegalArgumentException("Unsupported game type: " + value);
			};
		}
	}
}
