export const CANVAS_COPY = {
  chips: {
    board: "공유 보드",
    history: "기록 보관함",
    paint: "그리기",
    custom: "직접 색상",
    archive: "보관 기록"
  },
  status: {
    connection: "연결 상태",
    connected: "실시간 연결됨",
    degraded: "연결 불안정",
    offline: "연결 끊김",
    connecting: "연결 중",
    cooldown: "대기 시간",
    ready: "배치 가능",
    selectedPixel: "선택한 픽셀",
    selectedColor: "선택한 색상",
    selectedUser: "선택한 유저",
    notSelected: "선택 안 됨",
    hover: "가리킨 위치",
    selected: "선택한 위치",
    zoom: "확대",
    placedPixels: "배치된 픽셀",
    selectedPixelSheet: "선택한 픽셀",
    loadingBoard: "현재 시즌 보드를 준비하고 있습니다.",
    liveDescription: "이번 달 보드는 실시간으로 함께 완성됩니다."
  },
  sidebar: {
    nickname: "닉네임",
    nicknamePlaceholder: "닉네임을 입력해 주세요",
    rule: "픽셀을 배치하면 5분 동안 다음 픽셀을 배치할 수 없습니다.",
    recentActivity: "최근 활동",
    emptyActivity: "최근 활동이 곧 여기에 표시됩니다.",
    pausedWithCount: "{count}개의 새 활동이 대기 중입니다.",
    pausedNoPending: "로그가 일시정지되어 있습니다."
  },
  actions: {
    openGallery: "갤러리 열기",
    openHistoryCompact: "기록",
    openInfo: "정보",
    openPaint: "열기",
    closePaint: "닫기",
    placePixel: "픽셀 배치",
    placePixelReady: "그리기",
    placing: "배치 중...",
    connectionLost: "연결 끊김",
    openColorPicker: "직접 색상 선택기 열기",
    closeColorPicker: "색상 선택기 닫기",
    closeHistory: "기록 보관함 닫기",
    closeHistoryDetail: "기록 상세 닫기",
    closeInfo: "정보 닫기",
    closePixelInfo: "픽셀 정보 닫기",
    cancel: "취소",
    apply: "적용",
    pauseActivity: "일시정지",
    resumeActivity: "재개",
    clearActivity: "비우기",
    zoomIn: "확대",
    zoomOut: "축소",
    zoomReset: "원래 크기",
    gridOn: "격자 켜기",
    gridOff: "격자 끄기"
  },
  paint: {
    cooldownPrefix: "대기 시간",
    pickerTitle: "직접 색상",
    pickerTabCustom: "직접 선택",
    pickerTabPalette: "기본 팔레트",
    pickerGui: "색상 선택기",
    hex: "HEX",
    channelRed: "빨강",
    channelGreen: "초록",
    channelBlue: "파랑",
    recentColors: "최근 사용 색상",
    pickScreenColor: "화면에서 색상 추출",
    eyedropperUnsupported: "브라우저가 색상 추출을 지원하지 않습니다."
  },
  history: {
    title: "시즌 갤러리",
    emptyTitle: "아직 보관된 시즌이 없습니다.",
    emptyBody: "이번 달 캔버스가 끝나면 첫 결과물이 저장됩니다.",
    loadingDetail: "시즌 결과를 불러오는 중입니다.",
    totalPixels: "총 픽셀 수",
    participants: "참여자 수",
    dominantColors: "대표 색상",
    seasonStatus: "시즌 상태",
    archived: "보관 완료"
  },
  tooltip: {
    placedBy: "작성자",
    anonymous: "익명",
    notPaintedYet: "아직 배치되지 않음",
    freshCanvas: "방금 시작됨"
  },
  toast: {
    boardLoadError: "보드 데이터를 불러오지 못했습니다.",
    historyDetailError: "히스토리 상세를 불러오지 못했습니다.",
    placeSuccess: "픽셀이 배치되었습니다. 대기 시간이 시작됩니다.",
    placeError: "픽셀 배치에 실패했습니다.",
    selectPixelFirst: "픽셀을 먼저 선택해 주세요.",
    selectColorFirst: "색상을 먼저 선택해 주세요.",
    connectionLost: "서버 연결이 끊겨 배치할 수 없습니다."
  }
} as const;

export function displayNickname(value: string | null | undefined): string {
  if (!value || value.trim() === "" || value === "Anonymous") {
    return CANVAS_COPY.tooltip.anonymous;
  }

  return value.trim();
}
