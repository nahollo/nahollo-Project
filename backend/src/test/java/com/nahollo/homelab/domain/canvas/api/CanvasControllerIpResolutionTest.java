package com.nahollo.homelab.domain.canvas.api;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;

import com.nahollo.homelab.domain.canvas.application.CanvasService;
import com.nahollo.homelab.domain.canvas.infrastructure.websocket.CanvasWebSocketHandler;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

class CanvasControllerIpResolutionTest {

	private CanvasController controller;

	@BeforeEach
	void setUp() {
		controller = new CanvasController(mock(CanvasService.class), mock(CanvasWebSocketHandler.class));
	}

	@Test
	void ignoresForwardedHeadersFromUntrustedRemoteAddress() {
		MockHttpServletRequest request = new MockHttpServletRequest();
		request.setRemoteAddr("203.0.113.10");
		request.addHeader("X-Forwarded-For", "198.51.100.44, 10.0.0.2");
		request.addHeader("X-Real-IP", "198.51.100.99");

		assertEquals("203.0.113.10", controller.resolveIpAddress(request));
	}

	@Test
	void usesFirstForwardedAddressForTrustedProxy() {
		MockHttpServletRequest request = new MockHttpServletRequest();
		request.setRemoteAddr("127.0.0.1");
		request.addHeader("X-Forwarded-For", "198.51.100.44, 10.0.0.2");

		assertEquals("198.51.100.44", controller.resolveIpAddress(request));
	}

	@Test
	void fallsBackToXRealIpWhenForwardedForIsMissing() {
		MockHttpServletRequest request = new MockHttpServletRequest();
		request.setRemoteAddr("10.0.0.5");
		request.addHeader("X-Real-IP", "198.51.100.77");

		assertEquals("198.51.100.77", controller.resolveIpAddress(request));
	}

	@Test
	void returnsUnknownWhenRemoteAddressIsMissing() {
		MockHttpServletRequest request = new MockHttpServletRequest();
		request.setRemoteAddr("");

		assertEquals("unknown", controller.resolveIpAddress(request));
	}
}

