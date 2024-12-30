import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from 'src/user/entity/user.entity';

@Injectable()
export class RBACGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const role = this.reflector.get<Role>(RBACGuard, context.getHandler());

    // Role Enum에 해당되는 값이 데코레이터에 들어갔는지 확인하기
    if (!Object.values(Role).includes(role)) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // Auth Guard 통과 여부 체크
    const user = request.user;

    if (!user) {
      return false;
    }

    return user.role <= role;
  }
}
