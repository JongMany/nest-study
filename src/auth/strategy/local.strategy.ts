import { Injectable } from '@nestjs/common';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

export class LocalAuthGuard extends AuthGuard('login') {}

// Local - 이메일, 비밀번호 로그인 전략
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'login') {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email',
    });
  }

  /**
   * LocalStrategy
   *
   * validate: username, password
   *
   * return -> Request 객체에서 받을 수 있음 (가드이므로)
   */
  async validate(email: string, password: string) {
    // 존재하는 사용자인지 검증
    const user = await this.authService.authenticate(email, password);

    return user;
  }
}
