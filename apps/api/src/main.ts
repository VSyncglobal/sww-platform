import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AuditInterceptor } from './common/audit.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. SET GLOBAL PREFIX (Crucial for alignment)
  app.setGlobalPrefix('api'); 

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  
  app.useGlobalInterceptors(new AuditInterceptor());

  // 2. CORS (Allow Frontend to talk to Backend)
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('SWW Platform API')
    .setDescription('Core Banking & Governance System')
    .setVersion('1.0')
    .addCookieAuth('Authentication')
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document); // Docs at /docs

  const PORT = process.env.PORT || 3000;
  await app.listen(PORT);
  console.log(`🚀 System Initialized:`);
  console.log(`👉 API Running: http://localhost:${PORT}/api`);
  console.log(`👉 Docs Running: http://localhost:${PORT}/docs`);
}
bootstrap();