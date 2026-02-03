import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';


async function bootstrap() {
  const app =
  await NestFactory.create<NestExpressApplication>(AppModule);


  app.useStaticAssets(
  join(process.cwd(), 'uploads'),
  { prefix: '/uploads' },
);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  app.enableCors({
    origin: "*",
    credentials: true,
    methods: 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    allowedHeaders: "Content-Type,Authorization",
  })
  const config = new DocumentBuilder()
    .setTitle('Civil Resolve')
    .setDescription('The Civil Resolve API description')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
