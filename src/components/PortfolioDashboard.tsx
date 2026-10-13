"use client";

import { useEffect, useState } from "react";
import type { paths } from "../types/openapi";

// Tipo de la respuesta del endpoint, extraído del contrato generado por openapi-typescript
type PortfolioData = paths["/api/portfolio"]["get"]["responses"]["200"]["content"]["application/json"];

// Formateador de moneda USD reutilizable para las tarjetas de montos
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function PortfolioDashboard() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Bandera para ignorar resultados obsoletos si el efecto se ejecuta
    // más de una vez (p. ej. React Strict Mode) o el componente se desmonta
    // antes de que el fetch termine.
    let isActive = true;

    const fetchPortfolio = async () => {
      setIsLoading(true);

      try {
        const res = await fetch("/api/portfolio");
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || "Error al cargar el portafolio");
        }

        if (!isActive) return;

        // Fetch exitoso: guardamos los datos y limpiamos cualquier error previo
        setData(json);
        setError(null);
      } catch (err) {
        if (!isActive) return;

        console.error("Error al cargar el portafolio:", err);
        setError("No se pudo cargar el resumen del portafolio");
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    fetchPortfolio();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <div className="w-full max-w-4xl">
      {/* Solo mostramos el error si realmente no tenemos datos válidos que renderizar */}
      {error && !data && (
        <p className="text-red-400 text-center mb-6">{error}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Tarjeta 1: Total de Cartas */}
        <div className="bg-gray-800/60 rounded-xl p-6 border border-gray-700 flex flex-col items-center text-center">
          <p className="text-sm uppercase tracking-wide text-gray-400 mb-2">
            Total de Cartas
          </p>
          <p className="text-3xl font-bold text-white">
            {isLoading ? "—" : data?.totalCards ?? 0}
          </p>
        </div>

        {/* Tarjeta 2: Total Invertido */}
        <div className="bg-gray-800/60 rounded-xl p-6 border border-gray-700 flex flex-col items-center text-center">
          <p className="text-sm uppercase tracking-wide text-gray-400 mb-2">
            Total Invertido
          </p>
          <p className="text-3xl font-bold text-blue-400">
            {isLoading
              ? "—"
              : currencyFormatter.format(data?.totalInvested ?? 0)}
          </p>
        </div>

        {/* Tarjeta 3: Valor de Mercado */}
        <div className="bg-gray-800/60 rounded-xl p-6 border border-gray-700 flex flex-col items-center text-center">
          <p className="text-sm uppercase tracking-wide text-gray-400 mb-2">
            Valor de Mercado
          </p>
          <p className="text-3xl font-bold text-green-400">
            {isLoading
              ? "—"
              : currencyFormatter.format(data?.currentMarketValue ?? 0)}
          </p>
        </div>
      </div>
    </div>
  );
}
