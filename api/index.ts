import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
import * as cors from 'cors';

// Imports diretos dos módulos
import { AppModule } from '../src/modules/app.module';

const server = express();
let app: any = null;

async function bootstrap() {
  if (app) return app;

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

    const corsOptions: cors.CorsOptions = {
      origin: (origin, callback) => {
        console.log('CORS Check:', { 
          origin, 
          allowedOrigins: process.env.CORS_ALLOWED_ORIGINS 
        });
        
        // Permitir requisições sem origin (ex: Postman, apps mobile)
        if (!origin) return callback(null, true);
        
        // Permitir localhost para desenvolvimento
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
          return callback(null, true);
        }

        // Verificar origins permitidas
        const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
          ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(o => o.trim())
          : [];
        
        console.log('Allowed origins:', allowedOrigins);
        
        if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
          console.log('Origin allowed:', origin);
          return callback(null, true);
        }

        console.log('Origin blocked:', origin);
        return callback(new Error(`Not allowed by CORS: ${origin}`), false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Origin', 
        'Content-Type', 
        'Accept', 
        'Authorization', 
        'language', 
        'timezone'
      ],
    };

    nestApp.enableCors(corsOptions);
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

// Export para Vercel
export default async function handler(req: any, res: any) {
  try {
    console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
    
    await bootstrap();
    return server(req, res);
    
  } catch (error) {
    console.error('Handler error:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  }
}