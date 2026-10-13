import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Inicializa el cliente de Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { imageBase64 } = body;

        if (!imageBase64) {
            return NextResponse.json({ error: 'No se proporcionó ninguna imagen' }, { status: 400 });
        }

        // Usamos el modelo flash por ser el más rápido para visión
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // Formateamos la imagen (quitamos el encabezado base64 de HTML si viene)
        const base64Data = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType: 'image/jpeg'
            }
        };

        // El prompt estricto
        const prompt = "Eres un experto en el Juego de Cartas Coleccionables de Pokémon. Analiza esta imagen y responde única y exclusivamente con el nombre del Pokémon principal de la carta en texto plano. Ignora los puntos de vida (HP), los ataques y cualquier otro texto.";

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const pokemonName = response.text().trim();

        return NextResponse.json({ pokemonName }, { status: 200 });

    } catch (error) {
        console.error('Error procesando la imagen con Gemini:', error);
        return NextResponse.json(
            { error: 'Error interno al analizar la imagen' },
            { status: 500 }
        );
    }
}