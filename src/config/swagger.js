const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CaddyAI API',
      version: '1.0.0',
      description: 'Smart Golf Caddy API - AI-powered golf shot recommendations',
      contact: {
        name: 'CaddyAI Support',
        email: 'support@caddyai.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3001',
        description: 'Development server'
      },
      {
        url: 'https://api.caddyai.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'User unique identifier'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            firstName: {
              type: 'string',
              description: 'User first name'
            },
            lastName: {
              type: 'string',
              description: 'User last name'
            },
            phone: {
              type: 'string',
              description: 'User phone number'
            },
            handicap: {
              type: 'number',
              minimum: -10,
              maximum: 54,
              description: 'User golf handicap'
            },
            skillLevel: {
              type: 'string',
              enum: ['beginner', 'intermediate', 'advanced', 'professional'],
              description: 'User skill level'
            },
            dominantHand: {
              type: 'string',
              enum: ['left', 'right'],
              description: 'User dominant hand'
            },
            isActive: {
              type: 'boolean',
              description: 'Whether user account is active'
            },
            emailVerified: {
              type: 'boolean',
              description: 'Whether user email is verified'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'User last update timestamp'
            }
          }
        },
        Club: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Club unique identifier'
            },
            name: {
              type: 'string',
              description: 'Club name (e.g., "7 Iron")'
            },
            type: {
              type: 'string',
              enum: ['driver', 'fairway_wood', 'hybrid', 'iron', 'wedge', 'putter'],
              description: 'Club type'
            },
            brand: {
              type: 'string',
              description: 'Club brand'
            },
            model: {
              type: 'string',
              description: 'Club model'
            },
            loft: {
              type: 'integer',
              minimum: 0,
              maximum: 90,
              description: 'Club loft in degrees'
            },
            shaftFlex: {
              type: 'string',
              description: 'Shaft flex (e.g., Regular, Stiff)'
            },
            averageDistance: {
              type: 'integer',
              description: 'Average distance in yards'
            },
            distanceRanges: {
              type: 'object',
              properties: {
                min: { type: 'integer' },
                max: { type: 'integer' },
                carry: { type: 'integer' }
              },
              description: 'Distance ranges for different conditions'
            },
            notes: {
              type: 'string',
              description: 'Personal notes about the club'
            },
            orderIndex: {
              type: 'integer',
              description: 'Order in golf bag'
            }
          }
        },
        Calculation: {
          type: 'object',
          properties: {
            recommendedClub: {
              type: 'string',
              description: 'Recommended club name'
            },
            aimPoint: {
              type: 'string',
              description: 'Where to aim (e.g., "10 yards left of pin")'
            },
            stanceAdjustment: {
              type: 'string',
              description: 'Stance or swing adjustments'
            },
            confidenceScore: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              description: 'Confidence score (0-1)'
            },
            additionalNotes: {
              type: 'string',
              description: 'Additional notes and tips'
            },
            factors: {
              type: 'array',
              items: { type: 'string' },
              description: 'Factors considered in recommendation'
            },
            alternativeClubs: {
              type: 'array',
              items: { type: 'string' },
              description: 'Alternative club suggestions'
            }
          }
        },
        Subscription: {
          type: 'object',
          properties: {
            planType: {
              type: 'string',
              enum: ['free', 'basic', 'premium', 'professional'],
              description: 'Subscription plan type'
            },
            status: {
              type: 'string',
              enum: ['active', 'canceled', 'incomplete', 'past_due', 'trialing'],
              description: 'Subscription status'
            },
            price: {
              type: 'number',
              description: 'Monthly price'
            },
            currentPeriodStart: {
              type: 'string',
              format: 'date-time',
              description: 'Current billing period start'
            },
            currentPeriodEnd: {
              type: 'string',
              format: 'date-time',
              description: 'Current billing period end'
            },
            aiRequestsUsed: {
              type: 'integer',
              description: 'AI requests used this period'
            },
            aiRequestsLimit: {
              type: 'integer',
              description: 'AI requests limit for this period'
            },
            features: {
              type: 'array',
              items: { type: 'string' },
              description: 'Enabled features'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Error message'
            },
            code: {
              type: 'string',
              description: 'Error code'
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' }
                }
              },
              description: 'Validation error details'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Access token required'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Insufficient permissions'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Validation failed',
                details: [
                  {
                    field: 'email',
                    message: 'Please provide a valid email'
                  }
                ]
              }
            }
          }
        },
        RateLimitError: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Too many requests',
                retryAfter: 60
              }
            }
          }
        },
        SubscriptionRequired: {
          description: 'Subscription upgrade required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Premium subscription required',
                code: 'UPGRADE_REQUIRED',
                currentPlan: 'basic',
                requiredPlan: 'premium'
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization'
      },
      {
        name: 'User',
        description: 'User profile and club management'
      },
      {
        name: 'Calculation',
        description: 'Golf shot calculations and recommendations'
      },
      {
        name: 'Subscription',
        description: 'Subscription and billing management'
      },
      {
        name: 'Voice',
        description: 'Voice command processing'
      },
      {
        name: 'System',
        description: 'System health and status'
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/server.js'
  ],
};

const specs = swaggerJsdoc(options);

const swaggerSetup = (app) => {
  // Swagger page
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info hgroup.main h2 { color: #2563eb }
    `,
    customSiteTitle: 'CaddyAI API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showRequestHeaders: true,
      tryItOutEnabled: true
    }
  }));

  // JSON endpoint for API spec
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  console.log('📚 API Documentation available at /api-docs');
};

module.exports = swaggerSetup;