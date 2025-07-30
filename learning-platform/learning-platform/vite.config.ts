import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true, // 严格端口模式
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '192.168.1.4', // 你的本地IP
      '1an11759jj118.vicp.fun', // 花生壳域名
      '.vicp.fun', // 允许所有 vicp.fun 子域名
      '.vicp.cc', // 允许所有 vicp.cc 子域名
      '.vicp.net', // 允许所有 vicp.net 子域名
      '.ngrok.io', // 允许所有 ngrok 域名
      '.ngrok-free.app', // 允许所有 ngrok-free 域名
      'all', // 允许所有主机（更宽松的设置）
    ],
    cors: {
      origin: true, // 允许所有来源
      credentials: true,
    },
    hmr: {
      host: 'localhost', // 修复HMR主机设置
    },
  },
})
