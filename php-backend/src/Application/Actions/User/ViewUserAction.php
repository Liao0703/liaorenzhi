<?php
declare(strict_types=1);

namespace App\Application\Actions\User;

use App\Domain\User\UserRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class ViewUserAction
{
    private UserRepository $userRepository;

    public function __construct(UserRepository $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    public function __invoke(Request $request, Response $response, array $args): Response
    {
        try {
            // 检查权限
            $userToken = $request->getAttribute('user');
            $requestedUserId = (int)$args['id'];
            
            // 用户只能查看自己的信息，管理员可以查看所有
            if ($userToken->role !== 'admin' && $userToken->role !== 'maintenance' && $userToken->sub !== $requestedUserId) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => '权限不足：只能查看自己的信息'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(403);
            }

            $user = $this->userRepository->findById($requestedUserId);

            if (!$user) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => '用户不存在'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $user->toArray()
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




