import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MovieModule } from './movie/movie.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

@Module({
  // 다른 module을 module로 import 할 때,
  imports: [
    MovieModule,
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: process.env.DB_TYPE as 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [],
      synchronize: true, // 개발할 때만 true로 => 자동으로 코드와 맞게 실행시키므로 production인 경우에는 DB 손실 위험 (Production은 migration)
    }),
  ],
  // controller
  controllers: [AppController],
  // ioc inject
  providers: [AppService],
})
export class AppModule {}
