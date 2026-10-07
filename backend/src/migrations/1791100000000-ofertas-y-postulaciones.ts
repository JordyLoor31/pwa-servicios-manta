import { MigrationInterface, QueryRunner } from 'typeorm';

export class OfertasYPostulaciones1791100000000 implements MigrationInterface {
  name = 'OfertasYPostulaciones1791100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."solicitudes_estado_enum" ADD VALUE IF NOT EXISTS 'expirada'`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitudes" ADD "duracion_oferta_minutos" smallint`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitudes" ADD "fecha_expiracion_oferta" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."postulaciones_solicitud_unidad_cobro_enum" AS ENUM('por_hora', 'por_servicio')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."postulaciones_solicitud_estado_enum" AS ENUM('pendiente', 'rechazada', 'aceptada', 'cancelada')`,
    );
    await queryRunner.query(
      `CREATE TABLE "postulaciones_solicitud" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "solicitud_id" uuid NOT NULL, "tecnico_id" uuid NOT NULL, "unidad_cobro" "public"."postulaciones_solicitud_unidad_cobro_enum" NOT NULL, "precio" numeric(10,2) NOT NULL, "mensaje" text, "estado" "public"."postulaciones_solicitud_estado_enum" NOT NULL DEFAULT 'pendiente', "fecha_postulacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_postulaciones_solicitud_id" PRIMARY KEY ("id"), CONSTRAINT "UQ_postulacion_solicitud_tecnico" UNIQUE ("solicitud_id", "tecnico_id"), CONSTRAINT "FK_postulacion_solicitud" FOREIGN KEY ("solicitud_id") REFERENCES "solicitudes"("id") ON DELETE CASCADE, CONSTRAINT "FK_postulacion_tecnico" FOREIGN KEY ("tecnico_id") REFERENCES "usuarios"("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_postulaciones_solicitud" ON "postulaciones_solicitud" ("solicitud_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_postulaciones_tecnico" ON "postulaciones_solicitud" ("tecnico_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "postulaciones_solicitud"`);
    await queryRunner.query(`DROP TYPE "public"."postulaciones_solicitud_estado_enum"`);
    await queryRunner.query(`DROP TYPE "public"."postulaciones_solicitud_unidad_cobro_enum"`);
    await queryRunner.query(`ALTER TABLE "solicitudes" DROP COLUMN "fecha_expiracion_oferta"`);
    await queryRunner.query(`ALTER TABLE "solicitudes" DROP COLUMN "duracion_oferta_minutos"`);
  }
}
