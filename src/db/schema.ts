import { pgTable, serial, text, numeric } from "drizzle-orm/pg-core";

/**
 * Tabla "inventory"
 *
 * Esquema construido a partir del requestBody definido para
 * POST /api/inventory en openapi.yaml:
 *
 * required:
 *   - cardId
 *   - name
 *   - purchasePrice
 * properties:
 *   cardId:        string
 *   name:          string
 *   imageURL:      string (opcional)
 *   purchasePrice: number
 */
export const inventory = pgTable("inventory", {
  // Identificador interno autoincremental de la fila en la base de datos.
  id: serial("id").primaryKey(),

  // cardId: requerido por el contrato -> notNull()
  cardId: text("card_id").notNull(),

  // name: requerido por el contrato -> notNull()
  name: text("name").notNull(),

  // imageURL: NO está en el arreglo "required" del contrato -> columna nullable
  imageURL: text("image_url"),

  // purchasePrice: requerido por el contrato -> notNull()
  // Se usa "numeric" (DECIMAL) en lugar de un tipo de punto flotante
  // para evitar errores de redondeo al manejar valores monetarios.
  purchasePrice: numeric("purchase_price", { precision: 10, scale: 2 }).notNull(),
});

export type Inventory = typeof inventory.$inferSelect;
export type NewInventory = typeof inventory.$inferInsert;
