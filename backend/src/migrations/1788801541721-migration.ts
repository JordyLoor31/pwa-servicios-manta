import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1788801541721 implements MigrationInterface {
    name = 'Migration1788801541721'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "categorias_servicio" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "nombre" character varying(80) NOT NULL, "descripcion" text, "icono" character varying(100), "activa" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_2e0846b10004a7007862ee072" UNIQUE ("nombre"), CONSTRAINT "PK_b5b9f2f4d1fbbe6918e20f96a" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "categorias_servicio"`);
    }

}