import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Class Validator 적용을 위해 Pipe 등록
  app.useGlobalPipes(new ValidationPipe());
  // // Swagger 적용
  // app.enableCors();
  // app.useSwagger();
  // const document = SwaggerModule.createDocument(app, {
  //   title: 'Movie API',
  //   description: 'A simple API for managing movies',
  //   version: '1.0',
  // });
  // SwaggerModule.setup('api', app, document);
  // // Error Handling
  // app.useGlobalFilters(new HttpExceptionFilter());
  // app.useGlobalInterceptors(new LoggingInterceptor());
  // // Logging
  // app.useLogger(new WinstonLogger());
  // // Rate Limiting
  // app.use(rateLimit({
  //   windowMs: 15 * 60 * 1000, // 15 minutes
  //   max: 100, // limit each IP to 100 requests per windowMs
  // }));
  // // Caching

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
