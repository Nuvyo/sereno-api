import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1762977760674 implements MigrationInterface {

  name = 'Migration1762977760674';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP DEFAULT now(), "token" character varying(255) NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "userId" uuid, CONSTRAINT "REL_610102b60fea1455310ccd299d" UNIQUE ("userId"), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))',
    );
    await queryRunner.query(
      'CREATE TABLE "access_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP DEFAULT now(), "token" character varying(255) NOT NULL, "userId" uuid, CONSTRAINT "PK_65140f59763ff994a0252488166" PRIMARY KEY ("id"))',
    );
    await queryRunner.query(
      'CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP DEFAULT now(), "name" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "password" character varying(60) NOT NULL, "photo" character varying(255), "psychologist" boolean NOT NULL DEFAULT false, "public" boolean, "crp" character varying(255), "validCRP" boolean, "specializations" text, "whatsapp" character varying(20), "sessionCost" numeric(7,2), "bio" text, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))',
    );
    await queryRunner.query(
      'CREATE TABLE "chat_messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP DEFAULT now(), "message" text NOT NULL, "fromUserId" uuid, "toUserId" uuid, CONSTRAINT "PK_40c55ee0e571e268b0d3cd37d10" PRIMARY KEY ("id"))',
    );
    await queryRunner.query(
      'ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_610102b60fea1455310ccd299de" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
    );
    await queryRunner.query(
      'ALTER TABLE "access_tokens" ADD CONSTRAINT "FK_343a101d109c86071f2b2fb43e7" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
    );
    await queryRunner.query(
      'ALTER TABLE "chat_messages" ADD CONSTRAINT "FK_9ee145fd616227448de53646872" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
    );
    await queryRunner.query(
      'ALTER TABLE "chat_messages" ADD CONSTRAINT "FK_fbfdf0b8ee76855843441cc7551" FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "chat_messages" DROP CONSTRAINT "FK_fbfdf0b8ee76855843441cc7551"');
    await queryRunner.query('ALTER TABLE "chat_messages" DROP CONSTRAINT "FK_9ee145fd616227448de53646872"');
    await queryRunner.query('ALTER TABLE "access_tokens" DROP CONSTRAINT "FK_343a101d109c86071f2b2fb43e7"');
    await queryRunner.query('ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_610102b60fea1455310ccd299de"');
    await queryRunner.query('DROP TABLE "chat_messages"');
    await queryRunner.query('DROP TABLE "users"');
    await queryRunner.query('DROP TABLE "access_tokens"');
    await queryRunner.query('DROP TABLE "refresh_tokens"');
  }

}
