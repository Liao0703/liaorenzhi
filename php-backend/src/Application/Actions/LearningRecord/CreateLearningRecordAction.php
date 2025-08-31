<?php
declare(strict_types=1);

namespace App\Application\Actions\LearningRecord;

use Doctrine\DBAL\Connection;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class CreateLearningRecordAction
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
            $data = json_decode($request->getBody()->getContents(), true);

            // 验证必需字段
            if (!isset($data['article_id'])) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => '缺少必需字段：article_id'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            }

            // 检查文章是否存在
            $articleSql = 'SELECT id FROM articles WHERE id = ? AND status = "published"';
            $article = $this->connection->fetchAssociative($articleSql, [$data['article_id']]);
            
            if (!$article) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => '文章不存在或未发布'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $userId = (int)$userToken->sub;
            $articleId = $data['article_id'];
            $learningDate = $data['learning_date'] ?? date('Y-m-d');
            
            // 检查是否已存在该用户在该日期的学习记录
            $existingSql = 'SELECT id FROM learning_records WHERE user_id = ? AND article_id = ? AND learning_date = ?';
            $existing = $this->connection->fetchAssociative($existingSql, [$userId, $articleId, $learningDate]);

            if ($existing) {
                // 更新现有记录
                $updateSql = '
                    UPDATE learning_records SET 
                        reading_time = ?,
                        completion_rate = ?,
                        quiz_score = ?,
                        quiz_data = ?,
                        photos_taken = ?,
                        updated_at = NOW()
                    WHERE id = ?
                ';

                $this->connection->executeStatement($updateSql, [
                    $data['reading_time'] ?? 0,
                    $data['completion_rate'] ?? 0.0,
                    $data['quiz_score'] ?? null,
                    json_encode($data['quiz_data'] ?? null),
                    $data['photos_taken'] ?? 0,
                    $existing['id']
                ]);

                $recordId = $existing['id'];
            } else {
                // 创建新记录
                $insertSql = '
                    INSERT INTO learning_records (
                        user_id, article_id, reading_time, completion_rate, 
                        quiz_score, quiz_data, photos_taken, learning_date, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                ';

                $this->connection->executeStatement($insertSql, [
                    $userId,
                    $articleId,
                    $data['reading_time'] ?? 0,
                    $data['completion_rate'] ?? 0.0,
                    $data['quiz_score'] ?? null,
                    json_encode($data['quiz_data'] ?? null),
                    $data['photos_taken'] ?? 0,
                    $learningDate
                ]);

                $recordId = $this->connection->lastInsertId();
            }

            // 获取完整的学习记录
            $recordSql = '
                SELECT 
                    lr.*,
                    u.username,
                    u.name as user_name,
                    a.title as article_title
                FROM learning_records lr
                LEFT JOIN users u ON lr.user_id = u.id
                LEFT JOIN articles a ON lr.article_id = a.id
                WHERE lr.id = ?
            ';
            
            $record = $this->connection->fetchAssociative($recordSql, [$recordId]);
            $record['quiz_data'] = json_decode($record['quiz_data'] ?? 'null', true);
            $record['completion_rate'] = (float)$record['completion_rate'];
            $record['quiz_score'] = $record['quiz_score'] ? (float)$record['quiz_score'] : null;

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => $existing ? '学习记录已更新' : '学习记录已创建',
                'data' => $record
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




