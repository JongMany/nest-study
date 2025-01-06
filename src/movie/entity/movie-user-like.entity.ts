import { User } from 'src/user/entity/user.entity';
import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { Movie } from './movie.entity';

@Entity()
export class MovieUserLike {
  // composite primary key
  @PrimaryColumn({
    name: 'movieId',
    type: 'int8',
  })
  @ManyToOne(() => Movie, (movie: Movie) => movie.likedUsers, {
    onDelete: 'CASCADE',
  })
  movie: Movie;

  @PrimaryColumn({
    name: 'userId',
    type: 'int8',
  })
  @ManyToOne(() => User, (user: User) => user.likedMovies, {
    onDelete: 'CASCADE',
  })
  user: User;

  @Column()
  isLike: boolean;
}
