import { Module } from '@nestjs/common';
import { CommonService } from './common.service';

@Module({
  imports: [],
  controllers: [],
  providers: [CommonService],
  exports: [CommonService], // CommonModule을 import한 다른 Module에서도 CommonService, CommonController, CommonEntity를 import할 수 있도록 exports
})
export class CommonModule {}
