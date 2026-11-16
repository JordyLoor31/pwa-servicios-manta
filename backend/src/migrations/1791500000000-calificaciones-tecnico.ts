import { MigrationInterface, QueryRunner } from 'typeorm';

export class CalificacionesTecnico1791500000000 implements MigrationInterface {
  name = 'CalificacionesTecnico1791500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "calificaciones_tecnico" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "solicitud_id" uuid NOT NULL,
        "cliente_id" uuid NOT NULL,
        "tecnico_id" uuid NOT NULL,
        "calificacion" smallint NOT NULL,
        "comentario" text,
        "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_calificaciones_tecnico_id" PRIMARY KEY ("id"),
        CONSTRAINT "uq_calificacion_solicitud" UNIQUE ("solicitud_id"),
        CONSTRAINT "CHK_calificaciones_tecnico_rango" CHECK ("calificacion" BETWEEN 1 AND 5),
        CONSTRAINT "CHK_calificaciones_tecnico_comentario" CHECK (
          "comentario" IS NULL OR char_length("comentario") <= 1000
        ),
        CONSTRAINT "FK_calificaciones_tecnico_solicitud"
          FOREIGN KEY ("solicitud_id") REFERENCES "solicitudes"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_calificaciones_tecnico_cliente"
          FOREIGN KEY ("cliente_id") REFERENCES "usuarios"("id"),
        CONSTRAINT "FK_calificaciones_tecnico_tecnico"
          FOREIGN KEY ("tecnico_id") REFERENCES "usuarios"("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_calificaciones_tecnico" ON "calificaciones_tecnico" ("tecnico_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_calificaciones_cliente" ON "calificaciones_tecnico" ("cliente_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "calificaciones_tecnico"`);
  }
}
