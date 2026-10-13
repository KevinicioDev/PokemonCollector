import { NextResponse } from 'next/server';
import type { paths } from '../../src/types/openapi';

type SearchResponse = paths['/api/search']['get']['responses']['200']['content']['application/json'];

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json({ error: "Falta el parámetro de búsqueda" }, { status: 400 });
    }

    try {
        const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=name:"*${query}*"&pageSize=12`);

        if (!response.ok) {
            throw new Error('Error al consultar la API de Pokémon');
        }

        const json = await response.json();

        // 1. Protección: Si la API no devuelve la data correctamente, devolvemos un arreglo vacío
        if (!json.data || !Array.isArray(json.data)) {
            return NextResponse.json([]);
        }

        // 2. Corrección del "any": Le definimos a TypeScript la estructura exacta que esperamos de la API externa
        const realData: SearchResponse = json.data.map((card: {
            id: string;
            name: string;
            images: { small: string };
            tcgplayer?: { prices?: { holofoil?: { market?: number }, normal?: { market?: number } } };
            cardmarket?: { prices?: { averageSellPrice?: number } };
        }) => {
            const tcgPrices = card.tcgplayer?.prices;
            const marketPrice = tcgPrices?.holofoil?.market
                || tcgPrices?.normal?.market
                || card.cardmarket?.prices?.averageSellPrice
                || 0;

            return {
                id: card.id,
                name: card.name,
                imageURL: card.images.small,
                marketPrice: marketPrice
            };
        });

        return NextResponse.json(realData);

    } catch (error) {
        // 3. Corrección del "unused variable": Imprimimos el error en consola para saber qué falló
        console.error("Error interno en la búsqueda:", error);
        return NextResponse.json({ error: "Error procesando la búsqueda" }, { status: 500 });
    }
}