# 실시간 항공편 추적 시스템 - 기술 명세서

## 📋 문서 정보

- **프로젝트명**: realtimeplane
- **버전**: 1.0.0
- **작성일**: 2024
- **라이선스**: ISC
- **프로젝트 유형**: 풀스택 웹 애플리케이션

---

## 1. 프로젝트 개요

### 1.1 프로젝트 소개

한국 상공 항공편을 실시간으로 시각화하는 풀스택 웹 애플리케이션입니다. Vue 3와 Leaflet을 활용한 인터랙티브 지도 UI에서 항공기의 실시간 위치, 상태, 상세 정보를 제공하며, Express.js 백엔드가 외부 항공 데이터 API를 프록시하여 안전하고 효율적인 데이터 제공을 담당합니다.

### 1.2 주요 기능

- **실시간 항공기 추적**: 한국 상공 항공기의 실시간 위치 및 상태 표시
- **인터랙티브 지도**: Leaflet 기반 지도에서 항공기 마커 클릭 시 상세 정보 표시
- **항공편 상세 정보**: 편명, 항공사, 출발/도착 공항, 항공기 정보, 실시간 고도/속도/방향
- **날씨 정보**: 항공편의 도착지 또는 출발지 날씨 정보 제공
- **비행 경로 시각화**: 출발지와 도착지를 연결하는 경로 라인 표시
- **마커 애니메이션**: 항공기 마커의 부드러운 이동 및 회전 애니메이션

---

## 2. 시스템 아키텍처

### 2.1 아키텍처 패턴

**프론트엔드-백엔드 분리 (Frontend-Backend Separation)** 패턴을 따릅니다:

- **Frontend**: Vue 3 + Vite로 빌드된 SPA (Single Page Application)
- **Backend**: Express.js 기반 RESTful API 서버
- **통신**: HTTP/HTTPS 기반 REST API 통신
- **배포**: 프론트엔드 빌드 결과물을 백엔드가 정적으로 서비스

### 2.2 시스템 구성도

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Vue 3 Application (SPA)                            │   │
│  │  - Vue Router                                        │   │
│  │  - @vue-leaflet/vue-leaflet                          │   │
│  │  - Leaflet Map                                       │   │
│  │  - Axios (HTTP Client)                               │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────┬───────────────────────────────────────┘
                        │ HTTP/HTTPS
                        │
┌───────────────────────▼───────────────────────────────────────┐
│              Express.js Backend Server                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Static File Serving                                  │   │
│  │  - express.static('../frontend/dist')                 │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  API Proxy Endpoints                                  │   │
│  │  - /opensky/api/states/all                            │   │
│  │  - /api/flight                                        │   │
│  │  - /api/weather                                       │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────┬───────────────────────────────────────┘
                        │ HTTP
                        │
        ┌───────────────┼───────────────┬───────────────┐
        │               │               │               │
┌───────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
│  OpenSky     │ │ AviationStack│ │ WeatherAPI  │ │   CartoDB   │
│  Network API │ │     API      │ │     API     │ │  Tile Server│
│              │ │              │ │             │ │             │
│ 실시간 항공기 │ │ 항공편 상세  │ │ 날씨 정보   │ │ 지도 타일   │
│ 상태 데이터   │ │ 정보 조회    │ │ 조회        │ │ 제공        │
└──────────────┘ └──────────────┘ └─────────────┘ └─────────────┘
```

### 2.3 데이터 흐름

#### 2.3.1 항공기 목록 조회 흐름

```
1. 프론트엔드: fetchPlanes() 호출
   └─> GET /api/flight?limit=100&flight_status=active

2. 백엔드: Express 라우트 핸들러
   └─> AviationStack API 프록시
   └─> 데이터 정규화 (normalizeFlight)
   └─> JSON 응답 반환

3. 프론트엔드: 응답 데이터 처리
   └─> 지도에 마커 생성/업데이트
   └─> requestAnimationFrame으로 애니메이션
   └─> 60초마다 자동 갱신
```

#### 2.3.2 항공편 상세 정보 조회 흐름

```
1. 사용자: 지도에서 항공기 마커 클릭
   └─> fetchFlightDetails(flight_iata) 호출

2. 프론트엔드: GET /api/flight?flight_iata=KE123
   └─> 백엔드로 요청 전송

3. 백엔드: AviationStack API 조회
   └─> 데이터 정규화
   └─> 단일 항공편 정보 반환

4. 프론트엔드: 상세 정보 표시
   └─> Flight Card UI 표시
   └─> 출발지/도착지 마커 표시
   └─> 비행 경로 라인 그리기
   └─> 날씨 정보 조회 (fetchWeatherByFlight)
```

---

## 3. 기술 스택

### 3.1 Frontend 기술

| 기술 | 버전 | 용도 |
|------|------|------|
| Vue.js | 3.5.13 | 프론트엔드 프레임워크 |
| Vue Router | 4.5.1 | 클라이언트 사이드 라우팅 |
| Vite | 6.3.5 | 빌드 도구 및 개발 서버 |
| @vue-leaflet/vue-leaflet | 0.10.1 | Vue용 Leaflet 래퍼 |
| Leaflet | 1.9.4 | 인터랙티브 지도 라이브러리 |
| leaflet-rotatedmarker | 0.2.0 | 회전 가능한 마커 플러그인 |
| Axios | 1.9.0 | HTTP 클라이언트 |
| @vitejs/plugin-vue | 5.2.3 | Vite Vue 플러그인 |

### 3.2 Backend 기술

| 기술 | 버전 | 용도 |
|------|------|------|
| Node.js | 18.x | JavaScript 런타임 환경 |
| Express.js | 5.1.0 | 웹 애플리케이션 프레임워크 |
| Axios | 1.9.0 | HTTP 클라이언트 (외부 API 호출) |
| CORS | 2.8.5 | Cross-Origin Resource Sharing 미들웨어 |
| dotenv | 16.5.0 | 환경 변수 관리 |

### 3.3 외부 API

| API | 용도 | 인증 |
|-----|------|------|
| OpenSky Network API | 실시간 항공기 상태 데이터 (선택적 사용) | 없음 (공개 API) |
| AviationStack API | 항공편 상세 정보 조회 | API Key 필요 |
| WeatherAPI.com | 날씨 정보 조회 | API Key 필요 |
| CartoDB Basemaps | 지도 타일 제공 | 없음 (공개 서비스) |

### 3.4 인프라 및 배포

| 기술 | 용도 |
|------|------|
| Docker | 컨테이너화 |
| Docker Compose | 멀티 스테이지 빌드 및 배포 |
| Nginx | 리버스 프록시 (선택사항) |
| PM2 | 프로세스 관리 (선택사항) |

---

## 4. 프로젝트 구조

```
realtimeplane/
├── frontend/                    # Vue 3 프론트엔드 애플리케이션
│   ├── src/
│   │   ├── components/
│   │   │   ├── openskymap.vue   # 메인 지도 컴포넌트 (항공기 추적)
│   │   │   └── opensky.vue     # 보조 리스트 UI 컴포넌트
│   │   ├── assets/              # 정적 자산 (이미지 등)
│   │   ├── App.vue              # 루트 컴포넌트
│   │   ├── main.js              # 애플리케이션 진입점
│   │   ├── router.js            # Vue Router 설정
│   │   └── style.css            # 전역 스타일
│   ├── public/                  # 공개 정적 파일
│   ├── index.html               # HTML 템플릿
│   ├── vite.config.js           # Vite 설정 (프록시 포함)
│   ├── package.json             # 프론트엔드 의존성
│   └── dist/                    # 빌드 결과물 (Git 제외)
│
├── backend/                     # Express.js 백엔드 서버
│   ├── index.js                 # 메인 서버 파일
│   ├── package.json             # 백엔드 의존성
│   ├── .env                     # 환경 변수 (Git 제외)
│   └── public/                  # 정적 파일 (테스트용)
│
├── Dockerfile                   # 멀티 스테이지 Docker 빌드 설정
├── docker-compose.yml           # Docker Compose 설정
├── DEPLOY.md                    # 배포 가이드
├── .gitignore                   # Git 제외 파일 목록
└── README.md                    # 프로젝트 문서
```

---

## 5. API 명세서

### 5.1 OpenSky Network API 프록시

#### 5.1.1 실시간 항공기 상태 조회 (선택적 사용)

- **엔드포인트**: `GET /opensky/api/states/all`
- **설명**: OpenSky Network API를 프록시하여 실시간 항공기 상태 데이터를 제공합니다.
- **Query Parameters**: OpenSky Network API의 표준 파라미터 지원
- **Response**: OpenSky Network API의 원본 응답 데이터
- **에러 처리**: 
  - API 요청 실패 시 `500 Internal Server Error`
  - 에러 메시지: `{ error: 'OpenSky API 요청 실패' }`

**참고**: 현재 프론트엔드에서는 이 엔드포인트를 사용하지 않고 `/api/flight`를 사용합니다.

### 5.2 항공편 정보 API

#### 5.2.1 항공편 목록 조회

- **엔드포인트**: `GET /api/flight`
- **인증**: 없음 (공개 API)
- **Query Parameters**:
  | 파라미터 | 타입 | 필수 | 기본값 | 설명 |
  |---------|------|------|--------|------|
  | `limit` | Number | 아니오 | 100 | 조회할 항공편 수 |
  | `offset` | Number | 아니오 | 0 | 페이지네이션 오프셋 |
  | `flight_status` | String | 아니오 | - | 항공편 상태 필터 (예: "active") |
  | `flight_iata` | String | 아니오 | - | 특정 편명 조회 (예: "KE123") |

- **Response (목록 조회)**:
  ```json
  [
    {
      "flight_iata": "KE123",
      "airline": "Korean Air",
      "aircraft": "B777",
      "aircraft_reg": "HL1234",
      "status": "active",
      "live": {
        "latitude": 37.5665,
        "longitude": 126.9780,
        "altitude": 35000,
        "direction": 90,
        "speed": 450
      },
      "departure": {
        "airport": "ICN",
        "city": "Seoul",
        "time": "2024-01-01T10:00:00+00:00",
        "terminal": "1",
        "gate": "A12",
        "latitude": 37.4602,
        "longitude": 126.4407
      },
      "arrival": {
        "airport": "NRT",
        "city": "Tokyo",
        "time": "2024-01-01T13:00:00+00:00",
        "terminal": "1",
        "gate": "B5",
        "latitude": 35.7720,
        "longitude": 140.3929
      }
    }
  ]
  ```

- **Response (단일 항공편 조회)**:
  ```json
  {
    "flight_iata": "KE123",
    "airline": "Korean Air",
    "aircraft": "B777",
    "aircraft_reg": "HL1234",
    "status": "active",
    "live": {
      "latitude": 37.5665,
      "longitude": 126.9780,
      "altitude": 35000,
      "direction": 90,
      "speed": 450
    },
    "departure": {
      "airport": "ICN",
      "city": "Seoul",
      "time": "2024-01-01T10:00:00+00:00",
      "terminal": "1",
      "gate": "A12",
      "latitude": 37.4602,
      "longitude": 126.4407
    },
    "arrival": {
      "airport": "NRT",
      "city": "Tokyo",
      "time": "2024-01-01T13:00:00+00:00",
      "terminal": "1",
      "gate": "B5",
      "latitude": 35.7720,
      "longitude": 140.3929
    }
  }
  ```

- **에러 응답**:
  - `503 Service Unavailable`: API 키가 설정되지 않은 경우
    ```json
    {
      "error": "서버 API 키가 구성되지 않았습니다."
    }
    ```
  - `404 Not Found`: 항공편을 찾을 수 없는 경우 (단일 조회 시)
    ```json
    {
      "error": "Flight not found"
    }
    ```
  - `500 Internal Server Error`: API 요청 실패
    ```json
    {
      "error": "API 요청 실패"
    }
    ```

- **비즈니스 로직**:
  1. 환경 변수 `AVIATIONSTACK_API_KEY` 확인
  2. AviationStack API에 요청 전송
  3. 응답 데이터를 `normalizeFlight()` 함수로 정규화
  4. 단일 항공편 조회 시 첫 번째 결과 반환
  5. 목록 조회 시 모든 항공편 정규화 후 반환

#### 5.2.2 데이터 정규화 함수 (`normalizeFlight`)

- **목적**: AviationStack API 응답을 프론트엔드에서 사용하기 쉬운 형식으로 변환
- **입력**: AviationStack API 응답 객체
- **출력**: 정규화된 항공편 객체
- **변환 규칙**:
  - `flight.flight.iata` → `flight_iata`
  - `flight.airline.name` → `airline`
  - `flight.aircraft.icao` → `aircraft`
  - `flight.live` → `live` (위도, 경도, 고도, 방향, 속도)
  - `flight.departure` → `departure` (공항, 도시, 시간, 터미널, 게이트, 좌표)
  - `flight.arrival` → `arrival` (공항, 도시, 시간, 터미널, 게이트, 좌표)

### 5.3 날씨 정보 API

#### 5.3.1 날씨 정보 조회

- **엔드포인트**: `GET /api/weather`
- **인증**: 없음 (공개 API)
- **Query Parameters**:
  | 파라미터 | 타입 | 필수 | 설명 |
  |---------|------|------|------|
  | `query` | String | 예 | 도시명 또는 공항 코드 (예: "Seoul", "ICN") |

- **Response**:
  ```json
  {
    "location": {
      "name": "Seoul",
      "region": "Seoul",
      "country": "South Korea",
      "lat": 37.57,
      "lon": 126.98,
      "tz_id": "Asia/Seoul",
      "localtime": "2024-01-01 19:00"
    },
    "current": {
      "temp_c": 5,
      "temp_f": 41,
      "feelslike_c": 3,
      "feelslike_f": 37,
      "condition": {
        "text": "Partly cloudy",
        "icon": "//cdn.weatherapi.com/weather/64x64/night/116.png"
      },
      "humidity": 65,
      "wind_kph": 15,
      "wind_mph": 9.3,
      "pressure_mb": 1013,
      "vis_km": 10
    }
  }
  ```

- **에러 응답**:
  - `400 Bad Request`: `query` 파라미터가 없는 경우
    ```json
    {
      "error": "query 파라미터가 필요합니다."
    }
    ```
  - `503 Service Unavailable`: API 키가 설정되지 않은 경우
    ```json
    {
      "error": "날씨 API 키가 구성되지 않았습니다."
    }
    ```
  - `500 Internal Server Error`: API 요청 실패
    ```json
    {
      "error": "날씨 정보를 가져올 수 없습니다."
    }
    ```

- **비즈니스 로직**:
  1. 환경 변수 `WEATHER_API_KEY` 확인
  2. WeatherAPI.com API에 요청 전송
  3. 응답 데이터를 그대로 반환

### 5.4 정적 파일 서비스

#### 5.4.1 루트 경로

- **엔드포인트**: `GET /`
- **설명**: Vue 애플리케이션의 `index.html` 파일을 서비스합니다.
- **Response**: `frontend/dist/index.html` 파일

---

## 6. 프론트엔드 컴포넌트 상세

### 6.1 OpenSkyMap 컴포넌트 (`openskymap.vue`)

#### 6.1.1 주요 기능

- **지도 렌더링**: Leaflet 지도를 Vue 컴포넌트로 렌더링
- **항공기 마커 관리**: 실시간 항공기 위치를 마커로 표시
- **마커 애니메이션**: `requestAnimationFrame`을 사용한 부드러운 이동 및 회전
- **항공편 상세 정보 표시**: 마커 클릭 시 Flight Card UI 표시
- **날씨 정보 표시**: 항공편의 도착지 또는 출발지 날씨 정보 표시
- **비행 경로 시각화**: 출발지와 도착지를 연결하는 폴리라인 표시

#### 6.1.2 주요 메서드

| 메서드명 | 설명 |
|---------|------|
| `fetchPlanes()` | 항공기 목록을 조회하고 지도에 마커 표시 |
| `fetchFlightDetails(flight_iata)` | 특정 항공편의 상세 정보 조회 |
| `fetchWeatherByFlight(flight)` | 항공편의 도착지/출발지 날씨 정보 조회 |
| `animateMarker(marker, targetLatLng, heading)` | 마커를 부드럽게 이동 및 회전 |
| `buildTooltip(flight, live)` | 마커 툴팁 HTML 생성 |
| `clearFlightSelection()` | 선택된 항공편 정보 초기화 |
| `copyCoordinates()` | 항공기 현재 위치 좌표를 클립보드에 복사 |

#### 6.1.3 데이터 속성

| 속성명 | 타입 | 설명 |
|--------|------|------|
| `mapInstance` | Leaflet Map | Leaflet 지도 인스턴스 |
| `markerMap` | Map<String, Marker> | 항공기 마커 맵 (편명 → 마커) |
| `selectedFlight` | Object | 현재 선택된 항공편 정보 |
| `flightPath` | Polyline | 비행 경로 폴리라인 |
| `depMarker` | Marker | 출발지 마커 |
| `arrMarker` | Marker | 도착지 마커 |
| `weatherInfo` | Object | 날씨 정보 |
| `weatherLoading` | Boolean | 날씨 정보 로딩 상태 |
| `weatherError` | String | 날씨 정보 에러 메시지 |
| `timer` | Number | 자동 갱신 타이머 ID |

#### 6.1.4 생명주기 훅

- **`onMapReady(map)`**: 지도가 준비되면 호출
  - `fetchPlanes()` 호출하여 초기 항공기 데이터 로드
  - 60초마다 자동 갱신 타이머 설정

- **`beforeUnmount()`**: 컴포넌트가 언마운트되기 전 호출
  - 타이머 정리 (`clearInterval`)
  - 모든 마커 제거 및 맵 정리

#### 6.1.5 성능 최적화

- **마커 재사용**: 기존 마커를 재사용하여 DOM 조작 최소화
- **애니메이션 최적화**: `requestAnimationFrame`을 사용한 부드러운 애니메이션
- **불필요한 렌더링 방지**: 비활성 항공기는 투명도 조절 (`opacity: 0.3`)
- **자동 갱신 주기**: 60초마다 데이터 갱신 (과도한 API 호출 방지)

### 6.2 App 컴포넌트 (`App.vue`)

- **역할**: 루트 컴포넌트, Vue Router의 `router-view`를 렌더링
- **스타일**: 전역 스타일 설정 (지도 컨테이너 높이 100%)

### 6.3 라우터 설정 (`router.js`)

- **라우트**: 단일 라우트 (`/`) → `openskymap` 컴포넌트
- **히스토리 모드**: `createWebHistory` 사용 (HTML5 History API)

---

## 7. 백엔드 서버 상세

### 7.1 Express 서버 설정

- **포트**: 3000 (기본값)
- **정적 파일 서비스**: `express.static('../frontend/dist')`
- **CORS**: 모든 오리진 허용 (`cors()`)
- **환경 변수**: `dotenv`를 통한 `.env` 파일 로드

### 7.2 API 프록시 엔드포인트

#### 7.2.1 OpenSky Network 프록시

- **경로**: `/opensky/api/states/all`
- **프록시 대상**: `https://opensky-network.org/api/states/all`
- **목적**: CORS 문제 해결 및 속도 제한 완화

#### 7.2.2 AviationStack 프록시

- **경로**: `/api/flight`
- **프록시 대상**: `https://api.aviationstack.com/v1/flights`
- **인증**: `AVIATIONSTACK_API_KEY` 환경 변수 사용
- **데이터 변환**: `normalizeFlight()` 함수로 정규화

#### 7.2.3 WeatherAPI 프록시

- **경로**: `/api/weather`
- **프록시 대상**: `http://api.weatherapi.com/v1/current.json`
- **인증**: `WEATHER_API_KEY` 환경 변수 사용

---

## 8. 환경 변수 설정

### 8.1 필수 환경 변수

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `AVIATIONSTACK_API_KEY` | AviationStack API 키 | `your-aviationstack-api-key` |
| `WEATHER_API_KEY` | WeatherAPI.com API 키 | `your-weather-api-key` |

### 8.2 환경 변수 파일 위치

- **백엔드**: `backend/.env`
- **Docker Compose**: `env_file: backend/.env`로 지정

### 8.3 환경 변수 파일 예시

```env
AVIATIONSTACK_API_KEY=your_aviationstack_api_key_here
WEATHER_API_KEY=your_weather_api_key_here
```

---

## 9. 빌드 및 배포

### 9.1 개발 환경 실행

#### 9.1.1 프론트엔드 개발 서버

```bash
cd frontend
npm install
npm run dev
```

- **개발 서버**: Vite 개발 서버 (기본 포트: 5173)
- **프록시 설정**: `vite.config.js`에서 `/opensky`와 `/api` 프록시 설정

#### 9.1.2 백엔드 개발 서버

```bash
cd backend
npm install
cp .env.example .env  # 환경 변수 파일 생성
# .env 파일에 API 키 입력
npm start
```

- **서버 포트**: 3000
- **정적 파일**: `frontend/dist` 디렉토리 서비스

### 9.2 프로덕션 빌드

#### 9.2.1 프론트엔드 빌드

```bash
cd frontend
npm run build
```

- **빌드 결과물**: `frontend/dist/` 디렉토리
- **최적화**: Vite가 자동으로 코드 분할 및 압축 수행

#### 9.2.2 Docker 빌드

```bash
docker build -t realtimeplane:latest .
```

- **멀티 스테이지 빌드**: 
  - Stage 1: 프론트엔드 빌드
  - Stage 2: 백엔드 및 프론트엔드 빌드 결과물 포함

### 9.3 Docker Compose 배포

```bash
docker compose up -d --build
```

- **서비스 이름**: `realtimeplane`
- **포트 매핑**: `3000:3000`
- **환경 변수**: `backend/.env` 파일 사용
- **헬스 체크**: 30초마다 `/` 엔드포인트 확인

### 9.4 PM2 배포 (Docker 없이)

```bash
# 프론트엔드 빌드
cd frontend && npm run build

# PM2로 백엔드 실행
cd ../backend
pm2 start index.js --name realtimeplane
pm2 startup
pm2 save
```

---

## 10. 성능 사양

### 10.1 프론트엔드 성능

- **초기 로딩 시간**: Vite 빌드 최적화로 빠른 로딩
- **마커 렌더링**: 최대 100개 항공기 동시 표시 가능
- **애니메이션 프레임레이트**: `requestAnimationFrame`으로 60fps 유지
- **자동 갱신 주기**: 60초마다 데이터 갱신

### 10.2 백엔드 성능

- **API 응답 시간**: 외부 API 응답 시간에 의존
- **동시 요청 처리**: Node.js 이벤트 루프 기반 비동기 처리
- **정적 파일 서비스**: Express 정적 파일 미들웨어 사용

### 10.3 외부 API 제한

- **AviationStack API**: 요금제에 따라 월 요청 수 제한
- **WeatherAPI.com**: 요금제에 따라 일일 요청 수 제한
- **OpenSky Network API**: 공개 API, 속도 제한 있음

---

## 11. 보안 사양

### 11.1 API 키 보안

- **환경 변수 사용**: API 키를 코드에 하드코딩하지 않음
- **Git 제외**: `.env` 파일은 `.gitignore`에 포함
- **에러 메시지**: API 키 누락 시 명확한 에러 메시지 제공

### 11.2 CORS 설정

- **현재 설정**: 모든 오리진 허용 (`cors()`)
- **개선 권장**: 프로덕션 환경에서는 특정 오리진만 허용

### 11.3 입력 검증

- **Query Parameters**: Express 기본 파라미터 파싱 사용
- **에러 처리**: 외부 API 에러를 적절히 처리하여 클라이언트에 전달

---

## 12. 주요 기능 상세

### 12.1 실시간 항공기 추적

- **데이터 소스**: AviationStack API의 활성 항공편 조회
- **갱신 주기**: 60초마다 자동 갱신
- **표시 범위**: 한국 상공 항공기 (위도/경도 필터링 가능)
- **마커 표시**: 항공기 아이콘으로 표시, 방향에 따라 회전

### 12.2 항공편 상세 정보

- **편명 정보**: IATA 코드, 항공사명
- **항공기 정보**: 항공기 타입, 등록번호
- **출발/도착 정보**: 공항 코드, 도시명, 예정 시간, 터미널, 게이트
- **실시간 데이터**: 현재 위치 (위도/경도), 고도, 속도, 방향
- **비행 경로**: 출발지와 도착지를 연결하는 파란색 점선

### 12.3 날씨 정보

- **표시 위치**: 항공편의 도착지 또는 출발지 날씨
- **정보 내용**: 온도, 체감 온도, 습도, 풍속, 기압, 가시거리, 날씨 상태
- **UI 위치**: 지도 왼쪽 하단에 위젯 형태로 표시

### 12.4 마커 애니메이션

- **이동 애니메이션**: `requestAnimationFrame`을 사용한 부드러운 이동
- **회전 애니메이션**: 항공기 방향에 따라 마커 회전
- **프레임 수**: 30프레임으로 애니메이션 (약 0.5초)

---

## 13. 개선 사항

### 13.1 기능 개선

- [ ] 항공기 필터링 기능 (항공사, 상태별)
- [ ] 즐겨찾기 항공편 저장
- [ ] 항공편 검색 기능
- [ ] 알림 기능 (특정 항공편 도착 알림)
- [ ] 히스토리 기능 (과거 항공편 추적 기록)
- [ ] 다국어 지원

### 13.2 성능 개선

- [ ] 서버 사이드 캐싱 (Redis 등)
- [ ] API 호출 빈도 최적화
- [ ] 이미지 최적화 (항공기 아이콘)
- [ ] 코드 스플리팅 (Vue Router lazy loading)

### 13.3 보안 개선

- [ ] CORS 설정 세분화
- [ ] Rate Limiting 추가
- [ ] API 키 로테이션 지원
- [ ] HTTPS 강제

### 13.4 UX 개선

- [ ] 로딩 스피너 추가
- [ ] 에러 메시지 개선
- [ ] 반응형 디자인 개선
- [ ] 다크 모드 지원

---

## 14. 문제 해결

### 14.1 일반적인 문제

#### 항공기가 표시되지 않는 경우

1. **API 키 확인**: `backend/.env` 파일에 `AVIATIONSTACK_API_KEY`가 설정되어 있는지 확인
2. **네트워크 확인**: 브라우저 개발자 도구에서 API 요청 상태 확인
3. **콘솔 로그 확인**: 브라우저 콘솔에서 에러 메시지 확인

#### 날씨 정보가 표시되지 않는 경우

1. **API 키 확인**: `backend/.env` 파일에 `WEATHER_API_KEY`가 설정되어 있는지 확인
2. **도시명 확인**: 항공편의 도착지/출발지 도시명이 올바른지 확인

#### Docker 컨테이너가 시작되지 않는 경우

1. **포트 확인**: 포트 3000이 이미 사용 중인지 확인
   ```bash
   sudo lsof -i :3000
   ```
2. **로그 확인**: Docker 로그 확인
   ```bash
   docker compose logs -f
   ```

### 14.2 디버깅 팁

- **프론트엔드**: 브라우저 개발자 도구의 Network 탭에서 API 요청 확인
- **백엔드**: 서버 콘솔 로그에서 API 요청 및 에러 확인
- **Docker**: `docker compose logs -f`로 실시간 로그 확인

---

## 15. 참고 자료

### 15.1 공식 문서

- [Vue.js 공식 문서](https://vuejs.org/)
- [Vite 공식 문서](https://vitejs.dev/)
- [Leaflet 공식 문서](https://leafletjs.com/)
- [Express.js 공식 문서](https://expressjs.com/)
- [AviationStack API 문서](https://aviationstack.com/documentation)
- [WeatherAPI.com 문서](https://www.weatherapi.com/docs/)

### 15.2 외부 API

- [OpenSky Network API](https://opensky-network.org/apidoc/)
- [AviationStack API](https://aviationstack.com/)
- [WeatherAPI.com](https://www.weatherapi.com/)

---

## 16. 라이선스

ISC License

---

## 17. 작성자

개인 포트폴리오 프로젝트
