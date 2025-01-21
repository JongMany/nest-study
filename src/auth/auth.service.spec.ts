import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { Repository } from 'typeorm';
import { Role, User } from 'src/user/entity/user.entity';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const mockUserRepository = {
  findOne: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

const mockJwtService = {
  signAsync: jest.fn(),
  verifyAsync: jest.fn(),
  decode: jest.fn(),
};

const mockCacheManager = {
  set: jest.fn(),
};

const mockUserService = {
  create: jest.fn(),
};

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: Repository<User>;
  let configService: ConfigService;
  let jwtService: JwtService;
  let cacheManager: Cache;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: UserService, useValue: mockUserService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    configService = module.get<ConfigService>(ConfigService);
    jwtService = module.get<JwtService>(JwtService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
    userService = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('tokenBlock', () => {
    it('should block a token', async () => {
      const token = 'token';
      const payload = {
        exp: Math.floor(Date.now() / 1000) + 60,
      };

      jest.spyOn(jwtService, 'decode').mockReturnValue(payload);

      await authService.tokenBlock(token);
      expect(jwtService.decode).toHaveBeenCalledWith(token);
      expect(cacheManager.set).toHaveBeenCalledWith(
        `BLOCK_TOKEN_${token}`,
        payload,
        expect.any(Number),
      );
    });
  });

  describe('parseBasicToken', () => {
    it('should parse a valid Basic Token', () => {
      const rawToken = 'Basic dGVzdEBleGFtcGxlLmNvbToxMjM0NTY='; // test@example.com / 123456
      const result = authService.parseBasicToken(rawToken);
      const decoded = {
        email: 'test@example.com',
        password: '123456',
      };
      expect(result).toEqual(decoded);
    });

    it('should throw an error for invalid token format', () => {
      const rawToken = 'Invalid Token='; // test@example.com / 123456

      // Async 가 아니므로, 콜백으로 넣어줘야 한다.
      expect(() => authService.parseBasicToken(rawToken)).toThrow(
        BadRequestException,
      );
    });

    it('should throw an error for invalid Basic token format', () => {
      const rawToken = 'Bearer Invalid Token='; // test@example.com / 123456

      // Async 가 아니므로, 콜백으로 넣어줘야 한다.
      expect(() => authService.parseBasicToken(rawToken)).toThrow(
        BadRequestException,
      );
    });

    it('should throw an error for invalid Basic token format', () => {
      const rawToken = 'Basic a'; // test@example.com / 123456

      // Async 가 아니므로, 콜백으로 넣어줘야 한다.
      expect(() => authService.parseBasicToken(rawToken)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('parseBearerToken', () => {
    it('should parse a valid Bearer Token', async () => {
      const rawToken = 'Bearer token';
      const payload = { type: 'access' };

      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(payload);
      jest.spyOn(mockConfigService, 'get').mockReturnValue('secret');

      const result = await authService.parseBearerToken(rawToken, false);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith('token', {
        secret: 'secret',
      });
      expect(result).toEqual(payload);
    });

    it('should throw a BadRequestException for invalid Bearer token format', () => {
      const rawToken = 'a';

      expect(authService.parseBearerToken(rawToken, false)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw a BadRequestException for token not starting with Bearer', () => {
      const rawToken = 'Basic token';

      expect(authService.parseBearerToken(rawToken, false)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw a UnauthorizedException if payload.type is not refresh but isRefreshToken parameter is true', () => {
      const rawToken = 'Bearer token';

      jest
        .spyOn(jwtService, 'verifyAsync')
        .mockResolvedValue({ type: 'refresh' });

      expect(authService.parseBearerToken(rawToken, false)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw a UnauthorizedException if payload.type is not refresh but isRefreshToken parameter is true', () => {
      const rawToken = 'Bearer token';

      jest
        .spyOn(jwtService, 'verifyAsync')
        .mockResolvedValue({ type: 'access' });

      expect(authService.parseBearerToken(rawToken, true)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const rawToken = 'basic abcd';
      const user = {
        email: 'test@example.com',
        password: '123456',
      };

      jest.spyOn(authService, 'parseBasicToken').mockReturnValue(user);
      jest.spyOn(mockUserService, 'create').mockResolvedValue(user);

      const result = await authService.register(rawToken);
      expect(authService.parseBasicToken).toHaveBeenCalledWith(rawToken);
      expect(mockUserService.create).toHaveBeenCalledWith(user);
      expect(result).toEqual(user);
    });
  });

  describe('authenticate', () => {
    it('should authenticate a user with correct credentials', async () => {
      const email = 'test@codefactory.ai';
      const password = '123123';
      const user = { email, password: 'hashedPassword' };

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockImplementation((a, b) => true);

      const result = await authService.authenticate(email, password);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, 'hashedPassword');
      expect(result).toEqual(user);
    });

    it('should throw an error fro not existing user', async () => {
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(null);

      await expect(
        authService.authenticate('test@codefactory.ai', '123123'),
      ).rejects.toThrow(BadRequestException);
    });
    it('should throw an error fro not incorrect password', async () => {
      const user = { email: 'test@codefactory.ai', password: 'hashedPassword' };

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockImplementation((a, b) => false);

      await expect(
        authService.authenticate('test@codefactory.ai', 'password'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('issueToken', () => {
    const user = { id: 1, role: Role.user };
    const token = 'token';

    beforeEach(() => {
      jest.spyOn(mockConfigService, 'get').mockReturnValue('secret');
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue('token');
    });

    it('should issue an access token', async () => {
      const result = await authService.issueToken(user, false);

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: user.id, role: user.role, type: 'access' },
        { secret: 'secret', expiresIn: 300 },
      );
      expect(result).toBe(token);
    });

    it('should issue an access token', async () => {
      const result = await authService.issueToken(user, true);

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: user.id, role: user.role, type: 'refresh' },
        { secret: 'secret', expiresIn: '24h' },
      );
      expect(result).toBe(token);
    });
  });
});
