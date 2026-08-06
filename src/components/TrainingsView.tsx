import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Flame,
  Users,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Eye,
  Trash2,
  Clock,
  Dumbbell,
  X,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { SavedTraining, TrainingSection, ViewMode } from '../types';

interface TrainingsViewProps {
  trainings: SavedTraining[];
  onNavigate: (view: ViewMode) => void;
  onDeleteTraining: (id: string) => void;
}

export const TrainingsView: React.FC<TrainingsViewProps> = ({
  trainings,
  onNavigate,
  onDeleteTraining,
}) => {
  const [expandedSection, setExpandedSection] = useState<TrainingSection | null>(null);
  const [selectedTraining, setSelectedTraining] = useState<SavedTraining | null>(null);

  const sections: {
    id: TrainingSection;
    title: string;
    subtitle: string;
    icon: React.ElementType;
    iconBg: string;
  }[] = [
    {
      id: 'Ejercicios de pretemporada',
      title: 'Ejercicios de pretemporada',
      subtitle: 'Preparación física y base',
      icon: Flame,
      iconBg: 'bg-orange-500 text-white shadow-orange-500/20',
    },
    {
      id: 'Técnica individual y colectiva',
      title: 'Técnica individual y colectiva',
      subtitle: 'Fundamentos individuales y de equipo',
      icon: Users,
      iconBg: 'bg-blue-600 text-white shadow-blue-600/20',
    },
    {
      id: 'Táctica de equipo',
      title: 'Táctica de equipo',
      subtitle: 'Sistemas, defensas y estrategia',
      icon: ClipboardList,
      iconBg: 'bg-indigo-600 text-white shadow-indigo-600/20',
    },
    {
      id: 'Otros entrenamientos',
      title: 'Otros entrenamientos',
      subtitle: 'Guardados sin clasificar',
      icon: Calendar,
      iconBg: 'bg-slate-700 text-white shadow-slate-700/20',
    },
  ];

  const toggleSection = (secId: TrainingSection) => {
    setExpandedSection((prev) => (prev === secId ? null : secId));
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20 shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Entrenamientos
            </h1>
            <p className="text-xs text-slate-500">Tus sesiones guardadas y clasificadas</p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('create-training')}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo</span>
        </button>
      </div>

      {/* Sections Accordion */}
      <div className="space-y-4">
        {sections.map((sec) => {
          const Icon = sec.icon;
          const sectionTrainings = trainings.filter((t) => t.section === sec.id);
          const isExpanded = expandedSection === sec.id;

          return (
            <div
              key={sec.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden transition-all duration-200"
            >
              {/* Section Accordion Header */}
              <div
                onClick={() => toggleSection(sec.id)}
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md ${sec.iconBg}`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{sec.title}</h3>
                    <p className="text-xs text-slate-500">{sec.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center">
                    {sectionTrainings.length}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Section Content */}
              {isExpanded && (
                <div className="p-5 pt-0 border-t border-slate-100 space-y-3 bg-slate-50/50">
                  {sectionTrainings.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No hay sesiones guardadas en esta categoría.
                    </div>
                  ) : (
                    sectionTrainings.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow transition-all space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1.5">
                            <h4 className="font-extrabold text-slate-900 text-lg capitalize">
                              {item.title}
                            </h4>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                                {item.category}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                                {item.level}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
                                {item.intensity}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedTraining(item)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-sm"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Abrir</span>
                            </button>
                            <button
                              onClick={() => onDeleteTraining(item.id)}
                              className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Eliminar entrenamiento"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          ¡Hola! Soy **CoachMind**. {item.objective}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.durationMinutes} min</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Dumbbell className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.exerciseCount || 12} ejercicios</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Drill Detail Modal */}
      {selectedTraining && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 my-8 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                  {selectedTraining.section}
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900 capitalize">
                  {selectedTraining.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedTraining(null)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Meta Tags */}
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold">
                Categoría: {selectedTraining.category} ({selectedTraining.ageRange || 'Juvenil'})
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold">
                Nivel: {selectedTraining.level}
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-bold">
                Intensidad: {selectedTraining.intensity}
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold">
                Duración: {selectedTraining.durationMinutes} min
              </span>
            </div>

            {/* Objective */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Objetivo principal
              </h4>
              <p className="text-sm font-medium text-slate-800">{selectedTraining.objective}</p>
            </div>

            {/* Plan Breakdown if present */}
            {selectedTraining.plan ? (
              <div className="space-y-6">
                {/* Warmup */}
                <div className="space-y-3">
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    1. Calentamiento y Activación ({selectedTraining.plan.warmup.reduce((a, b) => a + b.durationMinutes, 0)} min)
                  </h3>
                  <div className="space-y-3">
                    {selectedTraining.plan.warmup.map((drill, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/60 space-y-2">
                        <div className="flex justify-between font-bold text-sm text-slate-900">
                          <span>{drill.title}</span>
                          <span className="text-amber-800">{drill.durationMinutes} min</span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">{drill.description}</p>
                        {drill.coachingTips && (
                          <div className="pt-2 border-t border-amber-200/40">
                            <p className="text-[11px] font-bold text-amber-900">Claves de coaching:</p>
                            <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-0.5">
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

                {/* Main Drills */}
                <div className="space-y-3">
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-600" />
                    2. Bloque Principal ({selectedTraining.plan.mainDrills.reduce((a, b) => a + b.durationMinutes, 0)} min)
                  </h3>
                  <div className="space-y-3">
                    {selectedTraining.plan.mainDrills.map((drill, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-blue-50/50 border border-blue-200/60 space-y-2">
                        <div className="flex justify-between font-bold text-sm text-slate-900">
                          <span>{drill.title}</span>
                          <span className="text-blue-800">{drill.durationMinutes} min</span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">{drill.description}</p>
                        {drill.coachingTips && (
                          <div className="pt-2 border-t border-blue-200/40">
                            <p className="text-[11px] font-bold text-blue-900">Claves de coaching:</p>
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

                {/* Cooldown */}
                <div className="space-y-3">
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    3. Vuelta a la Calma ({selectedTraining.plan.cooldown.reduce((a, b) => a + b.durationMinutes, 0)} min)
                  </h3>
                  <div className="space-y-3">
                    {selectedTraining.plan.cooldown.map((drill, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/60 space-y-2">
                        <div className="flex justify-between font-bold text-sm text-slate-900">
                          <span>{drill.title}</span>
                          <span className="text-emerald-800">{drill.durationMinutes} min</span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">{drill.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Coach Notes */}
                {selectedTraining.plan.coachNotes && (
                  <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2">
                    <h4 className="font-bold text-xs uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      Notas tácticas del entrenador
                    </h4>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {selectedTraining.plan.coachNotes.map((note, nIdx) => (
                        <li key={nIdx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-slate-500 text-xs">
                Sesión guardada sin desglose extendido. Genera nuevas sesiones con la pestaña de IA para obtener análisis completo ejercicio por ejercicio.
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedTraining(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
