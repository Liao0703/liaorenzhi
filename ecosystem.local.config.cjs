module.exports = {
  apps: [{
    name: 'learning-platform',
    script: './server/app.js',
    cwd: process.cwd(),
    env: {
      NODE_ENV: 'development',
      PORT: '3001',
      JWT_SECRET: 'railway-learning-platform-super-secret-jwt-key-2024',
      DB_HOST: 'localhost',
      DB_PORT: '3306',
      DB_USER: 'root',
      DB_PASSWORD: 'root',
      DB_NAME: 'learning_platform'
    },
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s',
    autorestart: true,
    kill_timeout: 5000
  }]
};
