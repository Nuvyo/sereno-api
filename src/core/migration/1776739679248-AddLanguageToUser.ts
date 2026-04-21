import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1776739679248 implements MigrationInterface {

  name = 'Migration1776739679248';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "users" ADD "language" character varying(10) NOT NULL DEFAULT \'ptbr\'');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN "language"');
  }

}
