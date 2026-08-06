import React, { useState } from 'react';
import { FileSpreadsheet, Sparkles, Check, ExternalLink, RefreshCw, Lock, ShieldCheck, Download, Users, UserCheck, UserX } from 'lucide-react';
import { UserProfile } from '../types';

interface GoogleSheetsSyncCardProps {
  userProfile?: UserProfile | null;
}

export interface CoachRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  club: string;
  teamLevel: string;
  teamCategory: string;
  isSubscribed: boolean;
  subscriptionPlan?: string;
  paymentMethod?: string;
  creditsRemaining?: number;
  registeredAt: string;
  status: string;
}

// Sample initial database of coaches for demonstration and syncing
export const initialCoachesDatabase: CoachRecord[] = [
  // Entrenadores Suscritos (De Pago)
  {
    id: 'coach-001',
    firstName: 'Carlos',
    lastName: 'García Pérez',
    email: 'carlos.garcia@baloncesto.es',
    phone: '+34 612 345 678',
    club: 'CB Estudiantes Cadete',
    teamLevel: 'Autonómico',
    teamCategory: 'Cadete (Sub-16)',
    isSubscribed: true,
    subscriptionPlan: 'Anual (119,99€/año)',
    paymentMethod: 'Tarjeta (•••• 4242)',
    creditsRemaining: 3500,
    registeredAt: '2026-01-15',
    status: 'Activa (Pro)',
  },
  {
    id: 'coach-002',
    firstName: 'María',
    lastName: 'Fernández López',
    email: 'maria.fdez@basketclub.com',
    phone: '+34 689 112 233',
    club: 'Valencia Basket Cantera',
    teamLevel: 'Regional',
    teamCategory: 'Infantil (Sub-14)',
    isSubscribed: true,
    subscriptionPlan: 'Mensual (14,99€/mes)',
    paymentMethod: 'PayPal',
    creditsRemaining: 210,
    registeredAt: '2026-02-01',
    status: 'Activa (Pro)',
  },
  {
    id: 'coach-003',
    firstName: 'Javier',
    lastName: 'Martínez Ruiz',
    email: 'j.martinez@cbcanarias.org',
    phone: '+34 655 443 211',
    club: 'Juventud Badalona Sub-18',
    teamLevel: 'Nacional',
    teamCategory: 'Junior (Sub-18)',
    isSubscribed: true,
    subscriptionPlan: 'Anual (119,99€/año)',
    paymentMethod: 'Tarjeta (•••• 8812)',
    creditsRemaining: 3200,
    registeredAt: '2025-11-20',
    status: 'Activa (Pro)',
  },
  // Entrenadores No Suscritos (Prueba Gratuita / Invitados)
  {
    id: 'coach-004',
    firstName: 'David',
    lastName: 'Sánchez Gómez',
    email: 'david.sanchez@gmail.com',
    phone: '+34 633 998 877',
    club: 'CD Basket San Agustín',
    teamLevel: 'Escolar / Iniciación',
    teamCategory: 'Alevín (Sub-12)',
    isSubscribed: false,
    subscriptionPlan: 'Ninguno (Invitado)',
    paymentMethod: '-',
    creditsRemaining: 0,
    registeredAt: '2026-03-02',
    status: 'Prueba Gratuita (Límite 1 acción/sem)',
  },
  {
    id: 'coach-005',
    firstName: 'Laura',
    lastName: 'Torres Navarro',
    email: 'laura.torres@hotmail.com',
    phone: '+34 677 221 100',
    club: 'Colegio Maristas Basket',
    teamLevel: 'Liga Local',
    teamCategory: 'Benjamín (Sub-10)',
    isSubscribed: false,
    subscriptionPlan: 'Ninguno (Invitado)',
    paymentMethod: '-',
    creditsRemaining: 0,
    registeredAt: '2026-03-05',
    status: 'Prueba Gratuita (Límite 1 acción/sem)',
  },
  {
    id: 'coach-006',
    firstName: 'Alejandro',
    lastName: 'Navarro Vidal',
    email: 'a.navarro@basketmadrid.org',
    phone: '+34 644 332 211',
    club: 'Real Canoe NC',
    teamLevel: 'Autonómico',
    teamCategory: 'Senior',
    isSubscribed: false,
    subscriptionPlan: 'Ninguno (Invitado)',
    paymentMethod: '-',
    creditsRemaining: 0,
    registeredAt: '2026-03-08',
    status: 'Prueba Gratuita (Límite 1 acción/sem)',
  },
];

export const GoogleSheetsSyncCard: React.FC<GoogleSheetsSyncCardProps> = ({ userProfile }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState(false);

  // Filter current database
  const subscribedList = initialCoachesDatabase.filter((c) => c.isSubscribed);
  const nonSubscribedList = initialCoachesDatabase.filter((c) => !c.isSubscribed);

  // If user profile exists, append or merge it to subscribed list
  if (userProfile && !subscribedList.some((c) => c.email === userProfile.email)) {
    subscribedList.unshift({
      id: 'current-user',
      firstName: userProfile.firstName || 'Entrenador',
      lastName: userProfile.lastName || 'Registrado',
      email: userProfile.email || 'entrenador@coachmind.app',
      phone: userProfile.phone || 'N/A',
      club: userProfile.club || 'Sin Club',
      teamLevel: userProfile.teamLevel || 'Autonómico',
      teamCategory: userProfile.teamCategory || 'Senior',
      isSubscribed: true,
      subscriptionPlan: userProfile.subscriptionPlan === 'annual' ? 'Anual (119,99€/año)' : 'Mensual (14,99€/mes)',
      paymentMethod: userProfile.paymentMethod === 'paypal' ? 'PayPal' : `Tarjeta (•••• ${userProfile.cardLast4 || '4242'})`,
      creditsRemaining: userProfile.creditsRemaining ?? 250,
      registeredAt: userProfile.registeredAt || new Date().toISOString().split('T')[0],
      status: 'Activa (Pro)',
    });
  }

  const handleSyncGoogleSheets = async () => {
    setIsSyncing(true);
    setErrorMessage(null);
    setSyncSuccess(false);

    try {
      // Send coaches payload to Express endpoint /api/sheets/sync-coaches
      const response = await fetch('/api/sheets/sync-coaches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscribedCoaches: subscribedList,
          nonSubscribedCoaches: nonSubscribedList,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al conectar con la API de Google Sheets');
      }

      setSheetUrl(data.spreadsheetUrl);
      setLastSyncTime(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setSyncSuccess(true);
    } catch (err: any) {
      console.error('Error syncing Google Sheets:', err);
      setErrorMessage(err.message || 'Error durante la sincronización');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownloadCSV = (type: 'subscribed' | 'nonsubscribed') => {
    const list = type === 'subscribed' ? subscribedList : nonSubscribedList;
    const headers = ['ID', 'Nombre', 'Apellidos', 'Email', 'Teléfono', 'Club', 'Nivel Equipo', 'Categoría', 'Plan', 'Método Pago', 'Estado'];
    
    const rows = list.map((c) => [
      c.id,
      `"${c.firstName}"`,
      `"${c.lastName}"`,
      `"${c.email}"`,
      `"${c.phone}"`,
      `"${c.club}"`,
      `"${c.teamLevel}"`,
      `"${c.teamCategory}"`,
      `"${c.subscriptionPlan || '-'}"`,
      `"${c.paymentMethod || '-'}"`,
      `"${c.status}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CoachMind_Entrenadores_${type === 'subscribed' ? 'Suscritos' : 'No_Suscritos'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-indigo-950 text-white p-6 rounded-2xl border border-emerald-500/30 shadow-xl space-y-5">
      {/* Card Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-emerald-500/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-950/40">
            <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Base de Datos Google Sheets
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-white tracking-tight">
              Sincronización de Entrenadores (Suscritos vs No Suscritos)
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSyncGoogleSheets}
          disabled={isSyncing}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Creando Google Sheet...' : 'Crear / Sincronizar Google Sheet'}</span>
        </button>
      </div>

      {/* Privacy Guarantee & Administrator Access Badge */}
      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/40 text-emerald-200 text-xs space-y-1.5 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="space-y-0.5">
          <h4 className="font-extrabold text-white text-xs flex items-center gap-1.5">
            <span>Privacidad & Acceso Exclusivo de Administrador</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Solo Tú
            </span>
          </h4>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Esta hoja de cálculo de Google Sheets se crea de forma privada directamente dentro de tu cuenta personal de Google Drive. <strong>Ningún otro usuario ni entrenador registrado en la plataforma tiene acceso a este documento ni a la base de datos</strong>.
          </p>
        </div>
      </div>

      {/* Database Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Subscribed Coaches Block */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              Entrenadores Suscritos (De Pago)
            </span>
            <span className="px-2 py-0.5 text-xs font-black rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {subscribedList.length} Registrados
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Entrenadores con suscripción mensual (14,99€) o anual (119,99€) activa, créditos de IA ilimitados y ficha oficial.
          </p>
          <div className="pt-2 flex items-center justify-between border-t border-slate-800 text-[11px]">
            <span className="text-slate-400">Exportar grupo:</span>
            <button
              type="button"
              onClick={() => handleDownloadCSV('subscribed')}
              className="text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>Descargar CSV</span>
            </button>
          </div>
        </div>

        {/* Non-Subscribed Coaches Block */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <UserX className="w-4 h-4 text-amber-400" />
              Entrenadores No Suscritos (Gratuitos)
            </span>
            <span className="px-2 py-0.5 text-xs font-black rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {nonSubscribedList.length} Invitados
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Entrenadores en modo prueba con acceso limitado (1 acción/semana). Ideal para seguimiento comercial y conversión a Pro.
          </p>
          <div className="pt-2 flex items-center justify-between border-t border-slate-800 text-[11px]">
            <span className="text-slate-400">Exportar grupo:</span>
            <button
              type="button"
              onClick={() => handleDownloadCSV('nonsubscribed')}
              className="text-amber-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>Descargar CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sync Status / Google Sheet Link Banner */}
      {sheetUrl && (
        <div className="p-4 rounded-xl bg-emerald-950/90 border border-emerald-500/50 space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-300 font-extrabold text-xs">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>¡Base de Datos Creada y Sincronizada en Google Sheets!</span>
            </div>
            {lastSyncTime && (
              <span className="text-[10px] text-slate-400">Última sinc: {lastSyncTime}</span>
            )}
          </div>
          <p className="text-xs text-slate-200">
            Se ha creado y actualizado tu libro de cálculo en Google Sheets con pestañas separadas para Entrenadores Suscritos y No Suscritos.
          </p>
          <div className="pt-2">
            <a
              href={sheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Abrir Hoja de Cálculo en Google Sheets</span>
            </a>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-950/80 border border-red-700/80 rounded-xl text-red-200 text-xs font-medium">
          ⚠️ {errorMessage}
        </div>
      )}
    </div>
  );
};
