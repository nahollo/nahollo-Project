package com.nahollo.homelab.domain.status.dto;

import java.time.OffsetDateTime;

public record StatusResponse(
	String applicationName,
	String environment,
	String status,
	OffsetDateTime serverTime,
	DatabaseStatus database
) {
}

