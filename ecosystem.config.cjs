module.exports = {
  apps: [
    {
      name: 'content-hub',
      script: './dist/server.cjs',
      cwd: '/var/www/content-hub',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};