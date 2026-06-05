ALTER TABLE "folders" ADD COLUMN "is_public" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "folders" ADD COLUMN "share_token" UUID;
ALTER TABLE "folders" ADD COLUMN "expires_at" TIMESTAMPTZ;

UPDATE "folders" SET "share_token" = gen_random_uuid() WHERE "share_token" IS NULL;

CREATE UNIQUE INDEX "folders_share_token_key" ON "folders"("share_token") WHERE "share_token" IS NOT NULL;
