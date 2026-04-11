package com.nahollo.homelab.domain.status.application;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.nahollo.homelab.domain.status.dto.DeploymentLogEntry;

import org.springframework.stereotype.Service;

@Service
public class DeploymentLogService {

	private static final int MAX_ENTRIES = 5;

	private final Deque<DeploymentLogEntry> entries = new ArrayDeque<>();

	public synchronized List<DeploymentLogEntry> readRecent() {
		return List.copyOf(entries);
	}

	public synchronized void recordWebhook(String eventType, Map<String, Object> payload) {
		Map<String, Object> workflowRun = nestedMap(payload, "workflow_run");
		if (workflowRun.isEmpty() && !"workflow_run".equalsIgnoreCase(eventType)) {
			return;
		}

		Map<String, Object> repository = nestedMap(payload, "repository");
		DeploymentLogEntry entry = new DeploymentLogEntry(
			valueAsString(workflowRun.get("id"), UUID.randomUUID().toString()),
			valueAsString(workflowRun.get("name"), "GitHub Actions"),
			valueAsString(workflowRun.get("conclusion"), "unknown"),
			valueAsString(workflowRun.get("head_branch"), "unknown"),
			valueAsString(repository.get("full_name"), "unknown"),
			valueAsInstant(workflowRun.get("updated_at")),
			valueAsString(workflowRun.get("html_url"), null)
		);

		entries.removeIf(existing -> existing.id().equals(entry.id()));
		entries.addFirst(entry);
		while (entries.size() > MAX_ENTRIES) {
			entries.removeLast();
		}
	}

	@SuppressWarnings("unchecked")
	private Map<String, Object> nestedMap(Map<String, Object> payload, String key) {
		Object value = payload.get(key);
		if (value instanceof Map<?, ?> nested) {
			return (Map<String, Object>) nested;
		}

		return Map.of();
	}

	private String valueAsString(Object value, String fallback) {
		if (value == null) {
			return fallback;
		}

		String stringValue = value.toString().trim();
		return stringValue.isEmpty() ? fallback : stringValue;
	}

	private Instant valueAsInstant(Object value) {
		if (value == null) {
			return Instant.now();
		}

		try {
			return Instant.parse(value.toString());
		} catch (Exception exception) {
			return Instant.now();
		}
	}
}

