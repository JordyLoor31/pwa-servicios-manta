import { MigrationInterface, QueryRunner } from "typeorm";

export class ReservasYHoraFin1791046214471 implements MigrationInterface {
    name = 'ReservasYHoraFin1791046214471'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "reservas_servicio" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tecnico_id" uuid NOT NULL, "solicitud_id" uuid NOT NULL, "fecha_servicio" date NOT NULL, "hora_inicio" TIME NOT NULL, "hora_fin" TIME NOT NULL, "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_1e7d1a7b421a26c91d857a63cf9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_reservas_tecnico_fecha" ON "reservas_servicio" ("tecnico_id", "fecha_servicio")`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_88a6160ca2703102cb04361307" ON "reservas_servicio" ("solicitud_id")`);
        await queryRunner.query(`ALTER TABLE "solicitudes" ADD "hora_fin_estimada" TIME`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "solicitudes" DROP COLUMN "hora_fin_estimada"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_88a6160ca2703102cb04361307"`);
        await queryRunner.query(`DROP INDEX "public"."idx_reservas_tecnico_fecha"`);
        await queryRunner.query(`DROP TABLE "reservas_servicio"`);
    }

}
