import { NextResponse } from 'next/server'
import { db } from '../../src/db'
import { paths } from '@/src/types/openapi'
import { inventory } from '@/src/db/schema';


type InventoryRequestBody = paths['/api/inventory']['post']['requestBody']['content']['application/json']

export async function POST(request: Request) {
    try {
        // 1. Extraer el body JSON
        const body: InventoryRequestBody = await request.json()
        const { name, purchasePrice, cardId, imageURL } = body
        // 2. Validar que vengan los campos obligatorios del contrato
        if (!cardId || !name || purchasePrice === undefined || purchasePrice === null) {
            return NextResponse.json(
                { error: 'Faltan campos obligatorios como: cardId, name, purchasePrice' },
                { status: 400 }//Es para un bad req: culpa del cliente
            )
        }
        // 3. Insertar en Neon con Drizzle
        await db.insert(inventory).values({
            cardId: cardId,
            name: name,
            imageURL: imageURL ?? null,
            purchasePrice: purchasePrice.toString(),
        });
        // 4. Responder con status 201

        return NextResponse.json(
            { success: true, message: "Inventario creado exitosamente" },
            { status: 201 }// 201 created: se creo correctamnete
        )
    } catch (error) {
        // Manejo de errores 500
        console.error('Error en POST /api/inventory:', error)
        return NextResponse.json(
            { error: 'Error interno de servidor!' },
            { status: 500 }//500 Internal Server Error: culpa del back o db
        )
    }
}

export async function GET() {
    try {
        const cards = await db.select().from(inventory)

        return NextResponse.json(
            cards,
            {status : 200},
        )
    }
    catch (error){
        console.error('Error en GET /api/inventory:', error)
        return NextResponse.json(
            {error: 'Error interno del servidor al cargar el inventario'},
            {status : 500}
        )
    }
}