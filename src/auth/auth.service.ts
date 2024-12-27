import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entity/user.entity';
import { Repository } from 'typeorm';

import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  private parseBasicToken(rawToken: string) {
    // 1. 토큰을 " " 기준으로 스플릿 한 후 토큰 값만 추출
    // 정상적인 경우 [Basic, $token]
    const basicSplit = rawToken.split(' ');

    if (basicSplit.length !== 2) {
      throw new BadRequestException('토큰 포맷이 잘못 되었습니다');
    }

    const [_, token] = basicSplit;

    // 2. 추출한 토큰을 base64 decode 후 이메일과 비밀번호로 나눈다.
    const decoded = Buffer.from(token, 'base64').toString('utf-8');

    // email:password 형태
    const tokenSplit = decoded.split(':');

    if (tokenSplit.length !== 2) {
      throw new BadRequestException('토큰 포맷이 잘못 되었습니다');
    }

    const [email, password] = tokenSplit;
    return { email, password };
  }

  // rawToken -> "Basic $token"
  async register(rawToken: string) {
    const { email, password } = this.parseBasicToken(rawToken);

    // 이미 가입한 사용자인지 파악
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
      this.configService.get<number>('HASH_ROUND'),
    );

    await this.userRepository.save({ email, password: hash });
  }
}
