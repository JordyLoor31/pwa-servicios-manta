import { MigrationInterface, QueryRunner } from 'typeorm';

export class TarifasMultiplesPorCategoria1791800000000 implements MigrationInterface {
  name = 'TarifasMultiplesPorCategoria1791800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tarifas_tecnico" ADD "id" uuid DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(`ALTER TABLE "tarifas_tecnico" ALTER COLUMN "id" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "tarifas_tecnico" DROP CONSTRAINT "PK_tarifas_tecnico"`);
    await queryRunner.query(
      `ALTER TABLE "tarifas_tecnico" ADD CONSTRAINT "PK_tarifas_tecnico_id" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_tarifas_tecnico_tipo" ON "tarifas_tecnico" ("tecnico_id", "categoria_id", "tipo_servicio")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const duplicadas = await queryRunner.query(
      `SELECT 1 FROM "tarifas_tecnico" GROUP BY "tecnico_id", "categoria_id" HAVING COUNT(*) > 1 LIMIT 1`,
    );
    if (duplicadas.length > 0) {
      throw new Error('No se puede revertir: existen varias tarifas en una misma categoría');
    }
    await queryRunner.query(`DROP INDEX "public"."uq_tarifas_tecnico_tipo"`);
    await queryRunner.query(`ALTER TABLE "tarifas_tecnico" DROP CONSTRAINT "PK_tarifas_tecnico_id"`);
    await queryRunner.query(`ALTER TABLE "tarifas_tecnico" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "tarifas_tecnico" ADD CONSTRAINT "PK_tarifas_tecnico" PRIMARY KEY ("tecnico_id", "categoria_id")`,
    );
  }
}
