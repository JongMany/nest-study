import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

const mockUserRepository = {
  create: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  save: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

describe('UserService', () => {
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService, // TypeORM Injection을 mockUserRepository로 대체하기
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user and return it.', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@test.com',
        password: 'test123',
      };

      const hashRounds = 10;
      const hashedPassword = 'hasdasdasd1h';

      const result = {
        id: 1,
        email: createUserDto.email,
        password: hashedPassword,
      };

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(mockConfigService, 'get').mockReturnValue(hashRounds);
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation((password, hashRounds) => hashedPassword);
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce(result);

      const createdUser = await userService.create(createUserDto);

      expect(createdUser).toEqual(result);
      expect(mockUserRepository.findOne).toHaveBeenNthCalledWith(1, {
        where: { email: createUserDto.email },
      });
      expect(mockUserRepository.findOne).toHaveBeenNthCalledWith(2, {
        where: { email: createUserDto.email },
      });
      expect(mockConfigService.get).toHaveBeenCalledWith(expect.anything()); // 매개변수로 호출이 되었음을 증명
      expect(bcrypt.hash).toHaveBeenCalledWith(
        createUserDto.password,
        hashRounds,
      );
      expect(mockUserRepository.save).toHaveBeenCalledWith({
        email: createUserDto.email,
        password: hashedPassword,
      });
    });

    it('should throw a BadRequestException if emila already exists', () => {
      const createUserDto: CreateUserDto = {
        email: 'test@test.com',
        password: 'test123',
      };

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce({
        id: 1,
        email: createUserDto.email,
      });

      expect(userService.create(createUserDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [
        {
          id: 1,
          email: 'test@test.com',
        },
      ];
      mockUserRepository.find.mockResolvedValue(users);

      const result = await userService.findAll();
      expect(result).toEqual(users);
      expect(mockUserRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const user = { id: 1, email: 'codefactory@test.ai' };

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(user);

      const result = await userService.findOne(1);

      expect(result).toEqual(user);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw a NotFoundException if user is not found', () => {
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(null);

      expect(userService.findOne(100)).rejects.toThrow(NotFoundException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 100 },
      });
    });
  });

  describe('remove', () => {
    it('should delete a user by id', async () => {
      const id = 999;
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue({ id });

      const result = await userService.remove(id);
      expect(result).toBe(id);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
    });

    it('should throw a NotFoundException if user to delete is not found', async () => {
      const id = 999;
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(null);

      expect(userService.remove(id)).rejects.toThrow(NotFoundException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: {
          id,
        },
      });
    });
  });
});
