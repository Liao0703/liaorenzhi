<?php
declare(strict_types=1);

namespace App\Application\Middleware;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Psr\Container\ContainerInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface as Middleware;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Slim\Psr7\Response as SlimResponse;

class JwtAuthMiddleware implements Middleware
{
    private ContainerInterface $container;
    
    // 不需要认证的路由
    private array $publicRoutes = [
        '/',
        '/health',
        '/api',
        '/api/',
        '/api/auth/login',
        '/api/auth/register'
    ];

    public function __construct(ContainerInterface $container)
    {
        $this->container = $container;
    }

    public function process(Request $request, RequestHandler $handler): Response
    {
        $uri = $request->getUri()->getPath();
        
        // 检查是否为公开路由
        if (in_array($uri, $this->publicRoutes)) {
            return $handler->handle($request);
        }

        // 获取Authorization头
        $authHeader = $request->getHeaderLine('Authorization');
        
        if (empty($authHeader)) {
            return $this->unauthorizedResponse('Missing authorization header');
        }

        // 解析Bearer token
        if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return $this->unauthorizedResponse('Invalid authorization header format');
        }

        $token = $matches[1];

        try {
            // 验证JWT token
            $jwtConfig = $this->container->get('jwt');
            $decoded = JWT::decode($token, new Key($jwtConfig['secret'], $jwtConfig['algorithm']));
            
            // 将用户信息添加到请求中
            $request = $request->withAttribute('user', $decoded);
            
            return $handler->handle($request);
            
        } catch (\Exception $e) {
            return $this->unauthorizedResponse('Invalid or expired token');
        }
    }

    private function unauthorizedResponse(string $message): Response
    {
        $response = new SlimResponse();
        $response->getBody()->write(json_encode([
            'success' => false,
            'error' => $message,
            'code' => 401
        ]));
        
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus(401);
    }
}




