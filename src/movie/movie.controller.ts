import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
  ParseIntPipe,
  BadRequestException,
  Version,
} from '@nestjs/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Public } from 'src/auth/decorator/public.decorator';
import { RBAC } from 'src/auth/decorator/rbac.decorator';
import { Role } from 'src/user/entity/user.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
import { TransactionInterceptor } from 'src/common/interceptor/transaction.interceptor';
import { UserId } from 'src/user/decorator/user-id.decorator';
import { QueryRunner } from 'src/common/decorator/query-runner.decorator';
import { QueryRunner as TypeOrmQueryRunner } from 'typeorm';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { Throttle } from 'src/common/decorator/throttle.decorator';

@Controller({
  path: 'movie',
  version: '2',
})
export class MovieControllerV2 {
  @Get()
  getMovies() {
    return [];
  }
}
@Controller({
  path: 'movie',
  version: ['1', '3'],
})
@UseInterceptors(ClassSerializerInterceptor)
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Public()
  // @UseInterceptors(CacheInterceptor)
  @Get()
  @Version(['1', '3', '5'])
  @Throttle({
    count: 5,
    unit: 'minute',
  })
  getMovies(@Query() dto: GetMoviesDto, @UserId() userId?: number) {
    return this.movieService.findAll(dto, userId);
  }

  @Get('recent')
  @UseInterceptors(CacheInterceptor) // query params를 키로 캐싱
  @CacheKey('getMoviesRecent')
  @CacheTTL(1000)
  getMoviesRecent() {
    return this.movieService.findRecent();
  }

  @Public()
  @Get(':id')
  getMovie(
    @Param(
      'id',
      new ParseIntPipe({
        exceptionFactory: (e) => {
          console.log(e);
          throw new BadRequestException('숫자를 입력해주세요');
        },
      }),
    )
    id: number,
  ) {
    return this.movieService.findOne(id);
  }

  @RBAC(Role.admin)
  @UseInterceptors(TransactionInterceptor)
  @Post('')
  postMovie(
    @Body() body: CreateMovieDto,
    @UserId() userId: number,
    @QueryRunner() queryRunner: TypeOrmQueryRunner,
  ) {
    return this.movieService.create(body, userId, queryRunner);
  }

  @RBAC(Role.admin)
  @Patch(':id')
  patchMovie(
    @Param(
      'id',
      new ParseIntPipe({
        exceptionFactory: (e) => {
          console.log(e);
          throw new BadRequestException('숫자를 입력해주세요');
        },
      }),
    )
    id: number,
    @Body() body: UpdateMovieDto,
  ) {
    return this.movieService.update(id, body);
  }

  @RBAC(Role.admin)
  @Delete(':id')
  deleteMovie(
    @Param(
      'id',
      new ParseIntPipe({
        exceptionFactory: (e) => {
          console.log(e);
          throw new BadRequestException('숫자를 입력해주세요');
        },
      }),
    )
    id: number,
  ) {
    return this.movieService.remove(id);
  }

  @Post(':movieId/like')
  createMovieLike(
    @Param('movieId', ParseIntPipe) movieId: number,
    @UserId() userId: number,
  ) {
    return this.movieService.toggleMovieLike(movieId, userId, true);
  }

  @Post(':movieId/dislike')
  createMovieDisLike(
    @Param('movieId', ParseIntPipe) movieId: number,
    @UserId() userId: number,
  ) {
    return this.movieService.toggleMovieLike(movieId, userId, false);
  }
}
