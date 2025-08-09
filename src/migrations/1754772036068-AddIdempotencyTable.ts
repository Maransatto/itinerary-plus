import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIdempotencyTable1754772036068 implements MigrationInterface {
    name = 'AddIdempotencyTable1754772036068'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "idempotency_keys" ("key" character varying(255) NOT NULL, "itineraryId" uuid NOT NULL, "contentHash" character varying(64), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0afd83cbf08c9d12089a9bffc5e" PRIMARY KEY ("key"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0afd83cbf08c9d12089a9bffc5" ON "idempotency_keys" ("key") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_0afd83cbf08c9d12089a9bffc5"`);
        await queryRunner.query(`DROP TABLE "idempotency_keys"`);
    }

}
