import { DataSource, In, QueryRunner, Repository } from 'typeorm';
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
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';

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

  describe('create', () => {
    let queryRunner: jest.Mocked<QueryRunner>;
    let createMovieMock: jest.SpyInstance;
    let createMovieDetailMock: jest.SpyInstance;
    let createMovieGenreRelationMock: jest.SpyInstance;
    let renameMovieFileMock: jest.SpyInstance;

    beforeEach(() => {
      queryRunner = {
        manager: {
          findOne: jest.fn(),
          find: jest.fn(),
        },
      } as any as jest.Mocked<QueryRunner>;

      createMovieMock = jest.spyOn(movieService, 'createMovie');
      createMovieDetailMock = jest.spyOn(movieService, 'createMovieDetail');
      createMovieGenreRelationMock = jest.spyOn(
        movieService,
        'createMovieGenreRelation',
      );
      renameMovieFileMock = jest.spyOn(movieService, 'renameMovieFile');
    });

    it('should create a movie successfully', async () => {
      const createMovieDto: CreateMovieDto = {
        title: 'New Movie',
        directorId: 1,
        genreIds: [1, 2],
        detail: 'Some Detail',
        movieFilename: 'new_movie.mp4',
      };
      const userId = 1;
      const director = { id: 1, name: 'Director' };
      const genres = [
        { id: 1, name: 'Genre1' },
        { id: 2, name: 'Genre2' },
      ];
      const movieDetailInsertResult = { identifiers: [{ id: 1 }] };
      const movieInsertResult = { identifiers: [{ id: 1 }] };

      (queryRunner.manager.findOne as any).mockResolvedValueOnce(director);
      (queryRunner.manager.findOne as any).mockResolvedValueOnce({
        ...createMovieDto,
        id: 1,
      });
      (queryRunner.manager.find as any).mockResolvedValueOnce(genres);

      createMovieDetailMock.mockResolvedValue(movieDetailInsertResult);
      createMovieMock.mockResolvedValue(movieInsertResult);
      createMovieGenreRelationMock.mockResolvedValue(undefined);
      renameMovieFileMock.mockResolvedValue(undefined);

      const result = await movieService.create(
        createMovieDto,
        userId,
        queryRunner,
      );

      expect(queryRunner.manager.findOne).toHaveBeenCalledWith(Director, {
        where: {
          id: createMovieDto.directorId,
        },
      });
      expect(queryRunner.manager.find).toHaveBeenCalledWith(Genre, {
        where: {
          id: In(createMovieDto.genreIds),
        },
      });
      expect(createMovieDetailMock).toHaveBeenCalledWith(
        queryRunner,
        createMovieDto,
      );
      expect(createMovieMock).toHaveBeenCalledWith(
        queryRunner,
        createMovieDto,
        director,
        movieDetailInsertResult.identifiers[0].id,
        userId,
        expect.any(String),
      );
      expect(createMovieGenreRelationMock).toHaveBeenCalledWith(
        queryRunner,
        movieInsertResult.identifiers[0].id,
        genres,
      );
      expect(renameMovieFileMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        createMovieDto,
      );
      expect(result).toEqual({
        ...createMovieDto,
        id: 1,
      });
    });

    it('should throw NotFoundException if director does not exist', async () => {
      const createMovieDto: CreateMovieDto = {
        title: 'New Movie',
        directorId: 1,
        genreIds: [1, 2],
        detail: 'Some Detail',
        movieFilename: 'new_movie.mp4',
      };
      const userId = 1;

      (queryRunner.manager.findOne as any).mockResolvedValueOnce(null);

      await expect(
        movieService.create(createMovieDto, userId, queryRunner),
      ).rejects.toThrow(NotFoundException);
      expect(queryRunner.manager.findOne).toHaveBeenCalledWith(Director, {
        where: {
          id: createMovieDto.directorId,
        },
      });
    });

    it('should throw NotFoundException if some genres do not exist', async () => {
      const createMovieDto: CreateMovieDto = {
        title: 'New Movie',
        directorId: 1,
        genreIds: [1, 2],
        detail: 'Some Detail',
        movieFilename: 'new_movie.mp4',
      };
      const userId = 1;
      const director = {
        id: 1,
        name: 'Director',
      };
      (queryRunner.manager.findOne as any).mockResolvedValueOnce(director);
      (queryRunner.manager.find as any).mockResolvedValueOnce([
        {
          id: 1,
          name: 'Genre1',
        },
      ]);

      await expect(
        movieService.create(createMovieDto, userId, queryRunner),
      ).rejects.toThrow(NotFoundException);
      expect(queryRunner.manager.findOne).toHaveBeenCalledWith(Director, {
        where: {
          id: createMovieDto.directorId,
        },
      });
      expect(queryRunner.manager.find).toHaveBeenCalledWith(Genre, {
        where: {
          id: In(createMovieDto.genreIds),
        },
      });
    });
  });

  describe('update', () => {
    let queryRunner: jest.Mocked<QueryRunner>;
    let updateMovieMock: jest.SpyInstance;
    let updateMovieDetailMock: jest.SpyInstance;
    let updateMovieGenreRelationMock: jest.SpyInstance;

    beforeEach(() => {
      queryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),

        manager: {
          findOne: jest.fn(),
          find: jest.fn(),
          save: jest.fn(),
        },
      } as any as jest.Mocked<QueryRunner>;

      updateMovieMock = jest.spyOn(movieService, 'updateMovie');
      updateMovieDetailMock = jest.spyOn(movieService, 'updateMovieDetail');
      updateMovieGenreRelationMock = jest.spyOn(
        movieService,
        'updateMovieGenreRelation',
      );

      jest.spyOn(dataSource, 'createQueryRunner').mockReturnValue(queryRunner);
    });
    it('should update a movie successfully', async () => {
      const updateMovieDto: UpdateMovieDto = {
        title: 'Updated Movie',
        directorId: 1,
        genreIds: [1, 2],
        detail: 'Updated Detail',
      };
      const movie = {
        id: 1,
        detail: { id: 1 },
        genres: [{ id: 1 }, { id: 2 }],
      };
      const director = { id: 1, name: 'Director' };

      const genres = [
        { id: 1, name: 'Genre1' },
        { id: 2, name: 'Genre2' },
      ];

      (queryRunner.connect as any).mockResolvedValue(null);
      (queryRunner.manager.findOne as any).mockResolvedValueOnce(movie);
      (queryRunner.manager.findOne as any).mockResolvedValueOnce(director);
      jest.spyOn(movieRepository, 'findOne').mockResolvedValue(movie as Movie);
      (queryRunner.manager.find as any).mockResolvedValueOnce(genres);

      updateMovieMock.mockResolvedValue(undefined);
      updateMovieDetailMock.mockResolvedValue(undefined);
      updateMovieGenreRelationMock.mockResolvedValue(undefined);

      const result = await movieService.update(1, updateMovieDto);

      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.findOne).toHaveBeenCalledWith(Movie, {
        where: { id: 1 },
        relations: ['detail', 'genres'],
      });
      expect(queryRunner.manager.findOne).toHaveBeenCalledWith(Director, {
        where: { id: updateMovieDto.directorId },
      });
      expect(queryRunner.manager.find).toHaveBeenCalledWith(Genre, {
        where: { id: In(updateMovieDto.genreIds) },
      });
      expect(updateMovieMock).toHaveBeenCalledWith(
        queryRunner,
        expect.any(Object),
        1,
      );
      expect(updateMovieDetailMock).toHaveBeenCalledWith(
        queryRunner,
        updateMovieDto.detail,
        movie,
      );
      expect(updateMovieGenreRelationMock).toHaveBeenCalledWith(
        queryRunner,
        1,
        genres,
        movie,
      );
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(result).toEqual(movie);
    });

    it('should throw NotFoundException if movie does not exist', async () => {
      const updateMovieDto: UpdateMovieDto = {
        title: 'Updated Movie',
        directorId: 1,
        genreIds: [1, 2],
        detail: 'Updated Detail',
      };

      (queryRunner.manager.findOne as any).mockResolvedValueOnce(null);

      await expect(movieService.update(1, updateMovieDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.findOne).toHaveBeenCalledWith(Movie, {
        where: { id: 1 },
        relations: ['detail', 'genres'],
      });
      expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });
    it('should throw NotFoundException if new director does not exist', async () => {
      const updateMovieDto: UpdateMovieDto = {
        title: 'Updated Movie',
        directorId: 1,
      };
      const movie = {
        id: 1,
        detail: { id: 1 },
        genres: [],
      };

      (queryRunner.manager.findOne as any).mockResolvedValueOnce(movie);
      (queryRunner.manager.findOne as any).mockResolvedValueOnce(null);

      await expect(movieService.update(1, updateMovieDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(queryRunner.manager.findOne).toHaveBeenCalledWith(Movie, {
        where: { id: 1 },
        relations: ['detail', 'genres'],
      });
      expect(queryRunner.manager.findOne).toHaveBeenCalledWith(Director, {
        where: { id: updateMovieDto.directorId },
      });
      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if new genres do not exist', async () => {
      const updateMovieDto: UpdateMovieDto = {
        title: 'Updated Movie',
        genreIds: [1, 2],
      };
      const movie = {
        id: 1,
        detail: { id: 1 },
        genres: [],
      };

      (queryRunner.manager.findOne as any).mockResolvedValueOnce(movie);
      (queryRunner.manager.find as any).mockResolvedValueOnce([
        { id: 1, name: 'Genre1' },
      ]);

      await expect(movieService.update(1, updateMovieDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(queryRunner.manager.findOne).toHaveBeenCalledWith(Movie, {
        where: { id: 1 },
        relations: ['detail', 'genres'],
      });
      expect(queryRunner.manager.find).toHaveBeenCalledWith(Genre, {
        where: { id: In(updateMovieDto.genreIds) },
      });
      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should rollback transaction and rethrow error on failure', async () => {
      const updateMovieDto: UpdateMovieDto = {
        title: 'Updated Movie',
        directorId: 1,
        genreIds: [1, 2],
        detail: 'Updated Detail',
      };
      const movie = {
        id: 1,
        detail: { id: 1 },
        genres: [],
      };

      (queryRunner.manager.findOne as any).mockRejectedValueOnce(
        new Error('Database Error'),
      );

      await expect(movieService.update(1, updateMovieDto)).rejects.toThrow(
        'Database Error',
      );
      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.findOne).toHaveBeenCalledWith(Movie, {
        where: { id: 1 },
        relations: ['detail', 'genres'],
      });
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    let findOneMock: jest.SpyInstance;
    let deleteMovieMock: jest.SpyInstance;
    let deleteMovieDetailMock: jest.SpyInstance;

    beforeEach(() => {
      findOneMock = jest.spyOn(movieRepository, 'findOne');
      deleteMovieMock = jest.spyOn(movieService, 'deleteMovie');
      deleteMovieDetailMock = jest.spyOn(movieDetailRepository, 'delete');
    });

    it('should remove a movie successfully', async () => {
      const movie = { id: 1, detail: { id: 2 } };

      findOneMock.mockResolvedValue(movie);
      deleteMovieMock.mockResolvedValue(undefined);
      deleteMovieDetailMock.mockResolvedValue(undefined);

      const result = await movieService.remove(1);

      expect(findOneMock).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['detail'],
      });
      expect(deleteMovieMock).toHaveBeenCalledWith(1);
      expect(deleteMovieDetailMock).toHaveBeenCalledWith(movie.detail.id);
      expect(result).toBe(1);
    });

    it('should throw NotFoundException if movie does not exist', async () => {
      findOneMock.mockResolvedValueOnce(null);

      await expect(movieService.remove(1)).rejects.toThrow(NotFoundException);

      expect(findOneMock).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['detail'],
      });
      expect(deleteMovieMock).not.toHaveBeenCalled();
      expect(deleteMovieDetailMock).not.toHaveBeenCalled();
    });
  });

  describe('toggleMovieLike', () => {
    let findOneMovieMock: jest.SpyInstance;
    let findOneUserMock: jest.SpyInstance;
    let getLikedRecordMock: jest.SpyInstance;
    let deleteLikeMock: jest.SpyInstance;
    let updateLikeMock: jest.SpyInstance;
    let saveLikeMock: jest.SpyInstance;

    beforeEach(() => {
      findOneMovieMock = jest.spyOn(movieRepository, 'findOne');
      findOneUserMock = jest.spyOn(userRepository, 'findOne');
      getLikedRecordMock = jest.spyOn(movieService, 'getLikedRecord');
      deleteLikeMock = jest.spyOn(movieUserLikeRepository, 'delete');
      updateLikeMock = jest.spyOn(movieUserLikeRepository, 'update');
      saveLikeMock = jest.spyOn(movieUserLikeRepository, 'save');
    });

    it('should toggle movie like status successfully when like record exists and isLike is different', async () => {
      const movie = { id: 1 };
      const user = { id: 2 };
      const likedRecord = { movie, user, isLike: true };

      findOneMovieMock.mockResolvedValue(movie);
      findOneUserMock.mockResolvedValue(user);
      getLikedRecordMock.mockResolvedValueOnce(likedRecord);
      getLikedRecordMock.mockResolvedValueOnce({ isLike: false });

      const result = await movieService.toggleMovieLike(1, 1, false);

      expect(findOneMovieMock).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(findOneUserMock).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(getLikedRecordMock).toHaveBeenCalledWith(1, 1);
      expect(updateLikeMock).toHaveBeenCalledWith(
        {
          movie,
          user,
        },
        { isLike: false },
      );

      expect(result).toEqual({ isLike: false });
    });

    it('should delete like record when isLike is the same as the existing record', async () => {
      const movie = { id: 1 };
      const user = { id: 1 };
      const likeRecord = { movie, user, isLike: true };

      findOneMovieMock.mockResolvedValue(movie);
      findOneUserMock.mockResolvedValue(user);
      getLikedRecordMock.mockResolvedValueOnce(likeRecord);
      getLikedRecordMock.mockResolvedValueOnce(null);

      const result = await movieService.toggleMovieLike(1, 1, true);

      expect(findOneMovieMock).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(findOneUserMock).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(getLikedRecordMock).toHaveBeenCalledWith(1, 1);
      expect(deleteLikeMock).toHaveBeenCalledWith({ movie, user });
      expect(result).toEqual({ isLike: null });
    });

    it('should save a new like record when no existing record is found', async () => {
      const movie = { id: 1 };
      const user = { id: 1 };

      findOneMovieMock.mockResolvedValue(movie);
      findOneUserMock.mockResolvedValue(user);
      getLikedRecordMock
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ isLike: true });

      const result = await movieService.toggleMovieLike(1, 1, true);

      expect(findOneMovieMock).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(findOneUserMock).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(getLikedRecordMock).toHaveBeenCalledWith(1, 1);
      expect(saveLikeMock).toHaveBeenCalledWith({ movie, user, isLike: true });
      expect(result).toEqual({ isLike: true });
    });

    it('should throw BadRequestException if movie does not exist', async () => {
      findOneMovieMock.mockResolvedValueOnce(null);

      await expect(movieService.toggleMovieLike(1, 1, true)).rejects.toThrow(
        BadRequestException,
      );

      expect(findOneMovieMock).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(findOneUserMock).not.toHaveBeenCalled();
      expect(getLikedRecordMock).not.toHaveBeenCalled();
      expect(deleteLikeMock).not.toHaveBeenCalled();
      expect(updateLikeMock).not.toHaveBeenCalled();
      expect(saveLikeMock).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if user does not exist ', async () => {
      const movie = { id: 1 };

      findOneMovieMock.mockResolvedValue(movie);
      findOneUserMock.mockResolvedValueOnce(null);

      await expect(movieService.toggleMovieLike(1, 1, true)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(findOneMovieMock).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(findOneUserMock).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(getLikedRecordMock).not.toHaveBeenCalled();
      expect(deleteLikeMock).not.toHaveBeenCalled();
      expect(updateLikeMock).not.toHaveBeenCalled();
      expect(saveLikeMock).not.toHaveBeenCalled();
    });
  });
});
