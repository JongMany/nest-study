import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { CreateMovieDto } from './dto/create-movie.dto';
import { Movie } from './entity/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, QueryRunner, Repository } from 'typeorm';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entity/genre.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
import { CommonService } from 'src/common/common.service';
import { join } from 'path';
import { rename } from 'fs/promises';

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
    private readonly dataSource: DataSource,
    private readonly commonService: CommonService,
  ) {}
  async findAll(dto: GetMoviesDto) {
    const { title } = dto;

    const queryBuilder = await this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres');

    if (title) {
      queryBuilder.where('movie.title LIKE :title', { title: `%${title}%` });
    }

    // this.commonService.applyPagePaginationParamsToQueryBuilder(
    //   queryBuilder,
    //   dto,
    // );

    const { nextCursor } =
      await this.commonService.applyCursorPaginationParamsToQueryBuilder(
        queryBuilder,
        dto,
      );

    const [data, count] = await queryBuilder.getManyAndCount();

    return {
      data,
      count,
      nextCursor,
    };

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
      .leftJoinAndSelect('movie.creator', 'creator')
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
  async create(
    createMovieDto: CreateMovieDto,
    userId: number,
    queryRunner: QueryRunner,
  ) {
    // Transaction
    // const queryRunner = this.dataSource.createQueryRunner();

    // await queryRunner.connect();
    // await queryRunner.startTransaction();

    // try {
    const director = await queryRunner.manager.findOne(Director, {
      where: {
        id: createMovieDto.directorId,
      },
    });

    if (!director) {
      throw new NotFoundException('존재하지 않는 감독의 ID입니다!');
    }

    const genres = await queryRunner.manager.find(Genre, {
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
    const movieDetail = await queryRunner.manager
      .createQueryBuilder()
      .insert()
      .into(MovieDetail)
      .values({
        detail: createMovieDto.detail,
      })
      .execute();

    // throw new NotFoundException('트랜잭션 테스트용');

    const movieDetailId = movieDetail.identifiers[0].id;

    const movieFolder = join('public', 'movie');
    // temp 폴더의 파일을 movie 폴더로 이동
    const tempFolder = join('public', 'temp');

    const movie = await queryRunner.manager
      .createQueryBuilder()
      .insert()
      .into(Movie)
      .values({
        title: createMovieDto.title,
        detail: { id: movieDetailId },
        director,
        creator: {
          id: userId,
        },
        movieFilePath: join(movieFolder, createMovieDto.movieFilename),
      })
      .execute();

    const movieId = movie.identifiers[0].id;

    // Genre 관계 넣기
    await queryRunner.manager
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

    // await queryRunner.commitTransaction();

    await rename(
      join(process.cwd(), tempFolder, createMovieDto.movieFilename),
      join(process.cwd(), movieFolder, createMovieDto.movieFilename),
    );

    return await queryRunner.manager.findOne(Movie, {
      where: {
        id: movieId,
      },
      relations: ['detail', 'director', 'genres'],
    });
    // } catch (error) {
    //   console.error('Transaction failed:', error);
    //   await queryRunner.rollbackTransaction();
    //   throw error;
    // } finally {
    //   await queryRunner.release();
    // }
  }

  async update(id: number, updateMovieDto: UpdateMovieDto) {
    const { detail, directorId, genreIds, ...movieRest } = updateMovieDto;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const movie = await queryRunner.manager.findOne(Movie, {
        where: {
          id,
        },
        relations: ['detail', 'genres'],
      });

      if (!movie) {
        throw new NotFoundException('존재하지 않는 ID의 영화입니다!');
      }

      let newGenres: Genre[];
      if (genreIds) {
        const genres = await queryRunner.manager.find(Genre, {
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
        const director = await queryRunner.manager.findOne(Director, {
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

      await queryRunner.manager
        .createQueryBuilder()
        .update(Movie)
        .set(movieUpdateFields)
        .where('id = :id', { id })
        .execute();

      if (detail) {
        await queryRunner.manager
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
        await queryRunner.manager
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

      await queryRunner.commitTransaction();

      return this.movieRepository.findOne({
        where: {
          id,
        },
        relations: ['detail', 'director', 'genres'],
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
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

    await this.movieRepository
      .createQueryBuilder()
      .delete()
      .where('id = :id', { id })
      .execute();
    // await this.movieRepository.delete(id);
    await this.movieDetailRepository.delete(movie.detail.id);

    return id;
  }
}
