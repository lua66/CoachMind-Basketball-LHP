import React, { useState } from 'react';
import { UserProfile } from '../types';
import {
  ShieldCheck,
  Lock,
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
  ShieldAlert,
  Award,
  X,
  Sparkles,
  CreditCard,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Check,
  LogIn,
  KeyRound,
  Calendar,
} from 'lucide-react';
import { 
  auth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  googleProvider, 
  signInWithPopup 
} from '../lib/firebase';
import { saveCoachProfileToFirestore } from '../lib/firebaseSync';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (profile: UserProfile) => void;
  titleNotice?: string;
  userProfile?: UserProfile | null;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  onRegister,
  titleNotice,
  userProfile,
}) => {
  // View Mode: 'register' or 'login'
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');

  // Step state for register: 1 = Ficha de Entrenador, 2 = Pasarela de Pago
  const [step, setStep] = useState<1 | 2>(1);

  // Form Fields - Step 1
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('España');
  const [town, setTown] = useState('');
  const [club, setClub] = useState('');
  const [season, setSeason] = useState('2025/2026');
  const [teamGender, setTeamGender] = useState('Masculino');
  const [coachRole, setCoachRole] = useState('Entrenador Principal');
  const [coachLevel, setCoachLevel] = useState('Nivel 2 / Autonómico');
  const [teamLevel, setTeamLevel] = useState('Autonómico');
  const [teamCategory, setTeamCategory] = useState('Senior');
  const [errorMsg, setErrorMsg] = useState('');

  // Pre-fill user data if userProfile is provided
  React.useEffect(() => {
    if (isOpen) {
      if (userProfile) {
        setFirstName(userProfile.firstName || '');
        setLastName(userProfile.lastName || '');
        setEmail(userProfile.email || '');
        setPhone(userProfile.phone || '');
        setCountry(userProfile.country || 'España');
        setTown(userProfile.town || '');
        setClub(userProfile.club || '');
        setSeason(userProfile.season || '2025/2026');
        setCoachRole(userProfile.coachRole || 'Entrenador Principal');
        setCoachLevel(userProfile.coachLevel || 'Nivel 2 / Autonómico');
        setTeamGender(userProfile.teamGender || 'Masculino');
        setTeamLevel(userProfile.teamLevel || 'Autonómico');
        setTeamCategory(userProfile.teamCategory || 'Senior');
        setSubscriptionPlan(userProfile.subscriptionPlan || 'monthly');
        setPaymentMethod(userProfile.paymentMethod || 'card');
        setStep(2); // Start directly at Step 2 (Plan & Payment) for existing profile
      } else {
        setStep(1);
      }
      setErrorMsg('');
      setPaymentSuccess(false);
      setIsProcessingPayment(false);
    }
  }, [isOpen, userProfile]);

  // Login Fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Payment Fields - Step 2
  const [subscriptionPlan, setSubscriptionPlan] = useState<'monthly' | 'annual'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card');

  // Card details
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardHolder, setCardHolder] = useState('');

  // Processing state
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GITHUB_AUTH_SUCCESS') {
        const ghUser = event.data.user;
        if (ghUser) {
          const names = (ghUser.name || ghUser.login || 'Entrenador').split(' ');
          setFirstName(names[0] || 'Entrenador');
          setLastName(names.slice(1).join(' ') || '');
          setEmail(ghUser.email || `${ghUser.login}@github.com`);
          setErrorMsg('');
          alert(`¡Conectado con GitHub como @${ghUser.login}!`);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleGitHubConnect = async () => {
    try {
      const origin = window.location.origin;
      const response = await fetch(`/api/auth/github/url?origin=${encodeURIComponent(origin)}`);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'GITHUB_CLIENT_ID aún no configurado.');
      }
      const { url } = await response.json();
      const authWindow = window.open(url, 'github_oauth_popup', 'width=600,height=700');
      if (!authWindow) {
        alert('Por favor autoriza las ventanas emergentes (popups) para conectar con tu cuenta de GitHub.');
      }
    } catch (error: any) {
      console.error('GitHub OAuth error:', error);
      setErrorMsg(error.message || 'Error al conectar con GitHub');
    }
  };

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMsg('Introduce tu correo y contraseña para iniciar sesión.');
      return;
    }
    setErrorMsg('');
    setIsLoggingIn(true);

    try {
      await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword.trim());
      setIsLoggingIn(false);
      onClose();
    } catch (err: any) {
      console.error('Login error:', err);
      setIsLoggingIn(false);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setErrorMsg('El correo electrónico o la contraseña son incorrectos.');
      } else {
        setErrorMsg('Error al iniciar sesión. Por favor verifica tus datos.');
      }
    }
  };

  const handleGoToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !password.trim() ||
      !phone.trim() ||
      !country.trim() ||
      !town.trim() ||
      !club.trim() ||
      !season.trim() ||
      !teamGender.trim() ||
      !coachRole.trim() ||
      !coachLevel.trim() ||
      !teamLevel.trim() ||
      !teamCategory.trim()
    ) {
      setErrorMsg('Por favor completa todos los campos obligatorios (*) para continuar a la selección de plan.');
      return;
    }
    if (password.trim().length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres para asegurar tu cuenta.');
      return;
    }
    setErrorMsg('');
    setStep(2);
  };

  const handleRegisterGuest = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setErrorMsg('Por favor introduce al menos tu Nombre, Apellidos y Correo para registrarte como Invitado.');
      return;
    }

    setErrorMsg('');
    
    const guestProfile: UserProfile = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim() || 'No facilitado',
      country: country.trim() || 'España',
      town: town.trim() || 'No facilitada',
      club: club.trim() || 'Sin club asignado',
      season: season.trim() || '2025/2026',
      teamGender: teamGender.trim() || 'Masculino',
      coachRole: coachRole.trim() || 'Entrenador Principal',
      coachLevel: coachLevel.trim() || 'Iniciación',
      teamLevel: teamLevel.trim() || 'Autonómico',
      teamCategory: teamCategory.trim() || 'Senior',
      registeredAt: new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
      subscriptionPlan: undefined,
      subscriptionStatus: 'trial',
      creditsRemaining: 100,
      totalCredits: 100,
    };

    // Attempt guest signup in Firebase Auth if password provided
    if (password.trim().length >= 6) {
      try {
        const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password.trim());
        if (userCred?.user) {
          await saveCoachProfileToFirestore(userCred.user.uid, guestProfile);
        }
      } catch (authErr) {
        console.log('Firebase guest auth attempt:', authErr);
      }
    }

    // Sync record to local & backend Google Sheets log as unsubscribed / free trial
    try {
      const sheetRecord = {
        fechaRegistro: guestProfile.registeredAt,
        nombreCompleto: `${guestProfile.firstName} ${guestProfile.lastName}`,
        email: guestProfile.email,
        telefono: guestProfile.phone,
        pais: guestProfile.country,
        ciudad: guestProfile.town,
        club: guestProfile.club,
        cargoRol: guestProfile.coachRole,
        titulacion: guestProfile.coachLevel,
        generoEquipo: guestProfile.teamGender,
        nivelEquipo: guestProfile.teamLevel,
        categoriaEquipo: guestProfile.teamCategory,
        plan: 'Prueba Gratis (Modo Invitado)',
        metodoPago: 'Sin Pago (Invitado)',
        estado: 'No Suscrito (Prueba Gratis)',
      };

      const existingSheets = JSON.parse(localStorage.getItem('coachmind_google_sheet_records') || '[]');
      existingSheets.push(sheetRecord);
      localStorage.setItem('coachmind_google_sheet_records', JSON.stringify(existingSheets));

      fetch('/api/sync-google-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sheetRecord),
      }).catch(() => {});
    } catch (err) {
      console.error('Guest sheet logging error:', err);
    }

    onRegister(guestProfile);
    onClose();
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (paymentMethod === 'card') {
      if (!cardNumber.trim() || !cardExpiry.trim() || !cardCvc.trim()) {
        setErrorMsg('Por favor completa los datos de tu tarjeta bancaria.');
        return;
      }
    }

    setIsProcessingPayment(true);

    try {
      // Execute PayPal backend integration call if PayPal is selected
      if (paymentMethod === 'paypal') {
        try {
          const createRes = await fetch('/api/paypal/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              plan: subscriptionPlan,
              amount: subscriptionPlan === 'annual' ? '60.00' : '5.00'
            })
          });
          const createData = await createRes.json();
          if (!createData.success) {
            throw new Error(createData.error || 'Error al iniciar la orden de PayPal');
          }

          const captureRes = await fetch('/api/paypal/capture-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderID: createData.orderID })
          });
          const captureData = await captureRes.json();
          if (!captureData.success) {
            throw new Error(captureData.error || 'Error al completar el cobro con PayPal');
          }
        } catch (paypalError: any) {
          console.error('Error PayPal Backend:', paypalError);
          setIsProcessingPayment(false);
          setErrorMsg(`Conexión PayPal: ${paypalError.message || 'Error en la pasarela'}`);
          return;
        }
      }

      // Create user or get current user in Firebase Auth
      let userUid = auth.currentUser?.uid || '';
      if (!userUid && email.trim() && password.trim()) {
        try {
          const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password.trim());
          userUid = userCred.user.uid;
        } catch (authError: any) {
          if (authError.code === 'auth/email-already-in-use') {
            try {
              const loginCred = await signInWithEmailAndPassword(auth, email.trim(), password.trim());
              userUid = loginCred.user.uid;
            } catch (signInErr) {
              if (!userProfile) {
                setIsProcessingPayment(false);
                setErrorMsg('Este correo ya está registrado. Por favor, introduce tu contraseña o inicia sesión.');
                return;
              }
            }
          } else if (!userProfile) {
            setIsProcessingPayment(false);
            setErrorMsg(authError.message || 'Error al registrar la cuenta.');
            return;
          }
        }
      }

      setIsProcessingPayment(false);
      setPaymentSuccess(true);

      const last4 = cardNumber.replace(/\s/g, '').slice(-4) || userProfile?.cardLast4 || '4242';

      const profile: UserProfile = {
        firstName: firstName.trim() || userProfile?.firstName || 'Entrenador',
        lastName: lastName.trim() || userProfile?.lastName || '',
        email: email.trim() || userProfile?.email || '',
        phone: phone.trim() || userProfile?.phone || '',
        country: country.trim() || userProfile?.country || 'España',
        town: town.trim() || userProfile?.town || '',
        club: club.trim() || userProfile?.club || '',
        season: season.trim() || userProfile?.season || '2025/2026',
        teamGender: teamGender.trim() || userProfile?.teamGender || 'Masculino',
        coachRole: coachRole.trim() || userProfile?.coachRole || 'Entrenador Principal',
        coachLevel: coachLevel.trim() || userProfile?.coachLevel || 'Nivel 2 / Autonómico',
        teamLevel: teamLevel.trim() || userProfile?.teamLevel || 'Autonómico',
        teamCategory: teamCategory.trim() || userProfile?.teamCategory || 'Senior',
        registeredAt: userProfile?.registeredAt || new Date().toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
        subscriptionPlan,
        paymentMethod,
        cardLast4: paymentMethod === 'card' ? last4 : undefined,
        subscriptionStatus: 'active',
        creditsRemaining: subscriptionPlan === 'annual' ? 1000 : 500,
        totalCredits: subscriptionPlan === 'annual' ? 1000 : 500,
      };

      // Save to Firebase Firestore
      if (userUid) {
        await saveCoachProfileToFirestore(userUid, profile);
      }

      // Sync subscriber record to local Google Sheets log
      try {
        const sheetRecord = {
          fechaRegistro: profile.registeredAt,
          nombreCompleto: `${profile.firstName} ${profile.lastName}`,
          email: profile.email,
          telefono: profile.phone,
          pais: profile.country,
          ciudad: profile.town,
          club: profile.club,
          cargoRol: profile.coachRole,
          titulacion: profile.coachLevel,
          generoEquipo: profile.teamGender,
          nivelEquipo: profile.teamLevel,
          categoriaEquipo: profile.teamCategory,
          plan: profile.subscriptionPlan === 'monthly' ? 'Mensual (5 € / mes)' : 'Anual (60 € / año)',
          metodoPago: profile.paymentMethod === 'paypal' ? 'PayPal' : `Tarjeta Visa/Mastercard (•••• ${last4})`,
          estado: 'Suscripción Activa',
        };

        const existingSheets = JSON.parse(localStorage.getItem('coachmind_google_sheet_records') || '[]');
        existingSheets.push(sheetRecord);
        localStorage.setItem('coachmind_google_sheet_records', JSON.stringify(existingSheets));

        fetch('/api/sync-google-sheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sheetRecord),
        }).catch(() => {});
      } catch (err) {
        console.error('Sheet logging error:', err);
      }

      setTimeout(() => {
        onRegister(profile);
      }, 1200);
    } catch (err: any) {
      console.error('Payment/Registration error:', err);
      setIsProcessingPayment(false);
      setErrorMsg('Ocurrió un error al procesar el alta. Por favor, inténtalo de nuevo.');
    }
  };

  const formatCardNumber = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 16);
    const parts = cleaned.match(/.{1,4}/g);
    return parts ? parts.join(' ') : cleaned;
  };

  const formatExpiry = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 3) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }
    return cleaned;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/90 rounded-3xl w-full max-w-2xl text-white shadow-2xl overflow-hidden my-auto relative">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-amber-600 p-5 sm:p-6 text-white relative overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white/80 hover:text-white transition-all cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner shrink-0">
              <ShieldCheck className="w-7 h-7 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-300/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  Paso {step} de 2: {step === 1 ? 'Ficha de Entrenador' : 'Suscripción & Pago Seguro'}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                {step === 1 ? 'Activar Modo Creador Pro' : 'Pasarela de Pago Internacional'}
              </h3>
            </div>
          </div>

          {/* Auth Mode Switcher Tabs */}
          <div className="flex border-b border-white/10 bg-black/20 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setErrorMsg('');
              }}
              className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                authMode === 'register'
                  ? 'bg-amber-500/20 text-amber-300 border-b-2 border-amber-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Registrarse y Suscribirse</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setErrorMsg('');
              }}
              className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                authMode === 'login'
                  ? 'bg-amber-500/20 text-amber-300 border-b-2 border-amber-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4 text-amber-400" />
              <span>Iniciar Sesión (Entrenador)</span>
            </button>
          </div>

          {authMode === 'register' && (
            <p className="text-xs sm:text-sm text-blue-100/90 mt-2.5 leading-relaxed">
              {step === 1
                ? titleNotice ||
                  'Rellena tus datos para crear tu cuenta oficial en Firebase y personalizar tus entrenamientos.'
                : 'Selecciona tu plan de suscripción y el método de pago preferido.'}
            </p>
          )}

          {authMode === 'login' && (
            <p className="text-xs sm:text-sm text-blue-100/90 mt-2.5 leading-relaxed">
              Ingresa tus credenciales de entrenador para acceder a tu área personal y cargar tu equipo sincronizado.
            </p>
          )}

          {/* Stepper Indicator (Only for register) */}
          {authMode === 'register' && (
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/10">
              <div
                className={`flex-1 h-1.5 rounded-full transition-all ${
                  step >= 1 ? 'bg-amber-400' : 'bg-white/20'
                }`}
              />
              <div
                className={`flex-1 h-1.5 rounded-full transition-all ${
                  step >= 2 ? 'bg-amber-400' : 'bg-white/20'
                }`}
              />
            </div>
          )}
        </div>

        {/* LOGIN FORM */}
        {authMode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="p-5 sm:p-6 space-y-4">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-800/80 text-red-200 text-xs font-medium flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-3.5 max-w-md mx-auto py-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  Correo Electrónico de Entrenador *
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="entrenador@miclub.com"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  Contraseña *
                </label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleGitHubConnect}
                  className="w-full py-2.5 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  <span>Conectar con GitHub (OAuth)</span>
                </button>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between gap-3 border-t border-slate-800/80">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoggingIn}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Iniciando Sesión...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 text-white" />
                    <span>Entrar a mi Panel</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 1: Datos del Entrenador */}
        {authMode === 'register' && step === 1 && (
          <form onSubmit={handleGoToPayment} className="p-5 sm:p-6 space-y-4">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-800/80 text-red-200 text-xs font-medium flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Nombre */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ej. Carlos"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Apellidos */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  Apellidos *
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Ej. García Martínez"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Correo Electrónico */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="entrenador@miclub.com"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Contraseña para Cuenta Firebase */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  Crear Contraseña (mín. 6 caracteres) *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Teléfono */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-400" />
                  Teléfono *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+34 612 345 678"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* País */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  País *
                </label>
                <input
                  type="text"
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="España, Argentina, México..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Pueblo / Ciudad */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  Pueblo / Ciudad *
                </label>
                <input
                  type="text"
                  required
                  value={town}
                  onChange={(e) => setTown(e.target.value)}
                  placeholder="Ej. Madrid, Valencia, Sevilla..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Club */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  Club / Colegio / Entidad Deportiva *
                </label>
                <input
                  type="text"
                  required
                  value={club}
                  onChange={(e) => setClub(e.target.value)}
                  placeholder="Ej. Club Baloncesto Estudiantes / C.B. San Fernando"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Temporada */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  Temporada Actual *
                </label>
                <input
                  type="text"
                  required
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  placeholder="Ej. 2025/2026"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Cargo / Rol en el club */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Cargo / Rol en el Equipo *</label>
                <select
                  value={coachRole}
                  onChange={(e) => setCoachRole(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Entrenador Principal">Entrenador Principal</option>
                  <option value="Entrenador Ayudante">Entrenador Ayudante</option>
                  <option value="Director Técnico">Director Técnico</option>
                  <option value="Preparador Físico">Preparador Físico</option>
                  <option value="Coordinador Cantera">Coordinador Cantera</option>
                </select>
              </div>

              {/* Titulación del Entrenador */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Titulación / Licencia FEB *</label>
                <select
                  value={coachLevel}
                  onChange={(e) => setCoachLevel(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Nivel 1 / Iniciación">Nivel 1 / Iniciación</option>
                  <option value="Nivel 2 / Autonómico">Nivel 2 / Autonómico</option>
                  <option value="Nivel 3 / Superior (FEB)">Nivel 3 / Superior (FEB)</option>
                  <option value="Sin Titulación Oficial">Sin Titulación Oficial</option>
                  <option value="Estudiante Ciencias del Deporte">Estudiante Ciencias del Deporte</option>
                </select>
              </div>

              {/* Género del equipo */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Género del Equipo *</label>
                <select
                  value={teamGender}
                  onChange={(e) => setTeamGender(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Mixto">Mixto</option>
                </select>
              </div>

              {/* Nivel del equipo */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Nivel del Equipo *</label>
                <select
                  value={teamLevel}
                  onChange={(e) => setTeamLevel(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
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

              {/* Categoría del equipo */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Categoría del Equipo *</label>
                <select
                  value={teamCategory}
                  onChange={(e) => setTeamCategory(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
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

            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800/80">
              <button
                type="button"
                onClick={handleRegisterGuest}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-extrabold transition-all cursor-pointer border border-slate-700 flex items-center justify-center gap-1.5"
                title="Registra tus datos como entrenador en prueba gratuita"
              >
                <span>Continuar como Invitado (Prueba Gratis)</span>
              </button>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <span>Continuar a Selección de Plan (Pro)</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Pasarela de Pago */}
        {step === 2 && (
          <form onSubmit={handleConfirmPayment} className="p-5 sm:p-6 space-y-5">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-800/80 text-red-200 text-xs font-medium flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 1. Selector de Plan */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold uppercase text-amber-400 tracking-wider block">
                1. Elige tu Plan de Suscripción Pro
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Plan Mensual */}
                <div
                  onClick={() => setSubscriptionPlan('monthly')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    subscriptionPlan === 'monthly'
                      ? 'bg-amber-500/10 border-amber-400 text-white shadow-lg shadow-amber-500/10'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-300">Plan Mensual</span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        subscriptionPlan === 'monthly'
                          ? 'border-amber-400 bg-amber-400 text-slate-950'
                          : 'border-slate-700'
                      }`}
                    >
                      {subscriptionPlan === 'monthly' && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>

                  <div className="mt-2 space-y-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-white">5 €</span>
                      <span className="text-xs text-slate-400">/ mes</span>
                    </div>
                    <p className="text-[11px] text-amber-300 font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>500 Créditos semanales por apartado</span>
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Acceso total a Pizarra, Calendario, Estadísticas y Ficha.
                    </p>
                  </div>
                </div>

                {/* Plan Anual */}
                <div
                  onClick={() => setSubscriptionPlan('annual')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    subscriptionPlan === 'annual'
                      ? 'bg-amber-500/10 border-amber-400 text-white shadow-lg shadow-amber-500/10'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[9px] font-black uppercase">
                    Mejor Valor
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-300">Plan Anual</span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        subscriptionPlan === 'annual'
                          ? 'border-amber-400 bg-amber-400 text-slate-950'
                          : 'border-slate-700'
                      }`}
                    >
                      {subscriptionPlan === 'annual' && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>

                  <div className="mt-2 space-y-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-white">60 €</span>
                      <span className="text-xs text-slate-400">/ año</span>
                    </div>
                    <p className="text-[11px] text-emerald-300 font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      <span>1.000 Créditos semanales por apartado</span>
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Equivalente a 5 €/mes en un único pago. Acceso total + soporte prioritario.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Método de Pago */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold uppercase text-amber-400 tracking-wider block">
                2. Método de Pago Seguro
              </label>

              <div className="grid grid-cols-2 gap-3">
                {/* Tarjeta */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'bg-blue-600/20 border-blue-400 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-blue-400" />
                  <span>Tarjeta Visa / Mastercard</span>
                </button>

                {/* PayPal */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('paypal')}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                    paymentMethod === 'paypal'
                      ? 'bg-amber-500/20 border-amber-400 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="font-extrabold text-blue-300 italic tracking-tight">Pay</span>
                  <span className="font-extrabold text-sky-400 italic tracking-tight -ml-1.5">Pal</span>
                </button>
              </div>
            </div>

            {/* Formulario según Método */}
            {paymentMethod === 'card' ? (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="font-bold text-slate-200">Datos de la Tarjeta Internacional</span>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <span className="px-1.5 py-0.5 bg-slate-800 rounded font-bold text-slate-200">VISA</span>
                    <span className="px-1.5 py-0.5 bg-slate-800 rounded font-bold text-slate-200">Mastercard</span>
                    <span className="px-1.5 py-0.5 bg-slate-800 rounded font-bold text-slate-200">Amex</span>
                  </div>
                </div>

                {/* Titular */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    Titular de la Tarjeta
                  </label>
                  <input
                    type="text"
                    required
                    value={cardHolder || `${firstName} ${lastName}`}
                    onChange={(e) => setCardHolder(e.target.value)}
                    placeholder="CARLOS GARCIA"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Número de Tarjeta */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    Número de Tarjeta (16 dígitos)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="4532 •••• •••• 8892"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs font-mono tracking-wider focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <CreditCard className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">
                      Caducidad (MM/AA)
                    </label>
                    <input
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      placeholder="08/28"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs font-mono tracking-wider focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">
                      CVC / CVV
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      required
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="123"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs font-mono tracking-wider focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 flex items-center justify-center mx-auto">
                  <span className="font-black text-lg italic">P</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Pago Exprés con PayPal</h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Se asociará tu suscripción ({subscriptionPlan === 'monthly' ? '5 € / mes' : '60 € / año'}) de forma rápida y cifrada a través de tu cuenta PayPal ({email || 'tu-correo@paypal.com'}).
                  </p>
                </div>
              </div>
            )}

            {/* Total Summary */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/20 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total a Pagar</span>
                <span className="text-white font-black text-sm">
                  {subscriptionPlan === 'monthly' ? '5,00 € / mes' : '60,00 € / año'}
                </span>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                Garantía SSL 256-bit
              </span>
            </div>

            {/* Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={isProcessingPayment}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver a Ficha</span>
              </button>

              <button
                type="submit"
                disabled={isProcessingPayment || paymentSuccess}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Procesando Pago Seguro...</span>
                  </>
                ) : paymentSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>¡Suscripción Activada!</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-white" />
                    <span>
                      Pagar {subscriptionPlan === 'monthly' ? '5 € / mes' : '60 € / año'} y Activar
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
