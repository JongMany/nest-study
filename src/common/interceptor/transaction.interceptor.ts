import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable, tap } from 'rxjs';
import { DataSource } from 'typeorm';

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  constructor(private readonly dataSource: DataSource) {}
  async intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Promise<Observable<any>> {
    // Start Transaction
    const req = context.switchToHttp().getRequest();
    const qr = this.dataSource.createQueryRunner();

    await qr.connect();
    await qr.startTransaction();

    // Query Runner를 넘겨준다.
    req.queryRunner = qr;

    // Logic 실행
    return next.handle().pipe(
      catchError(async (error) => {
        console.error('Transaction failed:', error);
        await qr.rollbackTransaction();
        await qr.release();

        throw error;
      }),
      tap(async () => {
        await qr.commitTransaction();
        await qr.release();
      }),
    );
  }
}
