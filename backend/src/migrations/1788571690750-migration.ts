import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1788571690750 implements MigrationInterface {
    name = 'Migration1788571690750'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."usuarios_rol_enum" AS ENUM('cliente', 'tecnico', 'admin')`);
        await queryRunner.query(`CREATE TYPE "public"."usuarios_estado_enum" AS ENUM('activo', 'inactivo', 'suspendido')`);
        await queryRunner.query(`CREATE TABLE "usuarios" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nombres" character varying(100) NOT NULL, "apellidos" character varying(100) NOT NULL, "email" character varying(150) NOT NULL, "password_hash" character varying(255) NOT NULL, "telefono" character varying(20), "rol" "public"."usuarios_rol_enum" NOT NULL, "avatar_url" character varying(255), "estado" "public"."usuarios_estado_enum" NOT NULL DEFAULT 'activo', "fecha_registro" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_446adfc18b35418aac32ae0b7b5" UNIQUE ("email"), CONSTRAINT "PK_d7281c63c176e152e4c531594a8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_usuarios_rol" ON "usuarios"  ("rol") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_usuarios_rol"`);
        await queryRunner.query(`DROP TABLE "usuarios"`);
        await queryRunner.query(`DROP TYPE "public"."usuarios_estado_enum"`);
        await queryRunner.query(`DROP TYPE "public"."usuarios_rol_enum"`);
    }

}
