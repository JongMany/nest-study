import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// 데코레이터는 사용하는 쪽에서 테스트하는 것이 간편함!
export const UserId = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();

    // if (!request || !request.user || !request.user.sub) {
    //   throw new UnauthorizedException('사용자 정보를 찾을 수 없습니다.');
    // }

    return request?.user?.sub;
  },
);
