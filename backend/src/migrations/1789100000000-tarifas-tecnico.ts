import { MigrationInterface, QueryRunner } from 'typeorm';

export class TarifasTecnico1789100000000 implements MigrationInterface {
  name = 'TarifasTecnico1789100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "tarifas_tecnico" ("tecnico_id" uuid NOT NULL, "categoria_id" uuid NOT NULL, "precio_min" numeric(8,2) NOT NULL, "precio_max" numeric(8,2) NOT NULL, CONSTRAINT "CHK_tarifas_tecnico_rango" CHECK ("precio_max" >= "precio_min"), CONSTRAINT "PK_tarifas_tecnico" PRIMARY KEY ("tecnico_id", "categoria_id"), CONSTRAINT "FK_tarifas_tecnico_tecnico" FOREIGN KEY ("tecnico_id") REFERENCES "perfiles_tecnico"("usuario_id") ON DELETE CASCADE, CONSTRAINT "FK_tarifas_tecnico_categoria" FOREIGN KEY ("categoria_id") REFERENCES "categorias_servicio"("id") ON DELETE CASCADE)`);
    await queryRunner.query(`UPDATE "categorias_servicio" SET "icono" = 'pi-sliders-h' WHERE "nombre" = 'Gasfitería'`);
    await queryRunner.query(`UPDATE "categorias_servicio" SET "icono" = 'pi-palette' WHERE "nombre" = 'Pintura'`);
    await queryRunner.query(`DROP TABLE "tarifas_categoria"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "tarifas_categoria" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "categoria_id" uuid NOT NULL, "precio_base" numeric(8,2) NOT NULL, "unidad_cobro" character varying(20) NOT NULL DEFAULT 'por_servicio', "fecha_actualizacion" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "UQ_tarifas_categoria_categoria" UNIQUE ("categoria_id"), CONSTRAINT "PK_tarifas_categoria" PRIMARY KEY ("id"), CONSTRAINT "FK_tarifas_categoria_categoria" FOREIGN KEY ("categoria_id") REFERENCES "categorias_servicio"("id") ON DELETE CASCADE)`);
    await queryRunner.query(`UPDATE "categorias_servicio" SET "icono" = 'pi-paint-bucket' WHERE "nombre" = 'Pintura'`);
    await queryRunner.query(`UPDATE "categorias_servicio" SET "icono" = 'pi-shower' WHERE "nombre" = 'Gasfitería'`);
    await queryRunner.query(`DROP TABLE "tarifas_tecnico"`);
  }
}