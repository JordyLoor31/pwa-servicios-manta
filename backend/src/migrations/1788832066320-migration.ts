import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1788832066320 implements MigrationInterface {
    name = 'Migration1788832066320'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tecnico_categoria" ("tecnico_id" uuid NOT NULL, "categoria_id" uuid NOT NULL, CONSTRAINT "PK_tecnico_categoria" PRIMARY KEY ("tecnico_id", "categoria_id"), CONSTRAINT "FK_tecnico_categoria_tecnico" FOREIGN KEY ("tecnico_id") REFERENCES "perfiles_tecnico"("usuario_id") ON DELETE CASCADE, CONSTRAINT "FK_tecnico_categoria_categoria" FOREIGN KEY ("categoria_id") REFERENCES "categorias_servicio"("id") ON DELETE CASCADE)`);
        await queryRunner.query(`CREATE INDEX "idx_tecnico_categoria_categoria" ON "tecnico_categoria" ("categoria_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "tecnico_categoria"`);
    }

}