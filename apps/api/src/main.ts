// apps/api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'; // <--- IMPORT
import { AuditInterceptor } from './common/audit.interceptor'; // Import

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
app.useGlobalInterceptors(new AuditInterceptor()); // <--- ADD THIS
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  });

  // --- SWAGGER CONFIGURATION ---
  const config = new DocumentBuilder()
    .setTitle('SWW Platform API')
    .setDescription('Core Banking & Governance System')
    .setVersion('1.0')
    .addCookieAuth('Authentication') // Tells Swagger to look for our HttpOnly cookie
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // Accessible at /api
  // -----------------------------

  const PORT = process.env.PORT || 3000;
  await app.listen(PORT);
  console.log(`🚀 System Initialized:`);
  console.log(`👉 API Running: http://localhost:${PORT}`);
  console.log(`👉 Docs Running: http://localhost:${PORT}/api`);
}
bootstrap();