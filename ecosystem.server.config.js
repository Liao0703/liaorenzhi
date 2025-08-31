module.exports = {
  apps: [{
    name: 'learning-platform',
    script: './app-simple.js',
    args: '--port 3002',
    cwd: '/www/wwwroot/learning-platform/server',
    env: {
      NODE_ENV: 'production',
      PORT: '3002',
      JWT_SECRET: 'railway-learning-platform-jwt-secret-key-2024',
      DB_HOST: 'localhost',
      DB_PORT: '3306',
      DB_USER: 'railway_user',
      DB_PASSWORD: 'Railway@2024',
      DB_NAME: 'railway_learning',
      CORS_ORIGIN: '*'
    },
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '500M',
    error_file: '/www/wwwroot/learning-platform/logs/pm2-err.log',
    out_file: '/www/wwwroot/learning-platform/logs/pm2-out.log',
    log_file: '/www/wwwroot/learning-platform/logs/pm2-combined.log',
    time: true,
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s',
    autorestart: true,
    kill_timeout: 5000
  }]
};
