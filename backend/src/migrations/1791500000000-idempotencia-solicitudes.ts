import { MigrationInterface, QueryRunner } from 'typeorm';

export class IdempotenciaSolicitudes1791500000000 implements MigrationInterface {
  name = 'IdempotenciaSolicitudes1791500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "solicitudes" ADD "idempotency_key" character varying(100)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_solicitudes_cliente_idempotencia" ON "solicitudes" ("cliente_id", "idempotency_key")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."uq_solicitudes_cliente_idempotencia"`,
    );
    await queryRunner.query(`ALTER TABLE "solicitudes" DROP COLUMN "idempotency_key"`);
  }
}
