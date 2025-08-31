<?php
declare(strict_types=1);

namespace App\Application\Actions\Article;

use Doctrine\DBAL\Connection;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class CreateArticleAction
{
    private Connection $connection;

    public function __construct(Connection $connection)
    {
        $this->connection = $connection;
    }

    public function __invoke(Request $request, Response $response): Response
    {
        try {
            // 检查权限：只有管理员可以创建文章
            $userToken = $request->getAttribute('user');
            if ($userToken->role !== 'admin') {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => '权限不足：需要管理员权限'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(403);
            }

            $data = json_decode($request->getBody()->getContents(), true);

            // 验证必需字段
            if (!isset($data['title']) || !isset($data['content'])) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => '缺少必需字段：title, content'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            }

            // 生成文章ID
            $articleId = $data['id'] ?? uniqid('article_', true);

            $sql = '
                INSERT INTO articles (
                    id, title, content, category, tags, difficulty, 
                    estimated_time, quiz_data, status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ';

            $this->connection->executeStatement($sql, [
                $articleId,
                $data['title'],
                $data['content'],
                $data['category'] ?? null,
                json_encode($data['tags'] ?? []),
                $data['difficulty'] ?? 'medium',
                $data['estimated_time'] ?? 0,
                json_encode($data['quiz_data'] ?? null),
                $data['status'] ?? 'published'
            ]);

            // 获取创建的文章
            $createdSql = 'SELECT * FROM articles WHERE id = ?';
            $stmt = $this->connection->executeQuery($createdSql, [$articleId]);
            $article = $stmt->fetchAssociative();

            $article['tags'] = json_decode($article['tags'] ?? '[]', true);
            $article['quiz_data'] = json_decode($article['quiz_data'] ?? 'null', true);

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => '文章创建成功',
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




