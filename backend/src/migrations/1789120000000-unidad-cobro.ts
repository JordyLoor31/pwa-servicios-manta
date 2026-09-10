import { MigrationInterface, QueryRunner } from 'typeorm';

export class UnidadCobro1789120000000 implements MigrationInterface {
  name = 'UnidadCobro1789120000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tarifas_tecnico" ADD "unidad_cobro" character varying(20) NOT NULL DEFAULT 'por_servicio'`,
    );
    await queryRunner.query(
      `ALTER TABLE "tarifas_tecnico" ADD CONSTRAINT "CHK_tarifas_tecnico_unidad" CHECK ("unidad_cobro" IN ('por_hora','por_servicio'))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tarifas_tecnico" DROP CONSTRAINT "CHK_tarifas_tecnico_unidad"`);
    await queryRunner.query(`ALTER TABLE "tarifas_tecnico" DROP COLUMN "unidad_cobro"`);
  }
}