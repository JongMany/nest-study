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
  Request,
  UploadedFiles,
  UploadedFile,
} from '@nestjs/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Public } from 'src/auth/decorator/public.decorator';
import { RBAC } from 'src/auth/decorator/rbac.decorator';
import { Role } from 'src/user/entity/user.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
import { TransactionInterceptor } from 'src/common/interceptor/transaction.interceptor';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { MovieFilePipe } from './pipe/movie-file.pipe';
// import { CacheInterceptor } from 'src/common/interceptor/cache.interceptor';

@Controller('movie')
@UseInterceptors(ClassSerializerInterceptor)
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Public()
  // @UseInterceptors(CacheInterceptor)
  @Get()
  getMovies(@Query() dto: GetMoviesDto) {
    return this.movieService.findAll(dto);
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
  @UseInterceptors(
    // FileFieldsInterceptor(
    //   [
    //     { name: 'movie', maxCount: 1 },
    //     {
    //       name: 'poster',
    //       maxCount: 2,
    //     },
    //   ],
    //   {
    //     limits: {
    //       fileSize: 20 * 1000 * 1000, // 20MB
    //     },
    //     fileFilter: (req, file, callback) => {
    //       console.log(file);
    //       if (file.mimetype !== 'video/mp4') {
    //         return callback(
    //           new BadRequestException('MP4 타입만 업로드 가능합니다.'),
    //           false,
    //         );
    //       }

    //       return callback(null, true);
    //     },
    //   },
    // ),
    FileInterceptor('movie', {
      limits: {
        fileSize: 20 * 1000 * 1000, // 20MB
      },
      fileFilter: (req, file, callback) => {
        console.log(file);
        if (file.mimetype !== 'video/mp4') {
          return callback(
            new BadRequestException('MP4 타입만 업로드 가능합니다.'),
            false,
          );
        }

        return callback(null, true);
      },
    }),
  )
  @Post('')
  postMovie(
    @Body() body: CreateMovieDto,
    @Request() request,
    @UploadedFile(
      new MovieFilePipe({
        maxSize: 20,
        mimeType: 'video/mp4',
      }),
    )
    movie: Express.Multer.File,
  ) {
    console.log('-----------');
    console.log(movie);

    return this.movieService.create(body, request.queryRunner);
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
}
