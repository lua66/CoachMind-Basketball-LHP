import { 
  db, 
  auth, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc,
  updateDoc, 
  collection, 
  getDocs, 
  onSnapshot 
} from './firebase';
import { 
  UserProfile, 
  CoachPhilosophy, 
  Player, 
  SavedTraining, 
  CalendarEvent, 
  MatchRecord 
} from '../types';

// Save or Update Coach Profile
export async function saveCoachProfileToFirestore(uid: string, profile: UserProfile) {
  try {
    const ref = doc(db, 'coaches', uid);
    await setDoc(ref, {
      uid,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phone: profile.phone,
      country: profile.country,
      town: profile.town,
      club: profile.club,
      teamLevel: profile.teamLevel,
      teamCategory: profile.teamCategory,
      registeredAt: profile.registeredAt,
      subscriptionPlan: profile.subscriptionPlan || 'monthly',
      paymentMethod: profile.paymentMethod || 'card',
      cardLast4: profile.cardLast4 || '',
      subscriptionStatus: profile.subscriptionStatus || 'active',
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error('Error saving profile to Firestore:', error);
  }
}

// Save Coach Philosophy
export async function savePhilosophyToFirestore(uid: string, philosophy: CoachPhilosophy) {
  try {
    const ref = doc(db, 'coaches', uid, 'data', 'philosophy');
    await setDoc(ref, philosophy, { merge: true });
  } catch (error) {
    console.error('Error saving philosophy to Firestore:', error);
  }
}

// Delete Coach Philosophy
export async function deletePhilosophyFromFirestore(uid: string) {
  try {
    const ref = doc(db, 'coaches', uid, 'data', 'philosophy');
    await deleteDoc(ref);
  } catch (error) {
    console.error('Error deleting philosophy from Firestore:', error);
  }
}

// Sync Players Array to Firestore
export async function savePlayersToFirestore(uid: string, players: Player[]) {
  try {
    const ref = doc(db, 'coaches', uid, 'data', 'players');
    await setDoc(ref, { list: players }, { merge: true });
  } catch (error) {
    console.error('Error saving players to Firestore:', error);
  }
}

// Sync Trainings Array to Firestore
export async function saveTrainingsToFirestore(uid: string, trainings: SavedTraining[]) {
  try {
    const ref = doc(db, 'coaches', uid, 'data', 'trainings');
    await setDoc(ref, { list: trainings }, { merge: true });
  } catch (error) {
    console.error('Error saving trainings to Firestore:', error);
  }
}

// Sync Calendar Events to Firestore
export async function saveCalendarToFirestore(uid: string, events: CalendarEvent[]) {
  try {
    const ref = doc(db, 'coaches', uid, 'data', 'calendar');
    await setDoc(ref, { list: events }, { merge: true });
  } catch (error) {
    console.error('Error saving calendar to Firestore:', error);
  }
}

// Sync Matches to Firestore
export async function saveMatchesToFirestore(uid: string, matches: MatchRecord[]) {
  try {
    const ref = doc(db, 'coaches', uid, 'data', 'matches');
    await setDoc(ref, { list: matches }, { merge: true });
  } catch (error) {
    console.error('Error saving matches to Firestore:', error);
  }
}

// Subscribe to real-time changes for a coach
export function subscribeToCoachData(
  uid: string,
  callbacks: {
    onProfileLoaded: (profile: UserProfile | null) => void;
    onPhilosophyLoaded: (philosophy: CoachPhilosophy | null) => void;
    onPlayersLoaded: (players: Player[]) => void;
    onTrainingsLoaded: (trainings: SavedTraining[]) => void;
    onCalendarLoaded: (events: CalendarEvent[]) => void;
    onMatchesLoaded: (matches: MatchRecord[]) => void;
  }
) {
  // Listen to profile doc
  const unsubProfile = onSnapshot(doc(db, 'coaches', uid), (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data() as UserProfile;
      callbacks.onProfileLoaded(data);
    } else {
      callbacks.onProfileLoaded(null);
    }
  });

  // Listen to philosophy
  const unsubPhilosophy = onSnapshot(doc(db, 'coaches', uid, 'data', 'philosophy'), (snapshot) => {
    if (snapshot.exists()) {
      callbacks.onPhilosophyLoaded(snapshot.data() as CoachPhilosophy);
    }
  });

  // Listen to players
  const unsubPlayers = onSnapshot(doc(db, 'coaches', uid, 'data', 'players'), (snapshot) => {
    if (snapshot.exists() && Array.isArray(snapshot.data()?.list)) {
      callbacks.onPlayersLoaded(snapshot.data().list);
    }
  });

  // Listen to trainings
  const unsubTrainings = onSnapshot(doc(db, 'coaches', uid, 'data', 'trainings'), (snapshot) => {
    if (snapshot.exists() && Array.isArray(snapshot.data()?.list)) {
      callbacks.onTrainingsLoaded(snapshot.data().list);
    }
  });

  // Listen to calendar
  const unsubCalendar = onSnapshot(doc(db, 'coaches', uid, 'data', 'calendar'), (snapshot) => {
    if (snapshot.exists() && Array.isArray(snapshot.data()?.list)) {
      callbacks.onCalendarLoaded(snapshot.data().list);
    }
  });

  // Listen to matches
  const unsubMatches = onSnapshot(doc(db, 'coaches', uid, 'data', 'matches'), (snapshot) => {
    if (snapshot.exists() && Array.isArray(snapshot.data()?.list)) {
      callbacks.onMatchesLoaded(snapshot.data().list);
    }
  });

  return () => {
    unsubProfile();
    unsubPhilosophy();
    unsubPlayers();
    unsubTrainings();
    unsubCalendar();
    unsubMatches();
  };
}
