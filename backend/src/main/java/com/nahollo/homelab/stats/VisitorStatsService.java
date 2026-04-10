package com.nahollo.homelab.stats;

import java.time.LocalDate;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

@Service
public class VisitorStatsService {

	private final Set<String> allTimeVisitors = ConcurrentHashMap.newKeySet();
	private final Map<LocalDate, Set<String>> dailyVisitors = new ConcurrentHashMap<>();

	public VisitorStatsResponse register(String visitorKey) {
		LocalDate today = LocalDate.now();
		clearOldEntries(today);
		dailyVisitors.computeIfAbsent(today, ignored -> ConcurrentHashMap.newKeySet()).add(visitorKey);
		allTimeVisitors.add(visitorKey);
		return snapshot();
	}

	public VisitorStatsResponse snapshot() {
		LocalDate today = LocalDate.now();
		clearOldEntries(today);
		return new VisitorStatsResponse(
			dailyVisitors.getOrDefault(today, Set.of()).size(),
			allTimeVisitors.size()
		);
	}

	private void clearOldEntries(LocalDate today) {
		dailyVisitors.keySet().removeIf(date -> date.isBefore(today.minusDays(7)));
	}
}
