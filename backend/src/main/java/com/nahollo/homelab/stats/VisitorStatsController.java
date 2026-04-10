package com.nahollo.homelab.stats;

import java.util.UUID;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stats/visitors")
public class VisitorStatsController {

	private final VisitorStatsService visitorStatsService;

	public VisitorStatsController(VisitorStatsService visitorStatsService) {
		this.visitorStatsService = visitorStatsService;
	}

	@GetMapping
	public VisitorStatsResponse stats() {
		return visitorStatsService.snapshot();
	}

	@PostMapping("/hit")
	public VisitorStatsResponse hit(@RequestBody(required = false) VisitorHitRequest request, HttpServletRequest servletRequest) {
		return visitorStatsService.register(resolveVisitorKey(request, servletRequest));
	}

	private String resolveVisitorKey(VisitorHitRequest request, HttpServletRequest servletRequest) {
		if (request != null && request.clientId() != null && !request.clientId().isBlank()) {
			return request.clientId().strip();
		}

		String forwardedFor = servletRequest.getHeader("X-Forwarded-For");
		if (forwardedFor != null && !forwardedFor.isBlank()) {
			return forwardedFor.split(",")[0].trim();
		}

		String remoteAddress = servletRequest.getRemoteAddr();
		if (remoteAddress != null && !remoteAddress.isBlank()) {
			return remoteAddress.trim();
		}

		return UUID.randomUUID().toString();
	}
}
