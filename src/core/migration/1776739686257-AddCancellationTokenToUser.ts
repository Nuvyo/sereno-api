import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1776739686257 implements MigrationInterface {

  name = 'Migration1776739686257';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "users" ADD "cancellationToken" character varying(100)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN "cancellationToken"');
  }

}
