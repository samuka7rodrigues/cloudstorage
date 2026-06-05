-- AlterTable: add default uuid generation for new rows
ALTER TABLE "folders" ALTER COLUMN "share_token" SET DEFAULT gen_random_uuid();

-- Update existing null share_tokens
UPDATE "folders" SET "share_token" = gen_random_uuid() WHERE "share_token" IS NULL;
