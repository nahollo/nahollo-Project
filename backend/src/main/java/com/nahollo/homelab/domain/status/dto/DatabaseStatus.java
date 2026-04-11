package com.nahollo.homelab.domain.status.dto;

public record DatabaseStatus(
	boolean connected,
	String databaseName,
	String currentUser,
	String serverAddress,
	Integer serverPort,
	String errorMessage
) {
}

