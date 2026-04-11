package com.nahollo.homelab.domain.canvas.api;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.List;

import com.nahollo.homelab.domain.canvas.application.CanvasService;
import com.nahollo.homelab.domain.canvas.dto.CanvasCooldownResponse;
import com.nahollo.homelab.domain.canvas.dto.CanvasHistoryDetailResponse;
import com.nahollo.homelab.domain.canvas.dto.CanvasPixelMetaResponse;
import com.nahollo.homelab.domain.canvas.dto.CanvasPixelPlacementRequest;
import com.nahollo.homelab.domain.canvas.dto.CanvasPlacementResponse;
import com.nahollo.homelab.domain.canvas.dto.CanvasSnapshot;
import com.nahollo.homelab.domain.canvas.dto.CanvasStateResponse;
import com.nahollo.homelab.domain.canvas.dto.CanvasUpdatesResponse;
import com.nahollo.homelab.domain.canvas.infrastructure.websocket.CanvasWebSocketHandler;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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
	public CanvasStateResponse canvas() {
		return canvasService.readCurrent();
	}

	@GetMapping("/current")
	public CanvasStateResponse current() {
		return canvasService.readCurrent();
	}

	@GetMapping("/history")
	public List<CanvasSnapshot> history(
		@RequestParam(name = "page", defaultValue = "0") @Min(0) int page,
		@RequestParam(name = "size", defaultValue = "12") @Min(1) @Max(48) int size
	) {
		return canvasService.readHistory(page, size);
	}

	@GetMapping("/history/{seasonCode}")
	public CanvasHistoryDetailResponse historyDetail(@PathVariable String seasonCode) {
		return canvasService.readHistoryDetail(seasonCode);
	}

	@GetMapping("/cooldown")
	public CanvasCooldownResponse cooldown(HttpServletRequest request) {
		return canvasService.readCooldown(resolveIpAddress(request));
	}

	@GetMapping("/pixel-meta")
	public CanvasPixelMetaResponse pixelMeta(
		@RequestParam @Min(0) @Max(511) int x,
		@RequestParam @Min(0) @Max(511) int y
	) {
		return canvasService.readPixelMeta(x, y);
	}

	@GetMapping("/updates")
	public CanvasUpdatesResponse updates(
		@RequestParam(name = "sinceEventId", defaultValue = "0") @Min(0) long sinceEventId,
		@RequestParam(name = "limit", defaultValue = "200") @Min(1) @Max(500) int limit
	) {
		return canvasService.readUpdates(sinceEventId, limit);
	}

	@PostMapping("/pixel")
	public ResponseEntity<CanvasPlacementResponse> placePixel(
		@Valid @RequestBody CanvasPixelPlacementRequest request,
		HttpServletRequest servletRequest
	) {
		CanvasPlacementResponse response = canvasService.placePixel(request, resolveIpAddress(servletRequest));

		if (!response.success()) {
			HttpStatus status = switch (response.code()) {
				case "COOLDOWN_ACTIVE" -> HttpStatus.TOO_MANY_REQUESTS;
				case "SEASON_CLOSED" -> HttpStatus.CONFLICT;
				default -> HttpStatus.BAD_REQUEST;
			};
			return ResponseEntity.status(status).body(response);
		}

		if (response.update() != null) {
			canvasWebSocketHandler.broadcast(response.update());
		}

		return ResponseEntity.ok(response);
	}

	String resolveIpAddress(HttpServletRequest request) {
		String remoteAddress = request.getRemoteAddr();
		if (isTrustedProxyAddress(remoteAddress)) {
			String forwardedFor = firstForwardedIp(request.getHeader("X-Forwarded-For"));
			if (forwardedFor != null) {
				return forwardedFor;
			}

			String realIp = request.getHeader("X-Real-IP");
			if (realIp != null && !realIp.isBlank()) {
				return realIp.trim();
			}
		}

		return (remoteAddress == null || remoteAddress.isBlank()) ? "unknown" : remoteAddress.trim();
	}

	boolean isTrustedProxyAddress(String remoteAddress) {
		if (remoteAddress == null || remoteAddress.isBlank()) {
			return false;
		}

		try {
			InetAddress address = InetAddress.getByName(remoteAddress.trim());
			return address.isAnyLocalAddress() || address.isLoopbackAddress() || address.isSiteLocalAddress();
		} catch (UnknownHostException exception) {
			return false;
		}
	}

	String firstForwardedIp(String forwardedFor) {
		if (forwardedFor == null || forwardedFor.isBlank()) {
			return null;
		}

		String first = forwardedFor.split(",")[0].trim();
		return first.isBlank() ? null : first;
	}
}

