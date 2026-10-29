import { MigrationInterface, QueryRunner } from 'typeorm';

export class RepararPerfilesTecnico1791400000000 implements MigrationInterface {
  name = 'RepararPerfilesTecnico1791400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "perfiles_tecnico" (
        "usuario_id",
        "verificado",
        "calificacion_promedio",
        "total_servicios_completados"
      )
      SELECT
        "u"."id",
        false,
        0,
        0
      FROM "usuarios" "u"
      WHERE "u"."rol" = 'tecnico'
        AND NOT EXISTS (
          SELECT 1
          FROM "perfiles_tecnico" "p"
          WHERE "p"."usuario_id" = "u"."id"
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    void queryRunner;
    throw new Error(
      'La migración de reparación de perfiles técnicos no se puede revertir sin riesgo de borrar datos válidos.',
    );
  }
}
