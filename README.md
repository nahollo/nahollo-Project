# nahollo Project

나홀로 개발하고 있는 개인 프로젝트 사이트입니다.

프론트엔드 화면만 보여주는 포트폴리오가 아니라, 브라우저에서 시작해서 API, 데이터 흐름, 배포까지 이어지는 구조를 함께 정리하는 방향으로 만들고 있습니다.  
현재 저장소는 포트폴리오 프론트엔드와 간단한 상태 확인용 Spring Boot 백엔드를 함께 포함합니다.

## 구성

- `frontend`
  - React + TypeScript 기반 포트폴리오 사이트
- `backend`
  - Spring Boot 기반 상태 확인용 API
- `deploy`
  - nginx / systemd 배포 설정

## 로컬 실행

프론트엔드:

```bash
cd frontend
npm install
npm start
```

백엔드:

```bash
cd backend
gradlew.bat bootRun
```

## 환경변수

백엔드 DB 연결 정보는 코드에 직접 넣지 않고 환경변수로 주입합니다.

- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `SERVER_PORT`
- `APP_ENV`

## 검증

프론트엔드:

```bash
cd frontend
npm test -- --watchAll=false
npm run build
```

백엔드:

```bash
cd backend
gradlew.bat test
gradlew.bat build
```

## 메모

이 저장소는 계속 혼자 다듬고 있는 작업물이라, 구조와 문구는 조금씩 바뀔 수 있습니다.  
지금 단계에서는 “나홀로 개발하는 개인 프로젝트 사이트”라는 성격에 맞게 차분하고 읽기 쉬운 방향으로 정리하고 있습니다.
