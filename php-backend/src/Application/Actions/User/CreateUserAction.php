<?php
declare(strict_types=1);

namespace App\Application\Actions\User;

use App\Domain\User\User;
use App\Domain\User\UserRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class CreateUserAction
{
    private UserRepository $userRepository;

    public function __construct(UserRepository $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    public function __invoke(Request $request, Response $response): Response
    {
        try {
            // 检查权限
            $userToken = $request->getAttribute('user');
            if ($userToken->role !== 'admin') {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => '权限不足：需要管理员权限'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(403);
            }

            $data = json_decode($request->getBody()->getContents(), true);

            if (!isset($data['username']) || !isset($data['password']) || !isset($data['name'])) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => '缺少必需字段：username, password, name'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            }

            // 检查用户名是否已存在
            if ($this->userRepository->usernameExists($data['username'])) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => '用户名已存在'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(409);
            }

            $user = new User(
                null,
                $data['username'],
                password_hash($data['password'], PASSWORD_DEFAULT),
                $data['name'],
                $data['full_name'] ?? null,
                $data['role'] ?? 'user',
                $data['employee_id'] ?? null,
                $data['company'] ?? null,
                $data['department'] ?? null,
                $data['team'] ?? null,
                $data['job_type'] ?? null,
                $data['email'] ?? null,
                $data['phone'] ?? null
            );

            $createdUser = $this->userRepository->create($user);

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => '用户创建成功',
                'data' => $createdUser->toArray()
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




