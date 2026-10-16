-- ============================================================================
-- Hypertrophy & Overload Tracker - Esquema PostgreSQL (Supabase)
-- ============================================================================

-- 1. Perfiles Biométricos del Usuario
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    base_weight_kg NUMERIC(5,2) NOT NULL DEFAULT 70.50,
    base_bmr_kcal INTEGER NOT NULL DEFAULT 1650,
    target_protein_ratio NUMERIC(3,2) NOT NULL DEFAULT 2.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Semanas / Mesociclos
CREATE TABLE IF NOT EXISTS weeks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    state TEXT NOT NULL CHECK (state IN ('accumulation', 'active_deload', 'full_deload', 'reactivation')) DEFAULT 'accumulation',
    start_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, week_number)
);

-- 3. Entrenamientos Diarios (Split de 3 Días: Empuje, Piernas, Tirón)
CREATE TABLE IF NOT EXISTS workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_id UUID NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
    day_type TEXT NOT NULL CHECK (day_type IN ('push', 'legs', 'pull')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Ejercicios Realizados (E0 a E6)
CREATE TABLE IF NOT EXISTS workout_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    code TEXT NOT NULL CHECK (code IN ('E0', 'E1', 'E2', 'E3', 'E4', 'E5', 'E6')),
    name TEXT NOT NULL,
    muscle_group TEXT NOT NULL CHECK (muscle_group IN ('chest', 'back', 'shoulders', 'arms', 'legs', 'core')),
    raw_input TEXT,
    is_substituted BOOLEAN NOT NULL DEFAULT FALSE,
    pulley_type TEXT NOT NULL CHECK (pulley_type IN ('single', 'double', 'standard')) DEFAULT 'standard',
    is_dropset BOOLEAN NOT NULL DEFAULT FALSE,
    is_skipped BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Series y Repeticiones (Sets)
CREATE TABLE IF NOT EXISTS exercise_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_exercise_id UUID NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
    set_order INTEGER NOT NULL,
    weight_kg NUMERIC(6,2) NOT NULL CHECK (weight_kg >= 0),
    reps INTEGER NOT NULL CHECK (reps >= 0),
    is_dropset_step BOOLEAN NOT NULL DEFAULT FALSE,
    volume_kg NUMERIC(8,2) GENERATED ALWAYS AS (weight_kg * reps) STORED,
    estimated_1rm NUMERIC(6,2) GENERATED ALWAYS AS (
        CASE WHEN reps > 0 THEN ROUND(weight_kg * (1 + reps::NUMERIC / 30.0), 2) ELSE 0 END
    ) STORED,
    is_pr_weight BOOLEAN NOT NULL DEFAULT FALSE,
    is_pr_volume BOOLEAN NOT NULL DEFAULT FALSE,
    is_pr_1rm BOOLEAN NOT NULL DEFAULT FALSE
);

-- 6. Nutrición y Actividad Diaria (Samsung Health + Macros)
CREATE TABLE IF NOT EXISTS daily_nutrition_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    calories_consumed NUMERIC(6,2) NOT NULL DEFAULT 0,
    protein_g NUMERIC(5,2) NOT NULL DEFAULT 0,
    carbs_g NUMERIC(5,2) NOT NULL DEFAULT 0,
    fat_g NUMERIC(5,2) NOT NULL DEFAULT 0,
    steps INTEGER NOT NULL DEFAULT 0,
    active_minutes INTEGER NOT NULL DEFAULT 0,
    active_burned_kcal INTEGER NOT NULL DEFAULT 0,
    screenshot_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, date)
);

-- Índices para consultas rápidas de ventana móvil de 4 semanas y récords
CREATE INDEX IF NOT EXISTS idx_weeks_user_number ON weeks(user_id, week_number DESC);
CREATE INDEX IF NOT EXISTS idx_workouts_week_day ON workouts(week_id, day_type);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_code ON workout_exercises(code, pulley_type);
CREATE INDEX IF NOT EXISTS idx_nutrition_user_date ON daily_nutrition_activity(user_id, date DESC);
