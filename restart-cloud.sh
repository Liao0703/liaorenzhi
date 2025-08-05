#!/bin/bash
echo "🔄 重启云服务器..."
ssh root@116.62.65.246 << 'REMOTE_EOF'
cd /root/learning-platform
nohup node server.js > app.log 2>&1 &
echo "✅ 服务器已启动"
sleep 2
curl -s http://localhost:3000/health || echo "服务器启动中..."
REMOTE_EOF
