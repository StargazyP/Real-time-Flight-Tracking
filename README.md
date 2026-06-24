# Real-time Flight Tracker

한반도 상공 **항공편을 실시간으로 지도에 표시**하고, 클릭 시 상세 정보·기상 데이터를 보여주는 웹 앱입니다.

**Live:** [https://stargazyp.com/realtime/](https://stargazyp.com/realtime/)

Repository: [github.com/StargazyP/realtimeplane](https://github.com/StargazyP/realtimeplane)

---

## 주요 기능

- **실시간 항공편 추적** — 한국 상공 항공기 위치·상태를 지도에 표시
- **인터랙티브 지도** — MapLibre GL JS, 비행기 마커 클릭 시 상세 패널
- **항공편 상세** — 편명, 항공사, 출발/도착 공항, 고도, 속도, heading
- **기상 정보** — 출발지 또는 도착지 날씨 (WeatherAPI)
- **항로 표시** — 출발·도착을 잇는 경로 라인
- **부드러운 애니메이션** — heading에 맞춘 비행기 마커 회전

## 사용 시나리오

1. Live 접속 → 지도에서 **현재 비행 중인 항공편** 탐색
2. 마커 클릭 → **편명·공항·고도** 등 상세 확인
3. 출발/도착지 **날씨** 참고

## 서버 구성 (요약)

| 구성 | 기술 |
|------|------|
| Frontend | Vue 3, Vite, MapLibre GL JS |
| Backend | Node.js, Express |
| 외부 API | AviationStack, WeatherAPI (키는 `.env`만) |
| 배포 | portfolio compose `realtime`, nginx `/realtime/` |

> 공개 repo에는 `backend/`·`frontend/` 소스 미포함 (demo README만). 배포·빌드는 서버 로컬 소스 기준.

로컬: `backend/.env.example` → `.env` 후 `docker compose up -d --build`

## Changelog

- **2026-06-24** — README 기능 중심 정리, webhook CI/CD secrets 연동.
- **2026-06-02** — Live demo URL (stargazyp.com/realtime).
- **2026-05-27** — portfolio Docker·Live URL 정리.

## License

ISC
