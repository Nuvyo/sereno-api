import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '@modules/app.module';
import { CustomExceptionFilter } from '@core/filters/error.filter';
import * as dotenv from 'dotenv';
import * as bodyParser from 'body-parser';
import * as useragent from 'express-useragent';
import cors from 'cors';
import { I18nService } from 'nestjs-i18n';
import { ResponseInterceptor } from '@core/interceptors/response.interceptor';
import { DictionaryService } from '@core/services/dictionary.service';
import { INestApplication } from '@nestjs/common';

dotenv.config();

let cachedApp: INestApplication | null = null;

async function createNestApp() {
  if (cachedApp) {
    return cachedApp;
  }

  const app = await NestFactory.create(AppModule);
  const i18n = app.get<I18nService>(I18nService);
  const dictionary = new DictionaryService(i18n);
  
  const corsOptions: cors.CorsOptions = {
    allowedHeaders: [
      'Origin',
      'Content-Type',
      'Accept',
      'Authorization',
      'language',
      'timezone',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    origin: (origin, callback) => {
      console.log('CORS Origin Check:', { 
        origin, 
        allowedOrigins: process.env.CORS_ALLOWED_ORIGINS 
      });
      
      if (!origin) return callback(null, true);

      if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
        return callback(null, true);
      }

      const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
        ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(o => o.trim())
        : [];
      
      console.log('Parsed allowed origins:', allowedOrigins);
      
      if (allowedOrigins.includes(origin)) {
        console.log('Origin allowed:', origin);
        return callback(null, true);
      }

      console.log('Origin blocked:', origin);
      return callback(new Error(`CORS policy: Origin ${origin} not allowed`), false);
    }
  };

  app.use(cors(corsOptions));
  app.use(bodyParser.json({ type: ['application/json'], limit: '128mb' }));
  app.use(bodyParser.urlencoded({ limit: '128mb', extended: true }));
  app.use(useragent.express());
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new CustomExceptionFilter(dictionary));
  app.useGlobalInterceptors(new ResponseInterceptor(dictionary));

  await app.init();
  cachedApp = app;
  return app;
}

async function bootstrap() {
  const port = Number(process.env.PORT) || 3000;
  const app = await createNestApp();
  await app.listen(port);
}

// Para execução local
if (require.main === module) {
  void bootstrap();
}

// Para Vercel (exporta como handler serverless)
module.exports = async (req: any, res: any) => {
  const app = await createNestApp();
  const expressInstance = app.getHttpAdapter().getInstance();
  return expressInstance(req, res);
};
