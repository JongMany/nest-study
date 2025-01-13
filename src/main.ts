import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['debug'], // 설정된 레벨 이상의 레벨을 다 보여준다.
  });
  // app.setGlobalPrefix('v1');
  app.enableVersioning({
    type: VersioningType.HEADER,
    header: 'version',
  });
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  // Class Validator 적용을 위해 Pipe 등록
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 정의된 값만 전달되도록 필터링
      forbidNonWhitelisted: true, // 있으면 안되는 프로퍼티가 있으면 에러를 반환한다.
      transformOptions: {
        enableImplicitConversion: true, // 타입스크립트로 명시된 타입으로 변환
      },
    }),
  );

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
