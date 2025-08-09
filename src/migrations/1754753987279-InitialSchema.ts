import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1754753987279 implements MigrationInterface {
  name = 'InitialSchema1754753987279';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "places" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "code" character varying(10), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1afab86e226b4c3bc9a74465c12" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_518be6d96b83fb1423a6cdea89" ON "places" ("name", "code") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tickets_baggage_enum" AS ENUM('auto-transfer', 'self-check-in', 'counter')`,
    );
    await queryRunner.query(
      `CREATE TABLE "tickets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" character varying(20) NOT NULL, "seat" character varying(50), "notes" text, "meta" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "line" character varying(50), "number" character varying(20), "platform" character varying(10), "airline" character varying(100), "flightNumber" character varying(20), "gate" character varying(10), "baggage" "public"."tickets_baggage_enum", "route" character varying(100), "operator" character varying(100), "company" character varying(100), "driver" character varying(100), "vehicleId" character varying(50), "vessel" character varying(100), "dock" character varying(50), "from_place_id" uuid, "to_place_id" uuid, CONSTRAINT "PK_343bc942ae261cf7a1377f48fd0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_04a189bf6adc1183a92ddaf925" ON "tickets" ("type") `,
    );
    await queryRunner.query(
      `CREATE TABLE "itinerary_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "index" integer NOT NULL, "itineraryId" uuid, "ticket_id" uuid, CONSTRAINT "PK_f37a39ff959ce329ccbb0d98e24" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "itineraries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "stepsHuman" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "start_place_id" uuid, "end_place_id" uuid, CONSTRAINT "PK_9c5db87d0f85f56e4466ae09a38" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" ADD CONSTRAINT "FK_91336f6228e409a230f82578458" FOREIGN KEY ("from_place_id") REFERENCES "places"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" ADD CONSTRAINT "FK_fb5310e601766fbeb4614e0919e" FOREIGN KEY ("to_place_id") REFERENCES "places"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "itinerary_items" ADD CONSTRAINT "FK_6855b90d08b3f2b67372431f705" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "itineraries" ADD CONSTRAINT "FK_053f395806c0b2a05683767b633" FOREIGN KEY ("start_place_id") REFERENCES "places"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "itineraries" ADD CONSTRAINT "FK_727963bb42c4bf2238200f5ea29" FOREIGN KEY ("end_place_id") REFERENCES "places"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "itineraries" DROP CONSTRAINT "FK_727963bb42c4bf2238200f5ea29"`,
    );
    await queryRunner.query(
      `ALTER TABLE "itineraries" DROP CONSTRAINT "FK_053f395806c0b2a05683767b633"`,
    );
    await queryRunner.query(
      `ALTER TABLE "itinerary_items" DROP CONSTRAINT "FK_6855b90d08b3f2b67372431f705"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" DROP CONSTRAINT "FK_fb5310e601766fbeb4614e0919e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" DROP CONSTRAINT "FK_91336f6228e409a230f82578458"`,
    );
    await queryRunner.query(`DROP TABLE "itineraries"`);
    await queryRunner.query(`DROP TABLE "itinerary_items"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_04a189bf6adc1183a92ddaf925"`,
    );
    await queryRunner.query(`DROP TABLE "tickets"`);
    await queryRunner.query(`DROP TYPE "public"."tickets_baggage_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_518be6d96b83fb1423a6cdea89"`,
    );
    await queryRunner.query(`DROP TABLE "places"`);
  }
}
