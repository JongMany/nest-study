import { Cache, CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from './entity/movie.entity';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entity/genre.entity';
import { Role, User } from 'src/user/entity/user.entity';
import { MovieUserLike } from './entity/movie-user-like.entity';
import { MovieService } from './movie.service';
import { CommonService } from 'src/common/common.service';
import { DataSource } from 'typeorm';
import { CreateMovieDto } from './dto/create-movie.dto';

describe('MovieService - Integration Test', () => {
  let service: MovieService;
  let cacheManager: Cache;
  let dataSource: DataSource;

  let users: User[];
  let directors: Director[];
  let genres: Genre[];
  let movies: Movie[];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        CacheModule.register(),
        TypeOrmModule.forRoot({
          type: 'sqlite', // 통합테스트용 DB
          database: ':memory:',
          // database: './test.sqlite',
          dropSchema: true,
          entities: [Movie, MovieDetail, Director, Genre, User, MovieUserLike],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([
          Movie,
          MovieDetail,
          Director,
          Genre,
          User,
          MovieUserLike,
        ]),
      ],
      providers: [MovieService, CommonService],
    }).compile();

    service = module.get<MovieService>(MovieService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
    dataSource = module.get<DataSource>(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(cacheManager).toBeDefined();
    expect(dataSource).toBeDefined();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await cacheManager.reset();

    const movieRepository = dataSource.getRepository(Movie);
    const movieDetailRepository = dataSource.getRepository(MovieDetail);
    const userRepository = dataSource.getRepository(User);
    const directorRepository = dataSource.getRepository(Director);
    const genreRepository = dataSource.getRepository(Genre);

    users = [1, 2].map((x) =>
      userRepository.create({
        id: x,
        email: `test${x}@example.com`,
        password: 'password',
        role: Role.user,
      }),
    );
    await userRepository.save(users);

    directors = [1, 2].map((x) =>
      directorRepository.create({
        id: x,
        name: `director ${x}`,
        dob: new Date('1992-11-14'),
        nationality: 'korean',
      }),
    );
    await directorRepository.save(directors);

    genres = [1, 2].map((x) =>
      genreRepository.create({
        id: x,
        name: `genre ${x}`,
      }),
    );
    await genreRepository.save(genres);

    movies = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((x) =>
      movieRepository.create({
        id: x,
        title: `movie ${x}`,
        likeCount: 0,
        dislikeCount: 0,
        director: directors[0],
        creator: users[0],
        genres: genres,
        detail: movieDetailRepository.create({
          detail: `movie ${x} detail`,
        }),
        movieFilePath: 'movies/movie1.mp4',
        createdAt: new Date(`2023-9-${x}`),
      }),
    );
    await movieRepository.save(movies);
  });

  describe('findRecent', () => {
    it('should return recent movies', async () => {
      const result = await service.findRecent();

      const sortedResult = [...movies].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
      const sortedResultIds = sortedResult.slice(0, 10).map((x) => x.id);

      expect(result).toHaveLength(10);
      expect(result.map((x) => x.id)).toEqual(sortedResultIds);
    });

    it('should cache recent movies', async () => {
      const result = await service.findRecent();

      const cachedData = await cacheManager.get('MOVIE_RECENT');

      expect(cachedData).toEqual(result);
    });
  });

  describe('findAll', () => {
    it('should return movies with correct titles', async () => {
      const dto = {
        title: 'Movie 15',
        order: ['createdAt_DESC'],
        take: 10,
      };
      const result = await service.findAll(dto);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('movie 15');
      expect(result.data[0]).not.toHaveProperty('likeStatus');
    });

    it('should return likeStatus if user id is provided', async () => {
      const dto = { order: ['createdAt_ASC'], take: 10 };

      const result = await service.findAll(dto, users[0].id);

      expect(result.data).toHaveLength(10);
      expect(result.data[0]).toHaveProperty('likeStatus');
    });
  });

  describe('create', () => {
    beforeEach(() => {
      jest.spyOn(service, 'renameMovieFile').mockResolvedValue();
    });

    it('should create movie correctly', async () => {
      const createMovieDto: CreateMovieDto = {
        title: 'New Movie',
        detail: 'New Movie Detail',
        directorId: directors[0].id,
        genreIds: genres.map((x) => x.id),
        movieFilename: 'new_movie.mp4',
      };

      const result = await service.create(
        createMovieDto,
        users[0].id,
        dataSource.createQueryRunner(),
      );
      expect(result.title).toBe(createMovieDto.title);
      expect(result.director.id).toBe(createMovieDto.directorId);
      expect(result.genres.map((g) => g.id)).toEqual(createMovieDto.genreIds);
      expect(result.detail.detail).toBe(createMovieDto.detail);
      expect(service.renameMovieFile).toHaveBeenCalled();
    });
  });
});
