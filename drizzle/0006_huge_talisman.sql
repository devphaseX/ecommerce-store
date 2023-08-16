CREATE TABLE IF NOT EXISTS "sizes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"name" varchar(256) NOT NULL,
	"value" varchar(256) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sizes" ADD CONSTRAINT "sizes_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
