<?php
declare(strict_types=1);

namespace App\Application\Actions\LearningRecord;

use Doctrine\DBAL\Connection;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class ListLearningRecordsAction
{
    private Connection $connection;

    public function __construct(Connection $connection)
    {
        $this->connection = $connection;
    }

    public function __invoke(Request $request, Response $response): Response
    {
        try {
            $userToken = $request->getAttribute('user');
            $queryParams = $request->getQueryParams();
            
            $limit = min((int)($queryParams['limit'] ?? 50), 100);
            $offset = max((int)($queryParams['offset'] ?? 0), 0);

            $sql = '
                SELECT 
                    lr.*,
                    u.username,
                    u.name as user_name,
                    u.company,
                    u.department,
                    u.team,
                    a.title as article_title,
                    a.category as article_category
                FROM learning_records lr
                LEFT JOIN users u ON lr.user_id = u.id
                LEFT JOIN articles a ON lr.article_id = a.id
                WHERE 1=1
            ';
            $params = [];

            // 权限控制：普通用户只能看到自己的记录
            if ($userToken->role === 'user') {
                $sql .= ' AND lr.user_id = ?';
                $params[] = $userToken->sub;
            }

            $sql .= ' ORDER BY lr.learning_date DESC, lr.created_at DESC LIMIT ? OFFSET ?';
            $params[] = $limit;
            $params[] = $offset;

            $stmt = $this->connection->executeQuery($sql, $params);
            $records = $stmt->fetchAllAssociative();

            // 处理JSON字段
            foreach ($records as &$record) {
                $record['quiz_data'] = json_decode($record['quiz_data'] ?? 'null', true);
                $record['completion_rate'] = (float)$record['completion_rate'];
                $record['quiz_score'] = $record['quiz_score'] ? (float)$record['quiz_score'] : null;
            }

            // 获取总数
            $countSql = 'SELECT COUNT(*) FROM learning_records lr WHERE 1=1';
            $countParams = [];
            if ($userToken->role === 'user') {
                $countSql .= ' AND lr.user_id = ?';
                $countParams[] = $userToken->sub;
            }
            $total = (int)$this->connection->fetchOne($countSql, $countParams);

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $records,
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




