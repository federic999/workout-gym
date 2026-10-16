import type { WeekState, WeeklyDashboardSummary } from '../types/workout.ts';

const WEEK_STATE_BADGES: Record<WeekState, { label: string; colorClass: string }> = {
  accumulation: {
    label: 'Acumulación / Sobrecarga',
    colorClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
  active_deload: {
    label: 'Descarga Activa (-10%)',
    colorClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  full_deload: {
    label: 'Descarga Total',
    colorClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
  },
  reactivation: {
    label: 'Reactivación (~95%)',
    colorClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  },
};

function DeltaBadge({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-xs text-zinc-500">Base</span>;
  }
  const isPositive = value > 0;
  const isZero = value === 0;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold ${
        isPositive
          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
          : isZero
          ? 'bg-zinc-800 text-zinc-300'
          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
      }`}
    >
      {isPositive ? `+${value}%` : `${value}%`}
    </span>
  );
}

interface WeeklyDashboardViewProps {
  dashboard: WeeklyDashboardSummary;
  selectedWeekIdx: number;
  onSelectWeekIdx: (idx: number) => void;
}

export function WeeklyDashboardView({
  dashboard,
  selectedWeekIdx,
  onSelectWeekIdx,
}: WeeklyDashboardViewProps) {
  const maxWeeklyVolume = Math.max(...dashboard.weeks.map((w) => w.totalVolumeKg), 1);

  return (
    <div className="space-y-6">
      {/* 1. Gráfico de Barras de Volumen Semanal Total en kg (Ventana Móvil 4 Semanas) */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-zinc-100">
              1. Volumen Semanal Total (kg) — Ventana Móvil de 4 Semanas
            </h3>
            <p className="text-xs text-zinc-400">
              Toca cualquier barra para inspeccionar o editar los registros de esa semana
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
            Pico del Ciclo: {maxWeeklyVolume.toLocaleString('es-AR')} kg
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {dashboard.weeks.map((w, idx) => {
            const heightPct = Math.max(12, Math.round((w.totalVolumeKg / maxWeeklyVolume) * 100));
            const isSelected = idx === selectedWeekIdx;
            const stateBadge = WEEK_STATE_BADGES[w.weekState];

            return (
              <button
                key={w.weekNumber}
                onClick={() => onSelectWeekIdx(idx)}
                className={`text-left bg-zinc-950 rounded-xl p-3.5 border transition cursor-pointer flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? 'border-emerald-500 ring-1 ring-emerald-500/40'
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-zinc-200">{w.weekLabel}</span>
                  <DeltaBadge value={w.deltaVsPrevWeekPercent} />
                </div>

                {/* Barra visual */}
                <div className="h-28 bg-zinc-900/90 rounded-lg p-2 flex items-end">
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-md transition-all duration-300 ${
                      isSelected
                        ? 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                        : 'bg-gradient-to-t from-zinc-700 to-emerald-500/70'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <div className="text-lg font-extrabold font-mono text-emerald-400">
                    {w.totalVolumeKg.toLocaleString('es-AR')} kg
                  </div>
                  <div className="text-[11px] text-zinc-400 flex items-center justify-between">
                    <span>{w.totalSets} series</span>
                    <span>{w.totalReps} reps</span>
                  </div>
                  <div
                    className={`text-[10px] px-2 py-0.5 rounded border inline-block font-medium ${stateBadge.colorClass}`}
                  >
                    {stateBadge.label}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Tabla Comparativa de Carga por Día y Estado de la Semana */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-3 overflow-x-auto">
        <div>
          <h3 className="text-base font-bold text-zinc-100">
            2. Tabla Comparativa de Carga por Día y Estado de la Semana
          </h3>
          <p className="text-xs text-zinc-400">
            Comparativa de tonelaje (kg) y series efectivas según los días configurados para tu rutina
          </p>
        </div>

        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400">
              <th className="py-2.5 pr-3 font-semibold">Día Configurado</th>
              {dashboard.weeks.map((w) => (
                <th key={w.weekNumber} className="py-2.5 px-3 font-semibold">
                  <div>{w.weekLabel}</div>
                  <div className="text-[10px] font-normal text-emerald-400">
                    {WEEK_STATE_BADGES[w.weekState].label}
                  </div>
                </th>
              ))}
              <th className="py-2.5 pl-3 font-semibold text-right">Δ% Ciclo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {dashboard.dayLoadComparison.map((row) => (
              <tr key={row.dayId} className="hover:bg-zinc-950/50">
                <td className="py-2.5 pr-3 font-semibold text-zinc-200">{row.dayTitle}</td>
                {row.volumesByWeek.map((vol, i) => (
                  <td key={i} className="py-2.5 px-3 font-mono">
                    <span className="text-zinc-100 font-semibold">
                      {vol.toLocaleString('es-AR')} kg
                    </span>
                    <span className="text-zinc-500 block text-[11px]">
                      {row.setsByWeek[i]} series
                    </span>
                  </td>
                ))}
                <td className="py-2.5 pl-3 text-right">
                  <DeltaBadge value={row.deltaCyclePercent} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 3. Tabla de Volumen por Grupo Muscular con Tendencia Porcentual Δ% */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-3 overflow-x-auto">
        <div>
          <h3 className="text-base font-bold text-zinc-100">
            3. Volumen por Grupo Muscular y Tendencia (Δ% Entre Semanas)
          </h3>
          <p className="text-xs text-zinc-400">
            Seguimiento de los 6 grupos musculares para evitar desbalances y verificar sobrecarga progresiva
          </p>
        </div>

        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400">
              <th className="py-2.5 pr-3 font-semibold">Grupo Muscular</th>
              {dashboard.weeks.map((w) => (
                <th key={w.weekNumber} className="py-2.5 px-3 font-semibold">
                  {w.weekLabel}
                </th>
              ))}
              <th className="py-2.5 px-3 font-semibold text-right">Δ% Últ. Semana</th>
              <th className="py-2.5 pl-3 font-semibold text-right">Δ% Ciclo (4 Sem)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {dashboard.muscleVolumeTrends.map((m) => (
              <tr key={m.muscleGroup} className="hover:bg-zinc-950/50">
                <td className="py-2.5 pr-3 font-semibold text-zinc-200">{m.label}</td>
                {m.volumesByWeek.map((v, i) => (
                  <td key={i} className="py-2.5 px-3 font-mono">
                    <span className="text-emerald-400 font-semibold">
                      {v.toLocaleString('es-AR')} kg
                    </span>
                    <span className="text-zinc-500 block text-[11px]">
                      {m.setsByWeek[i]} series
                    </span>
                  </td>
                ))}
                <td className="py-2.5 px-3 text-right">
                  <DeltaBadge value={m.deltaLastWeekPercent} />
                </td>
                <td className="py-2.5 pl-3 text-right">
                  <DeltaBadge value={m.deltaCyclePercent} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 4. Tabla de Evolución de Cargas Pico y 1RM Estimado en Ejercicios Principales */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-3 overflow-x-auto">
        <div>
          <h3 className="text-base font-bold text-zinc-100">
            4. Evolución de Cargas Pico y 1RM Estimado (Epley) — Ejercicios Principales
          </h3>
          <p className="text-xs text-zinc-400">
            Progreso porcentual de fuerza bruta (Carga Pico) y 1RM estimado a lo largo del mesociclo
          </p>
        </div>

        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400">
              <th className="py-2.5 pr-3 font-semibold">Ejercicio Principal</th>
              {dashboard.weeks.map((w) => (
                <th key={w.weekNumber} className="py-2.5 px-3 font-semibold">
                  {w.weekLabel}
                </th>
              ))}
              <th className="py-2.5 px-3 font-semibold text-right">Δ% Carga</th>
              <th className="py-2.5 pl-3 font-semibold text-right">Δ% 1RM</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {dashboard.keyExerciseProgression.map((ex) => (
              <tr key={ex.slotKey} className="hover:bg-zinc-950/50">
                <td className="py-2.5 pr-3 font-semibold text-zinc-200">{ex.exerciseName}</td>
                {ex.peakWeightByWeek.map((wKg, i) => (
                  <td key={i} className="py-2.5 px-3 font-mono">
                    <span className="text-zinc-100 font-bold">{wKg} kg</span>
                    <span className="text-amber-400/90 block text-[11px]">
                      1RM: {ex.estimated1RMByWeek[i]} kg
                    </span>
                  </td>
                ))}
                <td className="py-2.5 px-3 text-right">
                  <DeltaBadge value={ex.weightDeltaPercent} />
                </td>
                <td className="py-2.5 pl-3 text-right">
                  <DeltaBadge value={ex.oneRmDeltaPercent} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
