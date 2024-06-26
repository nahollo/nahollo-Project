package com.nahollo.nahollo.Project.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import com.nahollo.nahollo.Project.entity.Temp;
import com.nahollo.nahollo.Project.service.TempService;

// 웹 요청을 처리하는 컨트롤러 클래스
@RestController
public class TempController {

    private final TempService tempService;

    // TempService를 주입받는 생성자
    @Autowired
    public TempController(TempService tempService) {
        this.tempService = tempService;
    }

    // HTTP GET 요청을 처리하는 메서드
    @GetMapping("/temp")
    // Temp 엔티티를 생성하고 저장한 후 반환
    public Temp createTemp() {
        return tempService.createTempRecord();
    }
}