import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1776643400000 implements MigrationInterface {

  name = 'Migration1776643400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE TABLE "email_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid, "to" character varying(255) NOT NULL, "subject" character varying(255) NOT NULL, "template" character varying(100) NOT NULL, "status" character varying(10) NOT NULL, "error" text, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_email_logs" PRIMARY KEY ("id"))');
    await queryRunner.query('CREATE INDEX "IDX_email_logs_userId" ON "email_logs" ("userId")');
    await queryRunner.query('CREATE INDEX "IDX_email_logs_createdAt" ON "email_logs" ("createdAt")');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "public"."IDX_email_logs_createdAt"');
    await queryRunner.query('DROP INDEX "public"."IDX_email_logs_userId"');
    await queryRunner.query('DROP TABLE "email_logs"');
  }

}
