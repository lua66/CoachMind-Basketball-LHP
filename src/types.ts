export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  town: string;
  club: string;
  teamLevel: string;
  teamCategory: string;
  teamGender?: string;
  coachRole?: string;
  registeredAt: string;
  photoUrl?: string;
  age?: number | string;
  season?: string;
  coachLevel?: 'Nivel 0' | 'Nivel 1' | 'Nivel 2' | 'Nivel Nacional' | 'Nivel Profesional' | string;
  titleFederation?: string;
  workFederation?: string;
  subscriptionPlan?: 'monthly' | 'annual';
  paymentMethod?: 'card' | 'paypal' | 'none' | 'visa' | string;
  cardLast4?: string;
  subscriptionStatus?: 'active' | 'canceling_end_of_period' | 'cancelled' | 'trial';
  creditsRemaining?: number;
  totalCredits?: number;
}

export type ViewMode =
  | 'dashboard'
  | 'calendar'
  | 'philosophy'
  | 'trainings'
  | 'create-training'
  | 'stats'
  | 'match-analysis'
  | 'whiteboard'
  | 'players'
  | 'coach-ai'
  | 'settings';

export type EventType = 'training' | 'match' | 'friendly';
export type MatchLeg = 'ida' | 'vuelta' | 'unico' | 'pretemporada';

export interface CalendarEvent {
  id: string;
  title: string;
  type: EventType;
  date: string; // YYYY-MM-DD
  arrivalTime?: string; // HH:mm
  startTime: string; // HH:mm
  location: string;
  notes?: string;

  // Match details:
  isHome?: boolean; // true = Local, false = Visitante
  opponent?: string;
  leg?: MatchLeg;
  absentPlayers?: string[]; // Jugadoras ausentes / lesionadas
}

export interface CoachPhilosophy {
  playStyle: string;
  offensiveFocus: string;
  defensiveFocus: string;
  trainingGoals: string;
  matchGoals: string;
  coreValues: string;
  additionalNotes: string;
  updatedAt?: string;
}

export type CategoryType =
  | 'Benjamín'
  | 'Alevín'
  | 'Infantil'
  | 'Cadete'
  | 'Juvenil'
  | 'Senior'
  | 'Sénior Pro';

export type LevelType = 'Escolar' | 'Local' | 'Autonómico' | 'Regional' | 'Nacional';

export type IntensityType = 'Baja' | 'Media' | 'Alta' | 'Máxima';

export type TrainingSection =
  | 'Ejercicios de pretemporada'
  | 'Técnica individual y colectiva'
  | 'Táctica de equipo'
  | 'Otros entrenamientos';

export interface DrillItem {
  id: string;
  title: string;
  durationMinutes: number;
  playersCount: string;
  description: string;
  coachingTips: string[];
}

export interface TrainingPlan {
  warmup: DrillItem[];
  mainDrills: DrillItem[];
  cooldown: DrillItem[];
  coachNotes: string[];
  totalDuration: number;
}

export interface SavedTraining {
  id: string;
  title: string;
  section: TrainingSection;
  category: CategoryType;
  ageRange: string;
  level: LevelType;
  intensity: IntensityType;
  objective: string;
  durationMinutes: number;
  exerciseCount: number;
  createdAt: string;
  plan?: TrainingPlan;
}

export type PlayerRole = 'Base' | 'Escolta' | 'Alero' | 'Ala-Pívot' | 'Pívot';

export interface PlayerStats {
  pointsPerGame: number;
  reboundsPerGame: number;
  assistsPerGame: number;
  stealsPerGame: number;
  turnoversPerGame: number;
  fieldGoalPct: number;
  threePointPct: number;
  freeThrowPct: number;
}

export interface Player {
  id: string;
  name: string;
  jerseyNumber: number; // Dorsal
  role: PlayerRole;
  age?: number;
  heightCm?: number;
  weightKg?: number;
  attendancePct?: number;
  notes?: string;
  stats: PlayerStats;
  strengths?: string[];
  areasToImprove?: string[];
}

export interface PlayerMatchStat {
  id: string;
  name: string;
  jerseyNumber?: number;
  min: string;
  pts: number;
  reb: number;
  ast: number;
  twoPA: number; // 2P Anotados
  twoPI: number; // 2P Intentados
  threePA: number; // 3P Anotados
  threePI: number; // 3P Intentados
  tlA: number; // TL Anotados
  tlI: number; // TL Intentados
  plusMinus: number;
  val?: number; // Valoración / PER / Eficiencia
}

export interface MatchRecord {
  id: string;
  opponent: string;
  date: string;
  isHome: boolean;
  scoreUs: number;
  scoreThem: number;
  notes: string;
  fileName?: string;
  fileType?: string;
  playerStats?: PlayerMatchStat[];
  aiAnalysis?: {
    offensiveRating: string;
    defensiveRating: string;
    keyTakeaways: string[];
    recommendedDrills: string[];
  };
}

export type TacticalTokenType = 'playerA' | 'playerB' | 'ball' | 'cone';

export interface TacticalToken {
  id: string;
  type: TacticalTokenType;
  label: string;
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  color?: string;
}

export type DrawTool = 'select' | 'pass' | 'dribble' | 'screen' | 'cut' | 'shot' | 'eraser';

export type LineStyle = 'straight' | 'curve';

export interface Point {
  x: number;
  y: number;
}

export interface TacticalPath {
  id: string;
  tool: DrawTool;
  style: LineStyle;
  points: Point[];
  color: string;
}

export interface PlayFrame {
  id: string;
  title: string;
  tokens: TacticalToken[];
  paths: TacticalPath[];
}

export interface SavedPlay {
  id: string;
  title: string;
  createdAt: string;
  tokens: TacticalToken[];
  paths: TacticalPath[];
  frames?: PlayFrame[];
  category?: string;
  notes?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface SavedAiResponse {
  id: string;
  title: string;
  category: string; // e.g., 'Pretemporada', 'Táctica', 'Preparación Física', 'Técnica Individual', 'General'
  queryText: string;
  responseText: string;
  createdAt: string;
  tags?: string[];
}

export interface AppReview {
  id: string;
  authorName: string;
  club?: string;
  role?: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
}
