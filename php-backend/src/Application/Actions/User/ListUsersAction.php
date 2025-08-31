<?php
declare(strict_types=1);

namespace App\Application\Actions\User;

use App\Domain\User\UserRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class ListUsersAction
{
    private UserRepository $userRepository;

    public function __construct(UserRepository $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    public function __invoke(Request $request, Response $response): Response
    {
        try {
            // 检查用户权限
            $userToken = $request->getAttribute('user');
            if (!$userToken || ($userToken->role !== 'admin' && $userToken->role !== 'maintenance')) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => '权限不足：需要管理员或维护人员权限'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(403);
            }

            $users = $this->userRepository->findAll();
            
            // 移除密码字段
            $userData = array_map(function($user) {
                return $user->toArray(false);
            }, $users);

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $userData,
                'count' => count($userData)
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




