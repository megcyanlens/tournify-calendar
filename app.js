import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';

import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyDpqIP2y0ZBWjAcknp1szptkyh0fk6zGQI",
  authDomain: "tournamentsoftware-a1b3d.firebaseapp.com",
  projectId: "tournamentsoftware-a1b3d",
  storageBucket: "tournamentsoftware-a1b3d.appspot.com",
  messagingSenderId: "659831913509",
  appId: "1:659831913509:web:1295743f7e5becfcaf13cc"
};

window.findTournament = async (liveLink) => {

  const q = query(
    collection(db, 'tournaments'),
    where('liveLink', '==', liveLink)
  );

  const snapshot = await getDocs(q);

  console.log(
    snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  );

};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.testFirestore = async () => {

  const snapshot =
    await getDocs(collection(db, 'tournaments'));

  console.log(
    'count:',
    snapshot.docs.length
  );

  console.log(
    snapshot.docs.slice(0, 3).map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  );

  return snapshot.docs.length;

};

window.testBigBowl = async () => {

  try {

    const snapshot = await getDoc(
      doc(
        db,
        'tournaments',
        '6IXXjNnmPXwgWw6GXNPS'
      )
    );

    console.log(
      snapshot.exists()
    );

    console.log(
      snapshot.data()
    );

  } catch (e) {

    console.error(e);

  }

};

window.getTeams = async (tournamentId) => {

  const snapshot = await getDocs(
    collection(
      db,
      'tournaments',
      tournamentId,
      'teams'
    )
  );

  console.log(
    snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  );

};

window.getMatches = async (tournamentId) => {

  const snapshot = await getDocs(
    collection(
      db,
      'tournaments',
      tournamentId,
      'matches'
    )
  );

  const matches = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  console.table(
    matches.slice(0, 20).map(match => ({
      day: match.day,
      start: match.st,
      field: match.field,
      team1: match.team1,
      team2: match.team2,
      referee: match.referee
    }))
  );

  return matches;

};
