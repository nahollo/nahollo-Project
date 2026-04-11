package com.nahollo.homelab.domain.status.dto;

import java.time.Instant;

public record DeploymentLogEntry(
	String id,
	String workflowName,
	String conclusion,
	String branch,
	String repository,
	Instant finishedAt,
	String url
) {
}

