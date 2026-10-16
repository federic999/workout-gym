# Hypertrophy & Overload Tracker 🏋️‍♂️📈

Sistema **Web + PWA + Android APK (Capacitor)** para el seguimiento de hipertrofia, sobrecarga progresiva automatizada (Doble Progresión), entrada rápida por lenguaje natural (NLP) y análisis nutricional integrado con capturas de **Samsung Health**.

---

## 1. Estructura de la Arquitectura

```text
Workout/
├── .github/workflows/
│   └── build-apk.yml            # Compila el APK de Android gratis en la nube en cada push
├── supabase/
│   └── schema.sql               # Esquema PostgreSQL completo (Mesociclos, Series, Récords, Nutrición)
├── src/
│   ├── types/
│   │   └── workout.ts           # Modelos de dominio (Splits 2-5 días, Big 3 PRs, Dashboard 4 semanas)
│   ├── data/
│   │   ├── exerciseCatalog.ts   # Catálogo base E0-E6 (Empuje, Piernas, Tirón) y 6 grupos musculares
│   │   └── gymExerciseLibrary.ts # Biblioteca gráfica de gym, fuentes sin copyright y builder de 2-5 días
│   ├── core/
│   │   ├── metrics.ts           # Volumen, 1RM Epley, distribución muscular y cálculo TDEE
│   │   ├── nlpParser.ts         # Parser determinista de entrada rápida ("E1 60kg 8,8,6")
│   │   ├── progressionEngine.ts # Motor de Doble Progresión, Hoja de Ruta y Detector de Récords (🏆)
│   │   ├── weeklyDashboard.ts   # Extractor de 3 PRs Insignia (Pecho/Pierna/Espalda) y Dashboard 4 semanas
│   │   └── __tests__/
│   │       └── coreEngine.test.ts # Suite de 25 tests automatizados del motor central y dashboard
│   ├── components/
│   │   ├── WeeklyDashboardView.tsx # Las 4 vistas analíticas del Dashboard Semanal (ventana 4 semanas)
│   │   ├── RoutineConfigurator.tsx # Configurador de 2, 3, 4 o 5 días y personalización de ejercicios
│   │   └── ExerciseVisualModal.tsx # Motor SVG Cinemático animado + fotos de free-exercise-db (Dominio Público)
│   ├── services/
│   │   ├── supabaseClient.ts    # Conexión Cloud con fallback Offline-First
│   │   └── geminiOcr.ts         # Extracción multimodal de capturas Samsung Health (Gemini 2.0 Flash)
│   ├── App.tsx                  # Pantalla Principal (3 PRs Insignia + Dashboard Semanal + Entrenar Hoy)
│   └── main.tsx                 # Punto de entrada React 19
├── capacitor.config.ts          # Configuración nativa para empaquetar el APK de Android
├── vite.config.ts               # Configuración Vite + Tailwind v4 + PWA (instalable sin APK)
└── package.json
```

---

## 2. ¿Cómo funcionan el Parser NLP y el Motor de Doble Progresión?

### A. Parser NLP de Entrada Rápida (`src/core/nlpParser.ts`)
En lugar de llenar múltiples formularios en el gimnasio entre serie y serie, escribes una sola línea por ejercicio y el motor la transforma instantáneamente en datos estructurados:

| Lo que escribes | Lo que interpreta el motor automáticamente |
| :--- | :--- |
| `E0 = ruso 10kg 3x7` | Ejercicio `E0`, variante `"Giro Ruso"`, 3 series de 7 reps con 10 kg ($\text{Volumen} = 210\text{ kg}$). |
| `E1 60kg 8,8,6` | Ejercicio `E1`, 3 series con 60 kg ($8, 8\text{ y }6\text{ reps}$), $\text{Volumen} = 1320\text{ kg}$, $1\text{RM Epley} = 76\text{ kg}$. |
| `E2 75kg 5 70kg 8, 8, 6` | Bloques mixtos: 1ª serie pesada ($75\text{ kg} \times 5$) + 3 series back-off ($70\text{ kg} \times 8, 8, 6$), $\text{Volumen} = 1915\text{ kg}$. |
| `E3 no` | Marca el ejercicio `E3` como omitido en la sesión ($\text{Volumen} = 0\text{ kg}$). |
| `E4 press militar 20 por lado 3x8` | Detecta sustitución (`"Press Militar"`), duplica el peso por lado ($20 \times 2 = 40\text{ kg}$ totales) y registra $3 \times 8$ ($\text{Volumen} = 960\text{ kg}$). |
| `E1 doble polea 70kg 8,8,6` | Registra `pulleyType = 'double'` para no mezclar récords con polea simple. |

### B. Motor de Doble Progresión (`src/core/progressionEngine.ts`)
Trabaja con un **rango de repeticiones objetivo** (por ejemplo, `8 a 10 reps` en `3 series`):
1. **Fase 1 — Progresar en Repeticiones (`increase_reps`)**: Si la semana pasada hiciste `60kg 8,8,6`, todavía no llenaste el tope del rango (`3x10`). La Hoja de Ruta de hoy te indicará **mantener 60 kg** e intentar `[9, 9, 7]` (sumar repeticiones a igual carga).
2. **Fase 2 — Subir Peso (`increase_weight`)**: Cuando logras completar todas las series en el tope del rango (`60kg 10,10,10`), el motor te indica **subir la carga** (+2.5 kg o +5 kg según el ejercicio, ej. `62.5 kg`) y volver a la base del rango (`3x6` o `3x8`).
3. **Consolidación de Bloques Mixtos (`consolidate_weight`)**: Si probaste un peso mayor pero no llegaste al mínimo del rango (`75kg 5` seguido de `70kg 8,8,6`), te sugiere consolidar los `70 kg` o alcanzar el mínimo de repeticiones en la primera serie con `75 kg`.
4. **Adaptación según Estado de la Semana**:
   - `accumulation`: Aplica Doble Progresión estricta.
   - `active_deload`: Reduce ~10% el peso y baja 1 serie (RIR 3-4) para disipar fatiga.
   - `full_deload`: Semana de descanso/movilidad articular.
   - `reactivation`: Retorno post-descarga al ~95% de tu carga de trabajo previa.

---

## 3. Cómo subir este repositorio a GitHub desde cero

En esta PC aún no están instalados `Git` ni `Node.js`. Puedes instalarlos en 1 minuto abriendo **PowerShell** y ejecutando:

```powershell
winget install --id Git.Git -e --source winget
winget install --id OpenJS.NodeJS.LTS -e --source winget
```
*(Después de instalarlos, cierra y vuelve a abrir la terminal para que reconozca los comandos `git` y `npm`).*

### Paso a paso para subirlo a GitHub:
1. Crea una cuenta o inicia sesión en [github.com](https://github.com) y toca el botón **"New repository"** (puedes llamarlo `hypertrophy-overload-tracker`). Déjalo **vacío** (sin marcar README ni .gitignore).
2. En la carpeta `d:\OneDrive - CASINO MAGIC NEUQUEN SA\Federic\Workout`, ejecuta:
   ```powershell
   git init
   git add .
   git commit -m "feat: initialize Web + PWA + Capacitor architecture and core engine"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/hypertrophy-overload-tracker.git
   git push -u origin main
   ```
3. **¡Listo!** Apenas hagas `git push`, la pestaña **Actions** de tu repositorio en GitHub ejecutará automáticamente el archivo `.github/workflows/build-apk.yml`, correrá los 25 tests y compilará tu archivo `.apk` de Android listo para descargar.
