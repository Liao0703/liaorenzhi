<?php
declare(strict_types=1);

use App\Application\Middleware\JwtAuthMiddleware;
use App\Application\Middleware\CorsMiddleware;
use Selective\BasePath\BasePathMiddleware;
use Slim\App;

return function (App $app) {
    // 设置基础路径
    $app->add(BasePathMiddleware::class);

    // CORS中间件
    $app->add(CorsMiddleware::class);

    // JWT认证中间件（仅对需要认证的路由生效）
    $app->add(JwtAuthMiddleware::class);
};




