<?php
declare(strict_types=1);

use App\Domain\User\UserRepository;
use App\Domain\Article\ArticleRepository;
use App\Domain\LearningRecord\LearningRecordRepository;
use App\Infrastructure\Persistence\User\DatabaseUserRepository;
use App\Infrastructure\Persistence\Article\DatabaseArticleRepository;
use App\Infrastructure\Persistence\LearningRecord\DatabaseLearningRecordRepository;
use Doctrine\DBAL\Connection;
use Doctrine\DBAL\DriverManager;
use Monolog\Handler\StreamHandler;
use Monolog\Logger;
use Monolog\Processor\UidProcessor;
use Psr\Container\ContainerInterface;
use Psr\Log\LoggerInterface;

return [
    // 数据库连接
    Connection::class => function (ContainerInterface $c) {
        $connectionParams = [
            'dbname' => $_ENV['DB_DATABASE'],
            'user' => $_ENV['DB_USERNAME'],
            'password' => $_ENV['DB_PASSWORD'],
            'host' => $_ENV['DB_HOST'],
            'port' => $_ENV['DB_PORT'],
            'driver' => 'pdo_mysql',
            'charset' => 'utf8mb4',
            'driverOptions' => [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            ]
        ];

        return DriverManager::getConnection($connectionParams);
    },

    // 日志系统
    LoggerInterface::class => function (ContainerInterface $c) {
        $logLevel = $_ENV['LOG_LEVEL'] ?? 'info';
        $logPath = $_ENV['LOG_PATH'] ?? __DIR__ . '/../logs';
        
        if (!is_dir($logPath)) {
            mkdir($logPath, 0777, true);
        }

        $logger = new Logger($_ENV['APP_NAME'] ?? 'LearningPlatform');
        $processor = new UidProcessor();
        $logger->pushProcessor($processor);

        $handler = new StreamHandler($logPath . '/app.log', $logLevel);
        $logger->pushHandler($handler);

        return $logger;
    },

    // Repository注入
    UserRepository::class => function (ContainerInterface $c) {
        return new DatabaseUserRepository($c->get(Connection::class));
    },

    ArticleRepository::class => function (ContainerInterface $c) {
        return new DatabaseArticleRepository($c->get(Connection::class));
    },

    LearningRecordRepository::class => function (ContainerInterface $c) {
        return new DatabaseLearningRecordRepository($c->get(Connection::class));
    },

    // JWT配置
    'jwt' => [
        'secret' => $_ENV['JWT_SECRET'],
        'expire' => (int)($_ENV['JWT_EXPIRE'] ?? 86400),
        'algorithm' => 'HS256'
    ],

    // 上传配置
    'upload' => [
        'path' => $_ENV['UPLOAD_PATH'] ?? __DIR__ . '/../uploads',
        'max_size' => (int)($_ENV['MAX_UPLOAD_SIZE'] ?? 52428800),
        'allowed_extensions' => explode(',', $_ENV['ALLOWED_EXTENSIONS'] ?? 'pdf,doc,docx,txt,json')
    ]
];




