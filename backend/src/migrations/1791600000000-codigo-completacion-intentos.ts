import { MigrationInterface, QueryRunner } from 'typeorm';

export class CodigoCompletacionIntentos1791600000000 implements MigrationInterface {
  name = 'CodigoCompletacionIntentos1791600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "solicitudes"
      ADD COLUMN "codigo_intentos" smallint NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "solicitudes"
      DROP COLUMN "codigo_intentos"
    `);
  }
}
