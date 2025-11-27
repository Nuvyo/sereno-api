import { HttpException, HttpStatus, Module, Controller, Get } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ExceptionMiddleware } from '../middleware/exception.middleware';
import { setRequestContext } from './request-context';
import { DictionaryService } from '../services/dictionary.service';

class MockDictionaryService {
  isTranslationKey() { return false; }
  isTranslationObject(msg: any) { return msg && typeof msg === 'object' && 'key' in msg; }
  translate(key: string, args?: Record<string, any>) { return `${key}:${args?.language ?? 'en'}`; }
}

@Controller()
class TestController {
  @Get('/test')
  get() {
    throw new HttpException({ key: 'greet', args: {} }, HttpStatus.BAD_REQUEST);
  }
}

@Module({
  controllers: [TestController],
  providers: [
    { provide: DictionaryService, useClass: MockDictionaryService },
  ],
})
class TestModule {}

test('RequestContext isolation translates by per-request language', async (t) => {
  const moduleRef = await Test.createTestingModule({
    imports: [TestModule],
  })
    .overrideProvider(DictionaryService)
    .useClass(MockDictionaryService)
    .compile();

  const app = await moduleRef.createNestApplication();

  app.use((req: any, _res: any, next: any) => {
    const headerLanguage = req.headers['language'] || 'ptbr';
    const language = Array.isArray(headerLanguage) ? headerLanguage[0] : String(headerLanguage);
    
    setRequestContext({ language });
    next();
  });
  
  const dict = moduleRef.get(DictionaryService);
  
  app.useGlobalFilters(new ExceptionMiddleware(dict as any));
  
  await app.init();

  t.after(async () => { await app.close(); });

  const r1 = request(app.getHttpServer())
    .get('/test')
    .set('language', 'ptbr')
    .expect(HttpStatus.BAD_REQUEST);

  const r2 = request(app.getHttpServer())
    .get('/test')
    .set('language', 'en')
    .expect(HttpStatus.BAD_REQUEST);

  const [res1, res2] = await Promise.all([r1, r2]);
  assert.equal(res1.body.message, 'greet:ptbr');
  assert.equal(res2.body.message, 'greet:en');
});
