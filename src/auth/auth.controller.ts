import { Controller, Headers, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('')
  // authorization: Basic $token
  registerUser(@Headers('authorization') token: string) {
    this.authService.register(token);
  }
}
