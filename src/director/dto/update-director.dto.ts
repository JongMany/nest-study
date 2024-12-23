import { IsDateString, IsNotEmpty } from 'class-validator';
import { Movie } from 'src/movie/entity/movie.entity';
import { OneToMany } from 'typeorm';

export class UpdateDirectorDto {
  @IsNotEmpty()
  name?: string;

  @IsNotEmpty()
  @IsDateString()
  dob?: Date;

  @IsNotEmpty()
  nationality?: string;

  @OneToMany(() => Movie, (movie) => movie.director)
  movies: Movie[];
}
