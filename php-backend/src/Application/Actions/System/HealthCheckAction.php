<?php
declare(strict_types=1);

namespace App\Application\Actions\System;

use Doctrine\DBAL\Connection;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class HealthCheckAction
{
    private Connection $connection;

    public function __construct(Connection $connection)
    {
        $this->connection = $connection;
    }

    public function __invoke(Request $request, Response $response): Response
    {
        try {
            // 测试数据库连接
            $dbStatus = 'connected';
            try {
                $this->connection->executeQuery('SELECT 1');
            } catch (\Exception $e) {
                $dbStatus = 'disconnected: ' . $e->getMessage();
            }

            $healthData = [
                'success' => true,
                'message' => '兴站智训通 API 服务运行正常',
                'timestamp' => date('Y-m-d H:i:s'),
                'version' => '1.0.0',
                'environment' => $_ENV['APP_ENV'] ?? 'unknown',
                'status' => [
                    'database' => $dbStatus,
                    'php_version' => PHP_VERSION,
                    'memory_usage' => round(memory_get_usage(true) / 1024 / 1024, 2) . 'MB',
                    'uptime' => $this->getUptime()
                ]
            ];

            $response->getBody()->write(json_encode($healthData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $errorData = [
                'success' => false,
                'error' => '服务健康检查失败',
                'message' => $e->getMessage(),
                'timestamp' => date('Y-m-d H:i:s')
            ];

            $response->getBody()->write(json_encode($errorData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    private function getUptime(): string
    {
        if (function_exists('sys_getloadavg')) {
            $uptime = file_get_contents('/proc/uptime');
            if ($uptime !== false) {
                $uptime = explode(' ', $uptime)[0];
                $hours = floor($uptime / 3600);
                $minutes = floor(($uptime % 3600) / 60);
                return sprintf('%d小时%d分钟', $hours, $minutes);
            }
        }
        return 'unknown';
    }
}




