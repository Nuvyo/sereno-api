import * as assert from 'node:assert/strict';
import { describe, before, it, after } from 'node:test';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { createApp, Requester } from '@test/utils';
import { ServerStatusDTO } from '@modules/app.dto';
import { AppController } from '@modules/app.controller';
import { AppService } from '@modules/app.service';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';

describe('app', () => {

  let app: INestApplication;
  let requester: Requester;

  before(async () => {
    app = await createApp({
      controllers: [AppController],
      providers: [AppService]
    });
    requester = new Requester(app);
  });

  after(async () => {
    await app.close();
  });

  describe('[GET] /', () => {
    it('should return server status successfully', async () => {
      const response = await requester.get('/');

      assert.equal(response.status, HttpStatus.OK);
      assert.ok(response.body);
      
      const body = response.body as ServerStatusDTO;
      
      // Verifica se a estrutura do response está correta
      assert.ok(body.updated_at);
      assert.ok(body.dependencies);
      assert.ok(body.dependencies.database);
      
      // Verifica se os campos do banco estão presentes
      assert.ok(body.dependencies.database.version);
      assert.ok(typeof body.dependencies.database.max_connections === 'number');
      assert.ok(typeof body.dependencies.database.opened_connections === 'number');
      
      // Verifica se updated_at é uma data válida
      const updatedAt = new Date(body.updated_at);
      assert.ok(updatedAt instanceof Date && !isNaN(updatedAt.getTime()));
      
      // Verifica se os valores do banco são válidos
      assert.ok(body.dependencies.database.max_connections > 0);
      assert.ok(body.dependencies.database.opened_connections >= 0);
      assert.ok(body.dependencies.database.version.length > 0);
    });

    it('should return consistent response structure', async () => {
      const response1 = await requester.get('/');
      const response2 = await requester.get('/');

      assert.equal(response1.status, HttpStatus.OK);
      assert.equal(response2.status, HttpStatus.OK);

      const body1 = response1.body as ServerStatusDTO;
      const body2 = response2.body as ServerStatusDTO;

      // Verifica se a estrutura é consistente entre as chamadas
      assert.equal(typeof body1.dependencies.database.version, typeof body2.dependencies.database.version);
      assert.equal(typeof body1.dependencies.database.max_connections, typeof body2.dependencies.database.max_connections);
      assert.equal(typeof body1.dependencies.database.opened_connections, typeof body2.dependencies.database.opened_connections);

      // Verifica se alguns valores permanecem os mesmos (como max_connections e version)
      assert.equal(body1.dependencies.database.version, body2.dependencies.database.version);
      assert.equal(body1.dependencies.database.max_connections, body2.dependencies.database.max_connections);
    });
  });

});

describe('AppController (Unit)', () => {
  let controller: AppController;
  let service: AppService;
  let mockDataSource: Partial<DataSource>;

  before(async () => {
    // Mock do DataSource para testes unitários
    mockDataSource = {
      query: async (sql: string): Promise<any> => {
        if (sql.includes('version()')) {
          return [{ version: 'PostgreSQL 14.0 on test' }];
        }
        if (sql.includes('max_connections')) {
          return [{ max_connections: '100' }];
        }
        if (sql.includes('pg_stat_activity')) {
          return [{ count: '5' }];
        }
        return [];
      }
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
    service = module.get<AppService>(AppService);
  });

  describe('getStatus', () => {
    it('should return server status from service', async () => {
      const result = await controller.getStatus();

      assert.ok(result);
      assert.ok(result.updated_at);
      assert.ok(result.dependencies);
      assert.ok(result.dependencies.database);
      assert.equal(result.dependencies.database.version, 'PostgreSQL 14.0 on test');
      assert.equal(result.dependencies.database.max_connections, 100);
      assert.equal(result.dependencies.database.opened_connections, 5);
    });

    it('should return a new timestamp on each call', async () => {
      const result1 = await controller.getStatus();
      
      // Pequeno delay para garantir timestamps diferentes
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const result2 = await controller.getStatus();

      assert.notEqual(result1.updated_at, result2.updated_at);
    });
  });
});

describe('AppService (Unit)', () => {
  let service: AppService;
  let mockDataSource: Partial<DataSource>;

  before(async () => {
    // Mock do DataSource
    mockDataSource = {
      query: async (sql: string): Promise<any> => {
        if (sql.includes('version()')) {
          return [{ version: 'PostgreSQL 16.0 on unit test' }];
        }
        if (sql.includes('max_connections')) {
          return [{ max_connections: '200' }];
        }
        if (sql.includes('pg_stat_activity')) {
          return [{ count: '10' }];
        }
        return [];
      }
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  describe('getStatus', () => {
    it('should return properly formatted server status', async () => {
      const result = await service.getStatus();

      assert.ok(result);
      assert.equal(typeof result.updated_at, 'string');
      assert.equal(result.dependencies.database.version, 'PostgreSQL 16.0 on unit test');
      assert.equal(result.dependencies.database.max_connections, 200);
      assert.equal(result.dependencies.database.opened_connections, 10);

      // Verifica se updated_at é uma data ISO válida
      const date = new Date(result.updated_at);
      assert.ok(!isNaN(date.getTime()));
    });

    it('should convert string database values to numbers', async () => {
      const result = await service.getStatus();

      // Verifica se os valores são numbers após conversão
      assert.equal(typeof result.dependencies.database.max_connections, 'number');
      assert.equal(typeof result.dependencies.database.opened_connections, 'number');
      assert.ok(result.dependencies.database.max_connections > 0);
      assert.ok(result.dependencies.database.opened_connections >= 0);
    });
  });
});