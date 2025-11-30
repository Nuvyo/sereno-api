import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1764463288048 implements MigrationInterface {
    
  name = 'Migration1764463288048';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE TABLE "sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now(), "token" character varying(96) NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "maxAge" integer NOT NULL, "userId" uuid, CONSTRAINT "UQ_e9f62f5dcb8a54b84234c9e7a06" UNIQUE ("token"), CONSTRAINT "PK_3238ef96f18b355b671619111bc" PRIMARY KEY ("id"))');
    await queryRunner.query('CREATE INDEX "IDX_e9f62f5dcb8a54b84234c9e7a0" ON "sessions" ("token") ');
    await queryRunner.query('CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now(), "name" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "password" character varying(60) NOT NULL, "photo" character varying(255), "psychologist" boolean NOT NULL DEFAULT false, "public" boolean, "crp" character varying(255), "validCRP" boolean, "specializations" text, "whatsapp" character varying(20), "sessionCost" numeric(7,2), "bio" text, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))');
    await queryRunner.query('ALTER TABLE "sessions" ADD CONSTRAINT "FK_57de40bc620f456c7311aa3a1e6" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "sessions" DROP CONSTRAINT "FK_57de40bc620f456c7311aa3a1e6"');
    await queryRunner.query('DROP TABLE "users"');
    await queryRunner.query('DROP INDEX "public"."IDX_e9f62f5dcb8a54b84234c9e7a0"');
    await queryRunner.query('DROP TABLE "sessions"');
  }

}
