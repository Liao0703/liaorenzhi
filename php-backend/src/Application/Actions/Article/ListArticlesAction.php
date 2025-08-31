<?php
declare(strict_types=1);

namespace App\Application\Actions\Article;

use Doctrine\DBAL\Connection;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class ListArticlesAction
{
    private Connection $connection;

    public function __construct(Connection $connection)
    {
        $this->connection = $connection;
    }

    public function __invoke(Request $request, Response $response): Response
    {
        try {
            $queryParams = $request->getQueryParams();
            $category = $queryParams['category'] ?? null;
            $status = $queryParams['status'] ?? 'published';
            $limit = min((int)($queryParams['limit'] ?? 50), 100);
            $offset = max((int)($queryParams['offset'] ?? 0), 0);

            $sql = 'SELECT * FROM articles WHERE status = ?';
            $params = [$status];

            if ($category) {
                $sql .= ' AND category = ?';
                $params[] = $category;
            }

            $sql .= ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
            $params[] = $limit;
            $params[] = $offset;

            $stmt = $this->connection->executeQuery($sql, $params);
            $articles = $stmt->fetchAllAssociative();

            // 处理JSON字段
            foreach ($articles as &$article) {
                $article['tags'] = json_decode($article['tags'] ?? '[]', true);
                $article['quiz_data'] = json_decode($article['quiz_data'] ?? 'null', true);
            }

            // 获取总数
            $countSql = 'SELECT COUNT(*) FROM articles WHERE status = ?';
            $countParams = [$status];
            if ($category) {
                $countSql .= ' AND category = ?';
                $countParams[] = $category;
            }
            $total = (int)$this->connection->fetchOne($countSql, $countParams);

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $articles,
                'pagination' => [
                    'total' => $total,
                    'limit' => $limit,
                    'offset' => $offset,
                    'has_more' => ($offset + $limit) < $total
                ]
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




