<?php
declare(strict_types=1);

namespace App\Application\Actions\File;

use Doctrine\DBAL\Connection;
use Psr\Container\ContainerInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\UploadedFileInterface;

class UploadFileAction
{
    private Connection $connection;
    private ContainerInterface $container;

    public function __construct(Connection $connection, ContainerInterface $container)
    {
        $this->connection = $connection;
        $this->container = $container;
    }

    public function __invoke(Request $request, Response $response): Response
    {
        try {
            $userToken = $request->getAttribute('user');
            $uploadedFiles = $request->getUploadedFiles();
            $uploadConfig = $this->container->get('upload');

            if (empty($uploadedFiles['file'])) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => '没有上传文件'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            }

            /** @var UploadedFileInterface $uploadedFile */
            $uploadedFile = $uploadedFiles['file'];

            if ($uploadedFile->getError() !== UPLOAD_ERR_OK) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => '文件上传失败：' . $this->getUploadErrorMessage($uploadedFile->getError())
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            }

            // 验证文件大小
            if ($uploadedFile->getSize() > $uploadConfig['max_size']) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => '文件大小超过限制：' . round($uploadConfig['max_size'] / 1024 / 1024, 2) . 'MB'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            }

            $originalName = $uploadedFile->getClientFilename();
            $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

            // 验证文件类型
            if (!in_array($extension, $uploadConfig['allowed_extensions'])) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => '不支持的文件类型：' . $extension
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            }

            // 确保上传目录存在
            $uploadPath = $uploadConfig['path'];
            if (!is_dir($uploadPath)) {
                mkdir($uploadPath, 0777, true);
            }

            // 生成唯一文件名
            $filename = uniqid() . '_' . time() . '.' . $extension;
            $filePath = $uploadPath . '/' . $filename;

            // 移动文件
            $uploadedFile->moveTo($filePath);

            // 确定文件类型
            $uploadType = $this->getUploadType($extension);

            // 保存文件记录到数据库
            $sql = '
                INSERT INTO uploaded_files (
                    user_id, filename, original_name, file_type, file_size, 
                    file_path, upload_type, processing_status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ';

            $this->connection->executeStatement($sql, [
                (int)$userToken->sub,
                $filename,
                $originalName,
                $extension,
                $uploadedFile->getSize(),
                $filePath,
                $uploadType,
                'processed'
            ]);

            $fileId = $this->connection->lastInsertId();

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => '文件上传成功',
                'data' => [
                    'id' => (int)$fileId,
                    'filename' => $filename,
                    'original_name' => $originalName,
                    'file_size' => $uploadedFile->getSize(),
                    'file_type' => $extension,
                    'upload_type' => $uploadType,
                    'file_url' => '/uploads/' . $filename
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

    private function getUploadErrorMessage(int $error): string
    {
        switch ($error) {
            case UPLOAD_ERR_INI_SIZE:
                return '文件大小超过系统限制';
            case UPLOAD_ERR_FORM_SIZE:
                return '文件大小超过表单限制';
            case UPLOAD_ERR_PARTIAL:
                return '文件上传不完整';
            case UPLOAD_ERR_NO_FILE:
                return '没有文件上传';
            case UPLOAD_ERR_NO_TMP_DIR:
                return '缺少临时文件夹';
            case UPLOAD_ERR_CANT_WRITE:
                return '文件写入失败';
            default:
                return '未知上传错误';
        }
    }

    private function getUploadType(string $extension): string
    {
        $imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
        $documentTypes = ['pdf', 'doc', 'docx', 'txt', 'rtf'];
        $videoTypes = ['mp4', 'avi', 'mov', 'wmv', 'flv'];

        if (in_array($extension, $imageTypes)) {
            return 'image';
        } elseif (in_array($extension, $documentTypes)) {
            return 'document';
        } elseif (in_array($extension, $videoTypes)) {
            return 'video';
        } else {
            return 'other';
        }
    }
}




