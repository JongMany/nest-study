import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  ClassSerializerInterceptor,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { GenreService } from './genre.service';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';

@Controller('genre')
@UseInterceptors(ClassSerializerInterceptor)
export class GenreController {
  constructor(private readonly genreService: GenreService) {}

  @Post()
  create(@Body() createGenreDto: CreateGenreDto) {
    return this.genreService.create(createGenreDto);
  }

  @Get()
  findAll() {
    return this.genreService.findAll();
  }

  @Get(':id')
  findOne(
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
    return this.genreService.findOne(id);
  }

  @Patch(':id')
  update(
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
    @Body() updateGenreDto: UpdateGenreDto,
  ) {
    return this.genreService.update(id, updateGenreDto);
  }

  @Delete(':id')
  remove(
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
    return this.genreService.remove(id);
  }
}
