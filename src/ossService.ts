import OSS from 'ali-oss';
import { loadOSSConfig, validateOSSConfig } from './ossConfig';

// OSS服务类
class OSSService {
  private client: OSS | null = null;

  // 初始化OSS客户端
  private async initClient(): Promise<OSS> {
    if (this.client) {
      return this.client;
    }

    const config = loadOSSConfig();
    if (!validateOSSConfig(config)) {
      throw new Error('OSS配置不完整，请先配置OSS信息');
    }

    this.client = new OSS({
      region: config.region,
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret,
      bucket: config.bucket,
      endpoint: config.endpoint,
      secure: true // 使用HTTPS
    });

    return this.client;
  }

  // 上传文件到OSS（自动适配字符串/Blob/File）
  async uploadFile(fileName: string, content: string | Blob | File, contentType: string = 'application/json'): Promise<string> {
    try {
      const client = await this.initClient();
      let uploadContent: Blob | File;
      if (typeof content === 'string') {
        // 上传JSON等文本，需转Blob
        uploadContent = new Blob([content], { type: contentType });
      } else {
        uploadContent = content;
      }
      const result = await client.put(fileName, uploadContent, {
        headers: {
          'Content-Type': contentType
        }
      });
      
      console.log('文件上传成功:', result.url);
      return result.url;
    } catch (error) {
      console.error('文件上传失败:', error);
      throw error;
    }
  }

  // 从OSS下载文件
  async downloadFile(fileName: string): Promise<string> {
    try {
      const client = await this.initClient();
      const result = await client.get(fileName);
      if (typeof result.content === 'string') {
        return result.content;
      } else if (result.content instanceof Blob) {
        return await result.content.text();
      } else {
        throw new Error('无法解析文件内容');
      }
    } catch (error) {
      console.error('文件下载失败:', error);
      throw error;
    }
  }

  // 检查文件是否存在
  async fileExists(fileName: string): Promise<boolean> {
    try {
      const client = await this.initClient();
      await client.head(fileName);
      return true;
    } catch (error) {
      return false;
    }
  }

  // 删除文件
  async deleteFile(fileName: string): Promise<void> {
    try {
      const client = await this.initClient();
      await client.delete(fileName);
      console.log('文件删除成功:', fileName);
    } catch (error) {
      console.error('文件删除失败:', error);
      throw error;
    }
  }

  // 列出文件
  async listFiles(prefix: string = '', maxKeys: number = 100): Promise<string[]> {
    try {
      const client = await this.initClient();
      const result = await client.list({
        prefix,
        maxKeys: maxKeys
      });
      return result.objects?.map((obj: any) => obj.name) || [];
    } catch (error) {
      console.error('列出文件失败:', error);
      throw error;
    }
  }

  // 获取文件URL
  async getFileUrl(fileName: string, expires: number = 3600): Promise<string> {
    try {
      const client = await this.initClient();
      return client.signatureUrl(fileName, { expires });
    } catch (error) {
      console.error('获取文件URL失败:', error);
      throw error;
    }
  }
}

// 创建单例实例
export const ossService = new OSSService();

// 数据存储服务
export class DataStorageService {
  // 上传文章数据到OSS
  static async uploadArticles(articles: any[]): Promise<string> {
    const fileName = `data/articles_${new Date().toISOString().split('T')[0]}.json`;
    const content = JSON.stringify(articles, null, 2);
    return await ossService.uploadFile(fileName, content, 'application/json');
  }

  // 从OSS下载文章数据
  static async downloadArticles(): Promise<any[]> {
    const fileName = `data/articles_${new Date().toISOString().split('T')[0]}.json`;
    const content = await ossService.downloadFile(fileName);
    return JSON.parse(content);
  }

  // 上传照片数据到OSS
  static async uploadPhotos(photos: any[]): Promise<string> {
    const fileName = `data/photos_${new Date().toISOString().split('T')[0]}.json`;
    const content = JSON.stringify(photos, null, 2);
    return await ossService.uploadFile(fileName, content, 'application/json');
  }

  // 从OSS下载照片数据
  static async downloadPhotos(): Promise<any[]> {
    const fileName = `data/photos_${new Date().toISOString().split('T')[0]}.json`;
    const content = await ossService.downloadFile(fileName);
    return JSON.parse(content);
  }

  // 上传系统设置到OSS
  static async uploadSettings(settings: any): Promise<string> {
    const fileName = 'data/settings.json';
    const content = JSON.stringify(settings, null, 2);
    return await ossService.uploadFile(fileName, content, 'application/json');
  }

  // 从OSS下载系统设置
  static async downloadSettings(): Promise<any> {
    const fileName = 'data/settings.json';
    const content = await ossService.downloadFile(fileName);
    return JSON.parse(content);
  }

  // 上传单个照片文件（Base64转Blob）
  static async uploadPhotoFile(photoData: string, photoId: string): Promise<string> {
    const fileName = `photos/${photoId}.jpg`;
    // 将Base64数据转换为Blob
    const base64Data = photoData.replace(/^data:image\/\w+;base64,/, '');
    const byteString = atob(base64Data);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const intArray = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
      intArray[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([intArray], { type: 'image/jpeg' });
    return await ossService.uploadFile(fileName, blob, 'image/jpeg');
  }

  // 备份所有数据到OSS
  static async backupAllData(articles: any[], photos: any[], settings: any): Promise<{
    articlesUrl: string;
    photosUrl: string;
    settingsUrl: string;
  }> {
    const [articlesUrl, photosUrl, settingsUrl] = await Promise.all([
      this.uploadArticles(articles),
      this.uploadPhotos(photos),
      this.uploadSettings(settings)
    ]);

    return { articlesUrl, photosUrl, settingsUrl };
  }

  // 从OSS恢复所有数据
  static async restoreAllData(): Promise<{
    articles: any[];
    photos: any[];
    settings: any;
  }> {
    const [articles, photos, settings] = await Promise.all([
      this.downloadArticles(),
      this.downloadPhotos(),
      this.downloadSettings()
    ]);

    return { articles, photos, settings };
  }
} 