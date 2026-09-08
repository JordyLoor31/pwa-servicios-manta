import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1788831161944 implements MigrationInterface {
    name = 'Migration1788831161944'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tarifas_categoria" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "categoria_id" uuid NOT NULL, "precio_base" numeric(8,2) NOT NULL, "unidad_cobro" character varying(20) NOT NULL DEFAULT 'por_servicio', "fecha_actualizacion" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "UQ_tarifas_categoria_categoria" UNIQUE ("categoria_id"), CONSTRAINT "PK_tarifas_categoria" PRIMARY KEY ("id"), CONSTRAINT "FK_tarifas_categoria_categoria" FOREIGN KEY ("categoria_id") REFERENCES "categorias_servicio"("id") ON DELETE CASCADE)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "tarifas_categoria"`);
    }

}