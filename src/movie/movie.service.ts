import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { CreateMovieDto } from './dto/create-movie.dto';
import { Movie } from './entity/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';

@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @InjectRepository(MovieDetail)
    private readonly movieDetailRepository: Repository<MovieDetail>,
    @InjectRepository(Director)
    private readonly directorRepository: Repository<Director>,
  ) {}
  async findAll(title?: string) {
    // 나중에 title filter 기능 추가
    if (!title) {
      return [
        await this.movieRepository.find(),
        await this.movieRepository.count(),
      ];
    }

    return this.movieRepository.findAndCount({
      where: {
        title: Like(`%${title}%`),
      },
    });
  }
  async findOne(id: number) {
    const movie = await this.movieRepository.findOne({
      where: {
        id,
      },
      relations: ['detail'],
    });
    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }
    return movie;
  }

  async create(createMovieDto: CreateMovieDto) {
    // Transaction 예정
    const director = await this.directorRepository.findOne({
      where: {
        id: createMovieDto.directorId,
      },
    });

    if (!director) {
      throw new NotFoundException('존재하지 않는 감독의 ID입니다!');
    }

    const movie = await this.movieRepository.save({
      title: createMovieDto.title,
      genre: createMovieDto.genre,
      detail: { detail: createMovieDto.detail },
      director,
    });

    return movie;
  }

  async update(id: number, updateMovieDto: UpdateMovieDto) {
    const { detail, directorId, ...movieRest } = updateMovieDto;

    const movie = await this.movieRepository.findOne({
      where: {
        id,
      },
      relations: ['detail'],
    });

    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다!');
    }

    let newDirector: Director | undefined;
    if (directorId) {
      const director = await this.directorRepository.findOne({
        where: {
          id: directorId,
        },
      });

      if (!director) {
        throw new NotFoundException('존재하지 않는 감독의 ID입니다!');
      }
      newDirector = director;
    }

    const movieUpdateFields = {
      ...movieRest,
      ...(newDirector && { director: newDirector }),
    };

    await this.movieRepository.update({ id }, { ...movieUpdateFields });

    if (detail) {
      await this.movieDetailRepository.update(
        { id: movie.detail.id },
        { detail },
      );
    }

    const updatedMovie = await this.movieRepository.findOne({
      where: {
        id,
      },
      relations: ['detail', 'director'],
    });
    return updatedMovie;
  }

  async remove(id: number) {
    const movie = await this.movieRepository.findOne({
      where: {
        id,
      },
      relations: ['detail'],
    });
    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다!');
    }
    await this.movieRepository.delete(id);
    await this.movieDetailRepository.delete(movie.detail.id);

    return id;
  }
}
