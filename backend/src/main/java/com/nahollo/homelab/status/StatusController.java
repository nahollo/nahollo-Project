package com.nahollo.homelab.status;

import java.time.OffsetDateTime;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class StatusController {

	private final DatabaseStatusService databaseStatusService;

	@Value("${spring.application.name}")
	private String applicationName;

	@Value("${app.environment}")
	private String environment;

	public StatusController(DatabaseStatusService databaseStatusService) {
		this.databaseStatusService = databaseStatusService;
	}

	@GetMapping("/status")
	public StatusResponse status() {
		return new StatusResponse(
			applicationName,
			environment,
			"UP",
			OffsetDateTime.now(),
			databaseStatusService.fetch()
		);
	}
}
