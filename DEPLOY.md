# 우분투 서버 배포 가이드

이 프로젝트는 Node.js 기반이므로 JAR 파일로는 패키징할 수 없습니다. 대신 Docker를 사용하여 우분투 서버에 배포할 수 있습니다.

## 사전 요구사항

우분투 서버에 다음이 설치되어 있어야 합니다:

1. **Docker** (버전 20.10 이상)
2. **Docker Compose** (버전 2.0 이상)

### Docker 설치 (우분투)

```bash
# 기존 Docker 제거 (선택사항)
sudo apt-get remove docker docker-engine docker.io containerd runc

# 필수 패키지 설치
sudo apt-get update
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Docker 공식 GPG 키 추가
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Docker 저장소 추가
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Docker 설치
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Docker 서비스 시작 및 자동 시작 설정
sudo systemctl start docker
sudo systemctl enable docker

# 현재 사용자를 docker 그룹에 추가 (sudo 없이 실행하기 위해)
sudo usermod -aG docker $USER

# Docker Compose 설치 확인
docker compose version
```

## 배포 방법

### 방법 1: Docker Compose 사용 (권장)

1. **프로젝트 파일을 서버에 업로드**
   ```bash
   # 로컬에서 압축
   tar -czf realtimeplane.tar.gz --exclude='node_modules' --exclude='.git' .
   
   # 서버로 전송 (SCP 사용)
   scp realtimeplane.tar.gz user@your-server-ip:/home/user/
   
   # 서버에서 압축 해제
   ssh user@your-server-ip
   cd /home/user
   tar -xzf realtimeplane.tar.gz -C realtimeplane
   cd realtimeplane
   ```

2. **환경 변수 파일 생성**
   ```bash
   cd backend
   nano .env
   ```
   
   다음 내용을 추가:
   ```env
   AVIATIONSTACK_API_KEY=your_api_key_here
   WEATHER_API_KEY=your_weather_api_key_here
   ```

3. **Docker 이미지 빌드 및 실행**
   ```bash
   cd /home/user/realtimeplane
   docker compose up -d --build
   ```

4. **로그 확인**
   ```bash
   docker compose logs -f
   ```

5. **서비스 중지/재시작**
   ```bash
   # 중지
   docker compose down
   
   # 재시작
   docker compose restart
   ```

### 방법 2: Docker만 사용

1. **Docker 이미지 빌드**
   ```bash
   docker build -t realtimeplane:latest .
   ```

2. **컨테이너 실행**
   ```bash
   docker run -d \
     --name realtimeplane-app \
     -p 3000:3000 \
     --env-file backend/.env \
     --restart unless-stopped \
     realtimeplane:latest
   ```

3. **로그 확인**
   ```bash
   docker logs -f realtimeplane-app
   ```

### 방법 3: 직접 Node.js로 실행 (Docker 없이)

1. **Node.js 설치**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **프로젝트 설정**
   ```bash
   # 프론트엔드 빌드
   cd frontend
   npm install
   npm run build
   
   # 백엔드 설정
   cd ../backend
   npm install
   cp .env.example .env  # 환경 변수 설정
   nano .env
   ```

3. **PM2로 프로세스 관리 (권장)**
   ```bash
   # PM2 설치
   sudo npm install -g pm2
   
   # 애플리케이션 실행
   cd backend
   pm2 start index.js --name realtimeplane
   
   # 자동 시작 설정
   pm2 startup
   pm2 save
   ```

4. **Nginx 리버스 프록시 설정 (선택사항)**
   ```bash
   sudo apt-get install nginx
   sudo nano /etc/nginx/sites-available/realtimeplane
   ```
   
   다음 내용 추가:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   
   ```bash
   sudo ln -s /etc/nginx/sites-available/realtimeplane /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## 방화벽 설정

```bash
# UFW 방화벽에서 포트 3000 열기
sudo ufw allow 3000/tcp

# 또는 Nginx를 사용하는 경우 포트 80, 443
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

## 업데이트 방법

### Docker Compose 사용 시:
```bash
cd /home/user/realtimeplane
git pull  # 또는 새 파일 업로드
docker compose down
docker compose up -d --build
```

### PM2 사용 시:
```bash
cd /home/user/realtimeplane
git pull  # 또는 새 파일 업로드
cd frontend && npm run build
cd ../backend
pm2 restart realtimeplane
```

## 문제 해결

### 포트가 이미 사용 중인 경우
```bash
# 포트 사용 확인
sudo lsof -i :3000
# 또는
sudo netstat -tulpn | grep 3000

# Docker 컨테이너 확인
docker ps -a
```

### 로그 확인
```bash
# Docker Compose
docker compose logs -f

# PM2
pm2 logs realtimeplane

# 직접 실행 시
cd backend && node index.js
```

## 보안 권장사항

1. **환경 변수 보호**: `.env` 파일을 절대 Git에 커밋하지 마세요
2. **HTTPS 사용**: Let's Encrypt로 SSL 인증서 설정 권장
3. **방화벽 설정**: 필요한 포트만 열기
4. **정기 업데이트**: Docker 이미지와 의존성 정기 업데이트

