import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1788921526025 implements MigrationInterface {
  name = 'Migration1788921526025'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "direcciones" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "usuario_id" uuid NOT NULL, "etiqueta" character varying(50), "direccion_texto" character varying(255) NOT NULL, "referencia" character varying(255), "latitud" numeric(9,6) NOT NULL, "longitud" numeric(9,6) NOT NULL, "ciudad" character varying(80) NOT NULL DEFAULT 'Manta', "es_principal" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_direcciones" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "idx_direcciones_usuario" ON "direcciones" ("usuario_id")`);
    await queryRunner.query(`CREATE INDEX "idx_direcciones_geo" ON "direcciones" ("latitud", "longitud")`);
    await queryRunner.query(`ALTER TABLE "direcciones" ADD CONSTRAINT "FK_direcciones_usuario" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "direcciones"`);
  }
}