import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { QueryPipe, QueryData, QueryDataInput } from './query.pipe';

describe('QueryPipe', () => {
  const queryPipe = new QueryPipe();

  describe('transform()', () => {
    it('should transform input with default values', () => {
      const input: QueryDataInput = {};
      const result = queryPipe.transform(input);

      assert.deepEqual(result, new QueryData({}, '', 0, 10, {}));
    });

    it('should transform input with pagination', () => {
      const input: QueryDataInput = { page: 2, take: 5 };
      const result = queryPipe.transform(input);

      assert.equal(result.skip, 10);
      assert.equal(result.take, 5);
    });

    it('should transform input with filters', () => {
      const input: QueryDataInput = { like: 'test', customField: 'value' } as any;
      const result = queryPipe.transform(input);

      assert.equal(result.like, 'test');
      assert.deepEqual(result.where, { customField: 'value' });
    });

    it('should transform input with order', () => {
      const input: QueryDataInput = { order: '-createdAt,+name' };
      const result = queryPipe.transform(input);

      assert.deepEqual(result.order, { createdAt: 'DESC', name: 'ASC' });
    });

    it('should handle invalid pagination values gracefully', () => {
      const input: QueryDataInput = { page: -1, take: 0 };
      const result = queryPipe.transform(input);

      assert.equal(result.skip, 10);
      assert.equal(result.take, 10);
    });

    it('should handle complex filters', () => {
      const input: QueryDataInput = { customField: 'true', anotherField: '123' } as any;
      const result = queryPipe.transform(input);

      assert.deepEqual(result.where, { customField: true, anotherField: 123 });
    });

    it('should handle array filters', () => {
      const input: QueryDataInput = { customField: '["value1","value2"]' } as any;
      const result = queryPipe.transform(input);

      assert.deepEqual(result.where, { customField: ['value1', 'value2'] });
    });

    it('should handle date filters', () => {
      const input: QueryDataInput = { dateField: '2025-04-19T00:00:00Z' } as any;
      const result = queryPipe.transform(input);

      assert.deepEqual(result.where, { dateField: new Date('2025-04-19T00:00:00Z') });
    });

    it('should limit "take" to maxPageLimit when exceeded', () => {
      const input: QueryDataInput = { page: 1, take: 20 };
      const result = queryPipe.transform(input);

      assert.equal(result.take, 10);
      assert.equal(result.skip, 10);
    });

    it('should handle order strings starting with "+" correctly', () => {
      const input: QueryDataInput = { order: '+createdAt' };
      const result = queryPipe.transform(input);

      assert.deepEqual(result.order, { createdAt: 'ASC' });
    });

    it('should handle non-array JSON objects correctly', () => {
      const input: QueryDataInput = { customField: '{"key":"value"}' } as any;
      const result = queryPipe.transform(input);

      assert.deepEqual(result.where, { customField: { key: 'value' } });
    });
  });

  describe('private methods', () => {
    it('should correctly parse order strings', () => {
      const order = queryPipe['getOrder']('-createdAt,+name');

      assert.deepEqual(order, { createdAt: 'DESC', name: 'ASC' });
    });

    it('should correctly handle negative pagination values', () => {
      const pagination = queryPipe['getPagination']({ page: -2, take: -5 });

      assert.equal(pagination.skip, 10);
      assert.equal(pagination.take, 5);
    });

    it('should correctly format values', () => {
      assert.equal(queryPipe['formatValue']('123'), 123);
      assert.equal(queryPipe['formatValue']('true'), true);
      assert.equal(queryPipe['formatValue']('false'), false);
      assert.deepEqual(queryPipe['formatValue']('["a","b"]'), ['a', 'b']);
      assert.deepEqual(queryPipe['formatValue']('2025-04-19T00:00:00Z'), new Date('2025-04-19T00:00:00Z'));
    });
  });
});
