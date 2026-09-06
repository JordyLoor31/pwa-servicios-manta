import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1788659327354 implements MigrationInterface {
    name = 'Migration1788659327354'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "perfiles_tecnico" ("usuario_id" uuid NOT NULL, "biografia" text, "anios_experiencia" smallint, "radio_cobertura_km" numeric(5,2), "verificado" boolean NOT NULL DEFAULT false, "fecha_verificacion" TIMESTAMP WITH TIME ZONE, "calificacion_promedio" numeric(3,2) NOT NULL DEFAULT '0', "total_servicios_completados" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_841a7b1f11132ad23a5e555c627" PRIMARY KEY ("usuario_id"))`);
        await queryRunner.query(`ALTER TABLE "perfiles_tecnico" ADD CONSTRAINT "FK_841a7b1f11132ad23a5e555c627" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "perfiles_tecnico" DROP CONSTRAINT "FK_841a7b1f11132ad23a5e555c627"`);
        await queryRunner.query(`DROP TABLE "perfiles_tecnico"`);
    }

}
