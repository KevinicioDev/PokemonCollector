"use client";

import { useEffect, useState } from "react";

// El contrato OpenAPI aún no define la respuesta de GET /api/inventory,
// así que tipamos manualmente según lo que devuelve Drizzle (ver src/db/schema.ts).
// purchasePrice llega como string porque la columna es "numeric" en Postgres.
interface InventoryItem {
  id: number;
  cardId: string;
  name: string;
  imageURL: string | null;
  purchasePrice: string;
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const fetchInventory = async () => {
      setIsLoading(true);

      try {
        const res = await fetch("/api/inventory");
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || "Error al cargar el inventario");
        }

        if (!isActive) return;

        setItems(Array.isArray(json) ? json : []);
        setError(null);
      } catch (err) {
        if (!isActive) return;

        console.error("Error al cargar el inventario:", err);
        setError("No se pudo cargar tu inventario");
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    fetchInventory();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center p-8 bg-gray-900 text-white">
      <div className="w-full max-w-5xl">
        <h1 className="text-3xl font-bold mb-8 text-center text-yellow-400">
          Mi Inventario
        </h1>

        {/* Estado de carga */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="w-8 h-8 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mb-4" />
            <p>Cargando inventario...</p>
          </div>
        )}

        {/* Estado de error (solo si no hay datos válidos) */}
        {!isLoading && error && (
          <p className="text-red-400 text-center">{error}</p>
        )}

        {/* Estado vacío */}
        {!isLoading && !error && items.length === 0 && (
          <p className="text-gray-400 text-center">
            Aún no has guardado ninguna carta en tu inventario.
          </p>
        )}

        {/* Grid de resultados */}
        {!isLoading && !error && items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex flex-col items-center"
              >
                {item.imageURL && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageURL}
                    alt={item.name}
                    className="w-full h-auto rounded-lg mb-3"
                  />
                )}

                <p className="font-bold text-center mb-2">{item.name}</p>

                <p className="text-green-400 font-bold">
                  {currencyFormatter.format(parseFloat(item.purchasePrice))}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
