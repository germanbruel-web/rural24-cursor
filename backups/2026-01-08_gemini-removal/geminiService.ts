// ✅ /services/geminiService.ts
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { EnrichedData } from "../../types";

// ⚙️ Configuración del API Key desde .env
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn("⚠️ Gemini API key no configurada. Revisá tu archivo .env");
}

// ✅ Instancia de Gemini
const genAI = new GoogleGenerativeAI(API_KEY);

const enrichmentSchema = {
  type: SchemaType.OBJECT,
  properties: {
    category: {
      type: SchemaType.STRING,
      description:
        "Clasificación principal del producto, ej: Maquinaria Agrícola, Ganadería, Insumos, Inmuebles.",
    },
    brand: {
      type: SchemaType.STRING,
      description:
        "La marca del producto si aplica, ej: John Deere, Case, Don Mario.",
    },
    power: {
      type: SchemaType.STRING,
      description:
        "La potencia en HP si es una maquinaria, ej: 110HP.",
    },
    condition: {
      type: SchemaType.STRING,
      description:
        "La condición del producto, ej: Usado, Nuevo.",
    },
  },
};

export const enrichProductData = async (
  productTitle: string,
  productDescription: string
): Promise<EnrichedData | null> => {
  if (!API_KEY) {
    console.error("❌ Gemini API key no configurada en .env");
    return null;
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Analiza el siguiente producto de agronegocios y devuelve un JSON con la información estructurada:
      Título: "${productTitle}"
      Descripción: "${productDescription}"
      Si la categoría es inmobiliaria, responde como 'Inmuebles'.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Limpieza y parseo seguro
    const cleaned = text.replace(/```json|```/g, "").trim();
    const enrichedData = JSON.parse(cleaned);

    return enrichedData;
  } catch (error) {
    console.error("💥 Error enriqueciendo datos con Gemini:", error);
    return null;
  }
};
