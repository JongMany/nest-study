import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      // 토큰 추출 위치
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // 만료기간 무시하고 검증할 건지 여부
      secretOrKey: configService.get<string>('ACCESS_TOKEN_SECRET'), // 토큰 검증 시크릿키
    });
  }

  validate(payload: any) {
    return payload;
  }
}
