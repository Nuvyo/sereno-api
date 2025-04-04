import { NestFactory } from '@nestjs/core';
import { AppModule } from '@modules/app.module';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const port = Number(process.env.PORT);
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  await app.listen(port);
}

void bootstrap();
