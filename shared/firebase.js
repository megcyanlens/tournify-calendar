// Read-only access to Tournify's public Firestore data.

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';

import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  orderBy
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// Tournify's public web config (the same one its live pages use).
const firebaseConfig = {
  apiKey: 'AIzaSyDpqIP2y0ZBWjAcknp1szptkyh0fk6zGQI',
  authDomain: 'tournamentsoftware-a1b3d.firebaseapp.com',
  projectId: 'tournamentsoftware-a1b3d',
  storageBucket: 'tournamentsoftware-a1b3d.appspot.com',
  messagingSenderId: '659831913509',
  appId: '1:659831913509:web:1295743f7e5becfcaf13cc'
};

const db = getFirestore(initializeApp(firebaseConfig));

function toList(snapshot) {
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

function getSubcollection(tournamentId, name) {
  return getDocs(
    collection(db, 'tournaments', tournamentId, name)
  ).then(toList);
}

export async function findTournament(liveLink) {
  const snapshot = await getDocs(
    query(
      collection(db, 'tournaments'),
      where('liveLink', '==', liveLink)
    )
  );

  return toList(snapshot)[0] || null;
}

export async function getUpcomingTournaments(days = 10) {
  const now = Math.floor(Date.now() / 1000);
  const until = now + days * 24 * 60 * 60;

  const snapshot = await getDocs(
    query(
      collection(db, 'tournaments'),
      where('date', '>=', now),
      where('date', '<=', until),
      orderBy('date')
    )
  );

  return toList(snapshot).filter(t => t.liveLink);
}

export function getTeams(tournamentId) {
  return getSubcollection(tournamentId, 'teams');
}

export function getMatches(tournamentId) {
  return getSubcollection(tournamentId, 'matches');
}

// Extra match days. Day "0" is the tournament's own date; later days are
// documents here, referenced by id from match.day.
export function getDays(tournamentId) {
  return getSubcollection(tournamentId, 'days');
}

// Referees: one per refereeing team (same id as the team) plus any
// individual referees.
export function getReferees(tournamentId) {
  return getSubcollection(tournamentId, 'referees');
}
