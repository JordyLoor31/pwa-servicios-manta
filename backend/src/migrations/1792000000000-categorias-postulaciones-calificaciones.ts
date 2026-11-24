import { MigrationInterface, QueryRunner } from 'typeorm';

export class CategoriasPostulacionesCalificaciones1792000000000 implements MigrationInterface {
  name = 'CategoriasPostulacionesCalificaciones1792000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "postulaciones_solicitud" ADD "categoria_id" uuid`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_postulaciones_categoria" ON "postulaciones_solicitud" ("categoria_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "calificaciones_tecnico" ADD "categoria_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "calificaciones_tecnico" ADD "tipo_servicio" character varying(150)`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_calificaciones_categoria" ON "calificaciones_tecnico" ("categoria_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_calificaciones_categoria"`);
    await queryRunner.query(`ALTER TABLE "calificaciones_tecnico" DROP COLUMN "tipo_servicio"`);
    await queryRunner.query(`ALTER TABLE "calificaciones_tecnico" DROP COLUMN "categoria_id"`);
    await queryRunner.query(`DROP INDEX "idx_postulaciones_categoria"`);
    await queryRunner.query(`ALTER TABLE "postulaciones_solicitud" DROP COLUMN "categoria_id"`);
  }
}
