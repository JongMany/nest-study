import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entity/user.entity';
import * as bcrypt from 'bcrypt';
import { envVariableKeys } from 'src/common/const/env.const';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}
  async create(createUserDto: CreateUserDto) {
    const { email, password } = createUserDto;
    const user = await this.userRepository.findOne({
      where: {
        email,
      },
    });

    if (user) {
      throw new BadRequestException('이미 가입된 이메일입니다.');
    }

    // 암호화하기 (bcrypt)
    const hash = await bcrypt.hash(
      password,
      this.configService.get<number>(envVariableKeys.hashRound),
    );

    await this.userRepository.save({ email, password: hash });

    return this.userRepository.findOne({
      where: {
        email,
      },
    });
  }

  findAll() {
    return this.userRepository.find();
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`${id}에 해당하는 유저가 없습니다.`);
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException(`${id}에 해당하는 유저가 없습니다.`);
    }

    await this.userRepository.update({ id }, { ...updateUserDto });

    return this.userRepository.findOne({
      where: { id },
    });
  }

  async remove(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException(`${id}에 해당하는 유저가 없습니다.`);
    }

    await this.userRepository.delete(id);

    return id;
  }
}
