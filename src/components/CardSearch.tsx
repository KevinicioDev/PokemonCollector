"use client";

import { useState } from "react";
import type { paths } from "../types/openapi";
import CameraScanner from "./CameraScanner";

// Tipo de una sola carta, extraído del contrato generado por openapi-typescript
type PokemonCard = paths["/api/search"]["get"]["responses"]["200"]["content"]["application/json"][0];

// Posibles estados del botón "Guardar" para cada tarjeta individual
type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function CardSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PokemonCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Mapa: cardId -> estado de guardado, para controlar cada botón de la grilla de forma independiente
  const [saveStatus, setSaveStatus] = useState<Record<string, SaveStatus>>({});

  // Acepta un término opcional para poder dispararse programáticamente
  // (p. ej. desde el escáner de cámara) sin depender del estado `query`,
  // que es asíncrono y podría no estar actualizado todavía.
  const handleSearch = async (e?: React.FormEvent, termOverride?: string) => {
    e?.preventDefault();

    const term = (termOverride ?? query).trim();
    if (!term) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
      const data = await res.json();

      if (Array.isArray(data)) {
        setResults(data);
        setSaveStatus({});
      } else {
        console.error("El backend devolvió un error:", data);
        setResults([]);
        setError(data.error || "No se encontraron resultados");
      }
    } catch (err) {
      console.error("Error de conexión:", err);
      setResults([]);
      setError("No se pudo conectar con el servidor");
    } finally {
      setIsLoading(false);
    }
  };

  // Callback del CameraScanner: actualiza el input con el nombre detectado
  // y dispara la búsqueda automáticamente, como si el usuario lo hubiera escrito.
  const handleScanComplete = (name: string) => {
    setQuery(name);
    handleSearch(undefined, name);
  };

  const handleSave = async (card: PokemonCard) => {
    if (!card.id) return;

    setSaveStatus((prev) => ({ ...prev, [card.id as string]: "saving" }));

    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: card.id,
          name: card.name,
          imageURL: card.imageURL,
          purchasePrice: card.marketPrice ?? 0,
        }),
      });

      if (!res.ok) {
        throw new Error("Error al guardar la carta");
      }

      setSaveStatus((prev) => ({ ...prev, [card.id as string]: "saved" }));
    } catch (err) {
      console.error("Error al guardar la carta:", err);
      setSaveStatus((prev) => ({ ...prev, [card.id as string]: "error" }));
    }
  };

  return (
    <div className="w-full max-w-4xl">
      {/* Barra de búsqueda */}
      <form onSubmit={handleSearch} className="flex gap-4 mb-10">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar Pokémon (ej. Charizard)..."
          className="flex-1 p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
        >
          {isLoading ? "Buscando..." : "Buscar"}
        </button>

        <CameraScanner onScanComplete={handleScanComplete} />
      </form>

      {/* Mensaje de error */}
      {error && (
        <p className="text-red-400 text-center mb-6">{error}</p>
      )}

      {/* Cuadrícula de Resultados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {results.map((card) => {
          const status = card.id ? saveStatus[card.id] ?? "idle" : "idle";

          return (
            <div
              key={card.id}
              className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex flex-col items-center"
            >
              {card.imageURL && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={card.imageURL}
                  alt={card.name}
                  className="w-full h-auto rounded-lg mb-3"
                />
              )}

              <p className="font-bold text-center mb-2">{card.name}</p>

              <p className="text-green-400 font-bold mb-3">
                ${card.marketPrice ?? 0} USD
              </p>

              <button
                onClick={() => handleSave(card)}
                disabled={status === "saving" || status === "saved"}
                className={`w-full px-4 py-2 rounded-lg font-semibold transition-colors ${
                  status === "saved"
                    ? "bg-green-700 cursor-default"
                    : status === "error"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-yellow-500 hover:bg-yellow-600 text-gray-900"
                } disabled:opacity-70`}
              >
                {status === "saving"
                  ? "Guardando..."
                  : status === "saved"
                  ? "Guardado ✓"
                  : status === "error"
                  ? "Error, reintentar"
                  : "Guardar"}
              </button>
            </div>
          );
        })}
      </div>

      {!isLoading && results.length === 0 && (
        <p className="text-gray-400 text-center mt-10">
          Busca una carta de Pokémon para comenzar.
        </p>
      )}
    </div>
  );
}
