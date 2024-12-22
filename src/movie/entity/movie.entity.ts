// import { Exclude, Expose, Transform } from 'class-transformer';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseTable } from './base-table.entity';
import { MovieDetail } from './movie-detail.entity';

// ManyToOne - 감독과 영화의 관계
// OneToOne - 영화와 상세 내용의 관계
// ManyToMany - 영화와 장르의 관계

@Entity()
export class Movie extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  genre: string;

  @OneToOne(() => MovieDetail)
  @JoinColumn()
  detail: MovieDetail;
  // Entity Embedding
  // @Column(() => BaseEntity)
  // base: BaseEntity;
}
