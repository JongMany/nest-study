import { DataSource, Repository } from 'typeorm';
import { MovieService } from './movie.service';
import { TestBed } from '@automock/jest';
import { Movie } from './entity/movie.entity';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entity/genre.entity';
import { User } from 'src/user/entity/user.entity';
import { MovieUserLike } from './entity/movie-user-like.entity';
import { CommonService } from 'src/common/common.service';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GetMoviesDto } from './dto/get-movies.dto';
import { NotFoundException } from '@nestjs/common';

describe('MovieService', () => {
  let movieService: MovieService;
  let movieRepository: jest.Mocked<Repository<Movie>>;
  let movieDetailRepository: jest.Mocked<Repository<MovieDetail>>;
  let directorRepository: jest.Mocked<Repository<Director>>;
  let genreRepository: jest.Mocked<Repository<Genre>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let movieUserLikeRepository: jest.Mocked<Repository<MovieUserLike>>;
  let dataSource: jest.Mocked<DataSource>;
  let commonService: jest.Mocked<CommonService>;
  let cacheManager: Cache;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(MovieService).compile();

    movieService = unit;
    movieRepository = unitRef.get(getRepositoryToken(Movie) as string);
    movieDetailRepository = unitRef.get(
      getRepositoryToken(MovieDetail) as string,
    );
    directorRepository = unitRef.get(getRepositoryToken(Director) as string);
    genreRepository = unitRef.get(getRepositoryToken(Genre) as string);
    userRepository = unitRef.get(getRepositoryToken(User) as string);
    movieUserLikeRepository = unitRef.get(
      getRepositoryToken(MovieUserLike) as string,
    );
    dataSource = unitRef.get(DataSource);
    commonService = unitRef.get(CommonService);
    cacheManager = unitRef.get(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(movieService).toBeDefined();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findRecent', () => {
    it('should return recent movies from cache', async () => {
      const cachedMovies = [
        {
          id: 1,
          title: 'Movie 1',
        },
      ];
      jest.spyOn(cacheManager, 'get').mockResolvedValue(cachedMovies);

      const result = await movieService.findRecent();
      expect(cacheManager.get).toHaveBeenCalledWith('MOVIE_RECENT');
      expect(result).toEqual(cachedMovies);
    });

    it('should fetch recent movies from the repository and cache them if not found in cache', async () => {
      const recentMovies = [
        {
          id: 1,
          title: 'Movie 1',
        },
      ];

      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
      jest
        .spyOn(movieRepository, 'find')
        .mockResolvedValue(recentMovies as Movie[]);

      const result = await movieService.findRecent();

      expect(cacheManager.get).toHaveBeenCalledWith('MOVIE_RECENT');
      expect(cacheManager.set).toHaveBeenCalledWith(
        'MOVIE_RECENT',
        recentMovies,
        3000,
      );
      expect(result).toEqual(recentMovies);
    });
  });

  describe('findAll', () => {
    let getMoviesMock: jest.SpyInstance;
    let getLikedMoviesMock: jest.SpyInstance;

    beforeEach(() => {
      getMoviesMock = jest.spyOn(movieService, 'getMovies');
      getLikedMoviesMock = jest.spyOn(movieService, 'getLikedMovies');
    });

    it('should return a list of moives without user likes', async () => {
      const movies = [{ id: 1, title: 'Movie 1' }];
      const dto = { title: 'Movie' } as GetMoviesDto;

      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([movies, movies.length]),
      };
      getMoviesMock.mockResolvedValue(queryBuilder);
      jest
        .spyOn(commonService, 'applyCursorPaginationParamsToQueryBuilder')
        .mockResolvedValue({ nextCursor: null } as any);

      const result = await movieService.findAll(dto);

      expect(getMoviesMock).toHaveBeenCalledWith();
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'movie.title LIKE :title',
        {
          title: '%Movie%',
        },
      );
      expect(
        commonService.applyCursorPaginationParamsToQueryBuilder,
      ).toHaveBeenCalledWith(queryBuilder, dto);

      expect(queryBuilder.getManyAndCount).toHaveBeenCalled();
      expect(result).toEqual({
        data: movies,
        nextCursor: null,
        count: 1,
      });
    });

    it('should return a list of movies with user likes', async () => {
      const movies = [
        {
          id: 1,
          title: 'Movie 1',
        },
        { id: 3, title: 'Movie 3' },
      ];
      const likedMovies = [
        { movie: { id: 1 }, isLike: true },
        { movie: { id: 2 }, isLike: false },
      ];
      const getMoviesDto = { title: 'Movie' } as GetMoviesDto;
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([movies, 1]),
      };

      getMoviesMock.mockResolvedValue(queryBuilder);
      jest
        .spyOn(commonService, 'applyCursorPaginationParamsToQueryBuilder')
        .mockReturnValue({ nextCursor: null } as any);
      getLikedMoviesMock.mockResolvedValue(likedMovies);

      const userId = 1;
      const result = await movieService.findAll(getMoviesDto, userId);

      expect(getMoviesMock).toHaveBeenCalled();
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'movie.title LIKE :title',
        { title: '%Movie%' },
      );
      expect(
        commonService.applyCursorPaginationParamsToQueryBuilder,
      ).toHaveBeenCalledWith(queryBuilder, getMoviesDto);
      expect(queryBuilder.getManyAndCount).toHaveBeenCalled();
      expect(getLikedMoviesMock).toHaveBeenCalledWith(
        movies.map((m) => m.id),
        userId,
      );
      expect(result).toEqual({
        data: [
          { id: 1, title: 'Movie 1', likeStatus: true },
          { id: 3, title: 'Movie 3', likeStatus: null },
        ],
        nextCursor: null,
        count: 1,
      });
    });

    it('should return movies without title filter', async () => {
      const movies = [{ id: 1, title: 'Movie 1' }];
      const dto = {} as GetMoviesDto;

      const queryBuilder = {
        getManyAndCount: jest.fn().mockResolvedValue([movies, 1]),
      };
      getMoviesMock.mockResolvedValue(queryBuilder);
      jest
        .spyOn(commonService, 'applyCursorPaginationParamsToQueryBuilder')
        .mockResolvedValue({
          nextCursor: null,
        } as any);

      const result = await movieService.findAll(dto);

      expect(getMoviesMock).toHaveBeenCalled();
      expect(queryBuilder.getManyAndCount).toHaveBeenCalled();
      expect(result).toEqual({
        data: movies,
        nextCursor: null,
        count: 1,
      });
    });
  });

  describe('findOne', () => {
    let findMovieDetailMock: jest.SpyInstance;

    beforeEach(() => {
      findMovieDetailMock = jest.spyOn(movieService, 'findMovieDetail');
    });

    it('should return a movie if found', async () => {
      const movie = { id: 1, title: 'Movie 1' };

      findMovieDetailMock.mockResolvedValue(movie);

      const result = await movieService.findOne(1);

      expect(findMovieDetailMock).toHaveBeenCalledWith(1);
      expect(result).toEqual(movie);
    });

    it('should throw NotFoundException if movie is not found', async () => {
      findMovieDetailMock.mockResolvedValue(null);

      await expect(movieService.findOne(1)).rejects.toThrow(NotFoundException);
      expect(findMovieDetailMock).toHaveBeenCalledWith(1);
    });
  });
});
