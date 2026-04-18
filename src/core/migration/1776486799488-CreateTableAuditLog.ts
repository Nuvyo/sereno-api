import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1776486799488 implements MigrationInterface {

  name = 'Migration1776486799488';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid, "action" character varying(50) NOT NULL, "ip" character varying(45), "userAgent" character varying(512), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id"))');
    await queryRunner.query('CREATE INDEX "IDX_audit_logs_userId" ON "audit_logs" ("userId")');
    await queryRunner.query('CREATE INDEX "IDX_audit_logs_action" ON "audit_logs" ("action")');
    await queryRunner.query('CREATE INDEX "IDX_audit_logs_createdAt" ON "audit_logs" ("createdAt")');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "public"."IDX_audit_logs_createdAt"');
    await queryRunner.query('DROP INDEX "public"."IDX_audit_logs_action"');
    await queryRunner.query('DROP INDEX "public"."IDX_audit_logs_userId"');
    await queryRunner.query('DROP TABLE "audit_logs"');
  }

}
