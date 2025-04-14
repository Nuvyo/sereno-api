import { PipeTransform, Injectable } from '@nestjs/common';

export class QueryData {

  public like: string;

  public skip: number;

  public take: number;

  public order: Record<string, any>;

  public where: Record<string, string | number | boolean | Date | any[]>;

  constructor(where?: Record<string, any>, like?: string, skip?: number, take?: number, order?: Record<string, string>) {
    this.where = where || {};
    this.like = like || '';
    this.skip = skip || 0;
    this.take = take || 10;
    this.order = order || {};
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
    const where = this.getFilter(value);
    const like = value.like ? value.like.trim() : '';
    const order = value.order ? value.order.trim() : {};
    const { offset, limit } = this.getPagination(value);

    return new QueryData(where, like, offset, limit, order);
  }

  private getFilter(value: QueryDataInput): Record<string, any> {
    const where: Record<string, any> = {};

    Object.keys(value).map(key => {
      const queryInputObject = new QueryDataInput();

      if (!Object.keys(queryInputObject).includes(key)) {
        where[key] = this.formatValue(value[key as keyof QueryDataInput]);
      }
    });

    return where;
  }

  private getPagination(value: QueryDataInput) {
    const { page: valuePage, take: valueLimit } = value;
    const page = valuePage ? Number(valuePage) : 0;
    const maxPageLimit = 10;
    let limit = valueLimit ? Number(valueLimit) : null;
    let offset = 0;

    limit = !limit || limit > maxPageLimit ? maxPageLimit : limit;

    if (page !== 0) {
      offset = (page - 1) * limit;
    }

    return { offset, limit };
  }

  private formatValue(value: any): string | number | boolean | Date | any[] {
    if (!isNaN(value)) {
      return Number(value);
    } else if (value === 'true' || value === 'false') {
      return value === 'true';
    } else if (Array.isArray(JSON.parse(value))) {
      const parsedValue: any[] = JSON.parse(value);

      return parsedValue.map(item => this.formatValue(item));
    } else if (!isNaN(Date.parse(value))) {
      return new Date(value);
    } if (typeof value === 'string') {
      return value.trim().toLowerCase();
    }

    return value;
  }

}