# 멀티 스테이지 빌드를 사용하여 최종 이미지 크기 최적화

# Stage 1: 프론트엔드 빌드
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# 프론트엔드 의존성 설치
COPY frontend/package*.json ./
RUN npm ci

# 프론트엔드 소스 복사 및 빌드
COPY frontend/ .
RUN npm run build

# Stage 2: 백엔드 빌드 및 실행
FROM node:18-alpine

WORKDIR /app

# 백엔드 의존성 설치
COPY backend/package*.json ./
RUN npm ci --only=production

# 백엔드 소스 복사
COPY backend/ .

# 프론트엔드 빌드 결과물 복사
COPY --from=frontend-builder /app/frontend/dist ./../frontend/dist

# 포트 노출
EXPOSE 3000

# 환경 변수 파일이 있으면 사용 (선택사항)
# .env 파일은 docker-compose나 런타임에 마운트

# 애플리케이션 실행
CMD ["node", "index.js"]

