package com.nahollo.homelab.domain.status.dto;

public record SystemStatusResponse(
	double cpu,
	double ram,
	double disk,
	Double temperature
) {
}

