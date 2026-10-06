import { MigrationInterface, QueryRunner } from "typeorm";

export class SolicitudDireccionCoordenadas1791049500000 implements MigrationInterface {
  name = 'SolicitudDireccionCoordenadas1791049500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "solicitudes" ADD "direccion_latitud" numeric(9,6)`);
    await queryRunner.query(`ALTER TABLE "solicitudes" ADD "direccion_longitud" numeric(9,6)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "solicitudes" DROP COLUMN "direccion_longitud"`);
    await queryRunner.query(`ALTER TABLE "solicitudes" DROP COLUMN "direccion_latitud"`);
  }
}
