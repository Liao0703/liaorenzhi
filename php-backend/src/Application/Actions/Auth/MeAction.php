<?php
declare(strict_types=1);

namespace App\Application\Actions\Auth;

use App\Domain\User\UserRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class MeAction
{
    private UserRepository $userRepository;

    public function __construct(UserRepository $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    public function __invoke(Request $request, Response $response): Response
    {
        try {
            $userToken = $request->getAttribute('user');
            
            if (!$userToken || !isset($userToken->sub)) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => '无效的用户token'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
            }

            $user = $this->userRepository->findById((int)$userToken->sub);
            
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




