import * as faceapi from 'face-api.js';

export interface FaceRecognitionResult {
  isSamePerson: boolean;
  confidence: number;
  faceDetected: boolean;
  error?: string;
  details?: {
    distance?: number;
    similarity?: number;
    threshold?: number;
    faceCount?: number;
  };
}

class FaceRecognitionService {
  private isInitialized = false;
  private referenceDescriptor: Float32Array | null = null;
  private similarityThreshold = 0.6; // 相似度阈值
  private initializationPromise: Promise<boolean> | null = null;

  // 初始化人脸识别模型
  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    // 如果正在初始化，返回现有的Promise
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._initialize();
    return this.initializationPromise;
  }

  private async _initialize(): Promise<boolean> {
    try {
      console.log('🔄 正在加载人脸识别模型...');
      
      // 尝试多个CDN源以提高可靠性
      const modelUrls = [
        'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights',
        'https://unpkg.com/face-api.js@0.22.2/weights',
        'https://fastly.jsdelivr.net/npm/face-api.js@0.22.2/weights'
      ];

      let loaded = false;
      for (const modelBaseUrl of modelUrls) {
        try {
          console.log(`尝试从 ${modelBaseUrl} 加载模型...`);
          
          await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(modelBaseUrl),
            faceapi.nets.faceLandmark68Net.loadFromUri(modelBaseUrl),
            faceapi.nets.faceRecognitionNet.loadFromUri(modelBaseUrl)
          ]);
          
          console.log('✅ 人脸识别模型加载完成');
          loaded = true;
          break;
        } catch (error) {
          console.warn(`从 ${modelBaseUrl} 加载模型失败:`, error);
          continue;
        }
      }

      if (!loaded) {
        throw new Error('所有模型源都无法访问');
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('❌ 人脸识别模型加载失败:', error);
      this.initializationPromise = null;
      return false;
    }
  }

  // 从图片中提取人脸特征
  async extractFaceDescriptor(imageData: string): Promise<Float32Array | null> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        return null;
      }
    }

    try {
      // 创建图片元素
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      return new Promise((resolve) => {
        img.onload = async () => {
          try {
            console.log('🔍 开始检测人脸...');
            
            // 检测人脸
            const detections = await faceapi
              .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
              .withFaceLandmarks()
              .withFaceDescriptors();

            console.log(`检测到 ${detections.length} 个人脸`);

            if (detections.length === 0) {
              console.log('❌ 未检测到人脸');
              resolve(null);
              return;
            }

            if (detections.length > 1) {
              console.log('⚠️ 检测到多个人脸，使用第一个');
            }

            // 返回第一个人脸的特征向量
            const descriptor = detections[0].descriptor;
            console.log('✅ 人脸特征提取成功');
            resolve(descriptor);
          } catch (error) {
            console.error('❌ 人脸特征提取失败:', error);
            resolve(null);
          }
        };

        img.onerror = () => {
          console.error('❌ 图片加载失败');
          resolve(null);
        };

        img.src = imageData;
      });
    } catch (error) {
      console.error('❌ 人脸特征提取失败:', error);
      return null;
    }
  }

  // 设置参考人脸（用户注册时的人脸）
  async setReferenceFace(imageData: string): Promise<boolean> {
    console.log('🔄 设置参考人脸...');
    const descriptor = await this.extractFaceDescriptor(imageData);
    if (descriptor) {
      this.referenceDescriptor = descriptor;
      console.log('✅ 参考人脸设置成功');
      return true;
    }
    console.log('❌ 参考人脸设置失败');
    return false;
  }

  // 比对当前人脸与参考人脸
  async compareFaces(currentImageData: string): Promise<FaceRecognitionResult> {
    if (!this.referenceDescriptor) {
      return {
        isSamePerson: false,
        confidence: 0,
        faceDetected: false,
        error: '未设置参考人脸'
      };
    }

    const currentDescriptor = await this.extractFaceDescriptor(currentImageData);
    if (!currentDescriptor) {
      return {
        isSamePerson: false,
        confidence: 0,
        faceDetected: false,
        error: '未检测到人脸'
      };
    }

    try {
      // 计算欧几里得距离
      const distance = faceapi.euclideanDistance(this.referenceDescriptor, currentDescriptor);
      
      // 转换为相似度（距离越小，相似度越高）
      const similarity = 1 - distance;
      
      console.log('🔍 人脸比对结果:', {
        distance: distance.toFixed(4),
        similarity: similarity.toFixed(4),
        threshold: this.similarityThreshold
      });

      const isSamePerson = similarity >= this.similarityThreshold;

      return {
        isSamePerson,
        confidence: similarity,
        faceDetected: true,
        details: {
          distance,
          similarity,
          threshold: this.similarityThreshold,
          faceCount: 1
        }
      };
    } catch (error) {
      console.error('❌ 人脸比对失败:', error);
      return {
        isSamePerson: false,
        confidence: 0,
        faceDetected: true,
        error: '人脸比对失败'
      };
    }
  }

  // 清除参考人脸
  clearReferenceFace(): void {
    this.referenceDescriptor = null;
    console.log('🗑️ 参考人脸已清除');
  }

  // 获取当前状态
  getStatus(): { isInitialized: boolean; hasReferenceFace: boolean } {
    return {
      isInitialized: this.isInitialized,
      hasReferenceFace: this.referenceDescriptor !== null
    };
  }

  // 设置相似度阈值
  setSimilarityThreshold(threshold: number): void {
    if (threshold >= 0 && threshold <= 1) {
      this.similarityThreshold = threshold;
      console.log(`🔧 相似度阈值已设置为: ${threshold}`);
    } else {
      console.warn('⚠️ 相似度阈值必须在0-1之间');
    }
  }

  // 获取相似度阈值
  getSimilarityThreshold(): number {
    return this.similarityThreshold;
  }
}

// 创建单例实例
const faceRecognitionService = new FaceRecognitionService();
export default faceRecognitionService; 