import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { inventory } from '@/src/db/schema';
import { paths } from '@/src/types/openapi';
// Interfaz para mapear solo la parte del precio que nos interesa de la API externa
interface PokemonTCGCard {
    tcgplayer?:{
        prices?:{
            holofoil?: {market?: number}
            normal?: {market? : number}
        }
    }
}

type PortfolioResponse = paths['/api/portfolio']['get']['responses']['200']['content']['application/json'];

export async function GET() {
    try {
        // 1. Consultar localmente: Traer todas las cartas de Neon DB
        const myCards = await db.select().from(inventory);

        // 2. Calcular métricas locales
        const totalCards = myCards.length;

        const totalInvested = myCards.reduce((acumulador, card) => {
            return acumulador + parseFloat(card.purchasePrice);
        }, 0);

        // 3. Preparar el arreglo de IDs
        const cardIds = myCards.map(card => card.cardId);

        // GUARD CLAUSE: Si no hay cartas, devolvemos todo en 0 inmediatamente
        if (cardIds.length === 0) {
            return NextResponse.json({
                totalCards: 0,
                totalInvested: 0,
                currentMarketValue: 0
            }, { status: 200 });
        }

        // 4. Consultar la API externa
        const queryString = cardIds.map(id => `id:${id}`).join(" OR ");
        const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=${queryString}`);
        const data = await response.json();

        // 5. Calcular el valor de mercado sumando los precios
        let currentMarketValue = 0;
        data.data.forEach((card: PokemonTCGCard) => {
            const cardPrice = card.tcgplayer?.prices?.holofoil?.market || card.tcgplayer?.prices?.normal?.market || 0;
            currentMarketValue += cardPrice;
        });

        // 6. Respuesta final
        const responseBody: PortfolioResponse = {
            totalCards: totalCards,
            totalInvested: totalInvested,
            currentMarketValue: currentMarketValue
        };

        return NextResponse.json(responseBody, { status: 200 });

    } catch (error) {
        console.error('Error en GET /api/portfolio:', error);
        return NextResponse.json(
            { error: 'Error interno de servidor al cargar el portafolio' },
            { status: 500 }
        );
    }
}