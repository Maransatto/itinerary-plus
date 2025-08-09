import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUniqueNameConstraint1754767528102 implements MigrationInterface {
    name = 'AddUniqueNameConstraint1754767528102'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_518be6d96b83fb1423a6cdea89"`);
        await queryRunner.query(`ALTER TABLE "places" ADD CONSTRAINT "UQ_d93026712ed97941ccec28f8137" UNIQUE ("name")`);
        await queryRunner.query(`ALTER TABLE "tickets" DROP COLUMN "line"`);
        await queryRunner.query(`ALTER TABLE "tickets" ADD "line" character varying(20)`);
        await queryRunner.query(`CREATE INDEX "IDX_518be6d96b83fb1423a6cdea89" ON "places" ("name", "code") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_518be6d96b83fb1423a6cdea89"`);
        await queryRunner.query(`ALTER TABLE "tickets" DROP COLUMN "line"`);
        await queryRunner.query(`ALTER TABLE "tickets" ADD "line" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "places" DROP CONSTRAINT "UQ_d93026712ed97941ccec28f8137"`);
        await queryRunner.query(`CREATE INDEX "IDX_518be6d96b83fb1423a6cdea89" ON "places" ("name", "code") `);
    }

}
