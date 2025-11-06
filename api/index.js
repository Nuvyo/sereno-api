const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');
const { ExpressAdapter } = require('@nestjs/platform-express');
const express = require('express');
const cors = require('cors');
require('dotenv/config');

const server = express();
let app = null;

async function bootstrap() {
  if (app) return app;

  try {
    const { AppModule } = require('../dist/modules/app.module');
    
    const nestApp = await NestFactory.create(
      AppModule,
      new ExpressAdapter(server),
      { logger: ['error', 'warn'] }
    );

    const corsOptions = {
      origin: (origin, callback) => {
        console.log('CORS Check:', { origin });
        
        if (!origin) return callback(null, true);
        
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
          return callback(null, true);
        }

        const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
          ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(o => o.trim())
          : [];
        
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error(`Not allowed by CORS: ${origin}`), false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Origin', 'Content-Type', 'Accept', 'Authorization', 'language', 'timezone'],
    };

    nestApp.enableCors(corsOptions);
    nestApp.useGlobalPipes(new ValidationPipe());

    await nestApp.init();
    app = nestApp;
    
    console.log('NestJS initialized');
    return nestApp;
    
  } catch (error) {
    console.error('Bootstrap error:', error);
    throw error;
  }
}

module.exports = async (req, res) => {
  try {
    console.log(`${req.method} ${req.url}`);
    
    await bootstrap();
    return server(req, res);
    
  } catch (error) {
    console.error('Handler error:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
};