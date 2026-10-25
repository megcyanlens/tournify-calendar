// Read-only access to Tournify's public Firestore data.

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';

import {
  getFirestore,
  collection,
  getDocs,
  query,
  where
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

const SEARCH_FIELDS = [
  'name',
  'liveLink',
  'date',
  'place',
  'placeSecondaryName',
  'country',
  'numMatchDays',
  'timezone'
];

function fromRestValue(value) {
  if ('integerValue' in value) {
    return Number(value.integerValue);
  }

  if ('nullValue' in value) {
    return null;
  }

  return Object.values(value)[0];
}

// Tournaments whose `date` falls between the two unix timestamps, with only
// the fields the picker needs. Full tournament documents are large (a
// 30-day window is tens of MB), and the web SDK can't select fields, so
// this uses Firestore's REST API with a field mask instead.
export async function getTournamentsBetween(from, until) {
  const url =
    `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}` +
    `/databases/(default)/documents:runQuery?key=${firebaseConfig.apiKey}`;

  const range = (op, seconds) => ({
    fieldFilter: {
      field: { fieldPath: 'date' },
      op,
      value: { integerValue: String(seconds) }
    }
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        select: { fields: SEARCH_FIELDS.map(fieldPath => ({ fieldPath })) },
        from: [{ collectionId: 'tournaments' }],
        where: {
          compositeFilter: {
            op: 'AND',
            filters: [
              range('GREATER_THAN_OR_EQUAL', from),
              range('LESS_THAN_OR_EQUAL', until)
            ]
          }
        },
        orderBy: [{ field: { fieldPath: 'date' } }]
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Tournament search failed: ${response.status}`);
  }

  const rows = await response.json();

  return rows
    .filter(row => row.document)
    .map(({ document }) => ({
      id: document.name.split('/').pop(),
      ...Object.fromEntries(
        Object.entries(document.fields || {}).map(
          ([key, value]) => [key, fromRestValue(value)]
        )
      )
    }))
    .filter(t => t.liveLink);
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
