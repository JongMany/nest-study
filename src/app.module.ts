import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MovieModule } from './movie/movie.module';

@Module({
  // 다른 module을 module로 import 할 때,
  imports: [MovieModule],
  // controller
  controllers: [AppController],
  // ioc inject
  providers: [AppService],
})
export class AppModule {}
