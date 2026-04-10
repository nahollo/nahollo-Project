package com.nahollo.homelab.canvas;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class CanvasWebSocketConfig implements WebSocketConfigurer {

	private final CanvasWebSocketHandler canvasWebSocketHandler;

	public CanvasWebSocketConfig(CanvasWebSocketHandler canvasWebSocketHandler) {
		this.canvasWebSocketHandler = canvasWebSocketHandler;
	}

	@Override
	public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
		registry
			.addHandler(canvasWebSocketHandler, "/ws/canvas")
			.setAllowedOriginPatterns("*");
	}
}
