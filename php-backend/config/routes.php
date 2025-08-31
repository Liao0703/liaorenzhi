<?php
declare(strict_types=1);

use App\Application\Actions\Auth\LoginAction;
use App\Application\Actions\Auth\RegisterAction;
use App\Application\Actions\Auth\MeAction;
use App\Application\Actions\User\ListUsersAction;
use App\Application\Actions\User\ViewUserAction;
use App\Application\Actions\User\CreateUserAction;
use App\Application\Actions\User\UpdateUserAction;
use App\Application\Actions\User\DeleteUserAction;
use App\Application\Actions\Article\ListArticlesAction;
use App\Application\Actions\Article\ViewArticleAction;
use App\Application\Actions\Article\CreateArticleAction;
use App\Application\Actions\Article\UpdateArticleAction;
use App\Application\Actions\Article\DeleteArticleAction;
use App\Application\Actions\LearningRecord\ListLearningRecordsAction;
use App\Application\Actions\LearningRecord\CreateLearningRecordAction;
use App\Application\Actions\LearningRecord\UpdateLearningRecordAction;
use App\Application\Actions\LearningRecord\DeleteLearningRecordAction;
use App\Application\Actions\File\UploadFileAction;
use App\Application\Actions\System\HealthCheckAction;
use Slim\App;
use Slim\Routing\RouteCollectorProxy;

return function (App $app) {
    // 健康检查（无需认证）
    $app->get('/', HealthCheckAction::class);
    $app->get('/health', HealthCheckAction::class);
    
    // API路由组
    $app->group('/api', function (RouteCollectorProxy $group) {
        // 健康检查
        $group->get('', HealthCheckAction::class);
        $group->get('/', HealthCheckAction::class);
        
        // 认证路由（无需token）
        $group->post('/auth/login', LoginAction::class);
        $group->post('/auth/register', RegisterAction::class);
        
        // 需要认证的路由
        $group->group('', function (RouteCollectorProxy $authGroup) {
            // 用户信息
            $authGroup->get('/auth/me', MeAction::class);
            
            // 用户管理
            $authGroup->get('/users', ListUsersAction::class);
            $authGroup->get('/users/{id}', ViewUserAction::class);
            $authGroup->post('/users', CreateUserAction::class);
            $authGroup->put('/users/{id}', UpdateUserAction::class);
            $authGroup->delete('/users/{id}', DeleteUserAction::class);
            
            // 文章管理
            $authGroup->get('/articles', ListArticlesAction::class);
            $authGroup->get('/articles/{id}', ViewArticleAction::class);
            $authGroup->post('/articles', CreateArticleAction::class);
            $authGroup->put('/articles/{id}', UpdateArticleAction::class);
            $authGroup->delete('/articles/{id}', DeleteArticleAction::class);
            
            // 学习记录
            $authGroup->get('/learning-records', ListLearningRecordsAction::class);
            $authGroup->get('/learning-records/user/{userId}', ListLearningRecordsAction::class . ':byUser');
            $authGroup->get('/learning-records/article/{articleId}', ListLearningRecordsAction::class . ':byArticle');
            $authGroup->post('/learning-records', CreateLearningRecordAction::class);
            $authGroup->put('/learning-records/{id}', UpdateLearningRecordAction::class);
            $authGroup->delete('/learning-records/{id}', DeleteLearningRecordAction::class);
            
            // 文件上传
            $authGroup->post('/files/upload', UploadFileAction::class);
            
        })->add(new App\Application\Middleware\JwtAuthMiddleware($app->getContainer()));
    });
};




