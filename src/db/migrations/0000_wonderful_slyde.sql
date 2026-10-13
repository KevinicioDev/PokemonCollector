CREATE TABLE "inventory" (
	"id" serial PRIMARY KEY NOT NULL,
	"card_id" text NOT NULL,
	"name" text NOT NULL,
	"image_url" text,
	"purchase_price" numeric(10, 2) NOT NULL
);
