import { calculateEpley1RM, calculateSetVolume, round2 } from './metrics.ts';
import type { ExerciseCode, ExerciseSet, ParsedExerciseEntry, PulleyType } from '../types/workout.ts';

const VALID_CODES = new Set<ExerciseCode>(['E0', 'E1', 'E2', 'E3', 'E4', 'E5', 'E6']);

const SKIP_KEYWORDS = /^(?:no|omitido|omitir|skip|saltear|paso|-|0)$/i;

function normalizeVariantName(raw: string): string {
  const cleaned = raw
    .replace(/^[=:\-()\s]+|[=:\-()\s]+$/g, '')
    .replace(
      /\b(?:polea\s+simple|simple\s+polea|doble\s+polea(?:\s+m[aá]s\s+pesada)?|polea\s+doble(?:\s+m[aá]s\s+pesada)?|m[aá]s\s+pesada|dropset|drop\s*set|sin\s+peso)\b/gi,
      ''
    )
    .replace(/^[=:\-()\s]+|[=:\-()\s]+$/g, '')
    .trim();

  if (!cleaned) return '';

  const lower = cleaned.toLowerCase();
  if (lower === 'ruso' || lower === 'giro ruso') return 'Giro Ruso';
  if (lower === 'press militar' || lower === 'militar') return 'Press Militar';

  return cleaned
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function detectPulleyType(text: string): PulleyType {
  if (/\b(?:polea\s+simple|simple\s+polea)\b/i.test(text)) {
    return 'single';
  }
  if (/\b(?:doble\s+polea|polea\s+doble)\b/i.test(text)) {
    return 'double';
  }
  return 'standard';
}

function detectDropSet(text: string): boolean {
  return /\b(?:dropset|drop\s*set)\b/i.test(text) || /->|→/.test(text);
}

/**
 * Parsea la expresión de series/repeticiones asociada a un bloque de peso.
 * Soporta formatos:
 * - "3x7" o "3 x 8" -> [7, 7, 7] o [8, 8, 8]
 * - "8,8,6", "8, 8, 6" o "8-8-6" -> [8, 8, 6]
 * - "5" -> [5]
 * - Combinaciones como "2x8, 6" -> [8, 8, 6]
 */
function parseRepsSegment(segment: string): number[] {
  const cleaned = segment
    .replace(/->|→/g, ' ')
    .replace(/\b(?:reps?|series?)\b/gi, '')
    .trim();

  if (!cleaned) return [];

  const repsList: number[] = [];
  // Separar por comas, guiones o espacios manteniendo tokens "NxM" unidos
  const normalized = cleaned.replace(/(\d+)\s*[xX*]\s*(\d+)/g, '$1x$2');
  const tokens = normalized.split(/[\s,;/-]+/).filter(Boolean);

  for (const token of tokens) {
    const nxmMatch = token.match(/^(\d+)[xX*](\d+)$/);
    if (nxmMatch) {
      const setsCount = parseInt(nxmMatch[1], 10);
      const repsCount = parseInt(nxmMatch[2], 10);
      if (setsCount > 0 && setsCount <= 20 && repsCount > 0) {
        for (let i = 0; i < setsCount; i++) {
          repsList.push(repsCount);
        }
      }
      continue;
    }

    const singleRepMatch = token.match(/^(\d+)$/);
    if (singleRepMatch) {
      const repVal = parseInt(singleRepMatch[1], 10);
      if (repVal > 0) {
        repsList.push(repVal);
      }
    }
  }

  return repsList;
}

/**
 * Parsea una línea de entrada rápida en lenguaje natural.
 * Ejemplos soportados:
 * - "E0 = ruso 10kg 3x7"
 * - "E1 60kg 8,8,6" o "E1 60 8,8,6"
 * - "E2 75kg 5 70kg 8, 8, 6"
 * - "E3 no"
 * - "E4 press militar 20 por lado 3x8"
 * - "E1 doble polea más pesada 70kg 8,8,6"
 * - "E4 dropset 60kg 12 -> 50kg 10 -> 40kg 10"
 */
export function parseExerciseLine(rawLine: string): ParsedExerciseEntry {
  const trimmed = rawLine.trim();
  if (!trimmed) {
    throw new Error('La entrada de ejercicio no puede estar vacía.');
  }

  const codeMatch = trimmed.match(/^(E[0-6])\b\s*[=:\-]?\s*(.*)$/i);
  if (!codeMatch) {
    throw new Error(
      `Formato inválido: "${rawLine}". Debe comenzar con el código de ejercicio (E0 a E6), por ejemplo: "E1 60kg 8,8,6".`
    );
  }

  const code = codeMatch[1].toUpperCase() as ExerciseCode;
  if (!VALID_CODES.has(code)) {
    throw new Error(`Código de ejercicio inválido: ${code}`);
  }

  const remainder = codeMatch[2].trim();

  // Caso de ejercicio omitido ("E3 no", "E5 omitido", etc.)
  if (!remainder || SKIP_KEYWORDS.test(remainder)) {
    return {
      code,
      rawInput: trimmed,
      isSkipped: true,
      isSubstituted: false,
      isPerSideWeight: false,
      pulleyType: 'standard',
      isDropSet: false,
      sets: [],
      totalVolumeKg: 0,
      totalReps: 0,
      maxWeightKg: 0,
      bestEstimated1RM: 0,
    };
  }

  const pulleyType = detectPulleyType(remainder);
  const isDropSet = detectDropSet(remainder);

  // Detectar bloques de peso explícitos:
  // Soporta "<numero> kg por lado", "<numero> por lado", "<numero> c/lado", "<numero> c/u", "<numero> kg"
  const weightRegex =
    /(\d+(?:[.,]\d+)?)\s*(?:kg|kilos?|k)?\s*(por\s+lado|cada\s+lado|por\s+mano|c\/\s*lado|x\s*lado|c\/u)|(\d+(?:[.,]\d+)?)\s*(?:kg|kilos?|k)(?![a-zA-Z])/gi;

  interface WeightMatchBlock {
    index: number;
    endIndex: number;
    rawWeight: number;
    perSide: boolean;
  }

  const weightBlocks: WeightMatchBlock[] = [];
  let match: RegExpExecArray | null;

  while ((match = weightRegex.exec(remainder)) !== null) {
    if (match[1] !== undefined) {
      const rawWeight = parseFloat(match[1].replace(',', '.'));
      weightBlocks.push({
        index: match.index,
        endIndex: match.index + match[0].length,
        rawWeight,
        perSide: true,
      });
    } else if (match[3] !== undefined) {
      const rawWeight = parseFloat(match[3].replace(',', '.'));
      const afterText = remainder.slice(match.index + match[0].length);
      const perSideAfter = /^\s*(?:por\s+lado|cada\s+lado|por\s+mano|c\/\s*lado|x\s*lado|c\/u)\b/i.exec(afterText);
      weightBlocks.push({
        index: match.index,
        endIndex: match.index + match[0].length + (perSideAfter ? perSideAfter[0].length : 0),
        rawWeight,
        perSide: Boolean(perSideAfter),
      });
    }
  }

  // Fallback para pesos sin unidad "kg" cuando les sigue un patrón claro de series/reps (ej. "E1 60 8,8,6", "E0 = ruso 10 3x7", "E2 75 5 70 8, 8, 6")
  if (weightBlocks.length === 0) {
    const unitlessWeightRegex =
      /(?:^|\s)(\d+(?:\.\d+)?)(?=\s+(?:\d+\s*[xX*]\s*\d+|\d+\s*[,/-]\s*\d+|\d+\s+\d+(?:\.\d+)?\s+(?:\d+\s*[xX*]\s*\d+|\d+\s*[,/-]\s*\d+)))/g;
    let uMatch: RegExpExecArray | null;
    while ((uMatch = unitlessWeightRegex.exec(remainder)) !== null) {
      const leadingSpaceOffset = uMatch[0].length - uMatch[1].length;
      const startIdx = uMatch.index + leadingSpaceOffset;
      weightBlocks.push({
        index: startIdx,
        endIndex: startIdx + uMatch[1].length,
        rawWeight: parseFloat(uMatch[1]),
        perSide: false,
      });
    }
  }

  let customVariantName: string | undefined;
  const sets: ExerciseSet[] = [];
  let isPerSideWeight = false;
  let enteredWeightPerSideKg: number | undefined;

  if (weightBlocks.length > 0) {
    const prefixText = remainder.slice(0, weightBlocks[0].index);
    const normalizedVariant = normalizeVariantName(prefixText);
    if (normalizedVariant) {
      customVariantName = normalizedVariant;
    }

    for (let i = 0; i < weightBlocks.length; i++) {
      const currentBlock = weightBlocks[i];
      const nextBlockIndex = i + 1 < weightBlocks.length ? weightBlocks[i + 1].index : remainder.length;
      const repsSegment = remainder.slice(currentBlock.endIndex, nextBlockIndex);

      if (currentBlock.perSide) {
        isPerSideWeight = true;
        enteredWeightPerSideKg = currentBlock.rawWeight;
      }

      const effectiveWeightKg = currentBlock.perSide
        ? round2(currentBlock.rawWeight * 2)
        : round2(currentBlock.rawWeight);

      const parsedReps = parseRepsSegment(repsSegment);

      for (const reps of parsedReps) {
        const setOrder = sets.length + 1;
        sets.push({
          setOrder,
          weightKg: effectiveWeightKg,
          reps,
          volumeKg: calculateSetVolume(effectiveWeightKg, reps),
          estimated1RM: calculateEpley1RM(effectiveWeightKg, reps),
          isDropSetStep: isDropSet && i > 0,
        });
      }
    }
  } else {
    // Caso de ejercicio con peso corporal (0 kg) como "E0 abs 3x15"
    const firstDigitMatch = remainder.match(/\d/);
    if (firstDigitMatch && firstDigitMatch.index !== undefined) {
      const prefixText = remainder.slice(0, firstDigitMatch.index);
      const repsText = remainder.slice(firstDigitMatch.index);
      if (/\d+\s*[xX*]\s*\d+|\d+\s*[,/-]\s*\d+/.test(repsText)) {
        const normalizedVariant = normalizeVariantName(prefixText);
        if (normalizedVariant) {
          customVariantName = normalizedVariant;
        }
        const parsedReps = parseRepsSegment(repsText);
        for (const reps of parsedReps) {
          sets.push({
            setOrder: sets.length + 1,
            weightKg: 0,
            reps,
            volumeKg: 0,
            estimated1RM: 0,
            isDropSetStep: false,
          });
        }
      }
    }
  }

  if (sets.length === 0) {
    throw new Error(
      `No se detectaron series y repeticiones válidas en "${rawLine}". Ejemplo: "E1 60kg 8,8,6" o "E3 no".`
    );
  }

  const totalVolumeKg = round2(sets.reduce((sum, s) => sum + s.volumeKg, 0));
  const totalReps = sets.reduce((sum, s) => sum + s.reps, 0);
  const maxWeightKg = sets.length > 0 ? Math.max(...sets.map((s) => s.weightKg)) : 0;
  const bestEstimated1RM = sets.length > 0 ? Math.max(...sets.map((s) => s.estimated1RM)) : 0;

  return {
    code,
    rawInput: trimmed,
    isSkipped: false,
    customVariantName,
    isSubstituted: Boolean(customVariantName),
    isPerSideWeight,
    enteredWeightPerSideKg,
    pulleyType,
    isDropSet,
    sets,
    totalVolumeKg,
    totalReps,
    maxWeightKg,
    bestEstimated1RM,
  };
}

/**
 * Parsea múltiples líneas de una sesión completa (por ejemplo E0 a E6).
 */
export function parseWorkoutLog(multilineInput: string): ParsedExerciseEntry[] {
  return multilineInput
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => parseExerciseLine(line));
}
