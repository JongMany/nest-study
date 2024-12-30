import {
  BadRequestException,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NextFunction } from 'express';
import { envVariableKeys } from 'src/common/const/env.const';

@Injectable()
export class BearerTokenMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}
  async use(req: any, res: any, next: NextFunction) {
    const authHeader = req.headers['authorization'];

    // 인증을 할 의도가 없는 경우
    if (!authHeader) {
      next();
      return;
    }

    // 토큰 추출

    try {
      const token = this.validateBearerToken(authHeader);

      const decodedPayload = await this.jwtService.decode(token);

      if (
        decodedPayload.type !== 'refresh' &&
        decodedPayload.type !== 'access'
      ) {
        throw new UnauthorizedException('잘못된 토큰입니다.');
      }

      const secretKey =
        decodedPayload.type === 'refresh'
          ? envVariableKeys.refreshTokenSecret
          : envVariableKeys.accessTokenSecret;

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>(secretKey),
      });

      req.user = payload;
      next();
    } catch (e) {
      console.error(e);
      // 토큰 만료 에러 잡기는 Guard에서 처리함(MGIP)
      next();
    }
  }

  private validateBearerToken(rawToken: string) {
    const basicSplit = rawToken.split(' ');

    if (basicSplit.length !== 2) {
      throw new BadRequestException('토큰 포맷이 잘못 되었습니다');
    }

    const [bearer, token] = basicSplit;

    if (bearer.toLowerCase() !== 'bearer') {
      throw new BadRequestException('토큰 포맷이 잘못 되었습니다');
    }

    return token;
  }
}
