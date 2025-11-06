import { VercelRequest, VercelResponse } from '@vercel/node';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AppModule } from '../src/modules/app.module';

const server = express();
let app: any = null;

async function bootstrap() {
  if (app) {
    return app;
  }

  try {
    console.log('Creating NestJS app...');
    
    const nestApp = await NestFactory.create(
      AppModule,
      new ExpressAdapter(server),
      { 
        logger: ['error', 'warn', 'log'],
        bufferLogs: true 
      }
    );

    // Configurar CORS
    nestApp.enableCors({
      origin: (origin, callback) => {
        console.log('CORS Check:', { origin, env: process.env.CORS_ALLOWED_ORIGINS });
        
        if (!origin) return callback(null, true);
        
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
          return callback(null, true);
        }

        const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
          ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(o => o.trim())
          : [];
        
        if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error(`Not allowed by CORS: ${origin}`), false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Origin', 'Content-Type', 'Accept', 'Authorization', 'language', 'timezone'],
    });

    nestApp.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    await nestApp.init();
    app = nestApp;
    
    console.log('NestJS app initialized successfully');
    return nestApp;
    
  } catch (error) {
    console.error('Bootstrap error:', error);
    throw error;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log(`${req.method} ${req.url}`);
    
    await bootstrap();
    return server(req, res);
    
  } catch (error) {
    console.error('Handler error:', error);
    
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  }
}