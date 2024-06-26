package com.nahollo.nahollo.Project.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.nahollo.nahollo.Project.entity.Temp;
import com.nahollo.nahollo.Project.repository.TempRepository;

// 서비스 계층을 나타내는 어노테이션
@Service
public class TempService {

    private final TempRepository tempRepository;

    // TempRepository를 주입받는 생성자
    @Autowired
    public TempService(TempRepository tempRepository) {
        this.tempRepository = tempRepository;
    }

    // Temp 엔티티를 생성 후 confirm 필드를 true로 저장
    public Temp createTempRecord() {
        Temp temp = new Temp();
        temp.setConfirm(true);
        return tempRepository.save(temp);
    }
}