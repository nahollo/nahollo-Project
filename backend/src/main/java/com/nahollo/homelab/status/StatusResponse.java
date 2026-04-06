package com.nahollo.homelab.status;

import java.time.OffsetDateTime;

public record StatusResponse(
	String applicationName,
	String environment,
	String status,
	OffsetDateTime serverTime,
	DatabaseStatus database
) {
}
