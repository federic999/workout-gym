import { MUSCLE_GROUP_LABELS } from '../data/exerciseCatalog.ts';
import { GYM_EXERCISE_LIBRARY, getLibraryExerciseById } from '../data/gymExerciseLibrary.ts';
import type {
  ConfiguredDayRoutine,
  ConfiguredExerciseSlot,
  ExerciseCode,
  GymDaysCount,
  GymLibraryExercise,
} from '../types/workout.ts';

interface RoutineConfiguratorProps {
  daysCount: GymDaysCount;
  onChangeDaysCount: (count: GymDaysCount) => void;
  routineDays: ConfiguredDayRoutine[];
  onUpdateSlot: (
    dayIndex: number,
    code: ExerciseCode,
    updatedSlot: ConfiguredExerciseSlot
  ) => void;
  onResetToBaseDefaults: () => void;
  onInspectExercise: (exercise: GymLibraryExercise) => void;
}

const DAY_COUNT_DESCRIPTIONS: Record<GymDaysCount, string> = {
  2: '2 Días / Semana: Compacta todos tus ejercicios base en Día 1 (Tren Superior Base) y Día 2 (Piernas + Brazos Base). Ideal para semanas con poco tiempo sin perder ningún ejercicio clave.',
  3: '3 Días / Semana (Tu Split Base Original): Día 1 Empuje (Pecho/Hombro/Tríceps), Día 2 Piernas (Prensa/Cuádriceps/Isquios/Gemelos) y Día 3 Tirón (Espalda/Lumbares/Bíceps).',
  4: '4 Días / Semana: Mantiene intactos tus 3 Días Base (Empuje, Piernas, Tirón) y agrega el Día 4 de Torso / Puntos Débiles (Frecuencia 2 en hombro, pecho superior y brazos).',
  5: '5 Días / Semana: Mantiene intactos tus 3 Días Base + Día 4 (Upper Hipertrofia) + Día 5 (Pierna Posterior & Glúteo con Peso Muerto Rumano y Hip Thrust).',
};

export function RoutineConfigurator({
  daysCount,
  onChangeDaysCount,
  routineDays,
  onUpdateSlot,
  onResetToBaseDefaults,
  onInspectExercise,
}: RoutineConfiguratorProps) {
  const handleSelectLibraryExercise = (
    dayIndex: number,
    slot: ConfiguredExerciseSlot,
    newLibraryId: string
  ) => {
    const lib = getLibraryExerciseById(newLibraryId);
    onUpdateSlot(dayIndex, slot.code, {
      ...slot,
      libraryExerciseId: lib.id,
      customName: lib.name,
      muscleGroup: lib.muscleGroup,
      targetSets: lib.defaultSets,
      repRange: [...lib.defaultRepRange] as [number, number],
      weightIncrementKg: lib.defaultWeightIncrementKg,
      supportsDropSet: lib.supportsDropSet,
      supportsPulleySelector: lib.supportsPulleySelector,
    });
  };

  return (
    <div className="space-y-6">
      {/* Selector de 2, 3, 4 o 5 días */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-zinc-100">
              Configuración de Frecuencia Semanal (2, 3, 4 o 5 Días de Gym)
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Elige cuántos días vas a entrenar esta semana; la app adapta la rutina partiendo de tus ejercicios base
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {([2, 3, 4, 5] as GymDaysCount[]).map((cnt) => (
              <button
                key={cnt}
                onClick={() => onChangeDaysCount(cnt)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  daysCount === cnt
                    ? 'bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20'
                    : 'bg-zinc-950 text-zinc-300 border border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {cnt} Días {cnt === 3 ? '(Base)' : ''}
              </button>
            ))}

            <button
              onClick={onResetToBaseDefaults}
              className="px-3 py-2 rounded-xl text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-amber-300 cursor-pointer"
              title="Restaura los ejercicios base enviados originalmente"
            >
              ↺ Restaurar Ejercicios Base
            </button>
          </div>
        </div>

        <div className="bg-zinc-950/90 border border-zinc-800/80 rounded-xl p-3 text-xs text-emerald-300">
          {DAY_COUNT_DESCRIPTIONS[daysCount]}
        </div>
      </div>

      {/* Editor de ejercicios por cada día configurado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {routineDays.map((day, dayIndex) => (
          <div
            key={day.dayId}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-emerald-400">{day.title}</h4>
                <p className="text-xs text-zinc-400">{day.subtitle}</p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300">
                {day.exercises.length} ejercicios
              </span>
            </div>

            <div className="space-y-2.5">
              {day.exercises.map((slot) => {
                const libEx = getLibraryExerciseById(slot.libraryExerciseId);
                return (
                  <div
                    key={slot.code}
                    className="bg-zinc-950 border border-zinc-800/90 rounded-xl p-3 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                          {slot.code}
                        </span>
                        <select
                          value={slot.libraryExerciseId}
                          onChange={(e) =>
                            handleSelectLibraryExercise(dayIndex, slot, e.target.value)
                          }
                          aria-label={`Seleccionar ejercicio para ${slot.code}`}
                          className="bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-zinc-100 focus:outline-none focus:border-emerald-500"
                        >
                          <optgroup label="Ejercicios Base Originales">
                            {GYM_EXERCISE_LIBRARY.filter((e) => e.isBaseExercise).map((ex) => (
                              <option key={ex.id} value={ex.id}>
                                {ex.name} ({MUSCLE_GROUP_LABELS[ex.muscleGroup]})
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Biblioteca Extra de Gimnasio">
                            {GYM_EXERCISE_LIBRARY.filter((e) => !e.isBaseExercise).map((ex) => (
                              <option key={ex.id} value={ex.id}>
                                {ex.name} ({MUSCLE_GROUP_LABELS[ex.muscleGroup]})
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </div>

                      <button
                        onClick={() => onInspectExercise(libEx)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-semibold transition cursor-pointer"
                      >
                        👁️ Cómo se hace
                      </button>
                    </div>

                    {/* Ajustes rápidos de Series, Rango de Reps e Incremento */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-zinc-400">
                      <div className="flex items-center gap-2">
                        <span>Grupo:</span>
                        <strong className="text-zinc-200">
                          {MUSCLE_GROUP_LABELS[slot.muscleGroup]}
                        </strong>
                        {slot.supportsPulleySelector && (
                          <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30">
                            Polea Simple/Doble
                          </span>
                        )}
                        {slot.supportsDropSet && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                            Soporta Drop Set
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1">
                          <span>Series:</span>
                          <input
                            type="number"
                            min={1}
                            max={6}
                            value={slot.targetSets}
                            onChange={(e) =>
                              onUpdateSlot(dayIndex, slot.code, {
                                ...slot,
                                targetSets: Math.max(1, Number(e.target.value) || 3),
                              })
                            }
                            className="w-11 bg-zinc-900 border border-zinc-700 rounded px-1.5 py-0.5 text-center text-zinc-100 font-mono"
                          />
                        </label>
                        <span>
                          Rango: {slot.repRange[0]}-{slot.repRange[1]} reps
                        </span>
                        <span>+{slot.weightIncrementKg}kg</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
