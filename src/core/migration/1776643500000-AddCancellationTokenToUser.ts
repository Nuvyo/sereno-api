import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1776643500000 implements MigrationInterface {

  name = 'Migration1776643500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "users" ADD "cancellationToken" character varying(100)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN "cancellationToken"');
  }

}
