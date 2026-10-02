import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1790969443965 implements MigrationInterface {
    name = 'Migration1790969443965'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "suscripciones_push" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "usuario_id" uuid NOT NULL, "endpoint" text NOT NULL, "p256dh" text NOT NULL, "auth_key" text NOT NULL, "creada_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e023cf4607e1ab0034e55225f7c" UNIQUE ("usuario_id", "endpoint"), CONSTRAINT "PK_937c34a7cb5f1f2a949a22fbc2e" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "suscripciones_push"`);
    }

}
