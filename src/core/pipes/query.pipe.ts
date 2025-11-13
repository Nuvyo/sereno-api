import { PipeTransform, Injectable } from '@nestjs/common';

export class QueryData {

  public like: string;

  public skip: number;

  public take: number;

  public order: Record<string, 'ASC' | 'DESC'>;

  public where: Record<string, string | number | boolean | Date | any[]>;

  constructor(
    where: Record<string, any>,
    like: string,
    skip: number,
    take: number,
    order: Record<string, 'ASC' | 'DESC'>,
  ) {
    this.where = where;
    this.like = like;
    this.skip = skip;
    this.take = take;
    this.order = order;
  }

}

export class QueryDataInput {

  like?: string;
  page?: number;
  take?: number;
  order?: string;

}

@Injectable()
export class QueryPipe implements PipeTransform<QueryDataInput, QueryData> {

  constructor() {}

  public transform(value: QueryDataInput): QueryData {
    Object.keys(value).forEach((key) => {
      (value as Record<string, any>)[key] = this.formatValue((value as Record<string, any>)[key]);
    });

    const where = this.getFilter(value);
    const like = value.like ? value.like.trim() : '';
    const order = this.getOrder(value.order);
    const { skip, take } = this.getPagination(value);

    return new QueryData(where, like, skip, take, order);
  }

  private getFilter(value: QueryDataInput): Record<string, any> {
    const where: Record<string, any> = {};

    Object.keys(value).map((key) => {
      const queryInputObject = new QueryDataInput();

      if (!Object.keys(queryInputObject).includes(key)) {
        where[key] = value[key as keyof QueryDataInput];
      }
    });

    return where;
  }

  private getPagination(value: QueryDataInput): { skip: number; take: number } {
    const { page: valuePage, take: valueLimit } = value;
    const maxPageLimit = 10;
    const page = valuePage ? this.negativeToPositive(valuePage) : 0;
    const limit = valueLimit ? this.negativeToPositive(valueLimit) : 0;
    let skip = 0;
    let take = 10;

    if (limit) {
      take = limit > maxPageLimit ? maxPageLimit : limit;
    }

    if (page) {
      skip = page * take;
    }

    return { skip, take };
  }

  private formatValue(value: any): string | number | boolean | Date | any[] {
    if (!isNaN(value)) {
      return Number(value);
    } else if (value === 'true' || value === 'false') {
      return value === 'true';
    } else if (this.isJsonString(value)) {
      const parsedValue: any[] = JSON.parse(value);

      return Array.isArray(parsedValue) ? parsedValue.map((item) => this.formatValue(item)) : parsedValue;
    } else if (!isNaN(Date.parse(value))) {
      return new Date(value);
    }

    return value;
  }

  private isJsonString(value: string): boolean {
    try {
      JSON.parse(value);

      return true;
    } catch {
      return false;
    }
  }

  private getOrder(value?: string): Record<string, 'ASC' | 'DESC'> {
    const order: Record<string, 'ASC' | 'DESC'> = {};

    if (value) {
      const orderArray = value.split(',');

      orderArray.forEach((orderItem) => {
        const isDesc = orderItem.startsWith('-');
        const isAsc = orderItem.startsWith('+') || !isDesc;
        const orderKey = orderItem.replace(/^[-+]/, '');
        const orderValue = isAsc ? 'ASC' : 'DESC';
        const clearedOrderKey = orderKey.replace(/[^a-zA-Z0-9_]/g, '');

        order[clearedOrderKey] = orderValue;
      });
    }

    return order;
  }

  private negativeToPositive(value: number): number {
    if (value < 0) {
      return value * -1;
    }

    return value;
  }

}
