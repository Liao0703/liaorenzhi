<?php
declare(strict_types=1);

namespace App\Application\Actions\Article;

use Doctrine\DBAL\Connection;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class UpdateArticleAction
{
    private Connection $connection;

    public function __construct(Connection $connection)
    {
        $this->connection = $connection;
    }

    public function __invoke(Request $request, Response $response, array $args): Response
    {
        try {
            // 检查权限：只有管理员可以更新文章
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

            $data = json_decode($request->getBody()->getContents(), true);

            $updateFields = [];
            $updateValues = [];

            $allowedFields = [
                'title', 'content', 'category', 'difficulty', 'estimated_time', 'status'
            ];

            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updateFields[] = $field . ' = ?';
                    $updateValues[] = $data[$field];
                }
            }

            // 处理特殊字段
            if (isset($data['tags'])) {
                $updateFields[] = 'tags = ?';
                $updateValues[] = json_encode($data['tags']);
            }

            if (isset($data['quiz_data'])) {
                $updateFields[] = 'quiz_data = ?';
                $updateValues[] = json_encode($data['quiz_data']);
            }

            if (empty($updateFields)) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => '没有需要更新的字段'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            }

            $updateValues[] = $articleId;
            $sql = 'UPDATE articles SET ' . implode(', ', $updateFields) . ', updated_at = NOW() WHERE id = ?';

            $this->connection->executeStatement($sql, $updateValues);

            // 获取更新后的文章
            $updatedSql = 'SELECT * FROM articles WHERE id = ?';
            $stmt = $this->connection->executeQuery($updatedSql, [$articleId]);
            $article = $stmt->fetchAssociative();

            $article['tags'] = json_decode($article['tags'] ?? '[]', true);
            $article['quiz_data'] = json_decode($article['quiz_data'] ?? 'null', true);

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => '文章更新成功',
                'data' => $article
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




