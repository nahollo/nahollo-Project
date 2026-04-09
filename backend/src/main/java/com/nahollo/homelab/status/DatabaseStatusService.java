package com.nahollo.homelab.status;

import java.net.URI;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.SQLException;

import javax.sql.DataSource;

import org.springframework.stereotype.Service;

@Service
public class DatabaseStatusService {

	private final DataSource dataSource;

	public DatabaseStatusService(DataSource dataSource) {
		this.dataSource = dataSource;
	}

	public DatabaseStatus fetch() {
		try (Connection connection = dataSource.getConnection()) {
			DatabaseMetaData metadata = connection.getMetaData();
			HostPort hostPort = resolveHostPort(metadata.getURL());

			return new DatabaseStatus(
				resolveDatabaseName(connection, metadata.getURL()),
				resolveCurrentUser(metadata.getUserName()),
				hostPort.host(),
				hostPort.port()
			);
		} catch (SQLException exception) {
			throw new IllegalStateException("Failed to inspect database connection", exception);
		}
	}

	private String resolveDatabaseName(Connection connection, String jdbcUrl) throws SQLException {
		String catalog = connection.getCatalog();
		if (catalog != null && !catalog.isBlank()) {
			return catalog;
		}

		String schema = connection.getSchema();
		if (schema != null && !schema.isBlank()) {
			return schema;
		}

		if (jdbcUrl == null || jdbcUrl.isBlank()) {
			return "unknown";
		}

		if (jdbcUrl.startsWith("jdbc:h2:mem:")) {
			return jdbcUrl.substring("jdbc:h2:mem:".length()).split("[;:]")[0];
		}

		int lastSlash = jdbcUrl.lastIndexOf('/');
		if (lastSlash >= 0 && lastSlash < jdbcUrl.length() - 1) {
			return jdbcUrl.substring(lastSlash + 1).split("[?;]")[0];
		}

		return "unknown";
	}

	private String resolveCurrentUser(String userName) {
		if (userName == null || userName.isBlank()) {
			return "unknown";
		}

		return userName.strip();
	}

	private HostPort resolveHostPort(String jdbcUrl) {
		if (jdbcUrl == null || jdbcUrl.isBlank()) {
			return new HostPort("unknown", null);
		}

		if (jdbcUrl.startsWith("jdbc:h2:")) {
			return new HostPort("local", null);
		}

		try {
			URI uri = URI.create(jdbcUrl.substring("jdbc:".length()));
			return new HostPort(uri.getHost() == null ? "unknown" : uri.getHost(), uri.getPort() == -1 ? null : uri.getPort());
		} catch (IllegalArgumentException exception) {
			return new HostPort("unknown", null);
		}
	}

	private record HostPort(String host, Integer port) {
	}
}
