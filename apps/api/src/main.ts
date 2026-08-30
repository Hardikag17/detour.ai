import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { API_PATH } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    // Dev: any localhost port (next dev auto-increments); prod: WEB_ORIGIN list.
    origin: process.env.WEB_ORIGIN?.split(',') ?? /^http:\/\/localhost:\d+$/,
    credentials: true,
  });
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  Logger.log(`detour.ai API running at http://localhost:${port}${API_PATH}`, 'Bootstrap');
}

void bootstrap();
