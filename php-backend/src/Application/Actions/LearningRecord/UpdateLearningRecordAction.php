<?php
declare(strict_types=1);

namespace App\Application\Actions\LearningRecord;

use Doctrine\DBAL\Connection;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class UpdateLearningRecordAction
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

            // 权限检查：用户只能修改自己的记录，管理员可以修改所有
            if ($userToken->role !== 'admin' && $userToken->role !== 'maintenance' && $userToken->sub !== (int)$existing['user_id']) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => '权限不足：只能修改自己的学习记录'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(403);
            }

            $data = json_decode($request->getBody()->getContents(), true);

            $updateFields = [];
            $updateValues = [];

            $allowedFields = ['reading_time', 'completion_rate', 'quiz_score', 'photos_taken'];

            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updateFields[] = $field . ' = ?';
                    $updateValues[] = $data[$field];
                }
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

            $updateValues[] = $recordId;
            $sql = 'UPDATE learning_records SET ' . implode(', ', $updateFields) . ', updated_at = NOW() WHERE id = ?';

            $this->connection->executeStatement($sql, $updateValues);

            // 获取更新后的记录
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
                'message' => '学习记录更新成功',
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




