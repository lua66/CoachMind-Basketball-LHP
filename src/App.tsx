import React, { useState, useEffect, useRef } from 'react';
import { Menu, Dumbbell } from 'lucide-react';
import { ViewMode, SavedTraining, Player, MatchRecord, UserProfile, CalendarEvent, CoachPhilosophy } from './types';

import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { CalendarView } from './components/CalendarView';
import { PhilosophyView } from './components/PhilosophyView';
import { TrainingsView } from './components/TrainingsView';
import { CreateTrainingView } from './components/CreateTrainingView';
import { StatsView } from './components/StatsView';
import { MatchAnalysisView } from './components/MatchAnalysisView';
import { WhiteboardView } from './components/WhiteboardView';
import { PlayersView } from './components/PlayersView';
import { CoachAiView } from './components/CoachAiView';
import { SettingsView } from './components/SettingsView';
import { RegistrationModal } from './components/RegistrationModal';
import { TrialLimitModal } from './components/TrialLimitModal';
import { consumeTrialAction } from './utils/trialManager';
import { auth, onAuthStateChanged, signOut, User } from './lib/firebase';
import {
  subscribeToCoachData,
  saveCoachProfileToFirestore,
  savePhilosophyToFirestore,
  deletePhilosophyFromFirestore,
  savePlayersToFirestore,
  saveTrainingsToFirestore,
  saveCalendarToFirestore,
  saveMatchesToFirestore,
} from './lib/firebaseSync';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const [trialModalMode, setTrialModalMode] = useState<'general_action' | 'ficha_entrenador'>('general_action');
  const [authUser, setAuthUser] = useState<User | null>(null);

  // Auto cleanup on initial publication launch & Clean Shareable URL Handler (?clean=true or ?register=true)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isCleanRequested = params.has('clean') || params.has('guest') || params.has('register') || params.has('new');

    if (isCleanRequested) {
      localStorage.removeItem('coachmind_user_profile');
      setUserProfile(null);
      setIsRegistrationModalOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const hasCleaned = localStorage.getItem('coachmind_cleaned_launch_v9');
    if (!hasCleaned && !isCleanRequested) {
      localStorage.removeItem('coachmind_user_profile');
      localStorage.removeItem('coachmind_calendar_events');
      localStorage.removeItem('coachmind_philosophy');
      localStorage.removeItem('coachmind_trainings');
      localStorage.removeItem('coachmind_players');
      localStorage.removeItem('coachmind_matches');
      localStorage.removeItem('coach_saved_plays');
      localStorage.removeItem('coachmind_google_sheet_records');
      localStorage.removeItem('coachmind_ai_library');
      localStorage.removeItem('coachmind_app_reviews');
      localStorage.removeItem('coachmind_trial_action_count');
      localStorage.removeItem('coachmind_trial_action_timestamp');
      localStorage.removeItem('coachmind_guest_weekly_usage_v2');
      localStorage.setItem('coachmind_cleaned_launch_v9', 'true');

      setUserProfile(null);
      setCalendarEvents([]);
      setCoachPhilosophy(null);
      setTrainings([]);
      setPlayers([]);
      setMatches([]);
    }
  }, []);

  // Firebase Auth Listener & Firestore Sync
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      if (user) {
        // Sync user and fetch data from Cloud SQL
        user.getIdToken().then(async (token) => {
          try {
            await fetch('/api/auth/sync', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });

            // Sync players from Cloud SQL
            const pRes = await fetch('/api/db/players', {
              headers: { 'Authorization': `Bearer ${token}` },
            });
            const pData = await pRes.json();
            if (pData.success && Array.isArray(pData.players) && pData.players.length > 0) {
              setPlayers(pData.players);
              localStorage.setItem('coachmind_players', JSON.stringify(pData.players));
            }

            // Sync philosophy from Cloud SQL
            const philRes = await fetch('/api/db/philosophy', {
              headers: { 'Authorization': `Bearer ${token}` },
            });
            const philData = await philRes.json();
            if (philData.success && philData.philosophy) {
              setCoachPhilosophy(philData.philosophy);
              localStorage.setItem('coachmind_philosophy', JSON.stringify(philData.philosophy));
            }
          } catch (err) {
            console.warn('Cloud SQL sync notification:', err);
          }
        });

        // Subscribe to Firestore data for logged in coach
        const unsubscribeFirestore = subscribeToCoachData(user.uid, {
          onProfileLoaded: (prof) => {
            if (prof) {
              setUserProfile(prof);
              localStorage.setItem('coachmind_user_profile', JSON.stringify(prof));
            }
          },
          onPhilosophyLoaded: (philo) => {
            if (philo) {
              setCoachPhilosophy(philo);
              localStorage.setItem('coachmind_philosophy', JSON.stringify(philo));
            }
          },
          onPlayersLoaded: (pls) => {
            setPlayers(pls);
            localStorage.setItem('coachmind_players', JSON.stringify(pls));
          },
          onTrainingsLoaded: (trns) => {
            setTrainings(trns);
            localStorage.setItem('coachmind_trainings', JSON.stringify(trns));
          },
          onCalendarLoaded: (evs) => {
            setCalendarEvents(evs);
            localStorage.setItem('coachmind_calendar_events', JSON.stringify(evs));
          },
          onMatchesLoaded: (mts) => {
            setMatches(mts);
            localStorage.setItem('coachmind_matches', JSON.stringify(mts));
          },
        });

        return () => {
          unsubscribeFirestore();
        };
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setAuthUser(null);
      setUserProfile(null);
      setTrainings([]);
      setPlayers([]);
      setMatches([]);
      setCalendarEvents([]);
      setCoachPhilosophy(null);
      localStorage.removeItem('coachmind_user_profile');
      localStorage.removeItem('coachmind_calendar_events');
      localStorage.removeItem('coachmind_philosophy');
      localStorage.removeItem('coachmind_trainings');
      localStorage.removeItem('coachmind_players');
      localStorage.removeItem('coachmind_matches');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const handleOpenTrialModal = (mode: 'general_action' | 'ficha_entrenador' = 'general_action') => {
    setTrialModalMode(mode);
    setIsTrialModalOpen(true);
  };

  const handleCheckAndRunTrialAction = (actionCallback: () => void) => {
    if (consumeTrialAction(userProfile)) {
      actionCallback();
    } else {
      handleOpenTrialModal('general_action');
    }
  };

  // User Profile
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const local = localStorage.getItem('coachmind_user_profile');
    return local ? JSON.parse(local) : null;
  });

  // Calendar Events State
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
    const local = localStorage.getItem('coachmind_calendar_events');
    if (!local) return [];
    try {
      const parsed = JSON.parse(local);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  // Coach Philosophy State
  const [coachPhilosophy, setCoachPhilosophy] = useState<CoachPhilosophy | null>(() => {
    const local = localStorage.getItem('coachmind_philosophy');
    if (!local) return null;
    try {
      return JSON.parse(local);
    } catch {
      return null;
    }
  });

  // Clean initial state for every coach
  const [trainings, setTrainings] = useState<SavedTraining[]>(() => {
    const local = localStorage.getItem('coachmind_trainings');
    if (!local) return [];
    try {
      const parsed = JSON.parse(local);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [players, setPlayers] = useState<Player[]>(() => {
    const local = localStorage.getItem('coachmind_players');
    if (!local) return [];
    try {
      const parsed = JSON.parse(local);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [matches, setMatches] = useState<MatchRecord[]>(() => {
    const local = localStorage.getItem('coachmind_matches');
    if (!local) return [];
    try {
      const parsed = JSON.parse(local);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [quickAiQuestion, setQuickAiQuestion] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    localStorage.setItem('coachmind_calendar_events', JSON.stringify(calendarEvents));
    if (authUser) {
      saveCalendarToFirestore(authUser.uid, calendarEvents);
    }
  }, [calendarEvents, authUser]);

  useEffect(() => {
    if (coachPhilosophy) {
      localStorage.setItem('coachmind_philosophy', JSON.stringify(coachPhilosophy));
      if (authUser) {
        savePhilosophyToFirestore(authUser.uid, coachPhilosophy);
        authUser.getIdToken().then((token) => {
          fetch('/api/db/philosophy', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(coachPhilosophy),
          }).catch(err => console.warn('Cloud SQL philosophy save error:', err));
        });
      }
    } else {
      localStorage.removeItem('coachmind_philosophy');
      if (authUser) {
        deletePhilosophyFromFirestore(authUser.uid);
      }
    }
  }, [coachPhilosophy, authUser]);

  useEffect(() => {
    localStorage.setItem('coachmind_trainings', JSON.stringify(trainings));
    if (authUser) {
      saveTrainingsToFirestore(authUser.uid, trainings);
    }
  }, [trainings, authUser]);

  useEffect(() => {
    localStorage.setItem('coachmind_players', JSON.stringify(players));
    if (authUser) {
      savePlayersToFirestore(authUser.uid, players);
      authUser.getIdToken().then((token) => {
        fetch('/api/db/players/sync', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ players }),
        }).catch(err => console.warn('Cloud SQL players sync error:', err));
      });
    }
  }, [players, authUser]);

  useEffect(() => {
    localStorage.setItem('coachmind_matches', JSON.stringify(matches));
    if (authUser) {
      saveMatchesToFirestore(authUser.uid, matches);
    }
  }, [matches, authUser]);

  const handleUpdateProfile = (updated: UserProfile | null) => {
    setUserProfile(updated);
    if (updated) {
      localStorage.setItem('coachmind_user_profile', JSON.stringify(updated));
    } else {
      localStorage.removeItem('coachmind_user_profile');
    }
  };

  const handleAddCalendarEvent = (newEvent: CalendarEvent) => {
    setCalendarEvents((prev) => [newEvent, ...prev]);
  };

  const handleDeleteCalendarEvent = (id: string) => {
    setCalendarEvents((prev) => prev.filter((ev) => ev.id !== id));
  };

  const handleSavePhilosophy = (updated: CoachPhilosophy) => {
    const isAllEmpty = !updated.playStyle?.trim() && !updated.offensiveFocus?.trim() && !updated.defensiveFocus?.trim() && !updated.trainingGoals?.trim() && !updated.matchGoals?.trim() && !updated.coreValues?.trim() && !updated.additionalNotes?.trim();
    if (isAllEmpty) {
      handleDeletePhilosophy();
      return;
    }
    handleCheckAndRunTrialAction(() => {
      setCoachPhilosophy(updated);
    });
  };

  const handleDeletePhilosophy = () => {
    setCoachPhilosophy(null);
    localStorage.removeItem('coachmind_philosophy');
    if (authUser) {
      deletePhilosophyFromFirestore(authUser.uid);
    }
  };

  // Handlers
  const handleSaveTraining = (newTraining: SavedTraining) => {
    handleCheckAndRunTrialAction(() => {
      setTrainings((prev) => [newTraining, ...prev]);
    });
  };

  const handleDeleteTraining = (id: string) => {
    setTrainings((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddPlayer = (newPlayer: Player) => {
    handleCheckAndRunTrialAction(() => {
      setPlayers((prev) => [...prev, newPlayer]);
    });
  };

  const handleDeletePlayer = (id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdatePlayerStats = (updated: Player) => {
    setPlayers((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleAddMatch = (newMatch: MatchRecord) => {
    handleCheckAndRunTrialAction(() => {
      setMatches((prev) => [newMatch, ...prev]);
    });
  };

  const handleDeleteMatch = (id: string) => {
    setMatches((prev) => prev.filter((m) => m.id !== id));
  };

  const handleClearMatches = () => {
    setMatches([]);
    localStorage.removeItem('coachmind_matches');
  };

  const handleUpdateMatches = (newMatches: MatchRecord[]) => {
    setMatches(newMatches);
    localStorage.setItem('coachmind_matches', JSON.stringify(newMatches));
  };

  const handleQuickAskAi = (question: string) => {
    handleCheckAndRunTrialAction(() => {
      setQuickAiQuestion(question);
    });
  };

  const handleClearAllData = () => {
    localStorage.removeItem('coachmind_trainings');
    localStorage.removeItem('coachmind_players');
    localStorage.removeItem('coachmind_matches');
    localStorage.removeItem('coachmind_user_profile');
    localStorage.removeItem('coach_saved_plays');
    localStorage.removeItem('coachmind_calendar_events');
    localStorage.removeItem('coachmind_philosophy');
    localStorage.removeItem('coachmind_ai_library');
    localStorage.removeItem('coachmind_app_reviews');
    localStorage.removeItem('coachmind_trial_action_count');
    localStorage.removeItem('coachmind_trial_action_timestamp');
    setTrainings([]);
    setPlayers([]);
    setMatches([]);
    setCalendarEvents([]);
    setCoachPhilosophy(null);
    setUserProfile(null);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F8FAFC] text-slate-800 font-sans antialiased">
      {/* Mobile Header Bar */}
      <header className="md:hidden sticky top-0 z-20 bg-[#0B132B] text-white p-3.5 flex items-center justify-between border-b border-slate-800 shadow-md">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white transition-colors cursor-pointer"
            aria-label="Abrir menú de navegación"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white font-bold shrink-0">
              <Dumbbell className="w-4 h-4" />
            </div>
            <span className="font-black text-base tracking-tight">CoachMind</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Temporada 2026</span>
        </div>
      </header>

      {/* Navigation Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        savedTrainingsCount={trainings.length}
        playersCount={players.length}
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
        userProfile={userProfile}
        onOpenRegisterModal={() => setIsRegistrationModalOpen(true)}
        authUser={authUser}
        onSignOut={handleSignOut}
      />

      {/* Main Content Workspace Area */}
      <main className="flex-1 min-w-0 p-3 sm:p-6 md:p-8 overflow-y-auto">
        {currentView === 'dashboard' && (
          <DashboardView
            onNavigate={setCurrentView}
            trainings={trainings}
            players={players}
            matches={matches}
            calendarEvents={calendarEvents}
            coachPhilosophy={coachPhilosophy}
            onQuickAskAi={handleQuickAskAi}
            userProfile={userProfile}
            onUpdateProfile={handleUpdateProfile}
            onDeleteMatch={handleDeleteMatch}
            onClearMatches={handleClearMatches}
            onUpdateMatches={handleUpdateMatches}
            onOpenRegisterModal={() => setIsRegistrationModalOpen(true)}
            onOpenFichaLockModal={() => handleOpenTrialModal('ficha_entrenador')}
          />
        )}

        {currentView === 'calendar' && (
          <CalendarView
            events={calendarEvents}
            onAddEvent={handleAddCalendarEvent}
            onDeleteEvent={handleDeleteCalendarEvent}
            players={players}
            userProfile={userProfile}
            onOpenTrialModal={handleOpenTrialModal}
          />
        )}

        {currentView === 'philosophy' && (
          <PhilosophyView
            philosophy={coachPhilosophy}
            onSavePhilosophy={handleSavePhilosophy}
            userProfile={userProfile}
            onOpenTrialModal={handleOpenTrialModal}
            players={players}
          />
        )}

        {currentView === 'trainings' && (
          <TrainingsView
            trainings={trainings}
            onNavigate={setCurrentView}
            onDeleteTraining={handleDeleteTraining}
          />
        )}

        {currentView === 'create-training' && (
          <CreateTrainingView
            onSaveTraining={handleSaveTraining}
            onNavigate={setCurrentView}
            userProfile={userProfile}
            onOpenTrialModal={handleOpenTrialModal}
          />
        )}

        {currentView === 'stats' && (
          <StatsView
            players={players}
            onAddPlayer={handleAddPlayer}
            onDeletePlayer={handleDeletePlayer}
            onUpdatePlayerStats={handleUpdatePlayerStats}
            userProfile={userProfile}
            onOpenTrialModal={handleOpenTrialModal}
          />
        )}

        {currentView === 'match-analysis' && (
          <MatchAnalysisView
            matches={matches}
            players={players}
            onAddMatch={handleAddMatch}
            onDeleteMatch={handleDeleteMatch}
            onClearMatches={handleClearMatches}
            userProfile={userProfile}
            onNavigate={setCurrentView}
            onOpenTrialModal={handleOpenTrialModal}
          />
        )}

        {currentView === 'whiteboard' && (
          <WhiteboardView
            userProfile={userProfile}
            onOpenTrialModal={handleOpenTrialModal}
          />
        )}

        {currentView === 'players' && (
          <PlayersView
            players={players}
            onAddPlayer={handleAddPlayer}
            onDeletePlayer={handleDeletePlayer}
            onUpdatePlayer={handleUpdatePlayerStats}
            onNavigateToStats={() => setCurrentView('stats')}
            userProfile={userProfile}
            onOpenTrialModal={handleOpenTrialModal}
          />
        )}

        {currentView === 'coach-ai' && (
          <CoachAiView
            initialQuestion={quickAiQuestion}
            onClearInitialQuestion={() => setQuickAiQuestion(undefined)}
            userProfile={userProfile}
            players={players}
            onOpenTrialModal={handleOpenTrialModal}
          />
        )}

        {currentView === 'settings' && (
          <SettingsView
            userProfile={userProfile}
            onUpdateProfile={handleUpdateProfile}
            onClearAllData={handleClearAllData}
            onOpenRegisterModal={() => setIsRegistrationModalOpen(true)}
            onOpenFichaLockModal={() => handleOpenTrialModal('ficha_entrenador')}
          />
        )}
      </main>

      <RegistrationModal
        isOpen={isRegistrationModalOpen}
        userProfile={userProfile}
        onClose={() => setIsRegistrationModalOpen(false)}
        onRegister={(profile) => {
          handleUpdateProfile(profile);
          setIsRegistrationModalOpen(false);
        }}
      />

      <TrialLimitModal
        isOpen={isTrialModalOpen}
        onClose={() => setIsTrialModalOpen(false)}
        onOpenRegisterModal={() => setIsRegistrationModalOpen(true)}
        mode={trialModalMode}
      />
    </div>
  );
}
