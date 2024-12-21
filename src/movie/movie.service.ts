import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { CreateMovieDto } from './dto/create-movie.dto';
import { Movie } from './entity/movie.entity';

@Injectable()
export class MovieService {
  private movies: Movie[] = [];
  private idCounter = 3;

  constructor() {
    const movie1 = new Movie();

    movie1.id = 1;
    movie1.title = '해리포터';
    movie1.genre = 'fantasy';

    const movie2 = new Movie();
    movie2.id = 2;
    movie2.title = '반지의 제왕';
    movie2.genre = 'action';

    this.movies.push(movie1, movie2);
  }
  getManyMovies(title?: string): Movie[] {
    if (!title) return this.movies;

    return this.movies.filter((movie) => movie.title.includes(title));
  }
  getMovieById(id: number): Movie {
    const movie = this.movies.find((movie) => movie.id === +id);
    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }
    return movie;
  }

  createMovie(createMovieDto: CreateMovieDto) {
    const movie: Movie = {
      id: this.idCounter++,
      ...createMovieDto,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 0,
    };

    this.movies.push(movie);
    return movie;
  }

  updateMovie(id: number, updateMovieDto: UpdateMovieDto) {
    const movie = this.movies.find((movie) => movie.id === id);

    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다!');
    }
    console.log(updateMovieDto);

    Object.assign(movie, { ...updateMovieDto });
    return movie;
  }

  deleteMovie(id: number) {
    const movieIndex = this.movies.findIndex((movie) => movie.id === +id);
    if (movieIndex === -1) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다!');
    }
    this.movies.splice(movieIndex, 1);
    return id;
  }
}
