package com.nahollo.homelab.status;

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
