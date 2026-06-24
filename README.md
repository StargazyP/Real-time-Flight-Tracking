# Real-time Flight Tracker

A full-stack web app that visualizes flights over Korea in real time on an interactive map.

## DEMO

- **Live:** [https://stargazyp.com/realtime/](https://stargazyp.com/realtime/)
- Track flights on the map, click markers for details, view weather at departure/arrival

## Changelog

- **2026-05-27** — README: portfolio Live URL, Docker 실행 안내(API 키는 `.env`로만 설정).
- **2026-06-02** — Live demo URL (README).

## Features

- **Real-time flight tracking** — Live position and status of flights over Korea
- **Interactive map** — MapLibre GL JS map; click a plane marker for details
- **Flight details** — Flight number, airline, departure/arrival airports, altitude, speed, heading
- **Weather** — Weather at departure or arrival location
- **Flight path** — Line connecting origin and destination
- **Smooth animations** — Animated plane markers with rotation

## Tech Stack

- **Frontend**: Vue 3, Vite, MapLibre GL JS
- **Backend**: Node.js, Express (`backend/` — deploy 전용, 공개 repo에는 미포함)
- **APIs**: AviationStack · WeatherAPI (키는 `backend/.env`, 저장소에 올리지 않음)

## Docker (로컬 / portfolio)

```bash
cp backend/.env.example backend/.env   # API 키 입력 (공개 push 금지)
docker compose up -d --build
```

- 브라우저: **http://localhost:13500** (`REALTIMEPLANE_PORT`로 변경 가능)
- 헬스: `GET /api/health`

## License

ISC
