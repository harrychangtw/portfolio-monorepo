-- Structured transfer details replace the free-text column. Each old line
-- becomes one method with the whole line as its account, so nothing is lost.
ALTER TABLE "Member" ADD COLUMN "payMethods" JSONB NOT NULL DEFAULT '[]';

UPDATE "Member"
SET "payMethods" = (
  SELECT COALESCE(
    jsonb_agg(jsonb_build_object('type', '', 'id', '', 'account', btrim(line))),
    '[]'::jsonb
  )
  FROM unnest(string_to_array("payTo", E'\n')) AS line
  WHERE btrim(line) <> ''
)
WHERE "payTo" IS NOT NULL;

ALTER TABLE "Member" DROP COLUMN "payTo";
