<?php
declare(strict_types=1);

namespace App\Application\Actions\Article;

use Doctrine\DBAL\Connection;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class DeleteArticleAction
{
    private Connection $connection;

    public function __construct(Connection $connection)
    {
        $this->connection = $connection;
    }

    public function __invoke(Request $request, Response $response, array $args): Response
    {
        try {
            // 检查权限：只有管理员可以删除文章
            $userToken = $request->getAttribute('user');
            if ($userToken->role !== 'admin') {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => '权限不足：需要管理员权限'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(403);
            }

            $articleId = $args['id'];

            // 检查文章是否存在
            $checkSql = 'SELECT id FROM articles WHERE id = ?';
            $existing = $this->connection->fetchAssociative($checkSql, [$articleId]);

            if (!$existing) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => '文章不存在'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            // 软删除：设置状态为archived而不是真正删除
            $sql = 'UPDATE articles SET status = "archived", updated_at = NOW() WHERE id = ?';
            $result = $this->connection->executeStatement($sql, [$articleId]);

            if ($result > 0) {
                $response->getBody()->write(json_encode([
                    'success' => true,
                    'message' => '文章删除成功'
                ], JSON_UNESCAPED_UNICODE));
            } else {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => '文章删除失败'
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




