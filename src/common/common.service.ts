import { BadRequestException, Injectable } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';
import { PagePaginationDto } from './dto/page-pagination.dto';
import { CursorPaginationDto } from './dto/cursor-pagination.dto';

@Injectable()
export class CommonService {
  constructor() {}

  applyPagePaginationParamsToQueryBuilder<T>(
    qb: SelectQueryBuilder<T>,
    dto: PagePaginationDto,
  ) {
    const { page, take } = dto;
    const skip = (page - 1) * take;

    qb.take(take);
    qb.skip(skip);
  }

  async applyCursorPaginationParamsToQueryBuilder<T>(
    qb: SelectQueryBuilder<T>,
    dto: CursorPaginationDto,
  ) {
    let { order } = dto;
    const { take, cursor } = dto;

    if (cursor) {
      const decodedCursor = Buffer.from(cursor, 'base64').toString('utf-8');
      const cursorObject = JSON.parse(decodedCursor);

      order = cursorObject.order;
      const { values } = cursorObject;
      // 동적으로 OR 조건 생성

      this.applyCursorConditions(qb, order, values, qb.alias);
    }

    for (let i = 0; i < order.length; i++) {
      const [column, direction] = order[i].split('_');
      if (direction !== 'ASC' && direction !== 'DESC') {
        throw new BadRequestException('order direction must be ASC or DESC');
      }

      if (i === 0) {
        qb.orderBy(`${qb.alias}.${column}`, direction);
      } else {
        qb.addOrderBy(`${qb.alias}.${column}`, direction);
      }
    }

    qb.take(take);

    const results = await qb.getMany();
    // cursor 생성
    const nextCursor = this.generateNextCursor(results, order);

    return {
      qb,
      nextCursor,
    };
  }

  private applyCursorConditions<T>(
    qb: SelectQueryBuilder<T>,
    order: string[],
    values: Record<string, any>,
    alias: string,
  ) {
    for (let i = 0; i < order.length; i++) {
      const [column, direction] = order[i].split('_');
      const comparator = direction === 'ASC' ? '>' : '<';

      // 조건을 동적으로 생성
      const conditions = [];
      for (let j = 0; j < i; j++) {
        const [prevColumn] = order[j].split('_');
        conditions.push(`${alias}."${prevColumn}" = :cursor_${prevColumn}`);
      }
      const [currentColumn] = order[i].split('_');
      conditions.push(
        `${alias}."${currentColumn}" ${comparator} :cursor_${currentColumn}`,
      );

      // OR 조건을 QueryBuilder에 추가
      qb.orWhere(`(${conditions.join(' AND ')})`);
    }

    // 파라미터 설정
    const parameters = Object.keys(values).reduce(
      (acc, key) => {
        acc[`cursor_${key}`] = values[key];
        return acc;
      },
      {} as Record<string, any>,
    );
    qb.setParameters(parameters);
  }

  private generateNextCursor<T>(results: T[], order: string[]): string | null {
    if (results.length === 0) return null;

    /**
     * {
     *  values: {
     *    id: 27
     *  },
     * order: ['id_DESC']
     * }
     */
    const lastItem = results[results.length - 1];

    const values = {};

    order.forEach((columnOrder) => {
      const [column] = columnOrder.split('_');
      values[column] = lastItem[column];
    });

    const cursorObject = { values, order };
    const nextCursor = Buffer.from(JSON.stringify(cursorObject)).toString(
      'base64',
    );

    return nextCursor;
  }
}
