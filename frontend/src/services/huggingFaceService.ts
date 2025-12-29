// src/services/huggingFaceService.ts
// Servicio para generar texto y etiquetas usando Hugging Face Inference API

const HF_API_TOKEN = import.meta.env.HF_API_TOKEN;
const HF_API_URL = "/api/hf/generate";

if (!HF_API_TOKEN) {
  console.warn("⚠️ HF_API_TOKEN no configurado en .env.local");
}

export const generateDescription = async (
  title: string,
  category: string,
  subcategory?: string
): Promise<string | null> => {
  // El frontend ya no requiere HF_API_TOKEN, solo llama al backend

  const prompt = `Eres un experto en marketing agrícola y rural en Argentina.\n\nBasándote en el siguiente título de aviso clasificado, genera una descripción comercial atractiva y profesional de entre 80 y 150 palabras.\n\nTítulo: \"${title}\"\nCategoría: ${category}\n${subcategory ? `Subcategoría: ${subcategory}` : ''}\n\nLa descripción debe:\n- Ser persuasiva y profesional\n- Destacar beneficios y características clave\n- Usar lenguaje del sector agropecuario argentino\n- Incluir llamados a la acción sutiles\n- NO inventar especificaciones técnicas que no estén en el título\n- Ser concisa pero completa\n\nResponde SOLO con la descripción, sin etiquetas, comillas ni formato adicional.`;

  try {
    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt })
    });
    if (!response.ok) throw new Error("Error en Hugging Face Proxy: " + response.status);
    const data = await response.json();
    const text = data?.generated_text || data[0]?.generated_text || "";
    return text.trim();
  } catch (error) {
    console.error("💥 Error generando descripción con Hugging Face Proxy:", error);
    return null;
  }
};

export const suggestTags = async (
  title: string,
  description: string,
  category: string,
  subcategory?: string
): Promise<string[]> => {
  // El frontend ya no requiere HF_API_TOKEN, solo llama al backend

  const prompt = `Eres un experto en clasificación de productos agrícolas y rurales.\n\nAnaliza el siguiente aviso y sugiere exactamente 10 etiquetas (tags) relevantes para mejorar su visibilidad.\n\nTítulo: \"${title}\"\nDescripción: \"${description}\"\nCategoría: ${category}\n${subcategory ? `Subcategoría: ${subcategory}` : ''}\n\nLas etiquetas deben:\n- Ser palabras clave cortas (1-3 palabras)\n- Incluir marcas, modelos, características técnicas mencionadas\n- Ser términos de búsqueda comunes en el sector\n- Estar en español (Argentina)\n- NO repetir palabras del título exactamente\n- Ser específicas y útiles para búsquedas\n\nResponde SOLO con las 10 etiquetas separadas por comas, sin numeración ni formato adicional.`;

  try {
    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt })
    });
    if (!response.ok) throw new Error("Error en Hugging Face Proxy: " + response.status);
    const data = await response.json();
    const text = data?.generated_text || data[0]?.generated_text || "";
    const tags = text
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .slice(0, 10);
    return tags;
  } catch (error) {
    console.error("💥 Error generando tags con Hugging Face Proxy:", error);
    return [];
  }
};
