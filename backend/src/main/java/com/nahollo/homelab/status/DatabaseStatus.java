package com.nahollo.homelab.status;

public record DatabaseStatus(
	String databaseName,
	String currentUser,
	String serverAddress,
	Integer serverPort
) {
}
