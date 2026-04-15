import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './modules/app.module';
import { ExceptionMiddleware } from './core/middleware/exception.middleware';
import * as dotenv from 'dotenv';
import * as bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import * as useragent from 'express-useragent';
import cors from 'cors';
import helmet, { HelmetOptions } from 'helmet';
import { I18nService } from 'nestjs-i18n';
import { ResponseMiddleware } from './core/middleware/response.middleware';
import { DictionaryService } from './core/services/dictionary.service';

dotenv.config();

async function bootstrap() {
  const port = Number(process.env.PORT);
  const app = await NestFactory.create(AppModule);
  const i18n = app.get<I18nService>(I18nService);
  const dictionary = new DictionaryService(i18n);
  const corsOptions: cors.CorsOptions = {
    allowedHeaders: ['Origin', 'Content-Type', 'Accept', 'Authorization', 'language', 'timezone'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    origin: (origin, callback) => {
      const error = new Error('Not allowed by CORS');

      if (!origin) return callback(error);

      const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
        ? process.env.CORS_ALLOWED_ORIGINS.trim().split(',').map((o) => o.trim())
        : [];

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(error);
    },
  };
  const helmetOptions: HelmetOptions = {
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    frameguard: {
      action: 'deny',
    },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    xssFilter: true,
    hidePoweredBy: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  };

  app.use(helmet(helmetOptions));
  app.use(cors(corsOptions));
  app.use(cookieParser(process.env.COOKIE_SECRET));
  app.use(bodyParser.json({ type: ['application/json'], limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
  app.use(useragent.express());
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new ExceptionMiddleware(dictionary));
  app.useGlobalInterceptors(new ResponseMiddleware(dictionary));

  app.enableShutdownHooks();

  const closeApp = async (signal: string) => {
    // eslint-disable-next-line no-console
    console.warn(`[shutdown] signal=${signal} encerrando aplicação...`);
    await app.close();
    process.exit(0);
  };

  ['SIGINT', 'SIGTERM'].forEach((sig) => process.on(sig, () => void closeApp(sig)));

  await app.listen(port);
}

void bootstrap();
