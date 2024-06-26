package com.nahollo.nahollo.Project.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
// import lombok.Data;
import lombok.Data;

// 데이터베이스 테이블과 매핑되는 클래스
@Entity
// Data는 Lombok 어노테이션으로, 게터, 세터, toString, equals, hashCode 메서드를 자동으로 생성
@Data
public class Temp {
    // @Id: 기본 키(primary key)로 사용될 필드임을 나타냄
    // @GeneratedValue: 이 필드의 값을 자동으로 생성하도록 지정
    // strategy = GenerationType.IDENTITY: 데이터베이스의 IDENTITY 컬럼을 사용하여 기본 키 값을 자동 생성
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)

    // 데이터베이스의 id, confirm 컬럼과 매핑되는 필드
    private Long id;

    private Boolean confirm;

    // lombok을 사용하지 않으면 getter, setter을 생성해야됨.
}
