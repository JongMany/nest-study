import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { Repository } from 'typeorm';
import { User } from 'src/user/entity/user.entity';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { getRepositoryToken } from '@nestjs/typeorm';

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
});
