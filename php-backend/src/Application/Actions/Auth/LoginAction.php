<?php
declare(strict_types=1);

namespace App\Application\Actions\Auth;

use App\Domain\User\UserRepository;
use Firebase\JWT\JWT;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Container\ContainerInterface;

class LoginAction
{
    private UserRepository $userRepository;
    private ContainerInterface $container;

    public function __construct(UserRepository $userRepository, ContainerInterface $container)
    {
        $this->userRepository = $userRepository;
        $this->container = $container;
    }

    public function __invoke(Request $request, Response $response): Response
    {
        try {
            $data = json_decode($request->getBody()->getContents(), true);
            
            if (!isset($data['username']) || !isset($data['password'])) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => '用户名和密码不能为空'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            }

            $user = $this->userRepository->findByUsername($data['username']);
            
            if (!$user || !$user->verifyPassword($data['password'])) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => '用户名或密码错误'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
            }

            // 生成JWT token
            $jwtConfig = $this->container->get('jwt');
            $now = time();
            $payload = [
                'iat' => $now,
                'exp' => $now + $jwtConfig['expire'],
                'sub' => $user->getId(),
                'username' => $user->getUsername(),
                'role' => $user->getRole()
            ];

            $token = JWT::encode($payload, $jwtConfig['secret'], $jwtConfig['algorithm']);

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => '登录成功',
                'data' => [
                    'token' => $token,
                    'user' => $user->toArray(),
                    'expires_in' => $jwtConfig['expire']
                ]
            ]));

            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => '服务器内部错误：' . $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }
}




