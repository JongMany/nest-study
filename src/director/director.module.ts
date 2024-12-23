import { Module } from '@nestjs/common';
import { DirectorService } from './director.service';
import { DirectorController } from './director.controller';

@Module({
  imports: [],
  controllers: [DirectorController],
  providers: [DirectorService],
})
export class DirectorModule {}
