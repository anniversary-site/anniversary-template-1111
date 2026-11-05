import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// 배포 경로. urluv.shop/pepero/ 아래에 올릴 때는 BASE_PATH=/pepero/ 로 빌드합니다.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
})
