import { MigrationInterface, QueryRunner } from "typeorm";

export class SolicitudesTecnicoOpcional1791049000000 implements MigrationInterface {
  name = 'SolicitudesTecnicoOpcional1791049000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "solicitudes" ALTER COLUMN "tecnico_id" DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "solicitudes" ALTER COLUMN "tecnico_id" SET NOT NULL`);
  }
}
