package com.nahollo.homelab.canvas;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
public class CanvasWebSocketHandler extends TextWebSocketHandler {

	private final Set<WebSocketSession> sessions = ConcurrentHashMap.newKeySet();

	public CanvasWebSocketHandler() {
	}

	@Override
	public void afterConnectionEstablished(WebSocketSession session) {
		sessions.add(session);
	}

	@Override
	public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
		sessions.remove(session);
	}

	public void broadcast(CanvasPixelUpdate update) {
		String payload = toJson(update);
		TextMessage message = new TextMessage(payload);

		sessions.removeIf(session -> !session.isOpen());
		for (WebSocketSession session : sessions) {
			try {
				session.sendMessage(message);
			} catch (Exception exception) {
				sessions.remove(session);
			}
		}
	}

	private String toJson(CanvasPixelUpdate update) {
		return "{"
			+ "\"x\":" + update.x()
			+ ",\"y\":" + update.y()
			+ ",\"colorIndex\":" + update.colorIndex()
			+ ",\"painter\":" + quote(update.painter())
			+ ",\"paintedAt\":\"" + update.paintedAt() + "\""
			+ "}";
	}

	private String quote(String value) {
		if (value == null) {
			return "null";
		}

		return "\""
			+ value
				.replace("\\", "\\\\")
				.replace("\"", "\\\"")
				.replace("\n", "\\n")
				.replace("\r", "\\r")
				.replace("\t", "\\t")
			+ "\"";
	}
}
