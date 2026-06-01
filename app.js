const TOURNAMENT_ID =
  '6IXXjNnmPXwgWw6GXNPS';

const TOURNAMENT_NAME =
  'Big Bowl XVIII';

const VENUE =
  'Turngesellschaft Walldorf 1896 e.V., Okrifteler Straße, Mörfelden-Walldorf, Deutschland';

const MATCH_DURATION =
  30;

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

window.findTeam = async (tournamentId, teamName) => {

  const snapshot = await getDocs(
    collection(
      db,
      'tournaments',
      tournamentId,
      'teams'
    )
  );

  const teams = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  return teams.find(
    t => t.name === teamName
  );

};

window.findLondonFireMatches = async () => {

  const snapshot = await getDocs(
    collection(
      db,
      'tournaments',
      '6IXXjNnmPXwgWw6GXNPS',
      'matches'
    )
  );

  const matches =
    snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

  const fireMatches =
    matches.filter(match =>
      match.team1 === 2 ||
      match.team2 === 2 ||
      match.referee === 'yoDaAzO0m8ZU0TF1565J'
    );

  console.table(fireMatches);

  return fireMatches;

};

window.loadTeams = async () => {

  const snapshot = await getDocs(
    collection(
      db,
      'tournaments',
      TOURNAMENT_ID,
      'teams'
    )
  );

  const teams =
    snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .sort((a, b) =>
        a.name.localeCompare(b.name)
      );

  const select =
    document.getElementById(
      'teamSelect'
    );

  select.innerHTML = '';

  teams.forEach(team => {

    const option =
      document.createElement('option');

    option.value =
      team.id;

    option.textContent =
      team.name;

    select.appendChild(option);

  });

  window.bigBowlTeams =
    teams;

};
document
  .getElementById('teamSelect')
  .addEventListener(
    'change',
    async e => {

      const team =
        window.bigBowlTeams.find(
          t => t.id === e.target.value
        );

     await window.getMatchesForTeam(team);

    }
  );
window.getMatchesForTeam =
  async team => {

    const snapshot =
      await getDocs(
        collection(
          db,
          'tournaments',
          TOURNAMENT_ID,
          'matches'
        )
      );

    const matches =
      snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

    console.log(
      'selected team',
      team
    );

    console.log(
      'all matches',
      matches
    );

  };
loadTeams();
