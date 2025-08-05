export interface MaintenanceConfig {
  isEnabled: boolean;
  message: string;
  startTime: string;
  endTime?: string;
  reason: string;
  enabledBy: string;
}

class MaintenanceService {
  private readonly STORAGE_KEY = 'learning_maintenance_config';

  // 获取维护配置
  getMaintenanceConfig(): MaintenanceConfig | null {
    try {
      const config = localStorage.getItem(this.STORAGE_KEY);
      return config ? JSON.parse(config) : null;
    } catch (error) {
      console.error('获取维护配置失败:', error);
      return null;
    }
  }

  // 启用维护模式
  enableMaintenance(config: Omit<MaintenanceConfig, 'isEnabled'>): void {
    try {
      const maintenanceConfig: MaintenanceConfig = {
        ...config,
        isEnabled: true,
        startTime: new Date().toISOString()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(maintenanceConfig));
      console.log('维护模式已启用:', maintenanceConfig);
    } catch (error) {
      console.error('启用维护模式失败:', error);
    }
  }

  // 禁用维护模式
  disableMaintenance(_disabledBy: string): void {
    try {
      const currentConfig = this.getMaintenanceConfig();
      if (currentConfig) {
        const updatedConfig: MaintenanceConfig = {
          ...currentConfig,
          isEnabled: false,
          endTime: new Date().toISOString()
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedConfig));
        console.log('维护模式已禁用:', updatedConfig);
      }
    } catch (error) {
      console.error('禁用维护模式失败:', error);
    }
  }

  // 检查是否处于维护模式
  isMaintenanceMode(): boolean {
    const config = this.getMaintenanceConfig();
    return config?.isEnabled || false;
  }

  // 获取维护信息
  getMaintenanceInfo(): MaintenanceConfig | null {
    const config = this.getMaintenanceConfig();
    return config?.isEnabled ? config : null;
  }

  // 清除维护配置
  clearMaintenanceConfig(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('维护配置已清除');
    } catch (error) {
      console.error('清除维护配置失败:', error);
    }
  }

  // 获取维护历史
  getMaintenanceHistory(): MaintenanceConfig[] {
    try {
      const history = localStorage.getItem('learning_maintenance_history');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('获取维护历史失败:', error);
      return [];
    }
  }

  // 保存维护历史
  saveMaintenanceHistory(config: MaintenanceConfig): void {
    try {
      const history = this.getMaintenanceHistory();
      history.push(config);
      // 只保留最近10条记录
      if (history.length > 10) {
        history.shift();
      }
      localStorage.setItem('learning_maintenance_history', JSON.stringify(history));
    } catch (error) {
      console.error('保存维护历史失败:', error);
    }
  }
}

export const maintenanceService = new MaintenanceService(); 