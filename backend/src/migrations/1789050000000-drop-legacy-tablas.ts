import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropLegacyTablas1789050000000 implements MigrationInterface {
  name = 'DropLegacyTablas1789050000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "tecnico_categorias"`);
    await queryRunner.query(`DROP TABLE "categorias"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "categorias" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nombre" character varying(100) NOT NULL, "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_ccdf6cd1a34ea90a7233325063d" UNIQUE ("nombre"), CONSTRAINT "PK_3886a26251605c571c6b4f861fe" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "tecnico_categorias" ("tecnico_id" uuid NOT NULL, "categoria_id" uuid NOT NULL, CONSTRAINT "PK_015ae93f73b5a5cd86277639589" PRIMARY KEY ("tecnico_id", "categoria_id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_3688d09ebf9e9d9b384e9d6146" ON "tecnico_categorias"  ("tecnico_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_44f28f3b362b9624a573501aa9" ON "tecnico_categorias"  ("categoria_id")`);
    await queryRunner.query(`ALTER TABLE "tecnico_categorias" ADD CONSTRAINT "FK_3688d09ebf9e9d9b384e9d61469" FOREIGN KEY ("tecnico_id") REFERENCES "perfiles_tecnico"("usuario_id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await queryRunner.query(`ALTER TABLE "tecnico_categorias" ADD CONSTRAINT "FK_44f28f3b362b9624a573501aa9b" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
  }
}