import { useEffect, useMemo, useState } from 'react';
import { ExerciseKinematicSvg, ExerciseVisualModal } from './components/ExerciseVisualModal.tsx';
import { RoutineConfigurator } from './components/RoutineConfigurator.tsx';
import { WeeklyDashboardView } from './components/WeeklyDashboardView.tsx';
import { analyzeDailyNutrition } from './core/metrics.ts';
import { parseWorkoutLog } from './core/nlpParser.ts';
import { detectPersonalRecords, generateConfiguredDayRoadmap } from './core/progressionEngine.ts';
import {
  INITIAL_4WEEK_SNAPSHOTS,
  computeHeroBig3PRs,
  computeWeeklyDashboardSummary,
  safeParseLog,
} from './core/weeklyDashboard.ts';
import { MUSCLE_GROUP_LABELS } from './data/exerciseCatalog.ts';
import {
  GYM_EXERCISE_LIBRARY,
  OPEN_EXERCISE_SOURCES,
  buildDefaultSplitRoutine,
  findLibraryExerciseByNameOrCode,
  getLibraryExerciseById,
} from './data/gymExerciseLibrary.ts';
import type {
  ConfiguredDayRoutine,
  ConfiguredExerciseSlot,
  ExerciseCode,
  ExtendedDayId,
  GymDaysCount,
  GymLibraryExercise,
  HeroPRCategory,
  WeekLogSnapshot,
  WeekState,
} from './types/workout.ts';

type MainViewTab = 'home_dashboard' | 'workout_session' | 'routine_config' | 'visual_library';

const STORAGE_KEY = 'hypertrophy_tracker_state_v1';

interface PersistedAppState {
  daysCount: GymDaysCount;
  routineDays: ConfiguredDayRoutine[];
  weeksData: WeekLogSnapshot[];
  preferredPRIds: Record<HeroPRCategory, string>;
}

function loadPersistedState(): Partial<PersistedAppState> {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return {};
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<PersistedAppState>;
  } catch {
    return {};
  }
}

export default function App() {
  const initialSaved = useMemo(() => loadPersistedState(), []);

  // 1. Cantidad de días configurados (2, 3, 4 o 5 días) + Rutina activa
  const [daysCount, setDaysCount] = useState<GymDaysCount>(() => initialSaved.daysCount ?? 3);
  const [routineDays, setRoutineDays] = useState<ConfiguredDayRoutine[]>(
    () => initialSaved.routineDays ?? buildDefaultSplitRoutine(initialSaved.daysCount ?? 3)
  );
  const [activeDayId, setActiveDayId] = useState<ExtendedDayId>(
    () => initialSaved.routineDays?.[0]?.dayId ?? 'push'
  );

  // 2. Ventana móvil de 4 semanas (Mesociclo)
  const [weeksData, setWeeksData] = useState<WeekLogSnapshot[]>(
    () => initialSaved.weeksData ?? INITIAL_4WEEK_SNAPSHOTS
  );
  const [selectedWeekIdx, setSelectedWeekIdx] = useState<number>(() =>
    Math.max(0, (initialSaved.weeksData ?? INITIAL_4WEEK_SNAPSHOTS).length - 1)
  );

  // 3. Selección de ejercicio favorito para cada una de las 3 tarjetas de PR (Pecho, Piernas, Espalda)
  const [preferredPRIds, setPreferredPRIds] = useState<Record<HeroPRCategory, string>>(
    () =>
      initialSaved.preferredPRIds ?? {
        chest: 'press_plano',
        legs: 'prensa_inclinada',
        back: 'jalon_pecho',
      }
  );

  // 4. Pestaña activa y modal de demostración gráfica
  const [activeTab, setActiveTab] = useState<MainViewTab>('home_dashboard');
  const [inspectedExercise, setInspectedExercise] = useState<GymLibraryExercise | null>(null);
  const [libraryFilterGroup, setLibraryFilterGroup] = useState<string>('all');

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const payload: PersistedAppState = {
          daysCount,
          routineDays,
          weeksData,
          preferredPRIds,
        };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      }
    } catch {
      // Ignorar errores de cuota en modo privado
    }
  }, [daysCount, routineDays, weeksData, preferredPRIds]);

  const handleDaysCountChange = (newCount: GymDaysCount) => {
    setDaysCount(newCount);
    const nextRoutine = buildDefaultSplitRoutine(newCount);
    setRoutineDays(nextRoutine);
    if (!nextRoutine.some((d) => d.dayId === activeDayId)) {
      setActiveDayId(nextRoutine[0].dayId);
    }
  };

  const handleUpdateSlot = (
    dayIndex: number,
    code: ExerciseCode,
    updatedSlot: ConfiguredExerciseSlot
  ) => {
    setRoutineDays((prev) =>
      prev.map((day, idx) =>
        idx === dayIndex
          ? {
              ...day,
              exercises: day.exercises.map((s) => (s.code === code ? updatedSlot : s)),
            }
          : day
      )
    );
  };

  const handleResetToBaseDefaults = () => {
    setRoutineDays(buildDefaultSplitRoutine(daysCount));
  };

  const currentWeek = weeksData[selectedWeekIdx] ?? weeksData[weeksData.length - 1];
  const previousWeek =
    selectedWeekIdx > 0 ? weeksData[selectedWeekIdx - 1] : undefined;

  const activeDayRoutine =
    routineDays.find((d) => d.dayId === activeDayId) ?? routineDays[0];

  const rawInputForActiveDay = currentWeek.logsByDayId[activeDayRoutine.dayId] ?? '';

  const handleRawInputChange = (value: string) => {
    setWeeksData((prev) =>
      prev.map((w, idx) =>
        idx === selectedWeekIdx
          ? {
              ...w,
              logsByDayId: {
                ...w.logsByDayId,
                [activeDayRoutine.dayId]: value,
              },
            }
          : w
      )
    );
  };

  const handleWeekStateChange = (newState: WeekState) => {
    setWeeksData((prev) =>
      prev.map((w, idx) => (idx === selectedWeekIdx ? { ...w, weekState: newState } : w))
    );
  };

  // Cálculo en tiempo real de los 3 PRs Insignia (1 Pecho, 1 Piernas, 1 Espalda)
  const heroBig3PRs = useMemo(
    () => computeHeroBig3PRs(weeksData, routineDays, preferredPRIds),
    [weeksData, routineDays, preferredPRIds]
  );

  // Cálculo en tiempo real del Dashboard Semanal (ventana móvil de 4 semanas)
  const weeklyDashboard = useMemo(
    () => computeWeeklyDashboardSummary(weeksData, routineDays),
    [weeksData, routineDays]
  );

  // Entradas de la sesión inmediata anterior para la Hoja de Ruta (Doble Progresión)
  const previousDayEntries = useMemo(() => {
    const rawPrev = previousWeek?.logsByDayId[activeDayRoutine.dayId] ?? '';
    return safeParseLog(rawPrev);
  }, [previousWeek, activeDayRoutine.dayId]);

  // Historial acumulado de todas las semanas previas para el Detector de Récords (🏆)
  const historicalDayEntries = useMemo(() => {
    const priorWeeks = weeksData.slice(0, selectedWeekIdx);
    return priorWeeks.flatMap((w) => safeParseLog(w.logsByDayId[activeDayRoutine.dayId]));
  }, [weeksData, selectedWeekIdx, activeDayRoutine.dayId]);

  // Hoja de Ruta adaptada al día configurado
  const roadmap = useMemo(
    () =>
      generateConfiguredDayRoadmap(
        activeDayRoutine,
        currentWeek.weekState,
        previousDayEntries
      ),
    [activeDayRoutine, currentWeek.weekState, previousDayEntries]
  );

  // Parseo en vivo de la sesión actual
  const parsedCurrent = useMemo(() => {
    try {
      return { entries: parseWorkoutLog(rawInputForActiveDay), error: null };
    } catch (err) {
      return {
        entries: safeParseLog(rawInputForActiveDay),
        error: err instanceof Error ? err.message : 'Error de formato',
      };
    }
  }, [rawInputForActiveDay]);

  const sampleNutrition = useMemo(
    () =>
      analyzeDailyNutrition({
        date: new Date().toISOString().slice(0, 10),
        caloriesConsumed: 2450,
        proteinG: 165,
        carbsG: 280,
        fatG: 62,
        steps: 12450,
        activeMinutes: 75,
        activeBurnedKcal: 1150,
      }),
    []
  );

  const filteredLibraryExercises = useMemo(() => {
    if (libraryFilterGroup === 'all') return GYM_EXERCISE_LIBRARY;
    return GYM_EXERCISE_LIBRARY.filter((ex) => ex.muscleGroup === libraryFilterGroup);
  }, [libraryFilterGroup]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* CABECERA PRINCIPAL + CONFIGURADOR RÁPIDO DE DÍAS (2, 3, 4, 5 DÍAS) */}
      <header className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 md:p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-emerald-400">
              Hypertrophy & Overload Tracker
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Split Activo: {daysCount} Días / Semana
            </span>
          </div>
          <p className="text-xs md:text-sm text-zinc-400 mt-1">
            Dashboard Semanal • Récords Insignia (🏆) • Doble Progresión • Guía Gráfica de Ejercicios
          </p>
        </div>

        {/* Selector Rápido de Días (2, 3, 4 o 5 días) */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl p-2">
          <span className="text-xs font-semibold text-zinc-400 px-2">
            ¿Cuántos días vas al gym?
          </span>
          <div className="flex gap-1.5">
            {([2, 3, 4, 5] as GymDaysCount[]).map((cnt) => (
              <button
                key={cnt}
                onClick={() => handleDaysCountChange(cnt)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  daysCount === cnt
                    ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                    : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                {cnt} Días
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* SECCIÓN ESTRELLA: LOS 3 PRs INSIGNIA (1 PECHO, 1 PIERNAS, 1 ESPALDA) */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-lg md:text-xl font-extrabold text-zinc-100 flex items-center gap-2">
              <span>🏆 Récords Registrados a Superar Hoy</span>
              <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                1 Pecho • 1 Piernas • 1 Espalda
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Tu marca máxima actual en los 3 pilares para entrar al gym diciendo:{" "}
              <strong className="text-amber-300">«¡Uh, esto hoy lo tengo que superar!»</strong>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {heroBig3PRs.map((prCard) => {
            const categoryExercises = GYM_EXERCISE_LIBRARY.filter(
              (ex) => ex.muscleGroup === prCard.category
            );
            const libExercise = getLibraryExerciseById(prCard.exerciseId);

            return (
              <div
                key={prCard.category}
                className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-900 to-amber-950/30 border border-amber-500/40 rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-lg"
              >
                {/* Encabezado de Categoría + Selector de ejercicio de ese músculo */}
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {prCard.emoji} PR de {prCard.categoryLabel}
                  </span>

                  <select
                    value={prCard.exerciseId}
                    onChange={(e) =>
                      setPreferredPRIds((prev) => ({
                        ...prev,
                        [prCard.category]: e.target.value,
                      }))
                    }
                    aria-label={`Cambiar ejercicio insignia de ${prCard.categoryLabel}`}
                    className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-[11px] text-zinc-300 focus:outline-none focus:border-amber-400"
                  >
                    {categoryExercises.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Peso Récord Grande (Ej: Press Banca 60kg 🏆) */}
                <div className="flex items-baseline justify-between gap-2 pt-1">
                  <div>
                    <div className="text-base font-bold text-zinc-100">
                      {prCard.exerciseName}
                      {prCard.pulleyNote && (
                        <span className="ml-1.5 text-xs font-normal text-sky-300">
                          ({prCard.pulleyNote})
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-400 mt-0.5">
                      Mejor serie: <strong className="text-zinc-200">{prCard.bestSetFormatted}</strong> • Logrado en {prCard.achievedWeekLabel}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-3xl font-black font-mono text-amber-400 leading-none">
                      {prCard.maxWeightKg} <span className="text-base font-bold">kg</span> 🏆
                    </div>
                    <div className="text-[11px] font-mono text-emerald-400 mt-1">
                      1RM Est: {prCard.estimated1RMKg} kg (+{prCard.cycleDeltaPercent}%)
                    </div>
                  </div>
                </div>

                {/* Desafío motivacional para superarlo hoy + botón gráfico */}
                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                  <div className="text-xs text-amber-200 font-medium leading-snug">
                    🔥 <strong>Meta a batir:</strong> {prCard.nextTargetChallenge}
                  </div>
                  <button
                    onClick={() => setInspectedExercise(libExercise)}
                    className="shrink-0 px-2.5 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-emerald-300 border border-zinc-700 text-xs font-semibold cursor-pointer"
                    title="Ver demostración gráfica del ejercicio"
                  >
                    👁️ Técnica
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* BARRA DE NAVEGACIÓN DE LA PANTALLA PRINCIPAL */}
      <nav className="flex flex-wrap gap-2 border-b border-zinc-800 pb-3">
        {(
          [
            ['home_dashboard', '📊 Dashboard Semanal + Entrenar Hoy'],
            ['routine_config', `⚙️ Configurar Días (${daysCount}d) y Ejercicios Base`],
            ['visual_library', '🏋️ Biblioteca Gráfica de Ejercicios (Sin Copyright)'],
            ['workout_session', '📝 Solo Hoja de Ruta y Parser NLP'],
          ] as Array<[MainViewTab, string]>
        ).map(([tabId, label]) => (
          <button
            key={tabId}
            onClick={() => setActiveTab(tabId)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === tabId
                ? 'bg-emerald-500 text-zinc-950'
                : 'bg-zinc-900 text-zinc-300 border border-zinc-800 hover:border-zinc-700'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* VISTA 1: DASHBOARD SEMANAL (4 SEMANAS) */}
      {activeTab === 'home_dashboard' && (
        <section className="space-y-6">
          <WeeklyDashboardView
            dashboard={weeklyDashboard}
            selectedWeekIdx={selectedWeekIdx}
            onSelectWeekIdx={setSelectedWeekIdx}
          />
        </section>
      )}

      {/* VISTA 2: CONFIGURADOR DE DÍAS (2, 3, 4, 5 DÍAS) Y EJERCICIOS BASE */}
      {activeTab === 'routine_config' && (
        <section className="space-y-6">
          <RoutineConfigurator
            daysCount={daysCount}
            onChangeDaysCount={handleDaysCountChange}
            routineDays={routineDays}
            onUpdateSlot={handleUpdateSlot}
            onResetToBaseDefaults={handleResetToBaseDefaults}
            onInspectExercise={(ex) => setInspectedExercise(ex)}
          />
        </section>
      )}

      {/* VISTA 3: BIBLIOTECA GRÁFICA DE EJERCICIOS + WEBS SIN DERECHOS DE AUTOR */}
      {activeTab === 'visual_library' && (
        <section className="space-y-6">
          {/* Explicación de fuentes abiertas sin derechos de autor */}
          <div className="bg-zinc-900 border border-emerald-500/30 rounded-2xl p-5 space-y-3">
            <h3 className="text-base font-bold text-emerald-400">
              🌐 ¿De dónde tomamos los ejercicios y sus gráficos sin derechos de autor?
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              La app combina un <strong>Motor Cinemático SVG Animado (100% Offline)</strong> con
              conexión directa a repositorios en <strong>Dominio Público (Unlicense)</strong> y{' '}
              <strong>Open Source</strong> para que puedas usar las imágenes libremente en tu APK o
              Web sin reclamos de copyright ni pagar APIs:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {OPEN_EXERCISE_SOURCES.map((src) => (
                <div
                  key={src.id}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-zinc-100">{src.name}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px]">
                      {src.license}
                    </span>
                  </div>
                  <p className="text-zinc-400">{src.description}</p>
                  <div className="text-[11px] font-mono text-amber-300 break-all">
                    {src.apiOrRawUrl}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filtro por grupo muscular */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setLibraryFilterGroup('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                libraryFilterGroup === 'all'
                  ? 'bg-emerald-500 text-zinc-950'
                  : 'bg-zinc-900 text-zinc-300 border border-zinc-800'
              }`}
            >
              Todos ({GYM_EXERCISE_LIBRARY.length})
            </button>
            {Object.entries(MUSCLE_GROUP_LABELS).map(([groupKey, label]) => (
              <button
                key={groupKey}
                onClick={() => setLibraryFilterGroup(groupKey)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  libraryFilterGroup === groupKey
                    ? 'bg-emerald-500 text-zinc-950'
                    : 'bg-zinc-900 text-zinc-300 border border-zinc-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tarjetas gráficas de cada ejercicio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLibraryExercises.map((ex) => (
              <div
                key={ex.id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-emerald-500/50 transition"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-300">
                      {MUSCLE_GROUP_LABELS[ex.muscleGroup]}
                    </span>
                    {ex.isBaseExercise && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-300">
                        Base Usuario
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-zinc-100">{ex.name}</h4>
                  <ExerciseKinematicSvg pattern={ex.movementPattern} phase={1} />
                  <p className="text-xs text-zinc-400">
                    <strong>Músculos:</strong> {ex.primaryMuscles.join(', ')}
                  </p>
                </div>

                <button
                  onClick={() => setInspectedExercise(ex)}
                  className="w-full py-2 rounded-xl bg-zinc-950 hover:bg-emerald-500 hover:text-zinc-950 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition cursor-pointer"
                >
                  👁️ Ver Animación + Fotos Paso a Paso
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECCIÓN DE ENTRENAMIENTO DEL DÍA ACTIVO (VISIBLE EN HOME Y EN SOLO ENTRENAMIENTO) */}
      {(activeTab === 'home_dashboard' || activeTab === 'workout_session') && (
        <section className="space-y-6 pt-2 border-t border-zinc-800">
          {/* Selector de Día Activo (según los 2, 3, 4 o 5 días configurados) + Estado de la Semana */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold">
                  Sesión Activa • {currentWeek.weekLabel}
                </span>
                <h2 className="text-lg font-bold text-zinc-100">
                  Selecciona el Día de Entrenamiento ({daysCount} Días Configurados)
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                {routineDays.map((d) => (
                  <button
                    key={d.dayId}
                    onClick={() => setActiveDayId(d.dayId)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      activeDayRoutine.dayId === d.dayId
                        ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                        : 'bg-zinc-950 text-zinc-300 border border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {d.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Selector de Estado de Semana (Mesociclo) */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800/80">
              <span className="text-xs text-zinc-400">
                Estado de <strong>{currentWeek.weekLabel}</strong>:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    ['accumulation', 'Acumulación / Sobrecarga'],
                    ['active_deload', 'Descarga Activa'],
                    ['full_deload', 'Descarga Total'],
                    ['reactivation', 'Reactivación'],
                  ] as Array<[WeekState, string]>
                ).map(([stateKey, label]) => (
                  <button
                    key={stateKey}
                    onClick={() => handleWeekStateChange(stateKey)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                      currentWeek.weekState === stateKey
                        ? 'bg-amber-500 text-zinc-950 font-bold'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Hoja de Ruta del Día con botón para ver representación gráfica de cada ejercicio */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-100">
                Hoja de Ruta de Hoy — {activeDayRoutine.title}
              </h3>
              <button
                onClick={() => setActiveTab('routine_config')}
                className="text-xs text-emerald-400 hover:underline cursor-pointer"
              >
                ⚙️ Cambiar ejercicios o cantidad de días
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {roadmap.map((item) => {
                const slot =
                  activeDayRoutine.exercises.find((s) => s.code === item.code) ??
                  activeDayRoutine.exercises[0];
                const libExercise =
                  item.exerciseName !== slot.customName
                    ? findLibraryExerciseByNameOrCode(
                        activeDayRoutine.baseDayType,
                        item.code,
                        item.exerciseName
                      )
                    : getLibraryExerciseById(slot.libraryExerciseId);

                return (
                  <div
                    key={item.code}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2 flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-emerald-400">
                          {item.code} • {item.exerciseName}
                          {item.pulleyType === 'double'
                            ? ' (Doble Polea)'
                            : item.pulleyType === 'single'
                            ? ' (Polea Simple)'
                            : ''}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                            {slot.repRange[0]}-{slot.repRange[1]} reps
                          </span>
                          <button
                            onClick={() => setInspectedExercise(libExercise)}
                            className="px-2 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold cursor-pointer"
                            title="Ver representación gráfica de cómo se hace el ejercicio"
                          >
                            👁️ Cómo se hace
                          </button>
                        </div>
                      </div>
                      {item.previousSessionSummary && (
                        <p className="text-xs text-zinc-400">
                          Anterior: {item.previousSessionSummary}
                        </p>
                      )}
                      <p className="text-sm text-zinc-100 font-medium">{item.coachMessage}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Entrada Rápida NLP + Resultado Interpretado con Trofeos PR */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="text-base font-bold text-zinc-100">
                Entrada Rápida NLP ({activeDayRoutine.title} • {currentWeek.weekLabel})
              </h3>
              <textarea
                value={rawInputForActiveDay}
                onChange={(e) => handleRawInputChange(e.target.value)}
                rows={8}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 font-mono text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                placeholder="Ej: E1 60kg 8,8,6"
              />
              {parsedCurrent.error && (
                <p className="text-xs text-rose-400">{parsedCurrent.error}</p>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-zinc-100">
                Series Interpretadas + Detector de Récords (🏆)
              </h3>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {parsedCurrent.entries.map((entry, idx) => {
                  const prs = detectPersonalRecords(entry, historicalDayEntries);
                  const slot = activeDayRoutine.exercises.find((s) => s.code === entry.code);
                  return (
                    <div
                      key={`${entry.code}-${idx}`}
                      className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span>
                          {entry.code} • {entry.customVariantName || slot?.customName || entry.code}
                          {entry.pulleyType === 'double'
                            ? ' [Doble Polea]'
                            : entry.pulleyType === 'single'
                            ? ' [Polea Simple]'
                            : ''}
                          {entry.isPerSideWeight
                            ? ` [${entry.enteredWeightPerSideKg}kg/lado = ${entry.maxWeightKg}kg total]`
                            : ''}
                        </span>
                        <span className="text-emerald-400">
                          Vol: {entry.totalVolumeKg} kg | 1RM: {entry.bestEstimated1RM} kg
                        </span>
                      </div>
                      {entry.isSkipped ? (
                        <p className="text-zinc-500 italic">Ejercicio omitido</p>
                      ) : (
                        <p className="text-zinc-300">
                          Series:{' '}
                          {entry.sets.map((s) => `${s.weightKg}kg×${s.reps}`).join(', ')}
                        </p>
                      )}
                      {prs.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {prs.map((pr) => (
                            <span
                              key={pr.type}
                              className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium"
                            >
                              {pr.label}: {pr.newValue}kg (+{pr.deltaPercent}%)
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tarjeta de Balance Energético & Samsung Health */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-1.5">
            <h3 className="text-sm font-bold text-zinc-100">
              Balance Energético & Samsung Health (Base 70.5 kg / BMR 1650 kcal)
            </h3>
            <p className="text-xs md:text-sm text-emerald-400 font-medium">
              {sampleNutrition.summaryMessage}
            </p>
          </div>
        </section>
      )}

      {/* MODAL INTERACTIVO DE DEMOSTRACIÓN GRÁFICA DE EJERCICIO */}
      <ExerciseVisualModal
        exercise={inspectedExercise}
        onClose={() => setInspectedExercise(null)}
      />
    </div>
  );
}
