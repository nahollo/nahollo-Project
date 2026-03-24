package com.nahollo.project;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    @GetMapping("/api/health")
    public Map<String, String> health() {
        return Map.of(
                "status", "up",
                "message", "nahollo 백엔드가 정상적으로 실행 중입니다."
        );
    }
}
