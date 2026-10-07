import { MigrationInterface, QueryRunner } from "typeorm";

export class CodigoCompletacion1791334081935 implements MigrationInterface {
    name = 'CodigoCompletacion1791334081935'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "postulaciones_solicitud" DROP CONSTRAINT "FK_postulacion_solicitud"`);
        await queryRunner.query(`ALTER TABLE "postulaciones_solicitud" DROP CONSTRAINT "FK_postulacion_tecnico"`);
        await queryRunner.query(`ALTER TABLE "solicitudes_categorias" DROP CONSTRAINT "FK_solicitudes_categorias_solicitud"`);
        await queryRunner.query(`ALTER TABLE "solicitudes_categorias" DROP CONSTRAINT "FK_solicitudes_categorias_categoria"`);
        await queryRunner.query(`ALTER TABLE "postulaciones_solicitud" DROP CONSTRAINT "UQ_postulacion_solicitud_tecnico"`);
        await queryRunner.query(`ALTER TABLE "solicitudes_categorias" DROP CONSTRAINT "UQ_solicitud_categoria"`);
        await queryRunner.query(`ALTER TABLE "solicitudes" ADD "codigo_completacion" character varying(4)`);
        await queryRunner.query(`ALTER TABLE "solicitudes" ADD "fecha_expiracion_codigo" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "solicitudes" ADD "codigo_fallido" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "postulaciones_solicitud" ADD CONSTRAINT "uq_postulacion_solicitud_tecnico" UNIQUE ("solicitud_id", "tecnico_id")`);
        await queryRunner.query(`ALTER TABLE "solicitudes_categorias" ADD CONSTRAINT "uq_solicitud_categoria" UNIQUE ("solicitud_id", "categoria_id")`);
        await queryRunner.query(`ALTER TABLE "postulaciones_solicitud" ADD CONSTRAINT "FK_50f7ff1f921c4f805ccf134e367" FOREIGN KEY ("solicitud_id") REFERENCES "solicitudes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "postulaciones_solicitud" ADD CONSTRAINT "FK_610a1c80af021973540ed427cd2" FOREIGN KEY ("tecnico_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "solicitudes_categorias" ADD CONSTRAINT "FK_0cc11d49648004bb03257a74300" FOREIGN KEY ("solicitud_id") REFERENCES "solicitudes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "solicitudes_categorias" ADD CONSTRAINT "FK_f1265ba0e65c2939dfd0595cd0e" FOREIGN KEY ("categoria_id") REFERENCES "categorias_servicio"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "solicitudes_categorias" DROP CONSTRAINT "FK_f1265ba0e65c2939dfd0595cd0e"`);
        await queryRunner.query(`ALTER TABLE "solicitudes_categorias" DROP CONSTRAINT "FK_0cc11d49648004bb03257a74300"`);
        await queryRunner.query(`ALTER TABLE "postulaciones_solicitud" DROP CONSTRAINT "FK_610a1c80af021973540ed427cd2"`);
        await queryRunner.query(`ALTER TABLE "postulaciones_solicitud" DROP CONSTRAINT "FK_50f7ff1f921c4f805ccf134e367"`);
        await queryRunner.query(`ALTER TABLE "solicitudes_categorias" DROP CONSTRAINT "uq_solicitud_categoria"`);
        await queryRunner.query(`ALTER TABLE "postulaciones_solicitud" DROP CONSTRAINT "uq_postulacion_solicitud_tecnico"`);
        await queryRunner.query(`ALTER TABLE "solicitudes" DROP COLUMN "codigo_fallido"`);
        await queryRunner.query(`ALTER TABLE "solicitudes" DROP COLUMN "fecha_expiracion_codigo"`);
        await queryRunner.query(`ALTER TABLE "solicitudes" DROP COLUMN "codigo_completacion"`);
        await queryRunner.query(`ALTER TABLE "solicitudes_categorias" ADD CONSTRAINT "UQ_solicitud_categoria" UNIQUE ("solicitud_id", "categoria_id")`);
        await queryRunner.query(`ALTER TABLE "postulaciones_solicitud" ADD CONSTRAINT "UQ_postulacion_solicitud_tecnico" UNIQUE ("solicitud_id", "tecnico_id")`);
        await queryRunner.query(`ALTER TABLE "solicitudes_categorias" ADD CONSTRAINT "FK_solicitudes_categorias_categoria" FOREIGN KEY ("categoria_id") REFERENCES "categorias_servicio"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "solicitudes_categorias" ADD CONSTRAINT "FK_solicitudes_categorias_solicitud" FOREIGN KEY ("solicitud_id") REFERENCES "solicitudes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "postulaciones_solicitud" ADD CONSTRAINT "FK_postulacion_tecnico" FOREIGN KEY ("tecnico_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "postulaciones_solicitud" ADD CONSTRAINT "FK_postulacion_solicitud" FOREIGN KEY ("solicitud_id") REFERENCES "solicitudes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
