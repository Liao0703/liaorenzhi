<?php
declare(strict_types=1);

namespace App\Application\Handlers;

use Psr\Http\Message\ResponseInterface as Response;
use Slim\Exception\HttpBadRequestException;
use Slim\Exception\HttpException;
use Slim\Exception\HttpForbiddenException;
use Slim\Exception\HttpMethodNotAllowedException;
use Slim\Exception\HttpNotFoundException;
use Slim\Exception\HttpNotImplementedException;
use Slim\Exception\HttpUnauthorizedException;
use Slim\Handlers\ErrorHandler as SlimErrorHandler;
use Throwable;

class HttpErrorHandler extends SlimErrorHandler
{
    /**
     * @inheritdoc
     */
    protected function respond(): Response
    {
        $exception = $this->exception;
        $statusCode = 500;
        $error = [
            'success' => false,
            'error' => '服务器内部错误',
            'code' => $statusCode
        ];

        if ($exception instanceof HttpException) {
            $statusCode = $exception->getCode();
            $error['code'] = $statusCode;
            $error['error'] = $exception->getMessage();
        }

        if ($exception instanceof HttpNotFoundException) {
            $error['error'] = '请求的资源不存在';
        }

        if ($exception instanceof HttpMethodNotAllowedException) {
            $error['error'] = '请求方法不被允许';
        }

        if ($exception instanceof HttpUnauthorizedException) {
            $error['error'] = '未授权访问';
        }

        if ($exception instanceof HttpForbiddenException) {
            $error['error'] = '禁止访问';
        }

        if ($exception instanceof HttpBadRequestException) {
            $error['error'] = '请求参数错误';
        }

        if ($exception instanceof HttpNotImplementedException) {
            $error['error'] = '功能未实现';
        }

        // 开发环境显示详细错误信息
        if ($_ENV['APP_DEBUG'] === 'true' && !$exception instanceof HttpException) {
            $error['debug'] = [
                'message' => $exception->getMessage(),
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
                'trace' => $exception->getTraceAsString()
            ];
        }

        $payload = json_encode($error, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        $response = $this->responseFactory->createResponse($statusCode);
        $response->getBody()->write($payload);

        return $response->withHeader('Content-Type', 'application/json');
    }
}




