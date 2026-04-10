package com.nahollo.homelab.status;

public record DatabaseStatus(
	boolean connected,
	String databaseName,
	String currentUser,
	String serverAddress,
	Integer serverPort,
	String errorMessage
) {
}
