<?php
declare(strict_types=1);

namespace App\Application\Actions\User;

use App\Domain\User\UserRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class UpdateUserAction
{
    private UserRepository $userRepository;

    public function __construct(UserRepository $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    public function __invoke(Request $request, Response $response, array $args): Response
    {
        try {
            $userToken = $request->getAttribute('user');
            $targetUserId = (int)$args['id'];
            
            // 权限检查：用户只能更新自己的信息，管理员可以更新所有
            if ($userToken->role !== 'admin' && $userToken->sub !== $targetUserId) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => '权限不足：只能修改自己的信息'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(403);
            }

            $user = $this->userRepository->findById($targetUserId);
            if (!$user) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => '用户不存在'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $data = json_decode($request->getBody()->getContents(), true);

            // 处理密码加密
            if (isset($data['password']) && !empty($data['password'])) {
                $data['password'] = password_hash($data['password'], PASSWORD_DEFAULT);
            } else {
                unset($data['password']); // 不更新密码
            }

            // 普通用户不能修改role
            if ($userToken->role !== 'admin') {
                unset($data['role']);
            }

            // 检查用户名唯一性
            if (isset($data['username']) && $data['username'] !== $user->getUsername()) {
                if ($this->userRepository->usernameExists($data['username'])) {
                    $response->getBody()->write(json_encode([
                        'success' => false,
                        'error' => '用户名已存在'
                    ]));
                    return $response->withHeader('Content-Type', 'application/json')->withStatus(409);
                }
            }

            $updatedUser = $this->userRepository->update($targetUserId, $data);

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => '用户信息更新成功',
                'data' => $updatedUser->toArray()
            ], JSON_UNESCAPED_UNICODE));

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




