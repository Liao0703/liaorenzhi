<?php
declare(strict_types=1);

namespace App\Application\Actions\Article;

use Doctrine\DBAL\Connection;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class ViewArticleAction
{
    private Connection $connection;

    public function __construct(Connection $connection)
    {
        $this->connection = $connection;
    }

    public function __invoke(Request $request, Response $response, array $args): Response
    {
        try {
            $articleId = $args['id'];

            $sql = 'SELECT * FROM articles WHERE id = ? AND status = "published"';
            $stmt = $this->connection->executeQuery($sql, [$articleId]);
            $article = $stmt->fetchAssociative();

            if (!$article) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => '文章不存在或未发布'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            // 处理JSON字段
            $article['tags'] = json_decode($article['tags'] ?? '[]', true);
            $article['quiz_data'] = json_decode($article['quiz_data'] ?? 'null', true);

            $response->getBody()->write(json_encode([
                'success' => true,
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




