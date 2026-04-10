package com.nahollo.homelab.canvas;

import java.util.List;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/canvas")
public class CanvasController {

	private final CanvasService canvasService;
	private final CanvasWebSocketHandler canvasWebSocketHandler;

	public CanvasController(CanvasService canvasService, CanvasWebSocketHandler canvasWebSocketHandler) {
		this.canvasService = canvasService;
		this.canvasWebSocketHandler = canvasWebSocketHandler;
	}

	@GetMapping
	public List<CanvasPixel> canvas() {
		return canvasService.readCanvas();
	}

	@GetMapping("/history")
	public List<CanvasSnapshot> history() {
		return canvasService.readHistory();
	}

	@GetMapping("/cooldown")
	public CanvasCooldownResponse cooldown(HttpServletRequest request) {
		return canvasService.readCooldown(resolveIpAddress(request));
	}

	@PostMapping("/pixel")
	public ResponseEntity<CanvasPlacementResponse> placePixel(
		@Valid @RequestBody CanvasPixelPlacementRequest request,
		@RequestHeader(name = "X-Canvas-Nickname", required = false) String nickname,
		HttpServletRequest servletRequest
	) {
		CanvasPlacementResponse response = canvasService.placePixel(request, resolveIpAddress(servletRequest), nickname);

		if (!response.success()) {
			return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(response);
		}

		if (response.update() != null) {
			canvasWebSocketHandler.broadcast(response.update());
		}

		return ResponseEntity.ok(response);
	}

	private String resolveIpAddress(HttpServletRequest request) {
		String forwardedFor = request.getHeader("X-Forwarded-For");
		if (forwardedFor != null && !forwardedFor.isBlank()) {
			return forwardedFor.split(",")[0].trim();
		}

		String remoteAddress = request.getRemoteAddr();
		return (remoteAddress == null || remoteAddress.isBlank()) ? "unknown" : remoteAddress.trim();
	}
}
