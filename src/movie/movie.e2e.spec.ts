import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { DataSource } from 'typeorm';
import { Role, User } from 'src/user/entity/user.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entity/genre.entity';
import { Movie } from './entity/movie.entity';
import { MovieDetail } from './entity/movie-detail.entity';
import { MovieUserLike } from './entity/movie-user-like.entity';
import { AuthService } from 'src/auth/auth.service';

describe('MovieController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  let users: User[];
  let directors: Director[];
  let genres: Genre[];
  let movies: Movie[];
  let token: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true, // 정의된 값만 전달되도록 필터링
        forbidNonWhitelisted: true, // 있으면 안되는 프로퍼티가 있으면 에러를 반환한다.
        transformOptions: {
          enableImplicitConversion: true, // 타입스크립트로 명시된 타입으로 변환
        },
      }),
    );
    await app.init();

    dataSource = app.get<DataSource>(DataSource);
    const movieUserLikeRepository = dataSource.getRepository(MovieUserLike);
    const movieRepository = dataSource.getRepository(Movie);
    const movieDetailRepository = dataSource.getRepository(MovieDetail);
    const userRepository = dataSource.getRepository(User);
    const directorRepository = dataSource.getRepository(Director);
    const genreRepository = dataSource.getRepository(Genre);

    await movieUserLikeRepository.delete({});
    await movieRepository.delete({});
    await movieDetailRepository.delete({});
    await userRepository.delete({});
    await directorRepository.delete({});
    await genreRepository.delete({});

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

    // Authenticate
    const authService = moduleFixture.get<AuthService>(AuthService);
    token = await authService.issueToken(
      { id: users[0].id, role: Role.admin },
      false,
    );
  });

  afterAll(async () => {
    await new Promise((resolve, reject) => {
      setTimeout(resolve, 500);
    });
    await dataSource.destroy();
    await app.close();
  });

  describe('[GET /movie]', () => {
    it('should get all movies', async () => {
      const { body, statusCode, error } = await request(
        app.getHttpServer(),
      ).get('/movie');

      expect(statusCode).toBe(200);
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('nextCursor');
      expect(body).toHaveProperty('count');

      expect(body.data).toHaveLength(5);
    });
  });

  describe('[GET /movie/recent]', () => {
    it('should get recent movies', async () => {
      const { body, statusCode } = await request(app.getHttpServer())
        .get('/movie/recent')
        .set('authorization', `Bearer ${token}`);

      expect(statusCode).toBe(200);
      expect(body).toHaveLength(10);
    });
  });

  describe('[Get /movie/{id}]', () => {
    it('should get movie by id', async () => {
      const movieId = movies[0].id;

      const { body, statusCode } = await request(app.getHttpServer())
        .get(`/movie/${movieId}`)
        .set('authorization', `Bearer ${token}`);

      expect(statusCode).toBe(200);
      expect(body.id).toBe(movieId);
    });

    it('should throw 404 Error if movie does not exist', async () => {
      const movieId = 999999;
      const { body, statusCode } = await request(app.getHttpServer())
        .get(`/movie/${movieId}`)
        .set('authorization', `Bearer ${token}`);

      expect(statusCode).toBe(404);
      expect(body.message).toBe(`Movie with ID ${movieId} not found`);
    });
  });
});
