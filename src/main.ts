import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Activer CORS pour permettre les requêtes depuis le frontend
  app.enableCors({
    origin:
      process.env.NODE_ENV === 'production'
        ? [process.env.FRONTEND_URL || 'https://sfa-frontend.onrender.com']
        : ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  });

  // Activer la validation globale des DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Préfixe global pour toutes les routes API
  app.setGlobalPrefix('api');
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`  Backend démarré sur http://localhost:${port}/api`);
}
void bootstrap();
