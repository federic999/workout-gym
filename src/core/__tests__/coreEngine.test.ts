import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  analyzeDailyNutrition,
  calculateEpley1RM,
  calculateMuscleDistribution,
  calculateSetVolume,
} from '../metrics.ts';
import { parseExerciseLine, parseWorkoutLog } from '../nlpParser.ts';
import {
  detectPersonalRecords,
  generateConfiguredDayRoadmap,
  generateDayRoadmap,
  generateExerciseRoadmap,
} from '../progressionEngine.ts';
import {
  INITIAL_4WEEK_SNAPSHOTS,
  computeHeroBig3PRs,
  computeWeeklyDashboardSummary,
} from '../weeklyDashboard.ts';
import {
  GYM_EXERCISE_LIBRARY,
  OPEN_EXERCISE_SOURCES,
  buildDefaultSplitRoutine,
  findLibraryExerciseByNameOrCode,
} from '../../data/gymExerciseLibrary.ts';
import type { GymDaysCount, VisualMovementPattern } from '../../types/workout.ts';

describe('1. Parser NLP de Entrada Rápida (nlpParser.ts)', () => {
  it('parsea "E0 = ruso 10kg 3x7" correctamente', () => {
    const res = parseExerciseLine('E0 = ruso 10kg 3x7');
    assert.equal(res.code, 'E0');
    assert.equal(res.customVariantName, 'Giro Ruso');
    assert.equal(res.isSkipped, false);
    assert.equal(res.sets.length, 3);
    assert.deepEqual(
      res.sets.map((s) => ({ w: s.weightKg, r: s.reps })),
      [
        { w: 10, r: 7 },
        { w: 10, r: 7 },
        { w: 10, r: 7 },
      ]
    );
    assert.equal(res.totalVolumeKg, 210);
    assert.equal(res.totalReps, 21);
  });

  it('parsea "E1 60kg 8,8,6" correctamente', () => {
    const res = parseExerciseLine('E1 60kg 8,8,6');
    assert.equal(res.code, 'E1');
    assert.equal(res.sets.length, 3);
    assert.deepEqual(
      res.sets.map((s) => s.reps),
      [8, 8, 6]
    );
    assert.equal(res.totalVolumeKg, 1320); // 60 * 22
    assert.equal(res.maxWeightKg, 60);
    assert.equal(res.bestEstimated1RM, calculateEpley1RM(60, 8)); // 60 * (1 + 8/30) = 76
  });

  it('parsea bloques de peso mixtos "E2 75kg 5 70kg 8, 8, 6"', () => {
    const res = parseExerciseLine('E2 75kg 5 70kg 8, 8, 6');
    assert.equal(res.code, 'E2');
    assert.equal(res.sets.length, 4);
    assert.deepEqual(
      res.sets.map((s) => ({ w: s.weightKg, r: s.reps })),
      [
        { w: 75, r: 5 },
        { w: 70, r: 8 },
        { w: 70, r: 8 },
        { w: 70, r: 6 },
      ]
    );
    // 75*5 (375) + 70*22 (1540) = 1915
    assert.equal(res.totalVolumeKg, 1915);
    assert.equal(res.maxWeightKg, 75);
  });

  it('parsea ejercicios omitidos "E3 no" y variantes de omisión', () => {
    const res = parseExerciseLine('E3 no');
    assert.equal(res.code, 'E3');
    assert.equal(res.isSkipped, true);
    assert.equal(res.sets.length, 0);
    assert.equal(res.totalVolumeKg, 0);
  });

  it('parsea pesos por lado y variante "E4 press militar 20 por lado 3x8"', () => {
    const res = parseExerciseLine('E4 press militar 20 por lado 3x8');
    assert.equal(res.code, 'E4');
    assert.equal(res.customVariantName, 'Press Militar');
    assert.equal(res.isSubstituted, true);
    assert.equal(res.isPerSideWeight, true);
    assert.equal(res.enteredWeightPerSideKg, 20);
    assert.equal(res.maxWeightKg, 40); // 20 * 2
    assert.equal(res.sets.length, 3);
    assert.equal(res.totalVolumeKg, 960); // 40 * 24
  });

  it('detecta selector de polea simple vs "doble polea más pesada" sin contaminar customVariantName, y drop sets en E4 Piernas', () => {
    const single = parseExerciseLine('E1 polea simple 55kg 10,10,8');
    const double = parseExerciseLine('E1 doble polea más pesada 72,5kg 8,8,6');
    assert.equal(single.pulleyType, 'single');
    assert.equal(single.customVariantName, undefined);
    assert.equal(double.pulleyType, 'double');
    assert.equal(double.customVariantName, undefined);
    assert.equal(double.isSubstituted, false);
    assert.equal(double.maxWeightKg, 72.5);

    const drop = parseExerciseLine('E4 dropset 60kg 12 -> 50kg 10 -> 40kg 10');
    assert.equal(drop.isDropSet, true);
    assert.equal(drop.sets.length, 3);
    assert.equal(drop.sets[0].isDropSetStep, false);
    assert.equal(drop.sets[1].isDropSetStep, true);
    assert.equal(drop.sets[2].isDropSetStep, true);
  });

  it('soporta pesos sin sufijo "kg", separadores con guiones ("8-8-6") y ejercicios de peso corporal', () => {
    const unitless = parseExerciseLine('E1 60 8,8,6');
    assert.equal(unitless.maxWeightKg, 60);
    assert.equal(unitless.totalVolumeKg, 1320);

    const unitlessMixed = parseExerciseLine('E2 75 5 70 8, 8, 6');
    assert.equal(unitlessMixed.sets.length, 4);
    assert.equal(unitlessMixed.totalVolumeKg, 1915);

    const hyphenated = parseExerciseLine('E1 60kg 8-8-6');
    assert.deepEqual(
      hyphenated.sets.map((s) => s.reps),
      [8, 8, 6]
    );

    const bodyweight = parseExerciseLine('E0 abs 3x15');
    assert.equal(bodyweight.sets.length, 3);
    assert.equal(bodyweight.maxWeightKg, 0);
    assert.equal(bodyweight.totalReps, 45);
  });

  it('lanza error controlado ante entradas vacías, códigos fuera de E0-E6 o líneas sin series válidas', () => {
    assert.throws(() => parseExerciseLine(''), /vacía/);
    assert.throws(() => parseExerciseLine('E8 50kg 3x10'), /Formato inválido/);
    assert.throws(() => parseExerciseLine('E1 60kg'), /No se detectaron series/);
    assert.throws(() => parseExerciseLine('E1 texto sin numeros'), /No se detectaron series/);
  });
});

describe('2. Métricas, Epley 1RM, Grupos Musculares y Nutrición (metrics.ts)', () => {
  it('calcula Volumen y 1RM Epley con precisión y maneja valores 0 o negativos', () => {
    assert.equal(calculateSetVolume(60, 10), 600);
    assert.equal(calculateSetVolume(0, 10), 0);
    assert.equal(calculateEpley1RM(60, 10), 80); // 60 * (1 + 10/30) = 80
    assert.equal(calculateEpley1RM(100, 0), 0);
  });

  it('calcula distribución por los 6 grupos musculares', () => {
    const log = parseWorkoutLog('E1 60kg 10,10,10\nE5 30kg 10,10,10');
    const dist = calculateMuscleDistribution(
      log.map((entry) => ({ entry, dayType: 'push' as const }))
    );
    const chest = dist.find((d) => d.muscleGroup === 'chest')!;
    const arms = dist.find((d) => d.muscleGroup === 'arms')!;
    assert.equal(chest.volumeKg, 1800);
    assert.equal(arms.volumeKg, 900);
    assert.equal(chest.volumePercentage, 66.67);
    assert.equal(arms.volumePercentage, 33.33);
  });

  it('calcula TDEE (BMR 1650 + activas), ratio proteína/kg (70.5kg) y clasifica Déficit vs Refeed', () => {
    const deficit = analyzeDailyNutrition({
      date: '2026-10-16',
      caloriesConsumed: 2450,
      proteinG: 165,
      carbsG: 250,
      fatG: 60,
      steps: 12000,
      activeMinutes: 75,
      activeBurnedKcal: 1150,
    });
    assert.equal(deficit.tdeeKcal, 2800); // 1650 + 1150
    assert.equal(deficit.energyBalanceKcal, -350);
    assert.equal(deficit.proteinPerKg, 2.34); // 165 / 70.5
    assert.equal(deficit.classification, 'clean_deficit');

    const refeed = analyzeDailyNutrition({
      date: '2026-10-17',
      caloriesConsumed: 3050,
      proteinG: 155,
      carbsG: 420,
      fatG: 65,
      steps: 10000,
      activeMinutes: 60,
      activeBurnedKcal: 1150,
    });
    assert.equal(refeed.energyBalanceKcal, 250);
    assert.equal(refeed.classification, 'glycogen_refeed');
  });
});

describe('3. Motor de Doble Progresión y Detector de Récords (progressionEngine.ts)', () => {
  it('recomienda mantener peso y subir reps cuando no se alcanzó el tope del rango', () => {
    const prev = parseExerciseLine('E1 60kg 8,8,6'); // Rango E1 push: 6-10
    const rec = generateExerciseRoadmap('push', 'E1', 'accumulation', prev);
    assert.equal(rec.action, 'increase_reps');
    assert.equal(rec.recommendedWeightKg, 60);
    assert.equal(rec.recommendedRepsTarget, '[9, 9, 7]');
  });

  it('recomienda subir peso (+incremento) y volver al mínimo del rango cuando todas las series llegan al tope', () => {
    const prev = parseExerciseLine('E1 60kg 10,10,10'); // Tope 10 alcanzado en las 3 series
    const rec = generateExerciseRoadmap('push', 'E1', 'accumulation', prev);
    assert.equal(rec.action, 'increase_weight');
    assert.equal(rec.recommendedWeightKg, 62.5);
    assert.equal(rec.recommendedRepsTarget, '3x6');
  });

  it('recomienda consolidar peso cuando la sesión anterior tuvo bloques mixtos ("E2 75kg 5 70kg 8, 8, 6")', () => {
    const prev = parseExerciseLine('E2 75kg 5 70kg 8, 8, 6'); // Rango E2 push: 8-10, 75kg x 5 quedó < 8
    const rec = generateExerciseRoadmap('push', 'E2', 'accumulation', prev);
    assert.equal(rec.action, 'consolidate_weight');
    assert.equal(rec.recommendedWeightKg, 70);
  });

  it('aplica ajustes en Descarga Activa, Descarga Total y Reactivación', () => {
    const prev = parseExerciseLine('E1 60kg 8,8,8');
    const activeDeload = generateExerciseRoadmap('push', 'E1', 'active_deload', prev);
    assert.equal(activeDeload.action, 'deload_active');
    assert.equal(activeDeload.recommendedWeightKg, 55); // ~90% de 60 redondeado a 2.5kg
    assert.equal(activeDeload.recommendedSets, 2);

    const fullDeload = generateExerciseRoadmap('push', 'E1', 'full_deload', prev);
    assert.equal(fullDeload.action, 'deload_full');
    assert.equal(fullDeload.recommendedSets, 0);

    const reactivation = generateExerciseRoadmap('push', 'E1', 'reactivation', prev);
    assert.equal(reactivation.action, 'reactivate');
    assert.equal(reactivation.recommendedWeightKg, 57.5);

    const lightPrev = parseExerciseLine('E0 = ruso 10kg 3x7');
    const lightDeload = generateExerciseRoadmap('push', 'E0', 'active_deload', lightPrev);
    assert.equal(lightDeload.recommendedWeightKg, 7.5);
  });

  it('detecta récords (🏆) de peso, volumen y 1RM separando por tipo de polea y por variante de ejercicio', () => {
    const historySingle = [parseExerciseLine('E1 polea simple 55kg 10,10,10')];
    const currentDouble = parseExerciseLine('E1 doble polea 70kg 8,8,8');
    assert.equal(detectPersonalRecords(currentDouble, historySingle).length, 0);

    const historyRearDelt = [parseExerciseLine('E4 15kg 10,10,10')];
    const currentMilitaryPress = parseExerciseLine('E4 press militar 20 por lado 3x8');
    assert.equal(detectPersonalRecords(currentMilitaryPress, historyRearDelt).length, 0);

    const currentSinglePR = parseExerciseLine('E1 polea simple 60kg 10,10,10');
    const prs = detectPersonalRecords(currentSinglePR, historySingle);
    assert.equal(prs.length, 3);
    assert.deepEqual(
      prs.map((p) => p.type),
      ['max_weight', 'max_volume', 'max_1rm']
    );
  });

  it('genera la Hoja de Ruta completa del Día para Empuje (7 ejercicios) y Piernas (6 ejercicios)', () => {
    const pushRoadmap = generateDayRoadmap('push', 'accumulation', []);
    const legsRoadmap = generateDayRoadmap('legs', 'accumulation', []);
    assert.equal(pushRoadmap.length, 7);
    assert.equal(legsRoadmap.length, 6);
  });
});

describe('4. Configuración de 2, 3, 4 y 5 Días + Biblioteca Gráfica Libre de Copyright', () => {
  it('construye rutinas válidas para 2, 3, 4 y 5 días manteniendo los ejercicios base enviados por el usuario', () => {
    for (const count of [2, 3, 4, 5] as GymDaysCount[]) {
      const routine = buildDefaultSplitRoutine(count);
      assert.equal(routine.length, count);
      for (const day of routine) {
        assert.ok(day.exercises.length >= 5);
        const roadmap = generateConfiguredDayRoadmap(day, 'accumulation', []);
        assert.equal(roadmap.length, day.exercises.length);
      }
    }

    const base3 = buildDefaultSplitRoutine(3);
    assert.equal(base3[0].exercises[1].customName, 'Press Plano (Banca)');
    assert.equal(base3[1].exercises[1].customName, 'Prensa Inclinada 45°');
    assert.equal(base3[2].exercises[1].customName, 'Jalón al Pecho');
  });

  it('verifica que todos los ejercicios de la biblioteca tengan guía paso a paso, patrón SVG y URLs de Dominio Público (free-exercise-db)', () => {
    assert.ok(GYM_EXERCISE_LIBRARY.length >= 20);
    assert.ok(OPEN_EXERCISE_SOURCES.length >= 4);

    for (const ex of GYM_EXERCISE_LIBRARY) {
      assert.equal(ex.executionSteps.length, 3);
      assert.ok(ex.commonMistake.length > 5);
      assert.equal(ex.freeExerciseDbUrls.length, 2);
      assert.match(ex.freeExerciseDbUrls[0], /^https:\/\/raw\.githubusercontent\.com\/yuhonas\/free-exercise-db\/main\/exercises\/.+\/0\.jpg$/);
      assert.match(ex.freeExerciseDbUrls[1], /^https:\/\/raw\.githubusercontent\.com\/yuhonas\/free-exercise-db\/main\/exercises\/.+\/1\.jpg$/);
    }

    // Verificar que findLibraryExerciseByNameOrCode resuelva variantes como "Press Militar" en E4 de Empuje
    const resolvedVariant = findLibraryExerciseByNameOrCode('push', 'E4', 'Press Militar');
    assert.equal(resolvedVariant.id, 'press_militar');
    assert.equal(resolvedVariant.movementPattern, 'overhead_press');

    // Verificar que los 21 patrones biomecánicos tengan un case dedicado en ExerciseVisualModal.tsx sin caer en un default genérico
    const allPatterns: VisualMovementPattern[] = [
      'russian_twist',
      'bench_press',
      'incline_press',
      'pec_deck',
      'rear_delt_fly',
      'overhead_press',
      'skullcrusher',
      'tricep_pushdown',
      'leg_press',
      'leg_extension',
      'leg_curl',
      'calf_raise',
      'hip_adduction',
      'lat_pulldown',
      'seated_row',
      'back_extension',
      'lateral_raise',
      'incline_curl',
      'cable_curl',
      'romanian_deadlift',
      'hip_thrust',
    ];
    const modalSource = readFileSync(
      new URL('../../components/ExerciseVisualModal.tsx', import.meta.url),
      'utf8'
    );
    for (const pat of allPatterns) {
      assert.ok(
        modalSource.includes(`case '${pat}': {`),
        `Falta escena SVG dedicada para el patrón biomecánico: ${pat}`
      );
    }
    assert.ok(!modalSource.includes('default: {'), 'No debe existir un bloque default que mezcle patrones distintos');
  });
});

describe('5. Récords Insignia en Pantalla Principal (1 Pecho, 1 Piernas, 1 Espalda) y Dashboard Semanal de 4 Semanas', () => {
  it('extrae exactamente 3 PRs (1 Pecho, 1 Piernas, 1 Espalda) con su peso récord, emoji trofeo y desafío a superar', () => {
    const routine3 = buildDefaultSplitRoutine(3);
    const big3 = computeHeroBig3PRs(INITIAL_4WEEK_SNAPSHOTS, routine3);

    assert.equal(big3.length, 3);
    assert.deepEqual(
      big3.map((c) => c.category),
      ['chest', 'legs', 'back']
    );

    const chestPR = big3[0];
    const legsPR = big3[1];
    const backPR = big3[2];

    assert.equal(chestPR.emoji, '🏆');
    assert.equal(chestPR.exerciseName, 'Press Plano (Banca)');
    assert.equal(chestPR.maxWeightKg, 60);
    assert.equal(chestPR.repsAtMaxWeight, 8);
    assert.equal(chestPR.estimated1RMKg, 76);

    assert.equal(legsPR.exerciseName, 'Prensa Inclinada 45°');
    assert.equal(legsPR.maxWeightKg, 160);
    assert.equal(legsPR.repsAtMaxWeight, 10);

    assert.equal(backPR.exerciseName, 'Jalón al Pecho');
    assert.equal(backPR.maxWeightKg, 70);
    assert.equal(backPR.pulleyNote, 'Doble Polea');
  });

  it('permite cambiar qué ejercicio específico de Pecho, Piernas o Espalda mostrar en las 3 tarjetas de PR y maneja historiales vacíos', () => {
    const routine3 = buildDefaultSplitRoutine(3);
    const customBig3 = computeHeroBig3PRs(INITIAL_4WEEK_SNAPSHOTS, routine3, {
      chest: 'press_inclinado',
      legs: 'sillon_cuadriceps',
      back: 'remo_polea_maquina',
    });

    assert.equal(customBig3[0].exerciseName, 'Press Inclinado');
    assert.equal(customBig3[0].maxWeightKg, 75);
    assert.equal(customBig3[1].exerciseName, 'Sillón de Cuádriceps');
    assert.equal(customBig3[1].maxWeightKg, 65);
    assert.equal(customBig3[2].exerciseName, 'Remo en Polea / Máquina');
    assert.equal(customBig3[2].maxWeightKg, 70);

    const emptyBig3 = computeHeroBig3PRs([], routine3);
    assert.equal(emptyBig3.length, 3);
    assert.equal(emptyBig3[0].maxWeightKg, 0);
    assert.equal(emptyBig3[0].bestSetFormatted, 'Sin series aún');
  });

  it('calcula los 4 componentes del Dashboard Semanal (ventana móvil de 4 semanas) y tendencias porcentuales Δ%', () => {
    const routine3 = buildDefaultSplitRoutine(3);
    const dashboard = computeWeeklyDashboardSummary(INITIAL_4WEEK_SNAPSHOTS, routine3);

    // 1. Ventana de 4 semanas con volumen creciente
    assert.equal(dashboard.weeks.length, 4);
    assert.equal(dashboard.weeks[0].deltaVsPrevWeekPercent, null);
    assert.ok(dashboard.weeks[3].totalVolumeKg > dashboard.weeks[0].totalVolumeKg);
    assert.ok((dashboard.weeks[3].deltaVsPrevWeekPercent ?? 0) > 0);

    // 2. Comparativa de carga por día (3 días configurados)
    assert.equal(dashboard.dayLoadComparison.length, 3);
    assert.ok(dashboard.dayLoadComparison[0].deltaCyclePercent > 0);

    // 3. Tendencia de los 6 grupos musculares
    assert.equal(dashboard.muscleVolumeTrends.length, 6);
    const chestTrend = dashboard.muscleVolumeTrends.find((m) => m.muscleGroup === 'chest')!;
    assert.ok(chestTrend.deltaCyclePercent > 0);

    // 4. Evolución de cargas pico y 1RM estimado en los ejercicios principales
    assert.equal(dashboard.keyExerciseProgression.length, 6); // E1 y E2 de cada uno de los 3 días
    const benchProg = dashboard.keyExerciseProgression.find((k) => k.slotKey === 'push:E1')!;
    assert.deepEqual(benchProg.peakWeightByWeek, [55, 57.5, 60, 60]);
    assert.equal(benchProg.weightDeltaPercent, 9.09);
  });

  it('mantiene PRs exactos y hojas de ruta coherentes al cambiar al Split de 2 Días (upper / lower)', () => {
    const routine2 = buildDefaultSplitRoutine(2);
    assert.equal(routine2[0].dayId, 'upper');
    assert.equal(routine2[1].dayId, 'lower');

    const big3In2Days = computeHeroBig3PRs(INITIAL_4WEEK_SNAPSHOTS, routine2);
    assert.equal(big3In2Days[0].maxWeightKg, 60); // Press Plano
    assert.equal(big3In2Days[1].maxWeightKg, 160); // Prensa Inclinada
    assert.equal(big3In2Days[2].exerciseName, 'Jalón al Pecho');
    assert.equal(big3In2Days[2].maxWeightKg, 70); // No se contamina con los 45kg de Mariposa
    assert.equal(big3In2Days[2].pulleyNote, 'Doble Polea');

    // Verificar que la hoja de ruta del Día 1 (upper) en 2 días no renombre Remo en Polea (E4) a Press Militar
    const prevUpperEntries = parseWorkoutLog(INITIAL_4WEEK_SNAPSHOTS[2].logsByDayId.upper!);
    const upperRoadmap = generateConfiguredDayRoadmap(routine2[0], 'accumulation', prevUpperEntries);
    const e4Row = upperRoadmap.find((r) => r.code === 'E4')!;
    const e5Military = upperRoadmap.find((r) => r.code === 'E5')!;
    assert.equal(e4Row.exerciseName, 'Remo en Polea / Máquina');
    assert.equal(e4Row.recommendedWeightKg, 70); // 65kg 10,10,10 + 5kg = 70kg
    assert.equal(e5Military.exerciseName, 'Press Militar');
  });

  it('respeta preferredExerciseIds aunque el ejercicio elegido no esté en el split activo y escanea frecuencia 2 en 4d/5d', () => {
    const routine3 = buildDefaultSplitRoutine(3);
    // Elegir RDL (de Día 5) y Dominadas Neutras (de Día 4) estando en el split de 3 días
    const crossSplitPRs = computeHeroBig3PRs(INITIAL_4WEEK_SNAPSHOTS, routine3, {
      chest: 'press_plano',
      legs: 'peso_muerto_rumano',
      back: 'dominadas_neutras',
    });
    assert.equal(crossSplitPRs[1].exerciseId, 'peso_muerto_rumano');
    assert.equal(crossSplitPRs[1].exerciseName, 'Peso Muerto Rumano (RDL)');
    assert.equal(crossSplitPRs[1].maxWeightKg, 95);
    assert.equal(crossSplitPRs[2].exerciseId, 'dominadas_neutras');
    assert.equal(crossSplitPRs[2].exerciseName, 'Dominadas / Jalón Agarre Neutro');
    assert.equal(crossSplitPRs[2].maxWeightKg, 67.5);

    // Verificar escaneo multi-día en frecuencia 2 (4 días: press_inclinado está en push:E2 y day4:E3)
    const routine4 = buildDefaultSplitRoutine(4);
    const customWeeks = INITIAL_4WEEK_SNAPSHOTS.map((w, idx) =>
      idx === 3
        ? {
            ...w,
            logsByDayId: {
              ...w.logsByDayId,
              day4: 'E3 82.5kg 8,8,8',
            },
          }
        : w
    );
    const freq2PRs = computeHeroBig3PRs(customWeeks, routine4, {
      chest: 'press_inclinado',
    });
    assert.equal(freq2PRs[0].exerciseId, 'press_inclinado');
    assert.equal(freq2PRs[0].maxWeightKg, 82.5);
  });

  it('actualiza correctamente el nombre y recomendación cuando el usuario cambia un slot en RoutineConfigurator frente a una variante previa', () => {
    const routine3 = buildDefaultSplitRoutine(3);
    const prevPushEntries = parseWorkoutLog(INITIAL_4WEEK_SNAPSHOTS[2].logsByDayId.push!);

    // En la rutina base, E4 es Hombro Posterior y el log previo tiene la variante permitida "Press Militar"
    const defaultRoadmap = generateConfiguredDayRoadmap(routine3[0], 'accumulation', prevPushEntries);
    assert.equal(defaultRoadmap.find((r) => r.code === 'E4')!.exerciseName, 'Press Militar');

    // Si el usuario reconfigura E4 a "Vuelos Laterales", no debe quedar pegado en "Press Militar"
    const customizedPushDay = {
      ...routine3[0],
      exercises: routine3[0].exercises.map((s) =>
        s.code === 'E4'
          ? {
              ...s,
              libraryExerciseId: 'vuelos_laterales',
              customName: 'Vuelos Laterales',
            }
          : s
      ),
    };
    const updatedRoadmap = generateConfiguredDayRoadmap(
      customizedPushDay,
      'accumulation',
      prevPushEntries
    );
    const e4Updated = updatedRoadmap.find((r) => r.code === 'E4')!;
    assert.equal(e4Updated.exerciseName, 'Vuelos Laterales');
    assert.equal(e4Updated.action, 'baseline');
  });
});

describe('6. Salón de Récords Personales, Matriz 1RM Epley y Usabilidad Móvil', () => {
  it('detecta correctamente los récords históricos acumulados a lo largo de las 4 semanas sin duplicar marcas inferiores', () => {
    const routine3 = buildDefaultSplitRoutine(3);
    const prEvents: string[] = [];

    for (let wIdx = 0; wIdx < INITIAL_4WEEK_SNAPSHOTS.length; wIdx++) {
      const week = INITIAL_4WEEK_SNAPSHOTS[wIdx];
      const priorWeeks = INITIAL_4WEEK_SNAPSHOTS.slice(0, wIdx);

      for (const day of routine3) {
        const currentEntries = parseWorkoutLog(week.logsByDayId[day.dayId] ?? '');
        const historicalEntries = priorWeeks.flatMap((w) =>
          parseWorkoutLog(w.logsByDayId[day.dayId] ?? '')
        );

        for (const entry of currentEntries) {
          const prs = detectPersonalRecords(entry, historicalEntries);
          for (const pr of prs) {
            prEvents.push(`${week.weekLabel} - ${entry.code} - ${pr.label}: ${pr.newValue}kg`);
          }
        }
      }
    }

    // Debe detectar múltiples récords progresivos en semanas 2, 3 y 4
    assert.ok(prEvents.length > 5, 'Deben existir múltiples récords personales detectados en el mesociclo');
    assert.ok(
      prEvents.some((p) => p.includes('Semana 2') && p.includes('E1') && p.includes('57.5kg')),
      'Debe detectar la subida de Press Plano a 57.5kg en Semana 2'
    );
    assert.ok(
      prEvents.some((p) => p.includes('Semana 3') && p.includes('E1') && p.includes('60kg')),
      'Debe detectar la subida de Press Plano a 60kg en Semana 3'
    );
  });

  it('verifica la proyección de cargas según la fórmula Epley (1 a 12 reps) para un 1RM dado', () => {
    const oneRm = 100; // 100 kg 1RM teórico
    const repsList = [1, 3, 5, 8, 10, 12];
    const calcWeight = (reps: number) => Math.round((oneRm / (1 + reps / 30)) * 2) / 2;

    const weights = repsList.map(calcWeight);
    // Para 1 rep: 100 / (1 + 1/30) = 100 / 1.0333 = 96.8 -> 97
    // A mayor repetición, la carga debe ser estrictamente decreciente
    for (let i = 1; i < weights.length; i++) {
      assert.ok(
        weights[i] < weights[i - 1],
        `La carga proyectada para ${repsList[i]} reps (${weights[i]}kg) debe ser menor a la de ${repsList[i - 1]} reps (${weights[i - 1]}kg)`
      );
    }
    // Con 10 reps: 100 / (1 + 10/30) = 100 / 1.333 = 75 kg exactos
    assert.equal(calcWeight(10), 75);
    // Con 30 reps daría la mitad del peso (50 kg)
    assert.equal(calcWeight(30), 50);
  });

  it('verifica que App.tsx y ExerciseVisualModal.tsx incluyan soporte para dismiss móvil y safe-area insets', () => {
    const appSource = readFileSync(
      new URL('../../App.tsx', import.meta.url),
      'utf8'
    );
    assert.ok(
      appSource.includes('safe-area-inset-bottom'),
      'App.tsx debe contemplar env(safe-area-inset-bottom) en su barra inferior docked'
    );
    assert.ok(
      appSource.includes('allHistoricalPRs'),
      'App.tsx debe calcular el Salón de la Fama de Récords'
    );

    const modalSource = readFileSync(
      new URL('../../components/ExerciseVisualModal.tsx', import.meta.url),
      'utf8'
    );
    assert.ok(
      modalSource.includes("e.key === 'Escape'"),
      'ExerciseVisualModal debe admitir cierre con tecla Escape'
    );
    assert.ok(
      modalSource.includes('onClick={onClose}'),
      'ExerciseVisualModal debe cerrar al hacer tap en el backdrop oscuro'
    );
  });
});



