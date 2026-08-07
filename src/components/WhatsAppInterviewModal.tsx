import React, { useState, useEffect } from 'react';
import {
  X,
  MessageSquare,
  Send,
  User,
  Globe,
  Award,
  BookOpen,
  Dumbbell,
  ClipboardList,
  Sparkles,
  Phone,
  CheckCircle2,
  Brain,
} from 'lucide-react';
import { UserProfile } from '../types';

interface WhatsAppInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile?: UserProfile | null;
  phoneNumber?: string; // Default +34608180231
}

export const WhatsAppInterviewModal: React.FC<WhatsAppInterviewModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  phoneNumber = '34608180231',
}) => {
  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('');
  const [yearsExperience, setYearsExperience] = useState('3-5 años');
  const [topicType, setTopicType] = useState<'fisico' | 'tactico' | 'tecnico'>('tactico');
  const [topicLevel, setTopicLevel] = useState('Formación / Autonómico');
  const [contactPhone, setContactPhone] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setFullName(`${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim());
      setCountry(userProfile.country || 'España');
      setContactPhone(userProfile.phone || '');
      if (userProfile.teamLevel) {
        setTopicLevel(userProfile.teamLevel);
      }
    }
  }, [userProfile, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      alert('Por favor introduce tu nombre completo.');
      return;
    }
    if (!country.trim()) {
      alert('Por favor indica tu país.');
      return;
    }

    const topicLabel =
      topicType === 'fisico'
        ? '🏋️‍♂️ Físico (Preparación física y acondicionamiento)'
        : topicType === 'tactico'
        ? '📋 Táctico (Sistemas de juego, defensa, ataque, pizarra)'
        : '🏀 Técnico (Técnica individual, tiro, bote, pase)';

    const message = `🏀 *SOLICITUD DE ENTREVISTA / CONSULTA - COACHMIND* 🏀

👤 *Nombre:* ${fullName.trim()}
🌍 *País:* ${country.trim()}
⏱️ *Años de Experiencia:* ${yearsExperience}
🎯 *Tipo de Tema:* ${topicLabel}
📊 *Nivel / Categoría:* ${topicLevel}
📱 *Teléfono WhatsApp:* ${contactPhone.trim() || 'No especificado'}
${additionalDetails.trim() ? `📝 *Detalles adicionales:* ${additionalDetails.trim()}\n` : ''}
----------------------------------------
Quedo a la espera de tu respuesta para preparar la entrevista. ¡Muchas gracias!`;

    // Clean phone number (remove +, spaces, dashes)
    const cleanNumber = phoneNumber.replace(/[^0-9]/g, '') || '34608180231';
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;

    // Save history locally
    try {
      const history = JSON.parse(localStorage.getItem('coachmind_whatsapp_interviews') || '[]');
      history.push({
        fullName,
        country,
        yearsExperience,
        topicType,
        topicLevel,
        contactPhone,
        additionalDetails,
        date: new Date().toISOString(),
      });
      localStorage.setItem('coachmind_whatsapp_interviews', JSON.stringify(history));
    } catch (err) {
      console.error('Error saving interview record', err);
    }

    setIsSuccess(true);

    // Open WhatsApp
    window.open(whatsappUrl, '_blank');

    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 2500);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-emerald-500/40 rounded-3xl w-full max-w-lg text-white shadow-2xl p-5 sm:p-7 relative my-auto max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Glow Header */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {isSuccess ? (
          <div className="text-center py-10 space-y-4 animate-fadeIn my-auto">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8 animate-bounce text-emerald-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-white">¡Formulario Enviado a WhatsApp!</h3>
              <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
                Se ha abierto la ventana de WhatsApp con todos los datos formateados para preparar tu entrevista.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            {/* Badge & Title */}
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Entrevista / Asesoría Privada por WhatsApp</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <span>Formulario para la Entrevista</span>
                <span className="text-2xl">🏀</span>
              </h2>

              <p className="text-xs text-slate-300 leading-relaxed">
                Rellena estos datos para enviar tu solicitud directamente a mi WhatsApp y poder prepararme la entrevista o sesión de asesoría.
              </p>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Nombre completo */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Nombre Completo *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Carlos Gómez"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium"
                />
              </div>

              {/* País */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span>País *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: España, Argentina, México..."
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium"
                />
              </div>

              {/* Años de experiencia */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Años de Experiencia *</span>
                </label>
                <select
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium cursor-pointer"
                >
                  <option value="Menos de 1 año">Menos de 1 año</option>
                  <option value="1 a 3 años">1 a 3 años</option>
                  <option value="3 a 5 años">3 a 5 años</option>
                  <option value="5 a 10 años">5 a 10 años</option>
                  <option value="Más de 10 años">Más de 10 años</option>
                </select>
              </div>

              {/* Teléfono WhatsApp de contacto */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tu Teléfono / WhatsApp de Contacto</span>
                </label>
                <input
                  type="tel"
                  placeholder="Ej: +34 600 000 000"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium"
                />
              </div>

              {/* Tipo de tema */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tipo de Tema Deseado *</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTopicType('fisico')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col items-center justify-center gap-1 text-center ${
                      topicType === 'fisico'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-extrabold shadow-md'
                        : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Dumbbell className="w-4 h-4 text-emerald-400" />
                    <span className="text-[11px]">Tema Físico</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTopicType('tactico')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col items-center justify-center gap-1 text-center ${
                      topicType === 'tactico'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-extrabold shadow-md'
                        : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <ClipboardList className="w-4 h-4 text-emerald-400" />
                    <span className="text-[11px]">Tema Táctico</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTopicType('tecnico')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col items-center justify-center gap-1 text-center ${
                      topicType === 'tecnico'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-extrabold shadow-md'
                        : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    <span className="text-[11px]">Tema Técnico</span>
                  </button>
                </div>
              </div>

              {/* Nivel del tema / equipo */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>¿De qué Nivel es el Tema o tu Equipo? *</span>
                </label>
                <select
                  value={topicLevel}
                  onChange={(e) => setTopicLevel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium cursor-pointer"
                >
                  <option value="Iniciación / Escuelas / Minibasket">Iniciación / Escuelas / Minibasket</option>
                  <option value="Formación / Cantera (Infantil / Cadete / Junior)">
                    Formación / Cantera (Infantil / Cadete / Junior)
                  </option>
                  <option value="Autonómico / Preferente">Autonómico / Preferente</option>
                  <option value="Nacional / Senior Liga Regular">Nacional / Senior Liga Regular</option>
                  <option value="Alto Rendimiento / Profesional">Alto Rendimiento / Profesional</option>
                </select>
              </div>

              {/* Detalles adicionales */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Detalles Específicos para la Entrevista (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Quiero preparar la lectura de bloqueos directos y defensa zonal contra mi rival directo..."
                  value={additionalDetails}
                  onChange={(e) => setAdditionalDetails(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium resize-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Send className="w-4 h-4 text-slate-950 stroke-[3]" />
                <span>Enviar Datos y Abrir WhatsApp Directo</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
