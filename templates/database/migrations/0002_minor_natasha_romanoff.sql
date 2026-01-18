ALTER TABLE "user" ADD COLUMN "image_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_image_id_image_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."image"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "image";