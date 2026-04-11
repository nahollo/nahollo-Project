package com.nahollo.homelab.domain.status.api;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

import com.nahollo.homelab.domain.status.application.DatabaseStatusService;
import com.nahollo.homelab.domain.status.application.DeploymentLogService;
import com.nahollo.homelab.domain.status.application.SystemMetricsService;
import com.nahollo.homelab.domain.status.dto.DatabaseStatus;
import com.nahollo.homelab.domain.status.dto.DeploymentLogEntry;
import com.nahollo.homelab.domain.status.dto.StatusResponse;
import com.nahollo.homelab.domain.status.dto.SystemStatusResponse;
import com.nahollo.homelab.domain.status.dto.UptimeResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class StatusController {

	private final DatabaseStatusService databaseStatusService;
	private final SystemMetricsService systemMetricsService;
	private final DeploymentLogService deploymentLogService;

	@Value("${spring.application.name}")
	private String applicationName;

	@Value("${app.environment}")
	private String environment;

	public StatusController(
		DatabaseStatusService databaseStatusService,
		SystemMetricsService systemMetricsService,
		DeploymentLogService deploymentLogService
	) {
		this.databaseStatusService = databaseStatusService;
		this.systemMetricsService = systemMetricsService;
		this.deploymentLogService = deploymentLogService;
	}

	@GetMapping("/status")
	public StatusResponse status() {
		DatabaseStatus database = databaseStatusService.fetch();

		return new StatusResponse(
			applicationName,
			environment,
			database.connected() ? "UP" : "DEGRADED",
			OffsetDateTime.now(),
			database
		);
	}

	@GetMapping("/status/system")
	public SystemStatusResponse system() {
		return systemMetricsService.readSystemStatus();
	}

	@GetMapping("/status/uptime")
	public UptimeResponse uptime() {
		return new UptimeResponse(systemMetricsService.readUptimeSeconds());
	}

	@GetMapping("/status/deployments")
	public List<DeploymentLogEntry> deployments() {
		return deploymentLogService.readRecent();
	}

	@PostMapping("/status/deployments/webhook")
	public ResponseEntity<Void> deploymentWebhook(
		@RequestHeader(name = "X-GitHub-Event", required = false) String eventType,
		@RequestBody Map<String, Object> payload
	) {
		deploymentLogService.recordWebhook(eventType == null ? "" : eventType, payload);
		return ResponseEntity.accepted().build();
	}
}

