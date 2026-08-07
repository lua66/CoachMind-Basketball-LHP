import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Compass,
  Calendar,
  BarChart3,
  Video,
  ClipboardList,
  Users,
  Brain,
  Settings,
  Dumbbell,
  Sparkles,
  Share2,
  Check,
  X,
} from 'lucide-react';
import { ViewMode, UserProfile } from '../types';

interface SidebarProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  savedTrainingsCount?: number;
  playersCount?: number;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  userProfile?: UserProfile | null;
  onOpenRegisterModal?: () => void;
  authUser?: any;
  onSignOut?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  savedTrainingsCount = 0,
  playersCount = 0,
  isMobileOpen = false,
  onMobileClose,
  userProfile,
  onOpenRegisterModal,
  authUser,
  onSignOut,
}) => {
  const [copiedCleanLink, setCopiedCleanLink] = React.useState(false);

  const handleCopyCleanLink = () => {
    const cleanUrl = `${window.location.origin}/?clean=true`;
    navigator.clipboard.writeText(cleanUrl);
    setCopiedCleanLink(true);
    setTimeout(() => setCopiedCleanLink(false), 3000);
  };

  const navItems = [
    {
      id: 'dashboard' as ViewMode,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'calendar' as ViewMode,
      label: 'Calendario',
      icon: CalendarDays,
    },
    {
      id: 'philosophy' as ViewMode,
      label: 'Filosofía del Entrenador',
      icon: Compass,
    },
    {
      id: 'players' as ViewMode,
      label: 'Jugadores',
      icon: Users,
      badge: playersCount > 0 ? `${playersCount}` : undefined,
    },
    {
      id: 'trainings' as ViewMode,
      label: 'Entrenamientos',
      icon: Calendar,
      badge: savedTrainingsCount > 0 ? savedTrainingsCount : undefined,
    },
    {
      id: 'stats' as ViewMode,
      label: 'Estadísticas',
      icon: BarChart3,
    },
    {
      id: 'match-analysis' as ViewMode,
      label: 'Análisis de Partido',
      icon: Video,
    },
    {
      id: 'whiteboard' as ViewMode,
      label: 'Pizarra',
      icon: ClipboardList,
    },
    {
      id: 'coach-ai' as ViewMode,
      label: 'IA Entrenadora',
      icon: Brain,
      highlight: true,
    },
    {
      id: 'settings' as ViewMode,
      label: 'Configuración',
      icon: Settings,
    },
  ];

  const handleItemClick = (id: ViewMode) => {
    onNavigate(id);
    if (onMobileClose) {
      onMobileClose();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0B132B] text-slate-200 select-none">
      {/* Brand Header */}
      <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white font-bold shrink-0">
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-lg text-white tracking-tight">CoachMind</h1>
            </div>
            <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              BASKETBALL
            </p>
          </div>
        </div>

        {/* Mobile Close Button */}
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 group cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span
                  className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                    isActive
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {item.highlight && !isActive && (
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Account & Firebase / Cloud SQL Panel */}
      <div className="p-3.5 m-3 rounded-xl bg-slate-900/90 border border-slate-800/80 space-y-2">
        {authUser ? (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Cloud SQL & Auth Activo
              </span>
            </div>
            <p className="text-xs font-bold text-white truncate">{userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : authUser.email}</p>
            <p className="text-[10px] text-slate-400 truncate">{userProfile?.club || authUser.email}</p>
            
            <button
              type="button"
              onClick={onSignOut}
              className="mt-2.5 w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-red-900/40 text-slate-300 hover:text-red-300 text-[11px] font-bold border border-slate-700/60 hover:border-red-700/50 transition-all cursor-pointer text-center"
            >
              Cerrar Sesión
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Modo Invitado</span>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            </div>
            <p className="text-xs font-bold text-slate-200">Acceso Individual</p>
            
            {onOpenRegisterModal && (
              <div className="mt-2 space-y-1.5">
                <button
                  type="button"
                  onClick={onOpenRegisterModal}
                  className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-[11px] font-black transition-all cursor-pointer shadow-md shadow-orange-500/20 text-center"
                >
                  Iniciar Sesión / Registro
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const origin = window.location.origin;
                      const res = await fetch(`/api/auth/github/url?origin=${encodeURIComponent(origin)}`);
                      if (!res.ok) {
                        const err = await res.json();
                        alert(err.error || 'GITHUB_CLIENT_ID aún no configurado.');
                        return;
                      }
                      const { url } = await res.json();
                      window.open(url, 'github_oauth_popup', 'width=600,height=700');
                    } catch (e: any) {
                      alert('Error al conectar con GitHub: ' + e.message);
                    }
                  }}
                  className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold border border-slate-700/80 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 fill-current text-white" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  <span>Conectar GitHub</span>
                </button>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={handleCopyCleanLink}
          className="mt-2 w-full py-1.5 px-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer text-center"
        >
          {copiedCleanLink ? (
            <>
              <Check className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="text-emerald-300">¡Enlace Limpio Copiado!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3 h-3 text-amber-400 shrink-0" />
              <span>Copiar Enlace Limpio para Compartir</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar (hidden on mobile) */}
      <aside className="hidden md:flex w-64 shrink-0 h-screen sticky top-0 border-r border-slate-800/80 shadow-xl z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={onMobileClose}
          />
          {/* Slide-over panel */}
          <div className="relative w-72 max-w-[80vw] bg-[#0B132B] h-full shadow-2xl z-10 flex flex-col">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

