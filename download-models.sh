#!/bin/bash

echo "🤖 下载人脸识别模型文件..."
echo "================================"

# 创建模型目录
mkdir -p public/models

# 模型文件列表
MODELS=(
  "tiny_face_detector_model-weights_manifest.json"
  "tiny_face_detector_model-shard1"
  "face_landmark_68_model-weights_manifest.json"
  "face_landmark_68_model-shard1"
  "face_recognition_model-weights_manifest.json"
  "face_recognition_model-shard1"
)

# 下载每个模型文件
for model in "${MODELS[@]}"; do
  echo "📥 下载: $model"
  curl -L "https://github.com/justadudewhohacks/face-api.js/raw/master/weights/$model" \
    -o "public/models/$model" \
    --progress-bar
  
  if [ $? -eq 0 ]; then
    echo "✅ $model 下载完成"
  else
    echo "❌ $model 下载失败"
  fi
done

echo ""
echo "🎉 模型文件下载完成！"
echo "📁 模型文件位置: public/models/"
echo ""
echo "💡 提示："
echo "   - 模型文件大小约为 2MB"
echo "   - 首次使用时会自动加载模型"
echo "   - 加载完成后会缓存到浏览器中" 