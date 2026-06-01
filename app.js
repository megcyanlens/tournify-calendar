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

renderMatches(
  team,
  playingMatches,
  refereeMatches
);
console.log('rendering...');
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

  return fireMatches;

};

window.loadTeams = async () => {

  try {

    console.log('loading teams');

    const snapshot = await getDocs(
      collection(
        db,
        'tournaments',
        TOURNAMENT_ID,
        'teams'
      )
    );

    console.log(
      'team docs:',
      snapshot.docs.length
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

    console.log(
      'select:',
      select
    );

    select.innerHTML = '';

    teams.forEach(team => {

      const option =
        document.createElement('option');

      option.value = team.id;
      option.textContent = team.name;

      select.appendChild(option);

    });

    console.log(
      'loaded',
      teams.length,
      'teams'
    );

    window.bigBowlTeams = teams;

  } catch (error) {

    console.error(
      'loadTeams failed',
      error
    );

  }

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
window.getMatchesForTeam = async (team) => {

  const snapshot = await getDocs(
    collection(
      db,
      'tournaments',
      TOURNAMENT_ID,
      'matches'
    )
  );

  const matches = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
    window.allMatches = matches;

const playingMatches = matches.filter(
  match =>
    match.poule === team.poule0 &&
    (
      match.team1 === team.numInPoule0 ||
      match.team2 === team.numInPoule0
    )
);

const refereeMatches = matches.filter(
  match =>
    match.referee === team.id
);

const teamMatches = [
  ...playingMatches,
  ...refereeMatches
];

  console.log('team', team.name);
  console.log(
  'playing',
  playingMatches.length
);

console.log(
  'refereeing',
  refereeMatches.length
);

console.log(
  'total',
  teamMatches.length
);

  renderMatches(
  team,
  playingMatches,
  refereeMatches
);

console.log('rendering...');

  return teamMatches;

};
window.renderMatches = (
  team,
  playingMatches,
  refereeMatches
) => {

  const results =
    document.getElementById(
      'results'
    );

    const teamLookup = {};
    
    window.bigBowlTeams.forEach(team => {
    
      teamLookup[
        `${team.poule0}-${team.numInPoule0}`
      ] = team.name;
    
    });

  
  let html = `
    <h2>${team.name}</h2>

    <p>
      Playing:
      ${playingMatches.length}
    </p>

    <p>
      Refereeing:
      ${refereeMatches.length}
    </p>

    <p>
      Total:
      ${
        playingMatches.length +
        refereeMatches.length
      }
    </p>
  `;

  html += `
    <h3>Playing Games</h3>

    <table border="1" cellpadding="6">
      <tr>
        <th>Time</th>
        <th>Field</th>
        <th>Team 1</th>
        <th>Team 2</th>
      </tr>
  `;

  playingMatches.forEach(match => {

    html += `
      <tr>
        <td>${match.st}</td>
        <td>${match.field}</td>
     <td>
  ${
    teamLookup[
      `${match.poule}-${match.team1}`
    ] || match.team1
  }
</td>

<td>
  ${
    teamLookup[
      `${match.poule}-${match.team2}`
    ] || match.team2
  }
</td>
      </tr>
    `;

  });

  html += `
    </table>
  `;

  html += `
    <h3>Referee Games</h3>

    <table border="1" cellpadding="6">
      <tr>
        <th>Time</th>
        <th>Field</th>
        <th>Team 1</th>
        <th>Team 2</th>
      </tr>
  `;

  refereeMatches.forEach(match => {

    html += `
      <tr>
        <td>${match.st}</td>
        <td>${match.field}</td>
        <td>
  ${
    teamLookup[
      `${match.poule}-${match.team1}`
    ] || match.team1
  }
</td>

<td>
  ${
    teamLookup[
      `${match.poule}-${match.team2}`
    ] || match.team2
  }
</td>
      </tr>
    `;

  });

  html += `
    </table>
  `;

  results.innerHTML = html;

};


loadTeams();

console.log('app loaded');
