<?php
declare(strict_types=1);

namespace App\Application\Actions\LearningRecord;

use Doctrine\DBAL\Connection;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class DeleteLearningRecordAction
{
    private Connection $connection;

    public function __construct(Connection $connection)
    {
        $this->connection = $connection;
    }

    public function __invoke(Request $request, Response $response, array $args): Response
    {
        try {
            $userToken = $request->getAttribute('user');
            $recordId = (int)$args['id'];

            // 检查记录是否存在
            $checkSql = 'SELECT user_id FROM learning_records WHERE id = ?';
            $existing = $this->connection->fetchAssociative($checkSql, [$recordId]);

            if (!$existing) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => '学习记录不存在'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            // 权限检查：用户只能删除自己的记录，管理员可以删除所有
            if ($userToken->role !== 'admin' && $userToken->role !== 'maintenance' && $userToken->sub !== (int)$existing['user_id']) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => '权限不足：只能删除自己的学习记录'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(403);
            }

            // 删除记录
            $sql = 'DELETE FROM learning_records WHERE id = ?';
            $result = $this->connection->executeStatement($sql, [$recordId]);

            if ($result > 0) {
                $response->getBody()->write(json_encode([
                    'success' => true,
                    'message' => '学习记录删除成功'
                ], JSON_UNESCAPED_UNICODE));
            } else {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => '学习记录删除失败'
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




