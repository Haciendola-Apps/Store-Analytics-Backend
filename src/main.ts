import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors();

  const port = process.env.PORT || process.env.NODE_PORT || 3000;

  await app.listen(port, '0.0.0.0');

  logger.log(`APPLICATION INICIADA EN EL PUERTO ${port}`);
  logger.log(`HEALTH CHECK DISPONIBLE EN: http://localhost:${port}/`);
}

bootstrap();