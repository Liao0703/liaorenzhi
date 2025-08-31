const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger配置
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: '兴站智训通 API',
    version: '1.0.0',
    description: '班前学习监督系统的完整API文档',
    contact: {
      name: '技术支持',
      email: 'support@railway-learning.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: '本地开发环境'
    },
    {
      url: 'http://116.62.65.246:3001',
      description: '生产环境'
    },
    {
      url: '{protocol}://{host}:{port}',
      description: '自定义环境',
      variables: {
        protocol: {
          enum: ['http', 'https'],
          default: 'http'
        },
        host: {
          default: 'localhost'
        },
        port: {
          default: '3001'
        }
      }
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT认证，格式：Bearer {token}'
      }
    },
    schemas: {
      User: {
        type: 'object',
        required: ['username', 'password', 'name', 'role'],
        properties: {
          id: {
            type: 'integer',
            description: '用户ID',
            example: 1
          },
          username: {
            type: 'string',
            description: '用户名',
            example: 'zhangsan'
          },
          password: {
            type: 'string',
            description: '密码（加密存储）',
            example: 'hashedPassword123'
          },
          name: {
            type: 'string',
            description: '姓名',
            example: '张三'
          },
          full_name: {
            type: 'string',
            description: '全名',
            example: '张三'
          },
          role: {
            type: 'string',
            enum: ['admin', 'user', 'maintenance'],
            description: '用户角色',
            example: 'user'
          },
          employee_id: {
            type: 'string',
            description: '工号',
            example: '10001'
          },
          company: {
            type: 'string',
            description: '单位',
            example: '兴隆村车站'
          },
          department: {
            type: 'string',
            description: '部门',
            example: '白市驿车站'
          },
          team: {
            type: 'string',
            description: '班组',
            example: '运转一班'
          },
          job_type: {
            type: 'string',
            description: '工种',
            example: '车站值班员'
          },
          email: {
            type: 'string',
            format: 'email',
            description: '邮箱',
            example: 'zhangsan@example.com'
          },
          phone: {
            type: 'string',
            description: '电话',
            example: '13812345678'
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: '创建时间',
            example: '2025-01-08T10:30:00Z'
          }
        }
      },
      LoginRequest: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: {
            type: 'string',
            description: '用户名',
            example: 'zhangsan'
          },
          password: {
            type: 'string',
            description: '密码',
            example: '123456'
          }
        }
      },
      LoginResponse: {
        type: 'object',
        properties: {
          token: {
            type: 'string',
            description: 'JWT认证令牌',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
          },
          user: {
            $ref: '#/components/schemas/UserProfile'
          },
          message: {
            type: 'string',
            description: '响应消息',
            example: '登录成功'
          }
        }
      },
      UserProfile: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          username: { type: 'string', example: 'zhangsan' },
          name: { type: 'string', example: '张三' },
          full_name: { type: 'string', example: '张三' },
          role: { type: 'string', example: 'user' },
          employee_id: { type: 'string', example: '10001' },
          company: { type: 'string', example: '兴隆村车站' },
          department: { type: 'string', example: '白市驿车站' },
          team: { type: 'string', example: '运转一班' },
          job_type: { type: 'string', example: '车站值班员' },
          email: { type: 'string', example: 'zhangsan@example.com' },
          phone: { type: 'string', example: '13812345678' }
        }
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: '请求是否成功',
            example: true
          },
          data: {
            description: '返回的数据'
          },
          error: {
            type: 'string',
            description: '错误信息（当success为false时）',
            example: '用户名或密码错误'
          },
          count: {
            type: 'integer',
            description: '数据条数（用于列表接口）',
            example: 10
          }
        }
      },
      LearningRecord: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          user_id: { type: 'integer', example: 1 },
          article_id: { type: 'string', example: 'article-001' },
          reading_time: { type: 'integer', description: '阅读时间（秒）', example: 1200 },
          completion_rate: { type: 'number', description: '完成率', example: 0.95 },
          quiz_score: { type: 'number', description: '测试得分', example: 85.5 },
          photos_taken: { type: 'integer', description: '拍摄照片数量', example: 15 },
          created_at: { type: 'string', format: 'date-time' }
        }
      }
    },
    responses: {
      UnauthorizedError: {
        description: '认证失败',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: {
                  type: 'string',
                  example: '未授权访问'
                }
              }
            }
          }
        }
      },
      ValidationError: {
        description: '输入验证失败',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: {
                  type: 'string',
                  example: '输入验证失败'
                },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: { type: 'string' },
                      message: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      ServerError: {
        description: '服务器内部错误',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: {
                  type: 'string',
                  example: '服务器内部错误'
                }
              }
            }
          }
        }
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ],
  tags: [
    {
      name: '认证管理',
      description: '用户登录、注册、令牌验证等认证相关接口'
    },
    {
      name: '用户管理',
      description: '用户信息的增删改查操作'
    },
    {
      name: '文章管理',
      description: '学习文章的管理和获取'
    },
    {
      name: '学习记录',
      description: '学习进度和成绩记录管理'
    },
    {
      name: '照片管理',
      description: '学习监控照片的上传和管理'
    },
    {
      name: '文件管理',
      description: '文件上传下载功能'
    },
    {
      name: '系统监控',
      description: '系统健康检查和状态监控'
    }
  ]
};

const options = {
  definition: swaggerDefinition,
  apis: [
    './routes/*.js',    // 路由文件
    './app.js'          // 主应用文件
  ],
};

// 生成swagger规范
const swaggerSpec = swaggerJSDoc(options);

// 自定义CSS样式
const customCss = `
  .swagger-ui .topbar { display: none; }
  .swagger-ui .info .title { color: #3b82f6; }
  .swagger-ui .scheme-container { background: #f8fafc; padding: 15px; border-radius: 5px; }
`;

const swaggerUiOptions = {
  customCss,
  customSiteTitle: '兴站智训通 API 文档',
  swaggerOptions: {
    persistAuthorization: true,  // 保持认证状态
    displayRequestDuration: true,  // 显示请求时间
    filter: true,  // 启用搜索过滤
    tryItOutEnabled: true  // 启用在线测试
  }
};

module.exports = {
  swaggerSpec,
  swaggerUi,
  swaggerUiOptions
};
