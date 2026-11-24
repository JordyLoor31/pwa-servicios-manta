import { MigrationInterface, QueryRunner } from 'typeorm';

export class TarifasPorVisita1791700000000 implements MigrationInterface {
  name = 'TarifasPorVisita1791700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tarifas_tecnico" DROP CONSTRAINT IF EXISTS "CHK_tarifas_tecnico_rango"`,
    );
    await queryRunner.query(`ALTER TABLE "tarifas_tecnico" RENAME COLUMN "precio_min" TO "precio"`);
    await queryRunner.query(`ALTER TABLE "tarifas_tecnico" DROP COLUMN "precio_max"`);
    await queryRunner.query(
      `ALTER TABLE "tarifas_tecnico" ADD "tipo_servicio" character varying(80) NOT NULL DEFAULT 'Servicio general'`,
    );
    await queryRunner.query(
      `ALTER TABLE "tarifas_tecnico" ADD "negociable" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(`UPDATE "tarifas_tecnico" SET "unidad_cobro" = 'por_visita'`);
    await queryRunner.query(`ALTER TABLE "tarifas_tecnico" DROP CONSTRAINT IF EXISTS "CHK_tarifas_tecnico_unidad"`);
    await queryRunner.query(
      `ALTER TABLE "tarifas_tecnico" ADD CONSTRAINT "CHK_tarifas_tecnico_unidad" CHECK ("unidad_cobro" = 'por_visita')`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."postulaciones_solicitud_unidad_cobro_enum" ADD VALUE IF NOT EXISTS 'por_visita'`,
    );
    await queryRunner.query(
      `ALTER TABLE "postulaciones_solicitud" ADD "tipo_servicio" character varying(80) NOT NULL DEFAULT 'Servicio general'`,
    );
    await queryRunner.query(
      `ALTER TABLE "postulaciones_solicitud" ADD "negociable" boolean NOT NULL DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "postulaciones_solicitud" DROP COLUMN "negociable"`);
    await queryRunner.query(`ALTER TABLE "postulaciones_solicitud" DROP COLUMN "tipo_servicio"`);
    await queryRunner.query(`ALTER TABLE "tarifas_tecnico" DROP CONSTRAINT IF EXISTS "CHK_tarifas_tecnico_unidad"`);
    await queryRunner.query(`ALTER TABLE "tarifas_tecnico" ADD "precio_max" numeric(8,2)`);
    await queryRunner.query(`ALTER TABLE "tarifas_tecnico" RENAME COLUMN "precio" TO "precio_min"`);
    await queryRunner.query(`UPDATE "tarifas_tecnico" SET "precio_max" = "precio_min"`);
    await queryRunner.query(
      `ALTER TABLE "tarifas_tecnico" ADD CONSTRAINT "CHK_tarifas_tecnico_rango" CHECK ("precio_max" >= "precio_min")`,
    );
    await queryRunner.query(
      `ALTER TABLE "tarifas_tecnico" ADD CONSTRAINT "CHK_tarifas_tecnico_unidad" CHECK ("unidad_cobro" IN ('por_hora','por_servicio'))`,
    );
    await queryRunner.query(`ALTER TABLE "tarifas_tecnico" DROP COLUMN "negociable"`);
    await queryRunner.query(`ALTER TABLE "tarifas_tecnico" DROP COLUMN "tipo_servicio"`);
  }
}
