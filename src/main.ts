import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '@modules/app.module';
import { CustomExceptionFilter } from '@core/filters/error.filter';
import * as dotenv from 'dotenv';
import * as bodyParser from 'body-parser';
import * as useragent from 'express-useragent';
import cors from 'cors';

dotenv.config();

async function bootstrap() {
  const port = Number(process.env.PORT);
  const app = await NestFactory.create(AppModule);
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
    methods: 'GET,POST,PUT,DELETE',
    origin: '*'
  };

  app.use(cors(corsOptions));
  app.use(bodyParser.json({ type: ['application/json'], limit: '128mb' }));
  app.use(bodyParser.urlencoded({ limit: '128mb', extended: true }));
  app.use(useragent.express());
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new CustomExceptionFilter());

  await app.listen(port);
}

void bootstrap();
