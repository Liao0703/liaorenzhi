<?php
declare(strict_types=1);

use App\Application\App;
use DI\ContainerBuilder;
use Slim\Factory\AppFactory;

require __DIR__ . '/../vendor/autoload.php';

// 加载环境变量
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();

// 构建DI容器
$containerBuilder = new ContainerBuilder();

// 生产环境下编译容器
if ($_ENV['APP_ENV'] === 'production') {
    $containerBuilder->enableCompilation(__DIR__ . '/../var/cache');
}

// 添加服务定义
$containerBuilder->addDefinitions(__DIR__ . '/../config/container.php');
$container = $containerBuilder->build();

// 创建App实例
AppFactory::setContainer($container);
$app = AppFactory::create();

// 添加路由解析中间件
$app->addRoutingMiddleware();

// 设置错误处理
$callableResolver = $app->getCallableResolver();
$responseFactory = $app->getResponseFactory();

$errorHandler = new App\Application\Handlers\HttpErrorHandler($callableResolver, $responseFactory);
$errorMiddleware = $app->addErrorMiddleware($_ENV['APP_DEBUG'] === 'true', true, true);
$errorMiddleware->setDefaultErrorHandler($errorHandler);

// 注册中间件
(require __DIR__ . '/../config/middleware.php')($app);

// 注册路由
(require __DIR__ . '/../config/routes.php')($app);

$app->run();




