import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'fs'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    // 自定义插件：构建时复制用户管理HTML文件
    {
      name: 'copy-user-html-files',
      writeBundle() {
        try {
          copyFileSync('add-user-window.html', 'dist/add-user-window.html');
          copyFileSync('edit-user-window.html', 'dist/edit-user-window.html');
          console.log('✅ 用户管理HTML文件已复制到dist目录');
        } catch (error) {
          console.warn('⚠️  复制用户管理HTML文件失败:', error.message);
        }
      }
    }
  ],
  server: {
    port: 5175,
    host: '0.0.0.0',
    proxy: {
      // Node.js后端代理 (默认)
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false
      },
      '/health': {
        target: 'http://localhost:3002',
        changeOrigin: true
      },
      '/api-docs': {
        target: 'http://localhost:3002',
        changeOrigin: true
      },
      '/monitoring': {
        target: 'http://localhost:3002',
        changeOrigin: true
      }
    }
  }
})
