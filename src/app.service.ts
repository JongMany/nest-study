import { Injectable, NotFoundException } from '@nestjs/common';

export interface Movie {
  id: number;
  title: string;
}

@Injectable()
export class AppService {
  private movies: Movie[] = [
    {
      id: 1,
      title: '해리포터',
    },
    {
      id: 2,
      title: '반지의 제왕',
    },
  ];
  private idCounter = 3;
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
}
