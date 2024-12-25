import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { CreateMovieDto } from './dto/create-movie.dto';
import { Movie } from './entity/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entity/genre.entity';

@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @InjectRepository(MovieDetail)
    private readonly movieDetailRepository: Repository<MovieDetail>,
    @InjectRepository(Director)
    private readonly directorRepository: Repository<Director>,
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
  ) {}
  async findAll(title?: string) {
    // 나중에 title filter 기능 추가
    const queryBuilder = await this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres');

    if (title) {
      queryBuilder.where('movie.title LIKE :title', { title: `%${title}%` });
    }

    return await queryBuilder.getManyAndCount();

    // if (!title) {
    //   return [
    //     await this.movieRepository.find({
    //       relations: ['director', ' genres'],
    //     }),
    //     await this.movieRepository.count(),
    //   ];
    // }
    // return this.movieRepository.findAndCount({
    //   where: {
    //     title: Like(`%${title}%`),
    //   },
    //   relations: ['director', 'genres'],
    // });
  }
  async findOne(id: number) {
    const movie = await this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres')
      .leftJoinAndSelect('movie.detail', 'detail')
      .where('movie.id = :id', { id })
      .getOne();
    return movie;

    // const movie = await this.movieRepository.findOne({
    //   where: {
    //     id,
    //   },
    //   relations: ['detail', 'director', 'genres'],
    // });

    // if (!movie) {
    //   throw new NotFoundException(`Movie with ID ${id} not found`);
    // }

    // return movie;
  }

  // Query Builder로 한 번에 안되는 것 -> 같이 생성하는 것(Cascade), ManyToMany
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

    const genres = await this.genreRepository.find({
      where: {
        id: In(createMovieDto.genreIds),
      },
    });

    if (genres.length !== createMovieDto.genreIds.length) {
      throw new NotFoundException(
        `존재하지 않는 ID의 장르가 존재합니다! 존재하는 id: ${genres.map((genre) => genre.id).join(', ')}`,
      );
    }

    // Transaction이 필요함
    const movieDetail = await this.movieDetailRepository
      .createQueryBuilder()
      .insert()
      .into(MovieDetail)
      .values({
        detail: createMovieDto.detail,
      })
      .execute();

    const movieDetailId = movieDetail.identifiers[0].id;

    const movie = await this.movieRepository
      .createQueryBuilder()
      .insert()
      .into(Movie)
      .values({
        title: createMovieDto.title,
        detail: { id: movieDetailId },
        director,
      })
      .execute();

    const movieId = movie.identifiers[0].id;

    // Genre 관계 넣기
    await this.movieRepository
      .createQueryBuilder()
      .relation(Movie, 'genres')
      .of(movieId)
      .add(genres.map((genre) => genre.id));

    // const movie = await this.movieRepository.save({
    //   title: createMovieDto.title,
    //   detail: { detail: createMovieDto.detail },
    //   director,
    //   genres: genres,
    // });

    return await this.movieRepository.findOne({
      where: {
        id: movieId,
      },
      relations: ['detail', 'director', 'genres'],
    });
  }

  async update(id: number, updateMovieDto: UpdateMovieDto) {
    const { detail, directorId, genreIds, ...movieRest } = updateMovieDto;

    const movie = await this.movieRepository.findOne({
      where: {
        id,
      },
      relations: ['detail'],
    });

    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다!');
    }

    let newGenres: Genre[];
    if (genreIds) {
      const genres = await this.genreRepository.find({
        where: {
          id: In(genreIds),
        },
      });

      if (genres.length !== genreIds.length) {
        throw new NotFoundException(
          `존재하지 않는 ID의 장르가 존재합니다! 존재하는 id: ${genres.map((genre) => genre.id).join(', ')}`,
        );
      }

      newGenres = genres;
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

    // await this.movieRepository.update({ id }, { ...movieUpdateFields });

    await this.movieRepository
      .createQueryBuilder()
      .update(Movie)
      .set(movieUpdateFields)
      .where('id = :id', { id })
      .execute();

    if (detail) {
      await this.movieDetailRepository
        .createQueryBuilder()
        .update(MovieDetail)
        .set({
          detail,
        })
        .where('id = :id', { id: movie.detail.id })
        .execute();
      // await this.movieDetailRepository.update(
      //   { id: movie.detail.id },
      //   { detail },
      // );
    }

    if (newGenres) {
      await this.movieRepository
        .createQueryBuilder()
        .relation(Movie, 'genres')
        .of(id)
        .addAndRemove(
          newGenres.map((genre) => genre.id),
          movie.genres.map((genre) => genre.id),
        );
    }

    // const updatedMovie = await this.movieRepository.findOne({
    //   where: {
    //     id,
    //   },
    //   relations: ['detail', 'director'],
    // });

    // // 장르(ManyToMany) 업데이트
    // updatedMovie.genres = newGenres;

    // await this.movieRepository.save(updatedMovie);

    return this.movieRepository.findOne({
      where: {
        id,
      },
      relations: ['detail', 'director', 'genres'],
    });
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
