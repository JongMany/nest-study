import { Exclude } from 'class-transformer';
import { CreateDateColumn, UpdateDateColumn, VersionColumn } from 'typeorm';

export class BaseTable {
  @Exclude()
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  @Exclude()
  updatedAt: Date;

  @VersionColumn()
  @Exclude()
  version: number;
}
