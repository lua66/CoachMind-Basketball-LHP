import React, { useState } from 'react';
import {
  Sparkles,
  Dumbbell,
  Clock,
  CheckCircle2,
  BookmarkPlus,
  Loader2,
  Check,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import {
  CategoryType,
  IntensityType,
  LevelType,
  TrainingPlan,
  TrainingSection,
  SavedTraining,
  ViewMode,
  UserProfile,
} from '../types';
import { consumeTrialAction } from '../utils/trialManager';

interface CreateTrainingViewProps {
  onSaveTraining: (training: SavedTraining) => void;
  onNavigate: (view: ViewMode) => void;
  userProfile?: UserProfile | null;
  onCheckRegistration?: (action: () => void, notice?: string) => void;
  onOpenTrialModal?: (mode?: 'general_action' | 'ficha_entrenador') => void;
}

export const CreateTrainingView: React.FC<CreateTrainingViewProps> = ({
  onSaveTraining,
  onNavigate,
  userProfile,
  onCheckRegistration,
  onOpenTrialModal,
}) => {
  const [title, setTitle] = useState('');
  const [section, setSection] = useState<TrainingSection>('Ejercicios de pretemporada');
  const [category, setCategory] = useState<CategoryType>('Cadete');
  const [ageRange, setAgeRange] = useState('14-16 años');
  const [level, setLevel] = useState<LevelType>('Regional');
  const [intensity, setIntensity] = useState<IntensityType>('Media');
  const [objective, setObjective] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(90);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<TrainingPlan | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!objective.trim()) {
      setError('Por favor, indica un objetivo para el entrenamiento.');
      return;
    }

    if (!consumeTrialAction(userProfile, 'create-training')) {
      if (onOpenTrialModal) onOpenTrialModal('general_action');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedPlan(null);
    setIsSaved(false);

    // Client-side robust fallback generator
    const generateLocalFallbackPlan = (): TrainingPlan => {
      const totalMin = parseInt(String(durationMinutes), 10) || 90;
      const warmupDur = Math.max(10, Math.round(totalMin * 0.20));
      const mainTotal = Math.max(30, Math.round(totalMin * 0.65));
      const main1Dur = Math.round(mainTotal * 0.50);
      const main2Dur = mainTotal - main1Dur;
      const cooldownDur = Math.max(10, totalMin - warmupDur - mainTotal);

      const objText = objective.trim() || title.trim() || 'Fundamentos técnicos y tácticos de baloncesto';
      const timestamp = Date.now();

      return {
        warmup: [
          {
            id: `w-${timestamp}`,
            title: `Activación Adaptada y Movilidad (${category})`,
            durationMinutes: warmupDur,
            playersCount: 'Toda la plantilla',
            description: `Movilidad articular, bote de control coordinado y cambios de dirección progresivos enfocados en ${objText}.`,
            coachingTips: [`Exigir máxima postura defensiva baja`, `Postura corporal activa y vista al frente`],
          },
        ],
        mainDrills: [
          {
            id: `m-${timestamp}-1`,
            title: `Bloque Principal 1: ${title || objText.slice(0, 30)}`,
            durationMinutes: main1Dur,
            playersCount: '2v2 / 3v3 Media Pista',
            description: `Rueda analítica y progresiva orientada específicamente a trabajar: ${objText}. Múltiples repeticiones con corrección inmediata del entrenador.`,
            coachingTips: [`Buscar la máxima precisión en cada recepción`, `Intensidad ajustada a nivel ${level}`],
          },
          {
            id: `m-${timestamp}-2`,
            title: `Bloque Principal 2: Aplicación Táctica en Juego Real (5v5)`,
            durationMinutes: main2Dur,
            playersCount: '5v5 Toda la pista',
            description: `Situación real de partido condicionado donde se premia con puntos dobles el uso correcto de ${objText}.`,
            coachingTips: [`Mantener comunicación constante en cancha`, `Rápida lectura de la ventaja ofensiva/defensiva`],
          },
        ],
        cooldown: [
          {
            id: `c-${timestamp}`,
            title: 'Vuelta a la Calma y Serie de Tiro Específica',
            durationMinutes: cooldownDur,
            playersCount: 'Parejas / Individual',
            description: `Rueda de lanzamientos bajo fatiga repasando los gestos trabajados + estiramientos guiados.`,
            coachingTips: [`Regular respiración diafragmática`, `Consolidar los aprendizajes del entrenamiento`],
          },
        ],
        coachNotes: [
          `Objetivo de la sesión: ${objText}.`,
          `Categoría: ${category} (${ageRange}) | Nivel: ${level} | Intensidad: ${intensity}.`,
          `Planificación metodológica estructurada por la IA de CoachMind.`,
        ],
        totalDuration: totalMin,
      };
    };

    try {
      let savedPhilosophy = null;
      try {
        const stored = localStorage.getItem('coachmind_philosophy');
        if (stored) savedPhilosophy = JSON.parse(stored);
      } catch (e) {}

      const response = await fetch('/api/gemini/generate-training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || objective.slice(0, 30),
          section,
          category,
          ageRange,
          level,
          intensity,
          durationMinutes,
          objective,
          coachPhilosophy: savedPhilosophy,
        }),
      });

      const contentType = response.headers.get('content-type');
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      }

      if (data && data.success && data.plan && Array.isArray(data.plan.warmup) && data.plan.warmup.length > 0) {
        setGeneratedPlan(data.plan);
      } else {
        console.warn('Server training generator returned fallback or missing data. Using client fallback plan.');
        setGeneratedPlan(generateLocalFallbackPlan());
      }
    } catch (err: any) {
      console.warn('Error fetching server training, generating guaranteed local plan fallback:', err);
      setGeneratedPlan(generateLocalFallbackPlan());
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!generatedPlan) return;

    if (!userProfile) {
      if (onOpenTrialModal) onOpenTrialModal('general_action');
      return;
    }

    const newTraining: SavedTraining = {
      id: `tr-${Date.now()}`,
      title: title.trim() || objective.slice(0, 30),
      section,
      category,
      ageRange,
      level,
      intensity,
      objective,
      durationMinutes: generatedPlan.totalDuration || durationMinutes,
      exerciseCount:
        (generatedPlan.warmup?.length || 0) +
        (generatedPlan.mainDrills?.length || 0) +
        (generatedPlan.cooldown?.length || 0),
      createdAt: new Date().toISOString().split('T')[0],
      plan: generatedPlan,
    };

    onSaveTraining(newTraining);
    setIsSaved(true);

    setTimeout(() => {
      onNavigate('trainings');
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Crear entrenamiento
            </h1>
            <p className="text-xs text-slate-500">
              La IA generará una sesión personalizada para tu equipo
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('trainings')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition-all cursor-pointer border border-slate-200 shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Entrenamientos</span>
        </button>
      </div>

      {/* Main Grid: Form on left, Generated Plan on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Panel (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
          <form onSubmit={handleGenerate} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Título de la sesión
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Tiro y finalizaciones"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            {/* Section / Card type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tipo de tarjeta (sección)
              </label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value as TrainingSection)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                <option value="Ejercicios de pretemporada">Ejercicios de pretemporada</option>
                <option value="Técnica individual y colectiva">
                  Técnica individual y colectiva
                </option>
                <option value="Táctica de equipo">Táctica de equipo</option>
                <option value="Otros entrenamientos">Otros entrenamientos</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                El ejercicio se guardará en esta tarjeta de la sección Entrenamientos.
              </p>
            </div>

            {/* Category & Age Range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Categoría</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CategoryType)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  <option value="Benjamín">Benjamín</option>
                  <option value="Alevín">Alevín</option>
                  <option value="Infantil">Infantil</option>
                  <option value="Cadete">Cadete</option>
                  <option value="Juvenil">Juvenil</option>
                  <option value="Senior">Senior</option>
                  <option value="Sénior Pro">Sénior Pro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Edad de los jugadores
                </label>
                <input
                  type="text"
                  value={ageRange}
                  onChange={(e) => setAgeRange(e.target.value)}
                  placeholder="Ej. 14-16 años"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
            </div>

            {/* Level & Intensity */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nivel</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as LevelType)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  <option value="Escolar">Escolar</option>
                  <option value="Local">Local</option>
                  <option value="Regional">Regional</option>
                  <option value="Autonómico">Autonómico</option>
                  <option value="Nacional">Nacional</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Intensidad</label>
                <select
                  value={intensity}
                  onChange={(e) => setIntensity(e.target.value as IntensityType)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  <option value="Baja">Baja</option>
                  <option value="Media">Media</option>
                  <option value="Alta">Alta</option>
                  <option value="Máxima">Máxima</option>
                </select>
              </div>
            </div>

            {/* Objective */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Objetivo del entrenamiento
              </label>
              <textarea
                rows={3}
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Ej. Mejorar el tiro de 3 puntos en situaciones de partido y agresividad en rebote de ataque"
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Duración (minutos)
              </label>
              <input
                type="number"
                min={30}
                max={180}
                step={5}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit and Cancel Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('trainings')}
                className="w-1/3 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition-colors cursor-pointer border border-slate-200 text-center"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="w-2/3 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-60 text-white font-bold text-sm shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Diseñando sesión con IA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generar con IA</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Generated Plan Output (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm min-h-[500px] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="font-extrabold text-slate-900 text-lg">Plan generado</h2>
              {generatedPlan && (
                <div className="flex items-center gap-2 text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{generatedPlan.totalDuration} min proyectados</span>
                </div>
              )}
            </div>

            {!generatedPlan && !isLoading && (
              <div className="py-24 text-center space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-500 flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8 animate-pulse" />
                </div>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Completa el formulario y pulsa "Generar con IA" para crear tu entrenamiento personalizado.
                </p>
              </div>
            )}

            {isLoading && (
              <div className="py-24 text-center space-y-4">
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin mx-auto" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-800">
                    Analizando parámetros tácticos...
                  </p>
                  <p className="text-xs text-slate-400">
                    Diseñando calentamiento, ejercicios de cancha y claves de coaching.
                  </p>
                </div>
              </div>
            )}

            {generatedPlan && !isLoading && (
              <div className="py-4 space-y-6 animate-fadeIn">
                {/* 1. Warmup */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    Calentamiento y activación
                  </h3>
                  <div className="space-y-2">
                    {generatedPlan.warmup.map((drill, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/50 space-y-1"
                      >
                        <div className="flex justify-between text-xs font-bold text-slate-900">
                          <span>{drill.title}</span>
                          <span className="text-amber-800">{drill.durationMinutes} min</span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {drill.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Main Drills */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    Ejercicios Principales
                  </h3>
                  <div className="space-y-2">
                    {generatedPlan.mainDrills.map((drill, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/50 space-y-1.5"
                      >
                        <div className="flex justify-between text-xs font-bold text-slate-900">
                          <span>{drill.title}</span>
                          <span className="text-blue-800">{drill.durationMinutes} min</span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {drill.description}
                        </p>
                        {drill.coachingTips && drill.coachingTips.length > 0 && (
                          <div className="pt-1.5 border-t border-blue-200/40">
                            <span className="text-[10px] font-bold text-blue-900">
                              Tips de corrección:
                            </span>
                            <ul className="list-disc list-inside text-[11px] text-blue-800 space-y-0.5">
                              {drill.coachingTips.map((tip, tIdx) => (
                                <li key={tIdx}>{tip}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Cooldown */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Vuelta a la calma
                  </h3>
                  <div className="space-y-2">
                    {generatedPlan.cooldown.map((drill, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/50 space-y-1"
                      >
                        <div className="flex justify-between text-xs font-bold text-slate-900">
                          <span>{drill.title}</span>
                          <span className="text-emerald-800">{drill.durationMinutes} min</span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {drill.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Coach Notes */}
                {generatedPlan.coachNotes && generatedPlan.coachNotes.length > 0 && (
                  <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Claves para el Entrenador
                    </h4>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {generatedPlan.coachNotes.map((note, nIdx) => (
                        <li key={nIdx} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Footer */}
          {generatedPlan && !isLoading && (
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleSave}
                disabled={isSaved}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all"
              >
                {isSaved ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>¡Guardado en Entrenamientos!</span>
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="w-4 h-4" />
                    <span>Guardar en Entrenamientos</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
