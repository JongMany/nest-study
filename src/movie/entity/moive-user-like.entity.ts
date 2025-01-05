import { User } from 'src/user/entity/user.entity';
import { Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { Movie } from './movie.entity';

@Entity()
export class MovieUserLike {
  // composite primary key
  @PrimaryColumn({
    name: 'movie_id',
    type: 'int8',
  })
  @ManyToOne(() => Movie, (movie: Movie) => movie.likedUsers)
  movie: Movie;

  @PrimaryColumn({
    name: 'user_id',
    type: 'int8',
  })
  @ManyToOne(() => User, (user: User) => user.likedMovies)
  user: User;
}
