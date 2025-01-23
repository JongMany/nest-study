import { Test, TestingModule } from '@nestjs/testing';
import { GenreService } from './genre.service';
import { Repository } from 'typeorm';
import { Genre } from './entity/genre.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

const mockGenreRepository = {
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
  update: jest.fn(),
};

describe('GenreService', () => {
  let genreService: GenreService;
  let genreRepository: Repository<Genre>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenreService,
        {
          provide: getRepositoryToken(Genre),
          useValue: mockGenreRepository,
        },
      ],
    }).compile();

    genreService = module.get<GenreService>(GenreService);
    genreRepository = module.get<Repository<Genre>>(getRepositoryToken(Genre));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(genreService).toBeDefined();
  });

  describe('create', () => {
    it('should create a new genre successfully', async () => {
      const createGenreDto = { name: 'Fantasy' };
      const savedGenre = { id: 1, ...createGenreDto };

      jest
        .spyOn(genreRepository, 'save')
        .mockResolvedValue(savedGenre as Genre);

      const result = await genreService.create(createGenreDto);

      expect(genreRepository.save).toHaveBeenCalledWith(createGenreDto);
      expect(result).toEqual(savedGenre);
    });
  });

  describe('findAll', () => {
    it('should return an array of genres', async () => {
      const genres = [
        { id: 1, name: 'Fantasy' },
        { id: 2, name: 'Sci-Fi' },
      ];

      jest.spyOn(genreRepository, 'find').mockResolvedValue(genres as Genre[]);

      const result = await genreService.findAll();

      expect(genreRepository.find).toHaveBeenCalled();
      expect(result).toEqual(genres);
    });
  });

  describe('findOne', () => {
    it('should return a genre by id if found', async () => {
      const genre = { id: 1, name: 'Fantasy' };

      jest.spyOn(genreRepository, 'findOne').mockResolvedValue(genre as Genre);

      const result = await genreService.findOne(genre.id);

      expect(genreRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(genre);
    });

    it('should throw a NotFoundException if genre is not found', () => {
      jest.spyOn(genreRepository, 'findOne').mockResolvedValue(null);

      expect(genreService.findOne(1)).rejects.toThrow(NotFoundException);
      expect(genreRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('update', () => {
    it('should update a genre by id and return the updated genre if it exists', async () => {
      const updateGenreDto = { name: 'Fantasy Updated' };
      const existingGenre = { id: 1, name: 'Fantasy' };
      const updatedGenre = { ...existingGenre, ...updateGenreDto };

      jest
        .spyOn(genreRepository, 'findOne')
        .mockResolvedValueOnce(existingGenre as Genre)
        .mockResolvedValueOnce(updatedGenre as Genre);

      const result = await genreService.update(
        existingGenre.id,
        updateGenreDto,
      );

      expect(genreRepository.findOne).toHaveBeenCalledWith({
        where: { id: existingGenre.id },
      });
      expect(genreRepository.update).toHaveBeenCalledWith(
        { id: existingGenre.id },
        updateGenreDto,
      );
      expect(result).toEqual(updatedGenre);
    });

    it('should throw a NotFoundException if genre is not found', () => {
      jest.spyOn(genreRepository, 'findOne').mockResolvedValue(null);

      expect(genreService.update(1, {})).rejects.toThrow(NotFoundException);
      expect(genreRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('remove', () => {
    it('should delete a genre and return id', async () => {
      const genre = {
        id: 1,
        name: 'Fantasy',
      };

      jest.spyOn(genreRepository, 'findOne').mockResolvedValue(genre as Genre);

      const result = await genreService.remove(genre.id);

      expect(genreRepository.findOne).toHaveBeenCalledWith({
        where: { id: genre.id },
      });
      expect(genreRepository.delete).toHaveBeenCalledWith(genre.id);
      expect(result).toBe(1);
    });

    it('should throw a NotFoundException if genre is not found', () => {
      jest.spyOn(genreRepository, 'findOne').mockResolvedValue(null);

      expect(genreService.remove(1)).rejects.toThrow(NotFoundException);
      expect(genreRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });
});
