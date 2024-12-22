// import { Exclude, Expose, Transform } from 'class-transformer';
import {
  ChildEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  TableInheritance,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

export class BaseEntity {
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @VersionColumn()
  version: number;
}

// movie / series -> Content
// runtime (영화 상영시간) / seriesCount (몇 부작인지)

@Entity()
@TableInheritance({
  column: {
    type: 'varchar',
    name: 'type',
  },
})
export class Content extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  genre: string;
}

@ChildEntity()
export class Movie extends Content {
  @Column()
  runtime: number;

  // Entity Embedding
  // @Column(() => BaseEntity)
  // base: BaseEntity;
}

@ChildEntity()
export class Series extends Content {
  @Column()
  seriesCount: number;
}
