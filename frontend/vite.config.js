import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      // ✔️ OpenSky API 프록시
      '/opensky': {
        target: 'https://opensky-network.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/opensky/, '')
      },
      // ✔️ Node.js 백엔드 (AviationStack 프록시)
      '/api': {
        target: 'http://localhost:3000', // Node.js 서버가 실행 중인 포트
        changeOrigin: true
      }
    }
  }
})
