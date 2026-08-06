import React, { useState, useEffect } from 'react';
import {
  Settings,
  User,
  ShieldCheck,
  Check,
  Sparkles,
  Award,
  MapPin,
  Globe,
  Mail,
  Phone,
  Lock,
  RefreshCw,
  Star,
  X,
  HeartHandshake,
  MessageSquare,
  ArrowLeft,
  Send,
  Crown,
  Download,
  AlertTriangle,
  Calendar,
  Smartphone,
  Ticket,
} from 'lucide-react';
import { UserProfile } from '../types';
import { getSubscriptionPeriodInfo, downloadLibraryBackup } from '../utils/subscriptionUtils';
import { validateAndConsumeCode } from '../utils/activationCodes';
import { ReviewModal } from './ReviewModal';

interface SettingsViewProps {
  userProfile?: UserProfile | null;
  onUpdateProfile?: (profile: UserProfile | null) => void;
  onOpenRegisterModal?: () => void;
  onClearAllData?: () => void;
  onOpenFichaLockModal?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  userProfile,
  onUpdateProfile,
  onClearAllData,
  onOpenRegisterModal,
  onOpenFichaLockModal,
}) => {
  const [firstName, setFirstName] = useState(userProfile?.firstName || '');
  const [lastName, setLastName] = useState(userProfile?.lastName || '');
  const [email, setEmail] = useState(userProfile?.email || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [country, setCountry] = useState(userProfile?.country || 'España');
  const [town, setTown] = useState(userProfile?.town || '');
  const [club, setClub] = useState(userProfile?.club || '');
  const [season, setSeason] = useState(userProfile?.season || '2025/2026');
  const [teamGender, setTeamGender] = useState(userProfile?.teamGender || 'Masculino');
  const [coachRole, setCoachRole] = useState(userProfile?.coachRole || 'Entrenador Principal');
  const [coachLevel, setCoachLevel] = useState(userProfile?.coachLevel || 'Nivel 2 / Autonómico');
  const [teamLevel, setTeamLevel] = useState(userProfile?.teamLevel || 'Autonómico');
  const [teamCategory, setTeamCategory] = useState(userProfile?.teamCategory || 'Senior');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showOwnerPanel, setShowOwnerPanel] = useState(false);

  // Cancellation Modal states
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [cancelStep, setCancelStep] = useState<1 | 2>(1);
  const [starRating, setStarRating] = useState<number>(5);
  const [cancelReason, setCancelReason] = useState<string>(
    'Fin de temporada / Sin equipo actualmente'
  );
  const [cancelFeedback, setCancelFeedback] = useState<string>('');
  const [hasDownloadedBackup, setHasDownloadedBackup] = useState(false);

  // Activation Code / Bizum States
  const [activationCodeInput, setActivationCodeInput] = useState('');
  const [activationMessage, setActivationMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const handleActivateWithCode = () => {
    setActivationMessage(null);
    const code = activationCodeInput.trim().toUpperCase();
    if (!code) {
      setActivationMessage({ text: 'Por favor introduce un código de activación o cupón.', isError: true });
      return;
    }

    const valResult = validateAndConsumeCode(code);
    if (!valResult.success) {
      setActivationMessage({ text: valResult.message, isError: true });
      return;
    }

    // Call server to consume code as well
    fetch('/api/activation-codes/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    }).catch(() => {});

    const isAnnual = valResult.plan === 'annual';
    const newPlan = isAnnual ? 'annual' : 'monthly';
    const newCredits = valResult.credits || (isAnnual ? 1000 : 500);

    const updatedProfile: UserProfile = {
      ...(userProfile || {
        firstName: firstName || 'Entrenador',
        lastName: lastName || '',
        email: email || 'entrenador@coachmind.app',
        phone: phone || '',
        country: country || 'España',
        town: town || '',
        club: club || '',
        season: season || '2025/2026',
        teamGender: teamGender || 'Masculino',
        coachRole: coachRole || 'Entrenador Principal',
        coachLevel: coachLevel || 'Nivel 2 / Autonómico',
        teamLevel: teamLevel || 'Autonómico',
        teamCategory: teamCategory || 'Senior',
        registeredAt: new Date().toLocaleDateString('es-ES'),
      }),
      subscriptionPlan: newPlan,
      subscriptionStatus: 'active',
      paymentMethod: 'bizum',
      creditsRemaining: newCredits,
      totalCredits: newCredits,
    };

    if (onUpdateProfile) {
      onUpdateProfile(updatedProfile);
    }

    // Sync to Google Sheets
    const sheetRecord = {
      fechaRegistro: updatedProfile.registeredAt,
      nombreCompleto: `${updatedProfile.firstName} ${updatedProfile.lastName}`,
      email: updatedProfile.email,
      telefono: updatedProfile.phone,
      pais: updatedProfile.country,
      ciudad: updatedProfile.town,
      club: updatedProfile.club,
      cargoRol: updatedProfile.coachRole,
      titulacion: updatedProfile.coachLevel,
      generoEquipo: updatedProfile.teamGender,
      nivelEquipo: updatedProfile.teamLevel,
      categoriaEquipo: updatedProfile.teamCategory,
      plan: newPlan === 'annual' ? 'Anual (60€/año)' : 'Mensual (5€/mes)',
      metodoPago: `Bizum / Código (${code})`,
      codigoActivacion: code,
      estado: 'Activa (Pro)',
    };

    try {
      const existingSheets = JSON.parse(localStorage.getItem('coachmind_google_sheet_records') || '[]');
      existingSheets.unshift(sheetRecord);
      localStorage.setItem('coachmind_google_sheet_records', JSON.stringify(existingSheets));

      fetch('/api/sync-google-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sheetRecord),
      }).catch(() => {});
    } catch (e) {}

    setActivationMessage({
      text: valResult.message,
      isError: false,
    });
    setActivationCodeInput('');
  };

  // WhatsApp contact number & Bizum info from environment variables
  const BIZUM_PHONE = import.meta.env.VITE_BIZUM_PHONE || '+34 608180231';
  const WHATSAPP_NUMBER = BIZUM_PHONE.replace(/[^0-9]/g, '');
  const PAYPAL_EMAIL = import.meta.env.VITE_PAYPAL_EMAIL || 'leyanispuentes@gmail.com';

  // Compute subscription period details
  const subInfo = getSubscriptionPeriodInfo(userProfile);

  useEffect(() => {
    if (userProfile) {
      setFirstName(userProfile.firstName);
      setLastName(userProfile.lastName);
      setEmail(userProfile.email);
      setPhone(userProfile.phone);
      setCountry(userProfile.country);
      setTown(userProfile.town);
      setClub(userProfile.club);
      setSeason(userProfile.season || '2025/2026');
      setTeamGender(userProfile.teamGender || 'Masculino');
      setCoachRole(userProfile.coachRole || 'Entrenador Principal');
      setCoachLevel(userProfile.coachLevel || 'Nivel 2 / Autonómico');
      setTeamLevel(userProfile.teamLevel);
      setTeamCategory(userProfile.teamCategory);
    }
  }, [userProfile]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) {
      if (onOpenRegisterModal) onOpenRegisterModal();
      return;
    }

    const updated: UserProfile = {
      ...userProfile,
      firstName,
      lastName,
      email,
      phone,
      country,
      town,
      club,
      season,
      teamGender,
      coachRole,
      coachLevel,
      teamLevel,
      teamCategory,
    };

    if (onUpdateProfile) {
      onUpdateProfile(updated);
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-900/20 shrink-0">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Configuración & Ficha de Entrenador
            </h1>
            <p className="text-xs text-slate-500">
              Datos de la suscripción Pro, perfil del club y preferencias de la aplicación
            </p>
          </div>
        </div>

        <div>
          {userProfile ? (
            <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 font-black text-xs uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Suscripción Pro Activa
            </span>
          ) : (
            <button
              onClick={onOpenRegisterModal}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-white" />
              <span>Registrar Cuenta Pro</span>
            </button>
          )}
        </div>
      </div>

      {/* Subscription & Payment Card if User Registered */}
      {userProfile ? (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl border border-amber-500/30 shadow-xl space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-amber-400 block">
                  {subInfo.isPaid
                    ? userProfile.subscriptionStatus === 'canceling_end_of_period'
                      ? `Baja Programada (${subInfo.daysRemaining} días restantes)`
                      : 'Suscripción de Pago Activa'
                    : 'Modo Invitado / Prueba Gratis'}
                </span>
                <h4 className="text-base font-extrabold text-white">
                  {subInfo.isPaid
                    ? userProfile.subscriptionPlan === 'annual'
                      ? 'Plan Suscriptor Anual (60 € / año - 360 días)'
                      : 'Plan Suscriptor Mensual (5 € / mes - 28 días)'
                    : 'Registro Invitado (Sin Pago)'}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={onOpenRegisterModal}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-extrabold text-xs border border-amber-500/30 transition-all cursor-pointer"
              >
                Cambiar Plan o Método
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800 text-xs">
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Créditos por Apartado</span>
              <span className="text-amber-300 font-black text-sm mt-0.5 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                {userProfile.subscriptionPlan === 'annual'
                  ? '1.000 / semana'
                  : userProfile.subscriptionPlan === 'monthly'
                  ? '500 / semana'
                  : '100 / semana'}
              </span>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Método de Pago</span>
              <span className="text-slate-200 font-bold mt-0.5 block">
                {subInfo.isPaid
                  ? userProfile.paymentMethod === 'paypal'
                    ? 'PayPal (Pago Cifrado)'
                    : `Tarjeta Crédito/Débito (•••• ${userProfile.cardLast4 || '4242'})`
                  : 'Sin Pago (Modo Invitado)'}
              </span>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Estado de Cuenta</span>
              <span className={`font-bold mt-0.5 flex items-center gap-1 ${
                userProfile.subscriptionStatus === 'canceling_end_of_period'
                  ? 'text-amber-400'
                  : userProfile.subscriptionStatus === 'cancelled'
                  ? 'text-rose-400'
                  : 'text-emerald-400'
              }`}>
                {userProfile.subscriptionStatus === 'canceling_end_of_period' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                    Baja {subInfo.expirationDateStr}
                  </>
                ) : userProfile.subscriptionStatus === 'cancelled' ? (
                  <>
                    <X className="w-3.5 h-3.5 text-rose-400" />
                    Cancelado
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    {subInfo.isPaid ? 'Suscripción Activa' : 'Invitado Activo'}
                  </>
                )}
              </span>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Fecha de Alta</span>
              <span className="text-slate-200 font-bold mt-0.5 block">
                {userProfile.registeredAt}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 rounded-2xl border border-slate-700 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-wider text-amber-400 block">
                Modo Invitado Activo
              </span>
              <h4 className="text-sm font-extrabold text-white">
                Dispones de 100 créditos semanales en cada apartado
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Hazte suscriptor para obtener 500 o 1.000 créditos semanales por apartado y desbloquear tu Ficha de Entrenador.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenRegisterModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-black text-xs shadow-lg shadow-orange-500/20 shrink-0 cursor-pointer"
          >
            Suscribirse desde 5 €/mes
          </button>
        </div>
      )}

      {/* Profile Card / Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            <span>Datos del Entrenador / Suscriptor</span>
          </h3>

          {userProfile && (
            <span className="text-xs text-slate-400 font-mono">
              Registrado el: {userProfile.registeredAt}
            </span>
          )}
        </div>

        {!userProfile ? (
          <div className="bg-amber-500/10 border border-amber-500/30 p-6 rounded-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 text-white flex items-center justify-center mx-auto shadow-md">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900">
                Ficha Oficial del Entrenador Bloqueada
              </h4>
              <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed mt-1">
                La tarjeta <strong className="text-slate-900">Ficha de Entrenador</strong> es la única sección restringida exclusivamente para entrenadores que hayan activado su suscripción de pago. Suscríbete para acceder a tu ficha oficial y desbloquear todas las herramientas sin límites.
              </p>
            </div>
            <button
              onClick={onOpenFichaLockModal || onOpenRegisterModal}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-xs inline-flex items-center gap-2 shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Suscribirse para Desbloquear Ficha de Entrenador</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-blue-600" /> Nombre
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-blue-600" /> Apellidos
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-blue-600" /> Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-blue-600" /> Teléfono
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-blue-600" /> País
                </label>
                <input
                  type="text"
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" /> Pueblo / Ciudad
                </label>
                <input
                  type="text"
                  required
                  value={town}
                  onChange={(e) => setTown(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-500" /> Club / Colegio / Entidad
                </label>
                <input
                  type="text"
                  required
                  value={club}
                  onChange={(e) => setClub(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" /> Temporada Actual
                </label>
                <input
                  type="text"
                  required
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  placeholder="Ej. 2025/2026"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cargo / Rol en el Equipo</label>
                <select
                  value={coachRole}
                  onChange={(e) => setCoachRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                >
                  <option value="Entrenador Principal">Entrenador Principal</option>
                  <option value="Entrenador Ayudante">Entrenador Ayudante</option>
                  <option value="Director Técnico">Director Técnico</option>
                  <option value="Preparador Físico">Preparador Físico</option>
                  <option value="Coordinador Cantera">Coordinador Cantera</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Titulación / Licencia FEB</label>
                <select
                  value={coachLevel}
                  onChange={(e) => setCoachLevel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                >
                  <option value="Nivel 1 / Iniciación">Nivel 1 / Iniciación</option>
                  <option value="Nivel 2 / Autonómico">Nivel 2 / Autonómico</option>
                  <option value="Nivel 3 / Superior (FEB)">Nivel 3 / Superior (FEB)</option>
                  <option value="Sin Titulación Oficial">Sin Titulación Oficial</option>
                  <option value="Estudiante Ciencias del Deporte">Estudiante Ciencias del Deporte</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Género del Equipo</label>
                <select
                  value={teamGender}
                  onChange={(e) => setTeamGender(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                >
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Mixto">Mixto</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nivel del Equipo</label>
                <select
                  value={teamLevel}
                  onChange={(e) => setTeamLevel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                >
                  <option value="Escolar / Iniciación">Escolar / Iniciación</option>
                  <option value="Liga Local / Municipal">Liga Local / Municipal</option>
                  <option value="Autonómico">Autonómico</option>
                  <option value="Regional">Regional</option>
                  <option value="Nacional">Nacional / Liga EBA / FEB</option>
                  <option value="Cantera Profesional / ACB">Cantera Profesional / ACB</option>
                  <option value="Profesional">Profesional</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Categoría del Equipo</label>
                <select
                  value={teamCategory}
                  onChange={(e) => setTeamCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                >
                  <option value="Benjamín (Sub-10)">Benjamín (Sub-10)</option>
                  <option value="Alevín (Sub-12)">Alevín (Sub-12)</option>
                  <option value="Infantil (Sub-14)">Infantil (Sub-14)</option>
                  <option value="Cadete (Sub-16)">Cadete (Sub-16)</option>
                  <option value="Juvenil / Junior (Sub-18)">Juvenil / Junior (Sub-18)</option>
                  <option value="Sub-22">Sub-22</option>
                  <option value="Senior">Senior</option>
                  <option value="Sénior Pro">Sénior Pro</option>
                  <option value="Veteranos">Veteranos</option>
                </select>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>¡Ficha actualizada con éxito!</span>
                  </>
                ) : (
                  <span>Guardar Cambios del Perfil</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Clean Architecture Info & Cancel Subscription / Reset Workspace */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-5 h-5" />
            <span>Gestión de Suscripción & Espacio de Trabajo</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setCancelStep(1);
                setIsCancelModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-200 font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span>Dejar la suscripción</span>
            </button>
          </div>
        </div>

        {userProfile?.subscriptionStatus === 'canceling_end_of_period' && (
          <div className="p-4 rounded-xl bg-amber-950/80 border border-amber-600/60 text-amber-200 text-xs leading-relaxed space-y-1">
            <div className="font-extrabold text-amber-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Suscripción de Pago ({subInfo.planLabel}) en proceso de baja programada</span>
            </div>
            <p>
              Has solicitado la baja de tu suscripción. Tu servicio vence exactamente el <strong>{subInfo.expirationDateStr}</strong> ({subInfo.daysTotal} días desde tu alta el {userProfile.registeredAt}). Te quedan <strong>{subInfo.daysRemaining} días</strong> de acceso garantizado con tus créditos IA. Al finalizar los {subInfo.daysTotal} días se cerrará automáticamente sin nuevos cobros.
            </p>
          </div>
        )}

        {userProfile?.subscriptionStatus === 'cancelled' && (
          <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-600/60 text-rose-200 text-xs leading-relaxed space-y-1">
            <div className="font-extrabold text-rose-300 flex items-center gap-2">
              <X className="w-4 h-4 text-rose-400" />
              <span>Registro / Suscripción Anulada</span>
            </div>
            <p>
              Tu registro o suscripción ha sido anulado. Puedes volver a registrarte o suscribirte en cualquier momento cuando lo desees.
            </p>
          </div>
        )}

        <p className="text-xs text-slate-300 leading-relaxed">
          Cada entrenador dispone de su propio entorno de trabajo local independiente. Todos tus datos (entrenamientos guardados, jugadoras y registros) permanecen limpios y privados en tu espacio de trabajo.
        </p>
      </div>

      {/* Activación por Bizum / Código VIP Card */}
      <div className="bg-gradient-to-br from-amber-950/70 via-slate-900 to-emerald-950/70 text-white p-6 rounded-2xl border border-amber-500/30 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-amber-500/20 pb-3">
          <div className="flex items-center gap-2.5 text-amber-400 font-extrabold text-sm uppercase tracking-wide">
            <Ticket className="w-5 h-5 text-amber-400" />
            <span>Activar Suscripción Pro mediante Bizum o Código VIP</span>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Activación Inmediata
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Si has realizado el pago de tu suscripción por <strong>Bizum</strong> o te han facilitado un <strong>Código de Activación Pro</strong>, introdúcelo a continuación para activar tu cuenta de inmediato.
        </p>

        {activationMessage && (
          <div
            className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
              activationMessage.isError
                ? 'bg-rose-950/80 border-rose-600/80 text-rose-200'
                : 'bg-emerald-950/80 border-emerald-600/80 text-emerald-200'
            }`}
          >
            {activationMessage.isError ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{activationMessage.text}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
          <input
            type="text"
            value={activationCodeInput}
            onChange={(e) => setActivationCodeInput(e.target.value)}
            placeholder="Introduce tu código de activación (Ej: BIZUM-PRO-XXXX)"
            className="flex-1 px-4 py-2.5 bg-slate-950 border border-amber-500/40 rounded-xl text-amber-300 font-mono text-sm font-bold uppercase tracking-wider focus:ring-2 focus:ring-amber-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleActivateWithCode}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs shadow-md shadow-orange-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
            <span>Activar Suscripción Pro</span>
          </button>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-white/10 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Activación mediante Bizum / WhatsApp</span>
          </div>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hola! Deseo activar mi suscripción Pro en CoachMind.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 font-bold hover:underline flex items-center gap-1"
          >
            <MessageSquare className="w-3 h-3" />
            <span>Hablar por WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Cancellation Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col relative text-slate-900 dark:text-slate-100 my-auto overflow-hidden">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsCancelModalOpen(false)}
              className="absolute top-3 right-3 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Scrollable Content Container */}
            <div className="overflow-y-auto p-5 sm:p-6 space-y-4">
              {cancelStep === 1 ? (
                /* STEP 1: Explanation, Return Policy & Rating Invitation */
                <div className="space-y-4">
                  <div className="flex items-center gap-3.5 pr-8">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                      <HeartHandshake className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-extrabold tracking-tight">
                        ¿Deseas dejar la suscripción?
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {subInfo.isPaid ? `Suscripción de Pago ${subInfo.planLabel}` : 'Registro Modo Invitado (Sin Pago)'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs leading-relaxed">
                    <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 space-y-1">
                      <div className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2 text-xs">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>¡Siempre serás bienvenido de vuelta!</span>
                      </div>
                      <p className="text-[11px] sm:text-xs">
                        Queremos darte las gracias de corazón por confiar en nosotros y por todo tu trabajo como entrenador. Queremos recordarte que siempre puedes volver cuando lo desees, ¡aquí serás recibido con los brazos abiertos!
                      </p>
                    </div>

                    {/* BACKUP DOWNLOAD WARNING ALERT BOX */}
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-amber-950/90 via-rose-950/90 to-slate-900 border-2 border-amber-500/80 text-white shadow-xl space-y-2.5">
                      <div className="flex items-center gap-2 text-amber-300 font-black text-xs uppercase tracking-wide">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
                        <span>¡ADVERTENCIA IMPORTANTE! DESCARGA TU BIBLIOTECA</span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-amber-100/90 leading-relaxed font-medium">
                        Antes de finalizar tu suscripción o anular tu registro, <strong>descarga una copia de seguridad de tu biblioteca</strong>. Cuando se cierre tu suscripción o anules tu registro, la interfaz de la web quedará totalmente limpia de todos los datos (entrenamientos, pizarra táctica, jugadores, partidos y filosofía) que hayas creado en la web.
                      </p>

                      <button
                        type="button"
                        onClick={() => {
                          const ok = downloadLibraryBackup(userProfile || null);
                          if (ok) {
                            setHasDownloadedBackup(true);
                            alert('¡Copia de seguridad descargada con éxito! Revisa la carpeta de descargas de tu navegador.');
                          } else {
                            alert('No se pudieron exportar los datos locales.');
                          }
                        }}
                        className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer border border-amber-300/40"
                      >
                        <Download className="w-4 h-4 text-slate-950" />
                        <span>Descargar Copia de Seguridad de mi Biblioteca (.json)</span>
                      </button>
                      {hasDownloadedBackup && (
                        <p className="text-[10px] text-emerald-400 font-extrabold text-center flex items-center justify-center gap-1">
                          <Check className="w-3.5 h-3.5 text-emerald-400" /> Archivo de respaldo guardado correctamente
                        </p>
                      )}
                    </div>

                    {!subInfo.isPaid ? (
                      <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200 space-y-1">
                        <div className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-2 text-xs">
                          <X className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>Anulación Inmediata y Limpieza de Datos (Modo Invitado)</span>
                        </div>
                        <p className="text-[11px] sm:text-xs">
                          Al tratarse de un registro en modo invitado sin ningún pago realizado, tu cancelación se efectúa <strong>al momento de forma inmediata</strong>. Tu ficha de entrenador se eliminará y la interfaz quedará totalmente limpia.
                        </p>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 space-y-1">
                        <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 text-xs">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>Garantía de {subInfo.daysTotal} días contratados</span>
                        </div>
                        <p className="text-[11px] sm:text-xs">
                          Tu suscripción de pago <strong>{subInfo.planLabel}</strong> contratada el <strong>{userProfile?.registeredAt}</strong> te concede acceso durante los <strong>{subInfo.daysTotal} días</strong> pagados. La suscripción se cerrará el <strong>{subInfo.expirationDateStr}</strong> (te quedan <strong>{subInfo.daysRemaining} días</strong>). No se te pasará ningún nuevo cobro. Recuerda haber respaldado tu biblioteca antes del vencimiento.
                        </p>
                      </div>
                    )}

                    <div
                      onClick={() => setIsReviewModalOpen(true)}
                      className="p-3.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 border border-blue-200/80 dark:border-blue-800/60 text-blue-900 dark:text-blue-200 space-y-1 cursor-pointer transition-all hover:scale-[1.01] group shadow-sm"
                    >
                      <div className="font-bold text-blue-800 dark:text-blue-300 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Star className="w-3.5 h-3.5 text-blue-500 fill-blue-500 shrink-0" />
                          <span>Nos ayuda mucho tu opinión</span>
                        </div>
                        <span className="text-[10px] font-extrabold bg-blue-600 text-white dark:bg-blue-500 px-2 py-0.5 rounded-full shadow-sm group-hover:bg-blue-700 transition-colors">
                          ★ Calificar App
                        </span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-blue-900/90 dark:text-blue-200/90">
                        Haz clic aquí para dejarnos tu reseña con 5 estrellas. ¡Se publicará directamente en el espacio de opiniones del Dashboard!
                      </p>
                    </div>
                  </div>

                  {/* Step 1 Actions */}
                  <div className="flex items-center gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCancelModalOpen(false)}
                      className="w-1/2 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs transition-all cursor-pointer text-center border border-slate-200 dark:border-slate-700"
                    >
                      Volver
                    </button>
                    <button
                      type="button"
                      onClick={() => setCancelStep(2)}
                      className="w-1/2 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer text-center"
                    >
                      {subInfo.isPaid ? 'Dejar la suscripción' : 'Anular Registro'}
                    </button>
                  </div>
                </div>
              ) : (
                /* STEP 2: Short Form, Rating & WhatsApp Redirect */
                <div className="space-y-4">
                  <div className="flex items-center gap-3.5 pr-8">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-extrabold tracking-tight">
                        Motivo y Valoración
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Cuéntanos por qué lo haces para ayudarnos a mejorar
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    {/* Star Rating */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                      <label className="block font-bold text-slate-800 dark:text-slate-200 text-xs">
                        ¿Cómo calificas tu experiencia con la App?
                      </label>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setStarRating(star)}
                            className="p-1 transition-transform hover:scale-110 cursor-pointer focus:outline-none"
                          >
                            <Star
                              className={`w-6 h-6 ${
                                star <= starRating
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-300 dark:text-slate-600'
                              }`}
                            />
                          </button>
                        ))}
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 ml-2">
                          {starRating === 5 && '¡Excelente!'}
                          {starRating === 4 && 'Muy buena'}
                          {starRating === 3 && 'Buena'}
                          {starRating === 2 && 'Regular'}
                          {starRating === 1 && 'Mejorable'}
                        </span>
                      </div>
                    </div>

                    {/* Reason Dropdown */}
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-800 dark:text-slate-200 text-xs">
                        Motivo principal de la baja:
                      </label>
                      <select
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      >
                        <option value="Fin de temporada / Sin equipo actualmente">
                          Fin de temporada / Sin equipo actualmente
                        </option>
                        <option value="Falta de tiempo para usarla">
                          Falta de tiempo para usarla
                        </option>
                        <option value="Ajuste de presupuesto / Precio">
                          Ajuste de presupuesto / Precio
                        </option>
                        <option value="Probaré otras herramientas">
                          Probaré otras herramientas
                        </option>
                        <option value="Otro motivo">Otro motivo</option>
                      </select>
                    </div>

                    {/* Feedback Textarea */}
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-800 dark:text-slate-200 text-xs">
                        Comentarios o sugerencias (opcional):
                      </label>
                      <textarea
                        rows={2}
                        value={cancelFeedback}
                        onChange={(e) => setCancelFeedback(e.target.value)}
                        placeholder="Escribe aquí tu opinión o recomendaciones..."
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none"
                      />
                    </div>
                  </div>

                  {/* Step 2 Actions */}
                  <div className="flex items-center gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setCancelStep(1)}
                      className="w-1/3 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs transition-all cursor-pointer text-center flex items-center justify-center gap-1 border border-slate-200 dark:border-slate-700"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Atrás</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const coachName = `${firstName} ${lastName}`.trim() || 'Entrenador';

                        if (!subInfo.isPaid) {
                          // GUEST MODE / UNPAID: IMMEDIATE CANCELLATION & COMPLETE WIPE
                          if (onClearAllData) {
                            onClearAllData();
                          } else {
                            localStorage.removeItem('coachmind_user_profile');
                            localStorage.removeItem('coachmind_calendar_events');
                            localStorage.removeItem('coachmind_philosophy');
                            localStorage.removeItem('coachmind_trainings');
                            localStorage.removeItem('coachmind_players');
                            localStorage.removeItem('coachmind_matches');
                            localStorage.removeItem('coach_saved_plays');
                          }

                          if (onUpdateProfile) {
                            onUpdateProfile(null);
                          }

                          // Sync to Google Sheets
                          try {
                            const sheetRecord = {
                              fechaRegistro: userProfile?.registeredAt || new Date().toLocaleDateString('es-ES'),
                              nombreCompleto: coachName,
                              email: email || '',
                              telefono: phone || '',
                              pais: country || 'España',
                              ciudad: town || '',
                              club: club || '',
                              cargoRol: coachRole || '',
                              titulacion: coachLevel || '',
                              generoEquipo: teamGender || '',
                              nivelEquipo: teamLevel || '',
                              categoriaEquipo: teamCategory || '',
                              plan: 'Sin Suscripción (Invitado Cancelado)',
                              metodoPago: 'Sin Pago',
                              estado: 'Anulado al Momento - Ficha Eliminada e Interfaz Limpia',
                            };

                            fetch('/api/sync-google-sheet', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(sheetRecord),
                            }).catch(() => {});
                          } catch (err) {}

                          setIsCancelModalOpen(false);
                          alert(
                            'Tu registro en modo invitado ha sido anulado con éxito. Tu ficha de entrenador se ha eliminado y la interfaz de la web ha quedado totalmente limpia de datos.'
                          );
                        } else {
                          // PAID SUBSCRIPTION: SCHEDULED CANCELLATION (360 DAYS ANNUAL / 28 DAYS MONTHLY)
                          const baseProfile: UserProfile = userProfile!;

                          const updatedProfile: UserProfile = {
                            ...baseProfile,
                            subscriptionStatus: 'canceling_end_of_period',
                          };

                          if (onUpdateProfile) {
                            onUpdateProfile(updatedProfile);
                          } else {
                            localStorage.setItem(
                              'coachmind_user_profile',
                              JSON.stringify(updatedProfile)
                            );
                          }

                          // Sync to Google Sheets
                          try {
                            const sheetRecord = {
                              fechaRegistro: updatedProfile.registeredAt,
                              nombreCompleto: `${updatedProfile.firstName} ${updatedProfile.lastName}`,
                              email: updatedProfile.email,
                              telefono: updatedProfile.phone,
                              pais: updatedProfile.country,
                              ciudad: updatedProfile.town,
                              club: updatedProfile.club,
                              cargoRol: updatedProfile.coachRole || '',
                              titulacion: updatedProfile.coachLevel || '',
                              generoEquipo: updatedProfile.teamGender || '',
                              nivelEquipo: updatedProfile.teamLevel || '',
                              categoriaEquipo: updatedProfile.teamCategory || '',
                              plan: `Pago ${subInfo.planLabel} (${subInfo.daysTotal} días)`,
                              metodoPago: updatedProfile.paymentMethod || 'Pago Cifrado',
                              estado: `Baja Programada (Pago ${subInfo.planLabel} - ${subInfo.daysTotal} días - Vence: ${subInfo.expirationDateStr})`,
                            };

                            fetch('/api/sync-google-sheet', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(sheetRecord),
                            }).catch(() => {});
                          } catch (err) {}

                          const messageText =
                            `Hola, solicito gestionar la baja de mi suscripción de pago ${subInfo.planLabel} en CoachMind.\n\n` +
                            `👤 Entrenador: ${coachName}\n` +
                            `⚽ Club: ${club || 'No especificado'}\n` +
                            `📅 Fecha de Alta: ${userProfile?.registeredAt}\n` +
                            `⏳ Periodo Contratado: ${subInfo.daysTotal} días (Vence el ${subInfo.expirationDateStr})\n` +
                            `⭐ Calificación: ${starRating}/5 estrellas\n` +
                            `📋 Motivo: ${cancelReason}\n` +
                            (cancelFeedback ? `💬 Sugerencias: ${cancelFeedback}\n\n` : '\n') +
                            `Solicito tramitar la baja programada para el vencimiento de mis ${subInfo.daysTotal} días. ¡Muchas gracias!`;

                          const encodedText = encodeURIComponent(messageText);
                          window.open(
                            `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedText}`,
                            '_blank'
                          );

                          setIsCancelModalOpen(false);
                          alert(
                            `Se ha enviado tu solicitud de baja programada. Tu acceso continuará activo durante los ${subInfo.daysRemaining} días restantes (vence el ${subInfo.expirationDateStr}). Recuerda descargar la copia de seguridad de tu biblioteca antes de la fecha de cierre.`
                          );
                        }
                      }}
                      className={`w-2/3 py-2.5 px-3 rounded-xl font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 text-white ${
                        !subInfo.isPaid
                          ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                          : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                      }`}
                    >
                      {!subInfo.isPaid ? (
                        <>
                          <X className="w-3.5 h-3.5 text-white" />
                          <span>Anular Registro Al Momento</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5 text-white" />
                          <span>Enviar WhatsApp ({subInfo.daysTotal} Días)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        userProfile={userProfile}
      />
    </div>
  );
};
