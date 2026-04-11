package com.nahollo.homelab.domain.canvas.infrastructure.websocket;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import com.nahollo.homelab.domain.canvas.dto.CanvasPixelUpdate;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
public class CanvasWebSocketHandler extends TextWebSocketHandler {

	private final Set<WebSocketSession> sessions = ConcurrentHashMap.newKeySet();

	@Override
	public void afterConnectionEstablished(WebSocketSession session) {
		sessions.add(session);
	}

	@Override
	public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
		sessions.remove(session);
	}

	public void broadcast(CanvasPixelUpdate update) {
		TextMessage message = new TextMessage(toJson(update));

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
			+ "\"eventId\":" + update.eventId()
			+ ","
			+ "\"type\":\"" + escape(update.type()) + "\""
			+ ",\"seasonCode\":\"" + escape(update.seasonCode()) + "\""
			+ ",\"x\":" + update.x()
			+ ",\"y\":" + update.y()
			+ ",\"color\":" + update.color()
			+ ",\"painter\":\"" + escape(update.painter()) + "\""
			+ ",\"paintedAt\":\"" + update.paintedAt() + "\""
			+ ",\"overwrittenCount\":" + update.overwrittenCount()
			+ "}";
	}

	private String escape(String value) {
		if (value == null) {
			return "";
		}

		return value
			.replace("\\", "\\\\")
			.replace("\"", "\\\"")
			.replace("\n", "\\n")
			.replace("\r", "\\r")
			.replace("\t", "\\t");
	}
}

