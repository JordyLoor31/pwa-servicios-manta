import { MigrationInterface, QueryRunner } from 'typeorm';

export class SolicitudesTiposServicio1791900000000 implements MigrationInterface {
  name = 'SolicitudesTiposServicio1791900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "solicitudes" ADD "tipos_servicio" text[]`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitudes" ADD "oferta_hasta_fin_dia" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "solicitudes" DROP COLUMN "oferta_hasta_fin_dia"`);
    await queryRunner.query(`ALTER TABLE "solicitudes" DROP COLUMN "tipos_servicio"`);
  }
}
