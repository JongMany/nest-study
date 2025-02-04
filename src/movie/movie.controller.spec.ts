import { MovieController } from './movie.controller';
import { MovieService } from './movie.service';
import { TestBed } from '@automock/jest';
import { CreateMovieDto } from './dto/create-movie.dto';
import { QueryRunner } from 'typeorm';
import { UpdateMovieDto } from './dto/update-movie.dto';

describe('MovieController', () => {
  let movieController: MovieController;
  let movieService: MovieService;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(MovieController).compile();
    movieController = unit;
    movieService = unitRef.get<MovieService>(MovieService);
  });

  it('should be defined', () => {
    expect(movieController).toBeDefined();
  });

  describe('getMovies', () => {
    it('should call movieService.findAll with the correct parameters', async () => {
      const dto = { page: 1, limit: 10 };
      const userId = 1;
      const movies = [{ id: 1 }, { id: 2 }];

      jest.spyOn(movieService, 'findAll').mockResolvedValue(movies as any);

      const result = await movieController.getMovies(dto as any, userId);

      expect(movieService.findAll).toHaveBeenCalledWith(dto, userId);
      expect(result).toEqual(movies);
    });
  });

  describe('recent', () => {
    it('should call movieService.findRecent', async () => {
      await movieController.getMoviesRecent();

      expect(movieService.findRecent).toHaveBeenCalled();
    });
  });

  describe('getMovie', () => {
    it('should call movieService.findOne with the correct parameters', async () => {
      const id = 1;

      await movieController.getMovie(id);

      expect(movieService.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('postMovie', () => {
    it('should call movieService.create with the correct parameters', async () => {
      const body = { title: 'Test Movie' } as CreateMovieDto;
      const userId = 1;
      const queryRunner = {} as QueryRunner;

      await movieController.postMovie(body, userId, queryRunner);

      expect(movieService.create).toHaveBeenCalledWith(
        body,
        userId,
        queryRunner,
      );
    });
  });

  describe('updateMovie', () => {
    it('should call movieService.update with the correct parameters', async () => {
      const id = 1;
      const updateDto = { title: 'Updated Title' } as UpdateMovieDto;

      await movieController.patchMovie(id, updateDto);

      expect(movieService.update).toHaveBeenCalledWith(id, updateDto);
    });
  });

  describe('deleteMovie', () => {
    it('should call movieService.remove with the correct parameters', async () => {
      const id = 1;

      await movieController.deleteMovie(id);

      expect(movieService.remove).toHaveBeenCalledWith(id);
    });
  });

  describe('createMovieLike', () => {
    it('should call movieService.toggleMovieLike with the correct parameters', async () => {
      const movieId = 1;
      const userId = 2;

      await movieController.createMovieLike(movieId, userId);

      expect(movieService.toggleMovieLike).toHaveBeenCalledWith(
        movieId,
        userId,
        true,
      );
    });
  });

  describe('createMovieDislike', () => {
    it('should call movieService.toggleMovieLike with the correct parameters', async () => {
      const movieId = 1;
      const userId = 2;

      await movieController.createMovieDisLike(movieId, userId);

      expect(movieService.toggleMovieLike).toHaveBeenCalledWith(
        movieId,
        userId,
        false,
      );
    });
  });
});
