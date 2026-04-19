import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1776643200000 implements MigrationInterface {

  name = 'Migration1776643200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "users" ADD "emailVerified" boolean NOT NULL DEFAULT false');
    await queryRunner.query('ALTER TABLE "users" ADD "emailVerificationToken" character varying(100)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN "emailVerificationToken"');
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN "emailVerified"');
  }

}
