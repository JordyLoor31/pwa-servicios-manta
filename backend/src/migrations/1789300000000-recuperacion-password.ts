import { MigrationInterface, QueryRunner } from 'typeorm';

export class RecuperacionPassword1789300000000 implements MigrationInterface {
  name = 'RecuperacionPassword1789300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "usuarios" ADD "reset_token_hash" character varying(64)`);
    await queryRunner.query(`ALTER TABLE "usuarios" ADD "reset_token_expira" TIMESTAMP WITH TIME ZONE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN "reset_token_expira"`);
    await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN "reset_token_hash"`);
  }
}