import { getCatalogItem } from '../data/exerciseCatalog.ts';
import { getLibraryExerciseById } from '../data/gymExerciseLibrary.ts';
import { round2 } from './metrics.ts';
import type {
  ConfiguredDayRoutine,
  ConfiguredExerciseSlot,
  DayType,
  ExerciseCode,
  ExerciseRoadmapRecommendation,
  ParsedExerciseEntry,
  PRBadge,
  WeekState,
} from '../types/workout.ts';

function roundToStep(value: number, step = 2.5): number {
  return round2(Math.round(value / step) * step);
}

function formatPreviousSummary(entry: ParsedExerciseEntry): string {
  if (entry.isSkipped || entry.sets.length === 0) return 'Omitido en sesión previa';

  // Agrupar series consecutivas con el mismo peso
  const groups: Array<{ weightKg: number; reps: number[] }> = [];
  for (const s of entry.sets) {
    const last = groups[groups.length - 1];
    if (last && last.weightKg === s.weightKg) {
      last.reps.push(s.reps);
    } else {
      groups.push({ weightKg: s.weightKg, reps: [s.reps] });
    }
  }

  const blocksStr = groups
    .map((g) => `${g.weightKg}kg (${g.reps.join(', ')})`)
    .join(' + ');

  return `${blocksStr} — Vol: ${entry.totalVolumeKg}kg | 1RM: ${entry.bestEstimated1RM}kg`;
}

/**
 * Motor de Doble Progresión e IA Coach para un ejercicio específico.
 */
export function generateExerciseRoadmap(
  dayType: DayType,
  code: ExerciseCode,
  weekState: WeekState,
  previousEntry?: ParsedExerciseEntry
): ExerciseRoadmapRecommendation {
  const catalog = getCatalogItem(dayType, code);
  const [minReps, maxReps] = catalog.repRange;
  const targetSets = catalog.targetSets;
  const increment = catalog.weightIncrementKg;
  const exerciseName = previousEntry?.customVariantName || catalog.defaultName;
  const pulleyType = previousEntry?.pulleyType || 'standard';

  // 1. Semana de Descarga Total
  if (weekState === 'full_deload') {
    return {
      code,
      exerciseName,
      weekState,
      action: 'deload_full',
      recommendedWeightKg: 0,
      recommendedSets: 0,
      recommendedRepsTarget: 'Descanso Total / Movilidad',
      coachMessage: 'Semana de Descarga Total: Recuperación del SNC y tejido conectivo.',
      previousSessionSummary: previousEntry ? formatPreviousSummary(previousEntry) : undefined,
      pulleyType,
    };
  }

  // 2. Sin historial previo (Semana 1 o ejercicio omitido anteriormente)
  if (!previousEntry || previousEntry.isSkipped || previousEntry.sets.length === 0) {
    return {
      code,
      exerciseName,
      weekState,
      action: 'baseline',
      recommendedWeightKg: 0,
      recommendedSets: targetSets,
      recommendedRepsTarget: `${targetSets}x${minReps}-${maxReps}`,
      coachMessage: `Establecer marca base: ${targetSets} series de ${minReps} a ${maxReps} reps (RIR 1-2).`,
      pulleyType,
    };
  }

  const prevSummary = formatPreviousSummary(previousEntry);
  const workingSets = previousEntry.sets.filter((s) => !s.isDropSetStep);
  const effectiveSets = workingSets.length > 0 ? workingSets : previousEntry.sets;
  const maxWeight = Math.max(...effectiveSets.map((s) => s.weightKg));
  const minWeight = Math.min(...effectiveSets.map((s) => s.weightKg));
  const hasMixedWeights = maxWeight !== minWeight;

  // 3. Semana de Descarga Activa (-10% carga, -1 serie, lejos del fallo RIR 3-4)
  if (weekState === 'active_deload') {
    let deloadWeight = roundToStep(minWeight * 0.9, 2.5);
    if (deloadWeight >= minWeight && minWeight >= 2.5) {
      deloadWeight = round2(minWeight - 2.5);
    }
    const deloadSets = Math.max(2, targetSets - 1);
    return {
      code,
      exerciseName,
      weekState,
      action: 'deload_active',
      recommendedWeightKg: deloadWeight,
      recommendedSets: deloadSets,
      recommendedRepsTarget: `${deloadSets}x${minReps}`,
      coachMessage: `Descarga Activa: Bajar a ${deloadWeight}kg y realizar ${deloadSets}x${minReps} controlado (RIR 3-4) para disipar fatiga.`,
      previousSessionSummary: prevSummary,
      pulleyType,
    };
  }

  // 4. Semana de Reactivación (Retorno post-descarga al ~95% o base del rango)
  if (weekState === 'reactivation') {
    let reactivationWeight = roundToStep(minWeight * 0.95, 2.5);
    if (reactivationWeight >= minWeight && minWeight >= 2.5) {
      reactivationWeight = round2(minWeight - 2.5);
    }
    return {
      code,
      exerciseName,
      weekState,
      action: 'reactivate',
      recommendedWeightKg: reactivationWeight,
      recommendedSets: targetSets,
      recommendedRepsTarget: `${targetSets}x${minReps}`,
      coachMessage: `Semana de Reactivación: Retomar con ${reactivationWeight}kg buscando ${targetSets}x${minReps} fluidas antes de volver a sobrecargar.`,
      previousSessionSummary: prevSummary,
      pulleyType,
    };
  }

  // 5. Semana de Acumulación / Sobrecarga (Motor de Doble Progresión)
  if (hasMixedWeights) {
    // Ejemplo: "E2 75kg 5 70kg 8, 8, 6"
    const topWeightSets = effectiveSets.filter((s) => s.weightKg === maxWeight);
    const topReps = topWeightSets[0]?.reps ?? 0;

    if (topReps < minReps) {
      return {
        code,
        exerciseName,
        weekState,
        action: 'consolidate_weight',
        recommendedWeightKg: minWeight,
        recommendedSets: targetSets,
        recommendedRepsTarget: `${targetSets}x${minReps + 1}-${maxReps}`,
        coachMessage: `En la sesión previa el intento con ${maxWeight}kg quedó en ${topReps} reps (<${minReps}). Hoy: consolidar ${minWeight}kg buscando ${targetSets}x${Math.min(maxReps, minReps + 1)} o intentar ${maxWeight}kg por ${minReps}+ reps en la 1ª serie.`,
        previousSessionSummary: prevSummary,
        pulleyType,
      };
    }

    return {
      code,
      exerciseName,
      weekState,
      action: 'consolidate_weight',
      recommendedWeightKg: maxWeight,
      recommendedSets: targetSets,
      recommendedRepsTarget: `${targetSets}x${minReps}`,
      coachMessage: `Consolidar carga máxima de ${maxWeight}kg en todas las ${targetSets} series alcanzando al menos ${minReps} reps por serie.`,
      previousSessionSummary: prevSummary,
      pulleyType,
    };
  }

  // Peso uniforme en todas las series de trabajo
  const currentWeight = maxWeight;
  const allSetsAtOrAboveMax =
    effectiveSets.length >= targetSets && effectiveSets.every((s) => s.reps >= maxReps);

  // Regla A: Tope del rango de repeticiones alcanzado en todas las series -> Subir Peso
  if (allSetsAtOrAboveMax) {
    const nextWeight = round2(currentWeight + increment);
    return {
      code,
      exerciseName,
      weekState,
      action: 'increase_weight',
      recommendedWeightKg: nextWeight,
      recommendedSets: targetSets,
      recommendedRepsTarget: `${targetSets}x${minReps}`,
      coachMessage: `¡Tope de rango (${targetSets}x${maxReps}) completado! Subir peso a ${nextWeight}kg (+${increment}kg) y buscar mínimo ${targetSets}x${minReps}.`,
      previousSessionSummary: prevSummary,
      pulleyType,
    };
  }

  // Regla B: Aún dentro del rango o con series incompletas -> Mantener peso y sumar repeticiones
  const nextRepsArray = effectiveSets.slice(0, targetSets).map((s) => {
    if (s.reps < minReps) return minReps;
    if (s.reps < maxReps) return s.reps + 1;
    return s.reps;
  });

  while (nextRepsArray.length < targetSets) {
    nextRepsArray.push(minReps);
  }

  const prevWorkingReps = effectiveSets.reduce((sum, s) => sum + s.reps, 0);
  const allSameTarget = nextRepsArray.every((r) => r === nextRepsArray[0]);
  const targetStr = allSameTarget
    ? `${nextRepsArray.length}x${nextRepsArray[0]}`
    : `[${nextRepsArray.join(', ')}]`;

  return {
    code,
    exerciseName,
    weekState,
    action: 'increase_reps',
    recommendedWeightKg: currentWeight,
    recommendedSets: targetSets,
    recommendedRepsTarget: targetStr,
    coachMessage: `Mantener ${currentWeight}kg y progresar en repeticiones: apuntar a ${targetStr} (superar las ${prevWorkingReps} reps previas).`,
    previousSessionSummary: prevSummary,
    pulleyType,
  };
}

/**
 * Genera la Hoja de Ruta completa del Día (E0 a E6) a partir de la sesión previa.
 */
export function generateDayRoadmap(
  dayType: DayType,
  weekState: WeekState,
  previousDayEntries: ParsedExerciseEntry[]
): ExerciseRoadmapRecommendation[] {
  const prevByCode = new Map<ExerciseCode, ParsedExerciseEntry>();
  for (const entry of previousDayEntries) {
    prevByCode.set(entry.code, entry);
  }

  const codes: ExerciseCode[] =
    dayType === 'legs'
      ? prevByCode.has('E6')
        ? ['E0', 'E1', 'E2', 'E3', 'E4', 'E5', 'E6']
        : ['E0', 'E1', 'E2', 'E3', 'E4', 'E5']
      : ['E0', 'E1', 'E2', 'E3', 'E4', 'E5', 'E6'];

  return codes.map((code) =>
    generateExerciseRoadmap(dayType, code, weekState, prevByCode.get(code))
  );
}

function isVariantCompatibleWithSlot(
  slot: ConfiguredExerciseSlot,
  customVariantName?: string
): boolean {
  if (!customVariantName) return true;
  const lowerVariant = customVariantName.toLowerCase();
  const libEx = getLibraryExerciseById(slot.libraryExerciseId);

  // En E4 Base (hombro_posterior), Press Militar es la variante oficial permitida
  if (
    slot.libraryExerciseId === 'hombro_posterior' &&
    lowerVariant.includes('militar')
  ) {
    return true;
  }

  if (
    slot.customName.toLowerCase().includes(lowerVariant) ||
    lowerVariant.includes(slot.customName.toLowerCase()) ||
    libEx.name.toLowerCase().includes(lowerVariant) ||
    libEx.aliases.some(
      (a) => a.toLowerCase().includes(lowerVariant) || lowerVariant.includes(a.toLowerCase())
    )
  ) {
    return true;
  }

  return false;
}

/**
 * Genera la recomendación de progresión para una ranura configurada por el usuario (2, 3, 4 o 5 días).
 */
export function generateConfiguredSlotRoadmap(
  slot: ConfiguredExerciseSlot,
  weekState: WeekState,
  previousEntry?: ParsedExerciseEntry
): ExerciseRoadmapRecommendation {
  const [minReps, maxReps] = slot.repRange;
  const targetSets = slot.targetSets;
  const increment = slot.weightIncrementKg;

  const isCompatible = isVariantCompatibleWithSlot(slot, previousEntry?.customVariantName);
  const effectivePreviousEntry = isCompatible ? previousEntry : undefined;
  const exerciseName = effectivePreviousEntry?.customVariantName || slot.customName;
  const pulleyType = effectivePreviousEntry?.pulleyType || 'standard';

  if (weekState === 'full_deload') {
    return {
      code: slot.code,
      exerciseName,
      weekState,
      action: 'deload_full',
      recommendedWeightKg: 0,
      recommendedSets: 0,
      recommendedRepsTarget: 'Descanso Total / Movilidad',
      coachMessage: 'Semana de Descarga Total: Recuperación del SNC y tejido conectivo.',
      previousSessionSummary: effectivePreviousEntry
        ? formatPreviousSummary(effectivePreviousEntry)
        : undefined,
      pulleyType,
    };
  }

  if (
    !effectivePreviousEntry ||
    effectivePreviousEntry.isSkipped ||
    effectivePreviousEntry.sets.length === 0
  ) {
    return {
      code: slot.code,
      exerciseName,
      weekState,
      action: 'baseline',
      recommendedWeightKg: 0,
      recommendedSets: targetSets,
      recommendedRepsTarget: `${targetSets}x${minReps}-${maxReps}`,
      coachMessage: `Establecer marca base: ${targetSets} series de ${minReps} a ${maxReps} reps (RIR 1-2).`,
      pulleyType,
    };
  }

  const prevSummary = formatPreviousSummary(effectivePreviousEntry);
  const workingSets = effectivePreviousEntry.sets.filter((s) => !s.isDropSetStep);
  const effectiveSets = workingSets.length > 0 ? workingSets : effectivePreviousEntry.sets;
  const maxWeight = Math.max(...effectiveSets.map((s) => s.weightKg));
  const minWeight = Math.min(...effectiveSets.map((s) => s.weightKg));
  const hasMixedWeights = maxWeight !== minWeight;

  if (weekState === 'active_deload') {
    let deloadWeight = roundToStep(minWeight * 0.9, 2.5);
    if (deloadWeight >= minWeight && minWeight >= 2.5) {
      deloadWeight = round2(minWeight - 2.5);
    }
    const deloadSets = Math.max(2, targetSets - 1);
    return {
      code: slot.code,
      exerciseName,
      weekState,
      action: 'deload_active',
      recommendedWeightKg: deloadWeight,
      recommendedSets: deloadSets,
      recommendedRepsTarget: `${deloadSets}x${minReps}`,
      coachMessage: `Descarga Activa: Bajar a ${deloadWeight}kg y realizar ${deloadSets}x${minReps} controlado (RIR 3-4) para disipar fatiga.`,
      previousSessionSummary: prevSummary,
      pulleyType,
    };
  }

  if (weekState === 'reactivation') {
    let reactivationWeight = roundToStep(minWeight * 0.95, 2.5);
    if (reactivationWeight >= minWeight && minWeight >= 2.5) {
      reactivationWeight = round2(minWeight - 2.5);
    }
    return {
      code: slot.code,
      exerciseName,
      weekState,
      action: 'reactivate',
      recommendedWeightKg: reactivationWeight,
      recommendedSets: targetSets,
      recommendedRepsTarget: `${targetSets}x${minReps}`,
      coachMessage: `Semana de Reactivación: Retomar con ${reactivationWeight}kg buscando ${targetSets}x${minReps} fluidas antes de volver a sobrecargar.`,
      previousSessionSummary: prevSummary,
      pulleyType,
    };
  }

  if (hasMixedWeights) {
    const topWeightSets = effectiveSets.filter((s) => s.weightKg === maxWeight);
    const topReps = topWeightSets[0]?.reps ?? 0;

    if (topReps < minReps) {
      return {
        code: slot.code,
        exerciseName,
        weekState,
        action: 'consolidate_weight',
        recommendedWeightKg: minWeight,
        recommendedSets: targetSets,
        recommendedRepsTarget: `${targetSets}x${minReps + 1}-${maxReps}`,
        coachMessage: `En la sesión previa el intento con ${maxWeight}kg quedó en ${topReps} reps (<${minReps}). Hoy: consolidar ${minWeight}kg buscando ${targetSets}x${Math.min(maxReps, minReps + 1)} o intentar ${maxWeight}kg por ${minReps}+ reps en la 1ª serie.`,
        previousSessionSummary: prevSummary,
        pulleyType,
      };
    }

    return {
      code: slot.code,
      exerciseName,
      weekState,
      action: 'consolidate_weight',
      recommendedWeightKg: maxWeight,
      recommendedSets: targetSets,
      recommendedRepsTarget: `${targetSets}x${minReps}`,
      coachMessage: `Consolidar carga máxima de ${maxWeight}kg en todas las ${targetSets} series alcanzando al menos ${minReps} reps por serie.`,
      previousSessionSummary: prevSummary,
      pulleyType,
    };
  }

  const currentWeight = maxWeight;
  const allSetsAtOrAboveMax =
    effectiveSets.length >= targetSets && effectiveSets.every((s) => s.reps >= maxReps);

  if (allSetsAtOrAboveMax) {
    const nextWeight = round2(currentWeight + increment);
    return {
      code: slot.code,
      exerciseName,
      weekState,
      action: 'increase_weight',
      recommendedWeightKg: nextWeight,
      recommendedSets: targetSets,
      recommendedRepsTarget: `${targetSets}x${minReps}`,
      coachMessage: `¡Tope de rango (${targetSets}x${maxReps}) completado! Subir peso a ${nextWeight}kg (+${increment}kg) y buscar mínimo ${targetSets}x${minReps}.`,
      previousSessionSummary: prevSummary,
      pulleyType,
    };
  }

  const nextRepsArray = effectiveSets.slice(0, targetSets).map((s) => {
    if (s.reps < minReps) return minReps;
    if (s.reps < maxReps) return s.reps + 1;
    return s.reps;
  });

  while (nextRepsArray.length < targetSets) {
    nextRepsArray.push(minReps);
  }

  const prevWorkingReps = effectiveSets.reduce((sum, s) => sum + s.reps, 0);
  const allSameTarget = nextRepsArray.every((r) => r === nextRepsArray[0]);
  const targetStr = allSameTarget
    ? `${nextRepsArray.length}x${nextRepsArray[0]}`
    : `[${nextRepsArray.join(', ')}]`;

  return {
    code: slot.code,
    exerciseName,
    weekState,
    action: 'increase_reps',
    recommendedWeightKg: currentWeight,
    recommendedSets: targetSets,
    recommendedRepsTarget: targetStr,
    coachMessage: `Mantener ${currentWeight}kg y progresar en repeticiones: apuntar a ${targetStr} (superar las ${prevWorkingReps} reps previas).`,
    previousSessionSummary: prevSummary,
    pulleyType,
  };
}

/**
 * Genera la Hoja de Ruta para cualquier Día Configurado (en rutinas de 2, 3, 4 o 5 días).
 */
export function generateConfiguredDayRoadmap(
  dayRoutine: ConfiguredDayRoutine,
  weekState: WeekState,
  previousDayEntries: ParsedExerciseEntry[]
): ExerciseRoadmapRecommendation[] {
  const prevByCode = new Map<ExerciseCode, ParsedExerciseEntry>();
  for (const entry of previousDayEntries) {
    prevByCode.set(entry.code, entry);
  }

  return dayRoutine.exercises.map((slot) =>
    generateConfiguredSlotRoadmap(slot, weekState, prevByCode.get(slot.code))
  );
}


/**
 * Detector de Récords Personales (🏆):
 * Compara la entrada actual contra el historial previo del mismo ejercicio
 * (respetando el tipo de polea en ejercicios como E1 Tirón y la variante elegida).
 */
export function detectPersonalRecords(
  currentEntry: ParsedExerciseEntry,
  historicalEntries: ParsedExerciseEntry[]
): PRBadge[] {
  if (currentEntry.isSkipped || currentEntry.sets.length === 0) {
    return [];
  }

  const currentVariant = currentEntry.customVariantName?.toLowerCase() ?? '';

  // Filtrar historial del mismo código, misma variante, no omitido y mismo tipo de polea
  const comparableHistory = historicalEntries.filter(
    (h) =>
      h.code === currentEntry.code &&
      !h.isSkipped &&
      h.sets.length > 0 &&
      h.pulleyType === currentEntry.pulleyType &&
      (h.customVariantName?.toLowerCase() ?? '') === currentVariant
  );

  if (comparableHistory.length === 0) {
    return [];
  }

  const prevMaxWeight = Math.max(...comparableHistory.map((h) => h.maxWeightKg));
  const prevMaxVolume = Math.max(...comparableHistory.map((h) => h.totalVolumeKg));
  const prevMax1RM = Math.max(...comparableHistory.map((h) => h.bestEstimated1RM));

  const badges: PRBadge[] = [];

  if (currentEntry.maxWeightKg > prevMaxWeight && prevMaxWeight > 0) {
    badges.push({
      type: 'max_weight',
      label: '🏆 Récord de Carga Máxima',
      previousValue: prevMaxWeight,
      newValue: currentEntry.maxWeightKg,
      deltaPercent: round2(((currentEntry.maxWeightKg - prevMaxWeight) / prevMaxWeight) * 100),
    });
  }

  if (currentEntry.totalVolumeKg > prevMaxVolume && prevMaxVolume > 0) {
    badges.push({
      type: 'max_volume',
      label: '🏆 Récord de Volumen de Sesión',
      previousValue: prevMaxVolume,
      newValue: currentEntry.totalVolumeKg,
      deltaPercent: round2(((currentEntry.totalVolumeKg - prevMaxVolume) / prevMaxVolume) * 100),
    });
  }

  if (currentEntry.bestEstimated1RM > prevMax1RM && prevMax1RM > 0) {
    badges.push({
      type: 'max_1rm',
      label: '🏆 Récord de 1RM Estimado (Epley)',
      previousValue: prevMax1RM,
      newValue: currentEntry.bestEstimated1RM,
      deltaPercent: round2(((currentEntry.bestEstimated1RM - prevMax1RM) / prevMax1RM) * 100),
    });
  }

  return badges;
}
