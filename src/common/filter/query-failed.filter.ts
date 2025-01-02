import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

@Catch(QueryFailedError)
export class QueryFailedExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = 400;

    // let message = '데이터베이스 에러 발생';

    // if (exception.message.toLowerCase().includes('duplicate key')) {
    //   message = '중복 키 에러';
    // }
    let message = '데이터베이스 에러 발생';
    let table = null;

    if (exception.code === '23505' && exception.table) {
      // PostgreSQL 중복 키 예외 처리
      table = exception.table.toUpperCase();
      message = `중복 키 에러: ${table} 테이블에서 중복된 값이 존재합니다.`;
    } else if (exception.code === 'ER_DUP_ENTRY' && exception.sqlMessage) {
      // MySQL 중복 키 예외 처리
      const match = exception.sqlMessage.match(/for key '(.*?)'/);
      table = match ? match[1].toUpperCase() : null;
      message = `중복 키 에러: ${table}에서 중복된 값이 존재합니다.`;
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      table,
    });
  }
}
