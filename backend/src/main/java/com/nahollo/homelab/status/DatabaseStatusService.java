package com.nahollo.homelab.status;

import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class DatabaseStatusService {

	private final JdbcTemplate jdbcTemplate;

	public DatabaseStatusService(JdbcTemplate jdbcTemplate) {
		this.jdbcTemplate = jdbcTemplate;
	}

	public DatabaseStatus fetch() {
		Map<String, Object> row = jdbcTemplate.queryForMap("""
			select
				current_database() as database_name,
				current_user as current_user,
				coalesce(inet_server_addr()::text, '127.0.0.1') as server_address,
				inet_server_port() as server_port
			""");

		return new DatabaseStatus(
			String.valueOf(row.get("database_name")),
			String.valueOf(row.get("current_user")),
			String.valueOf(row.get("server_address")),
			row.get("server_port") == null ? null : ((Number) row.get("server_port")).intValue()
		);
	}
}
