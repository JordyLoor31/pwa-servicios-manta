import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1788660349284 implements MigrationInterface {
    name = 'Migration1788660349284'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "categorias" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nombre" character varying(100) NOT NULL, "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_ccdf6cd1a34ea90a7233325063d" UNIQUE ("nombre"), CONSTRAINT "PK_3886a26251605c571c6b4f861fe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "disponibilidad_tecnico" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tecnico_id" uuid NOT NULL, "dia_semana" smallint NOT NULL, "hora_inicio" TIME NOT NULL, "hora_fin" TIME NOT NULL, "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_c3dc35d75518a78fa02d77e82f" CHECK ("dia_semana" BETWEEN 0 AND 6), CONSTRAINT "PK_0ae8be3474657ed2db88c9fcab9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."certificaciones_tecnico_estado_enum" AS ENUM('pendiente', 'aprobada', 'rechazada')`);
        await queryRunner.query(`CREATE TABLE "certificaciones_tecnico" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tecnico_id" uuid NOT NULL, "tipo_documento" character varying(100) NOT NULL, "url_documento" character varying(255) NOT NULL, "estado" "public"."certificaciones_tecnico_estado_enum" NOT NULL DEFAULT 'pendiente', "fecha_revision" TIMESTAMP WITH TIME ZONE, "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_b2f75bc139b34dfbd9d886344fd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "tecnico_categorias" ("tecnico_id" uuid NOT NULL, "categoria_id" uuid NOT NULL, CONSTRAINT "PK_015ae93f73b5a5cd86277639589" PRIMARY KEY ("tecnico_id", "categoria_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3688d09ebf9e9d9b384e9d6146" ON "tecnico_categorias"  ("tecnico_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_44f28f3b362b9624a573501aa9" ON "tecnico_categorias"  ("categoria_id") `);
        await queryRunner.query(`ALTER TABLE "disponibilidad_tecnico" ADD CONSTRAINT "FK_53da887a3e59b087737e249fd0c" FOREIGN KEY ("tecnico_id") REFERENCES "perfiles_tecnico"("usuario_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "certificaciones_tecnico" ADD CONSTRAINT "FK_3976bfa4e10a22643cdc5b8e76f" FOREIGN KEY ("tecnico_id") REFERENCES "perfiles_tecnico"("usuario_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tecnico_categorias" ADD CONSTRAINT "FK_3688d09ebf9e9d9b384e9d61469" FOREIGN KEY ("tecnico_id") REFERENCES "perfiles_tecnico"("usuario_id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "tecnico_categorias" ADD CONSTRAINT "FK_44f28f3b362b9624a573501aa9b" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tecnico_categorias" DROP CONSTRAINT "FK_44f28f3b362b9624a573501aa9b"`);
        await queryRunner.query(`ALTER TABLE "tecnico_categorias" DROP CONSTRAINT "FK_3688d09ebf9e9d9b384e9d61469"`);
        await queryRunner.query(`ALTER TABLE "certificaciones_tecnico" DROP CONSTRAINT "FK_3976bfa4e10a22643cdc5b8e76f"`);
        await queryRunner.query(`ALTER TABLE "disponibilidad_tecnico" DROP CONSTRAINT "FK_53da887a3e59b087737e249fd0c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_44f28f3b362b9624a573501aa9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3688d09ebf9e9d9b384e9d6146"`);
        await queryRunner.query(`DROP TABLE "tecnico_categorias"`);
        await queryRunner.query(`DROP TABLE "certificaciones_tecnico"`);
        await queryRunner.query(`DROP TYPE "public"."certificaciones_tecnico_estado_enum"`);
        await queryRunner.query(`DROP TABLE "disponibilidad_tecnico"`);
        await queryRunner.query(`DROP TABLE "categorias"`);
    }

}
