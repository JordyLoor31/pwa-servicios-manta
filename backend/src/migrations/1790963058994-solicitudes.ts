import { MigrationInterface, QueryRunner } from "typeorm";

export class Solicitudes1790963058994 implements MigrationInterface {
    name = 'Solicitudes1790963058994'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tecnico_categoria" DROP CONSTRAINT "FK_tecnico_categoria_tecnico"`);
        await queryRunner.query(`ALTER TABLE "tecnico_categoria" DROP CONSTRAINT "FK_tecnico_categoria_categoria"`);
        await queryRunner.query(`ALTER TABLE "tarifas_tecnico" DROP CONSTRAINT "FK_tarifas_tecnico_tecnico"`);
        await queryRunner.query(`ALTER TABLE "tarifas_tecnico" DROP CONSTRAINT "FK_tarifas_tecnico_categoria"`);
        await queryRunner.query(`ALTER TABLE "direcciones" DROP CONSTRAINT "FK_direcciones_usuario"`);
        await queryRunner.query(`DROP INDEX "public"."idx_tecnico_categoria_categoria"`);
        await queryRunner.query(`DROP INDEX "public"."idx_direcciones_geo"`);
        await queryRunner.query(`ALTER TABLE "tarifas_tecnico" DROP CONSTRAINT "CHK_tarifas_tecnico_unidad"`);
        await queryRunner.query(`CREATE TYPE "public"."solicitudes_estado_enum" AS ENUM('pendiente', 'aceptada', 'rechazada', 'cancelada', 'completada')`);
        await queryRunner.query(`CREATE TABLE "solicitudes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "cliente_id" uuid NOT NULL, "tecnico_id" uuid NOT NULL, "descripcion" text NOT NULL, "direccion" text, "estado" "public"."solicitudes_estado_enum" NOT NULL DEFAULT 'pendiente', "motivo_rechazo" text, "fecha_aceptacion" TIMESTAMP WITH TIME ZONE, "fecha_completada" TIMESTAMP WITH TIME ZONE, "fecha_solicitud" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_8c7e99758c774b801853b538647" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_solicitudes_cliente" ON "solicitudes"  ("cliente_id") `);
        await queryRunner.query(`CREATE INDEX "idx_solicitudes_tecnico" ON "solicitudes"  ("tecnico_id") `);
        await queryRunner.query(`CREATE INDEX "idx_direcciones_geo" ON "direcciones"  ("latitud", "longitud") `);
        await queryRunner.query(`CREATE INDEX "idx_tecnico_categoria_categoria" ON "tecnico_categoria"  ("categoria_id") `);
        await queryRunner.query(`ALTER TABLE "tarifas_tecnico" ADD CONSTRAINT "FK_372a79573015d3a7dc3639ea05c" FOREIGN KEY ("tecnico_id") REFERENCES "perfiles_tecnico"("usuario_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tarifas_tecnico" ADD CONSTRAINT "FK_93060197db8046fabc0fbefd5c8" FOREIGN KEY ("categoria_id") REFERENCES "categorias_servicio"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "direcciones" ADD CONSTRAINT "FK_1a0f2a34355a3ac2879a9756746" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "solicitudes" ADD CONSTRAINT "FK_25ce61e19829efada40e96dfa64" FOREIGN KEY ("cliente_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "solicitudes" ADD CONSTRAINT "FK_785c6fff247a873ff77a6ba6714" FOREIGN KEY ("tecnico_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "solicitudes" DROP CONSTRAINT "FK_785c6fff247a873ff77a6ba6714"`);
        await queryRunner.query(`ALTER TABLE "solicitudes" DROP CONSTRAINT "FK_25ce61e19829efada40e96dfa64"`);
        await queryRunner.query(`ALTER TABLE "direcciones" DROP CONSTRAINT "FK_1a0f2a34355a3ac2879a9756746"`);
        await queryRunner.query(`ALTER TABLE "tarifas_tecnico" DROP CONSTRAINT "FK_93060197db8046fabc0fbefd5c8"`);
        await queryRunner.query(`ALTER TABLE "tarifas_tecnico" DROP CONSTRAINT "FK_372a79573015d3a7dc3639ea05c"`);
        await queryRunner.query(`DROP INDEX "public"."idx_solicitudes_tecnico"`);
        await queryRunner.query(`DROP INDEX "public"."idx_solicitudes_cliente"`);
        await queryRunner.query(`DROP TABLE "solicitudes"`);
        await queryRunner.query(`DROP TYPE "public"."solicitudes_estado_enum"`);
        await queryRunner.query(`ALTER TABLE "tarifas_tecnico" ADD CONSTRAINT "CHK_tarifas_tecnico_unidad" CHECK (((unidad_cobro)::text = ANY ((ARRAY['por_hora'::character varying, 'por_servicio'::character varying])::text[])))`);
        await queryRunner.query(`CREATE INDEX "idx_direcciones_geo" ON "direcciones" USING btree ("latitud", "longitud") `);
        await queryRunner.query(`CREATE INDEX "idx_tecnico_categoria_categoria" ON "tecnico_categoria" USING btree ("categoria_id") `);
        await queryRunner.query(`ALTER TABLE "direcciones" ADD CONSTRAINT "FK_direcciones_usuario" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tarifas_tecnico" ADD CONSTRAINT "FK_tarifas_tecnico_categoria" FOREIGN KEY ("categoria_id") REFERENCES "categorias_servicio"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tarifas_tecnico" ADD CONSTRAINT "FK_tarifas_tecnico_tecnico" FOREIGN KEY ("tecnico_id") REFERENCES "perfiles_tecnico"("usuario_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tecnico_categoria" ADD CONSTRAINT "FK_tecnico_categoria_categoria" FOREIGN KEY ("categoria_id") REFERENCES "categorias_servicio"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tecnico_categoria" ADD CONSTRAINT "FK_tecnico_categoria_tecnico" FOREIGN KEY ("tecnico_id") REFERENCES "perfiles_tecnico"("usuario_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
