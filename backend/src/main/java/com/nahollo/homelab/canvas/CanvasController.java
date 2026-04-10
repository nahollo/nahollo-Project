package com.nahollo.homelab.canvas;

import java.util.List;

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

	private String resolveIpAddress(HttpServletRequest request) {
		String forwardedFor = request.getHeader("X-Forwarded-For");
		if (forwardedFor != null && !forwardedFor.isBlank()) {
			return forwardedFor.split(",")[0].trim();
		}

		String remoteAddress = request.getRemoteAddr();
		return (remoteAddress == null || remoteAddress.isBlank()) ? "unknown" : remoteAddress.trim();
	}
}
