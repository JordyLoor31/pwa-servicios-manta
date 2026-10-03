import { MigrationInterface, QueryRunner } from "typeorm";

export class SolicitudFechasPropuesta1791001850404 implements MigrationInterface {
    name = 'SolicitudFechasPropuesta1791001850404'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "solicitudes" ADD "fecha_propuesta" date`);
        await queryRunner.query(`ALTER TABLE "solicitudes" ADD "hora_propuesta" TIME`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "solicitudes" DROP COLUMN "hora_propuesta"`);
        await queryRunner.query(`ALTER TABLE "solicitudes" DROP COLUMN "fecha_propuesta"`);
    }

}
