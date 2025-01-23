import { Test, TestingModule } from '@nestjs/testing';
import { GenreController } from './genre.controller';
import { GenreService } from './genre.service';
import { CreateGenreDto } from './dto/create-genre.dto';
import { Genre } from './entity/genre.entity';

const mockGenreService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('GenreController', () => {
  let genreController: GenreController;
  let genreService: GenreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GenreController],
      providers: [
        {
          provide: GenreService,
          useValue: mockGenreService,
        },
      ],
    }).compile();
    genreController = module.get<GenreController>(GenreController);
    genreService = module.get<GenreService>(GenreService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(genreController).toBeDefined();
  });

  describe('create', () => {
    it('should call genreService.create with correct paramter', async () => {
      const createGenreDto = {
        name: 'Fantasy',
      };
      const result = { id: 1, ...createGenreDto };

      jest
        .spyOn(genreService, 'create')
        .mockResolvedValue(result as CreateGenreDto & Genre);

      expect(genreController.create(createGenreDto)).resolves.toEqual(result);
      expect(genreService.create).toHaveBeenCalledWith(createGenreDto);
    });
  });

  describe('findAll', () => {
    it('should call genreService.findAll and return an array of genres', () => {
      const result = [{ id: 1, name: 'Fantasy' }];

      jest.spyOn(genreService, 'findAll').mockResolvedValue(result as Genre[]);

      expect(genreController.findAll()).resolves.toEqual(result);
      expect(genreService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should call genreService.findOne with correct id and return the genre', () => {
      const result = { id: 1, name: 'Fantasy' };

      jest.spyOn(genreService, 'findOne').mockResolvedValue(result as Genre);

      expect(genreController.findOne(1)).resolves.toEqual(result);
      expect(genreService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should call genreService.update with correct parameters and return updated genre', () => {
      const id = 1;
      const updateGenreDto = { name: 'Fantasy Updated' };
      const result = { id, ...updateGenreDto };

      jest.spyOn(genreService, 'update').mockResolvedValue(result as Genre);

      expect(genreController.update(id, updateGenreDto)).resolves.toEqual(
        result,
      );
      expect(genreService.update).toHaveBeenCalledWith(id, updateGenreDto);
    });
  });

  describe('remove', () => {
    it('should call genreService.remove with correct id and return id of the remvoed genre', () => {
      const id = 1;

      jest.spyOn(genreService, 'remove').mockResolvedValue(id);

      expect(genreController.remove(id)).resolves.toEqual(id);
      expect(genreService.remove).toHaveBeenCalledWith(id);
    });
  });
});
