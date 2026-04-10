package com.nahollo.homelab.canvas;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class CanvasServiceTest {

	@Autowired
	private CanvasService canvasService;

	@Test
	void placePixelStoresColorAndStartsCooldown() {
		CanvasPlacementResponse response = canvasService.placePixel(
			new CanvasPixelPlacementRequest(12, 34, (120 << 16) | (45 << 8) | 200, "nahollo"),
			"127.0.0.1"
		);

		assertTrue(response.success());
		assertEquals("OK", response.code());
		assertEquals(300, response.remainingSeconds());
		assertNotNull(response.update());
		assertEquals((120 << 16) | (45 << 8) | 200, response.update().color());

		CanvasStateResponse state = canvasService.readCurrent();
		assertEquals(512, state.width());
		assertEquals(512, state.height());
		assertEquals((120 << 16) | (45 << 8) | 200, state.pixels()[34 * 512 + 12]);
		assertFalse(canvasService.readCooldown("127.0.0.1").canPlace());
		assertTrue(canvasService.readCooldown("127.0.0.1").remainingSeconds() > 0);
	}

	@Test
	void currentSeasonExistsAndHistoryStartsEmpty() {
		CanvasStateResponse current = canvasService.readCurrent();

		assertNotNull(current.season());
		assertEquals(512, current.width());
		assertEquals(512, current.height());
		assertEquals(0, canvasService.readHistory(0, 12).size());
	}
}
