import { MigrationInterface, QueryRunner } from 'typeorm';

export class SolicitudesCategorias1791110000000 implements MigrationInterface {
  name = 'SolicitudesCategorias1791110000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "solicitudes_categorias" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "solicitud_id" uuid NOT NULL, "categoria_id" uuid NOT NULL, CONSTRAINT "PK_solicitudes_categorias_id" PRIMARY KEY ("id"), CONSTRAINT "UQ_solicitud_categoria" UNIQUE ("solicitud_id", "categoria_id"), CONSTRAINT "FK_solicitudes_categorias_solicitud" FOREIGN KEY ("solicitud_id") REFERENCES "solicitudes"("id") ON DELETE CASCADE, CONSTRAINT "FK_solicitudes_categorias_categoria" FOREIGN KEY ("categoria_id") REFERENCES "categorias_servicio"("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_solicitudes_categorias_solicitud" ON "solicitudes_categorias" ("solicitud_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_solicitudes_categorias_categoria" ON "solicitudes_categorias" ("categoria_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "solicitudes_categorias"`);
  }
}
