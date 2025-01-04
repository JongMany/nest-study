import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { rename } from 'fs/promises';
import { join } from 'path';
import { v4 } from 'uuid';

@Injectable()
export class MovieFilePipe
  implements PipeTransform<Express.Multer.File, Promise<Express.Multer.File>>
{
  constructor(
    private readonly options: {
      // MB로 입력
      maxSize: number;
      mimeType: string;
    },
  ) {}

  async transform(
    value: Express.Multer.File,
    metadata: ArgumentMetadata,
  ): Promise<Express.Multer.File> {
    if (!value) {
      throw new BadRequestException('Movie 필드는 필수입니다!');
    }

    const byteSize = this.options.maxSize * 1000 * 1000;

    if (value.size > byteSize) {
      throw new BadRequestException(
        `MP4 파일 크기는 ${this.options.maxSize}MB 이하로 업로드 해주세요!`,
      );
    }

    if (value.mimetype !== this.options.mimeType) {
      throw new BadRequestException(
        `${this.options.mimeType} 파일만 업로드할 수 있습니다!`,
      );
    }
    const split = value.originalname.split('.');

    let extension = 'mp4';

    if (split.length > 1) {
      extension = split[split.length - 1];
    }

    // ex) uuid_Date.mp4
    const filename = `${v4()}_${Date.now()}.${extension}`;
    const newPath = join(value.destination, filename);

    await rename(value.path, newPath);

    return {
      ...value,
      // 덮어씌우기
      filename,
      path: newPath,
    };
  }
}
