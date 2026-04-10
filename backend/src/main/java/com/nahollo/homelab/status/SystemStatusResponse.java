package com.nahollo.homelab.status;

public record SystemStatusResponse(
	double cpu,
	double ram,
	double disk,
	Double temperature
) {
}
