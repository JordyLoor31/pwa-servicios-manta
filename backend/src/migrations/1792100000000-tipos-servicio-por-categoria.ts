import { MigrationInterface, QueryRunner } from 'typeorm';

export class TiposServicioPorCategoria1792100000000 implements MigrationInterface {
  name = 'TiposServicioPorCategoria1792100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "solicitudes" ADD "tipos_servicio_por_categoria" jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "solicitudes" DROP COLUMN "tipos_servicio_por_categoria"`,
    );
  }
}
