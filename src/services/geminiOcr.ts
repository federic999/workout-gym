import type { DailyNutritionInput } from '../types/workout.ts';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export interface SamsungHealthOcrResult {
  caloriesConsumed: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  steps: number;
  activeMinutes: number;
  activeBurnedKcal: number;
}

/**
 * Extrae métricas de nutrición y actividad desde una captura de pantalla de Samsung Health
 * usando Gemini 2.0 Flash (Free Tier de Google AI Studio).
 */
export async function extractSamsungHealthFromBase64(
  base64ImageWithoutPrefix: string,
  mimeType = 'image/jpeg'
): Promise<SamsungHealthOcrResult> {
  if (!GEMINI_API_KEY) {
    throw new Error(
      'Falta configurar VITE_GEMINI_API_KEY en el archivo .env para usar la extracción por imagen con Gemini.'
    );
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

  const prompt = `Analiza esta captura de pantalla de Samsung Health / registro nutricional y devuelve EXCLUSIVAMENTE un objeto JSON válido con las siguientes claves numéricas (usa 0 si algún dato no aparece en la imagen):
{
  "caloriesConsumed": number,
  "proteinG": number,
  "carbsG": number,
  "fatG": number,
  "steps": number,
  "activeMinutes": number,
  "activeBurnedKcal": number
}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64ImageWithoutPrefix,
              },
            },
          ],
        },
      ],
      generationConfig: {
        response_mime_type: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Error al consultar Gemini OCR: HTTP ${response.status}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
  const parsed = JSON.parse(rawText);

  return {
    caloriesConsumed: Number(parsed.caloriesConsumed) || 0,
    proteinG: Number(parsed.proteinG) || 0,
    carbsG: Number(parsed.carbsG) || 0,
    fatG: Number(parsed.fatG) || 0,
    steps: Number(parsed.steps) || 0,
    activeMinutes: Number(parsed.activeMinutes) || 0,
    activeBurnedKcal: Number(parsed.activeBurnedKcal) || 0,
  };
}

export function mapOcrToDailyNutritionInput(
  ocr: SamsungHealthOcrResult,
  date: string
): DailyNutritionInput {
  return {
    date,
    caloriesConsumed: ocr.caloriesConsumed,
    proteinG: ocr.proteinG,
    carbsG: ocr.carbsG,
    fatG: ocr.fatG,
    steps: ocr.steps,
    activeMinutes: ocr.activeMinutes,
    activeBurnedKcal: ocr.activeBurnedKcal,
  };
}
