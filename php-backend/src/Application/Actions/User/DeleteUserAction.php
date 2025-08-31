<?php
declare(strict_types=1);

namespace App\Application\Actions\User;

use App\Domain\User\UserRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class DeleteUserAction
{
    private UserRepository $userRepository;

    public function __construct(UserRepository $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    public function __invoke(Request $request, Response $response, array $args): Response
    {
        try {
            // 只有管理员可以删除用户
            $userToken = $request->getAttribute('user');
            if ($userToken->role !== 'admin') {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => '权限不足：需要管理员权限'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(403);
            }

            $targetUserId = (int)$args['id'];

            // 不能删除自己
            if ($userToken->sub === $targetUserId) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => '不能删除自己的账户'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            }

            // 检查用户是否存在
            $user = $this->userRepository->findById($targetUserId);
            if (!$user) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => '用户不存在'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            // 删除用户
            $deleted = $this->userRepository->delete($targetUserId);

            if ($deleted) {
                $response->getBody()->write(json_encode([
                    'success' => true,
                    'message' => '用户删除成功'
                ], JSON_UNESCAPED_UNICODE));
            } else {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => '用户删除失败'
                ]));
                return $response->withStatus(500);
            }

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