import {
  CallHandler,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class ResponseTimeInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();

    const reqTime = Date.now();

    return next.handle().pipe(
      // delay(1000),
      tap(() => {
        const resTime = Date.now();
        const diff = resTime - reqTime;
        // 시간이 오래걸린 요청은 응답을 반환하지 않도록 구현
        if (diff > 1000) {
          console.log(`TIMEOUT [${req.method} ${req.path}] ${diff}ms`);
          throw new InternalServerErrorException(
            '시간이 너무 오래 걸렸습니다.',
          );
        } else {
          console.log(`[${req.method} ${req.path}] ${diff}ms`);
        }
      }),
    );
  }
}
