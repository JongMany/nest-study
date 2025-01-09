// import { Exclude, Expose, Transform } from 'class-transformer';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseTable } from '../../common/entity/base-table.entity';
import { MovieDetail } from './movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entity/genre.entity';
import { User } from 'src/user/entity/user.entity';
import { Transform } from 'class-transformer';
import { MovieUserLike } from './movie-user-like.entity';

// ManyToOne - 감독과 영화의 관계
// OneToOne - 영화와 상세 내용의 관계
// ManyToMany - 영화와 장르의 관계

@Entity()
export class Movie extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    unique: true,
  })
  title: string;

  @Column({
    default: 0,
  })
  likeCount: number;

  @Column({
    default: 0,
  })
  dislikeCount: number;

  @ManyToMany(() => Genre, (genre) => genre.movies)
  @JoinTable()
  genres: Genre[];

  @OneToOne(() => MovieDetail, (movieDetail) => movieDetail.id, {
    cascade: true,
    nullable: false,
  })
  @JoinColumn()
  detail: MovieDetail;

  @ManyToOne(() => Director, (director) => director.id, {
    cascade: true,
    nullable: false,
  })
  director: Director;

  @ManyToOne(() => User, (user) => user.createMovies)
  creator: User;

  @Column()
  @Transform(({ value }) => `http://localhost:3000/${value}`)
  movieFilePath: string;

  @OneToMany(() => MovieUserLike, (mul) => mul.movie)
  likedUsers: MovieUserLike[];

  // Entity Embedding
  // @Column(() => BaseEntity)
  // base: BaseEntity;
}
