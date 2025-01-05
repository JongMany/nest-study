import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { CommonController } from './common.controller';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { v4 } from 'uuid';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: join(process.cwd(), 'public', 'temp'),
        filename: (req, file, callback) => {
          const split = file.originalname.split('.');

          let extension = 'mp4';

          if (split.length > 1) {
            extension = split[split.length - 1];
          }

          callback(null, `${v4()}_${Date.now()}.${extension}`);
        },
      }), // 서버 파일 시스템
    }),
  ],
  controllers: [CommonController],
  providers: [CommonService],
  exports: [CommonService], // CommonModule을 import한 다른 Module에서도 CommonService, CommonController, CommonEntity를 import할 수 있도록 exports
})
export class CommonModule {}
