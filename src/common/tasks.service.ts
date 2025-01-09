import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { readdir, unlink } from 'fs/promises';
import { join, parse } from 'path';

@Injectable()
export class TasksService {
  constructor() {}

  // @Cron('* * * * * *')
  logEverySecond() {
    console.log('1초마다 실행');
  }

  // @Cron('* * * * * *')
  async eraseOrphanFiles() {
    const files = await readdir(join(process.cwd(), 'public', 'temp'));

    const deleteFilesTargets = files.filter((file) => {
      const filename = parse(file).name;

      const split = filename.split('_');

      if (split.length !== 2) {
        return true;
      }

      try {
        const date = +new Date(parseInt(split[split.length - 1])); // ms
        const aDayInMilSec = 24 * 60 * 60 * 1000;

        const now = +new Date();

        return now - date > aDayInMilSec;
      } catch (err) {
        return true;
      }
    });

    // 병렬로 파일 삭제
    await Promise.all(
      deleteFilesTargets.map((filename) =>
        unlink(join(process.cwd(), 'public', 'temp', filename)),
      ),
    );
  }
}
