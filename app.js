const TOURNAMENT_ID =
  '6IXXjNnmPXwgWw6GXNPS';

const TOURNAMENT_NAME =
  'Big Bowl XVIII';

const venue =
  `${window.tournamentInfo.place},
   ${window.tournamentInfo.placeSecondaryName}`;

function getEventDurationMinutes() {

  return (
    Number(window.tournamentInfo.matchDuration) +
    Number(window.tournamentInfo.timeBetweenMatches)
  );

}
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

const eventDuration =
  getEventDurationMinutes();

const startDateTime = ...;
const endDateTime =
  new Date(
    startDateTime.getTime() +
    eventDuration * 60000
  );

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
window.tournamentFields = {};

window.loadTournamentInfo = async () => {

  const snapshot = await getDoc(
    doc(
      db,
      'tournaments',
      TOURNAMENT_ID
    )
  );

  const tournament =
    snapshot.data();

  window.tournamentInfo =
    tournament;

  window.tournamentFields =
    tournament.fields;

//  console.log('fields loaded',tournament.fields );

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

document
  .getElementById('generateBtn')
  .addEventListener(
    'click',
    generateCalendar
  );


window.loadTeams = async () => {

  try {

    //console.log('loading teams');

    const snapshot = await getDocs(
      collection(
        db,
        'tournaments',
        TOURNAMENT_ID,
        'teams'
      )
    );

  //  console.log('team docs:',snapshot.docs.length);

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

  window.selectedTeam = team;
  
  console.log('playing',playingMatches.length);

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

  window.currentTeam = team;

  window.currentPlayingMatches =
    playingMatches;

  window.currentRefereeMatches =
    refereeMatches;

  return teamMatches;

};
window.renderMatches = (
  team,
  playingMatches,
  refereeMatches
) => {
window.generateCalendar = () => {

  const team =
    window.selectedTeam;

  if (!team) {

    alert(
      'Please select a team first'
    );

    return;

  }

  const eventDuration =
    Number(
      window.tournamentInfo.matchDuration
    ) +
    Number(
      window.tournamentInfo.timeBetweenMatches
    );

  const calendarEvents =
    window.calendarEvents.map(
      event => {

        const start =
          buildDateTime(
            event.day,
            event.time
          );

        const end =
          new Date(
            start.getTime() +
            eventDuration * 60000
          );

        return {
          ...event,
          start,
          end
        };

      }
    );

  console.log(
    calendarEvents
  );

};
  const results =
    document.getElementById(
      'results'
    );

        const teamLookup = {};
        
        window.bigBowlTeams.forEach(t => {
        
          teamLookup[
            `${t.poule0}-${t.numInPoule0}`
          ] = t.name;
        
        });
      playingMatches.sort(
        (a, b) => a.st.localeCompare(b.st)
      );
      
      refereeMatches.sort(
        (a, b) => a.st.localeCompare(b.st)
      );
  
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
        <td>${
          window.tournamentFields[
            match.field
            ]?.name || match.field
        }</td>
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
        <td>${
           window.tournamentFields[
            match.field
            ]?.name || match.field
          }</td>
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

function buildDateTime(
  day,
  time
) {

  const baseDate =
    new Date(
      window.tournamentInfo.date * 1000
    );

  baseDate.setHours(
    0,
    0,
    0,
    0
  );

  baseDate.setDate(
    baseDate.getDate() +
    Number(day)
  );

  const [
    hours,
    minutes
  ] = time.split(':');

  baseDate.setHours(
    Number(hours),
    Number(minutes)
  );

  return baseDate;

}


window.generateCalendar =
  async () => {

    const calendarEvents = [

      ...window.currentPlayingMatches.map(
        match => ({
          type: 'PLAYING',
          ...match
        })
      ),

      ...window.currentRefereeMatches.map(
        match => ({
          type: 'REFEREE',
          ...match
        })
      )

    ];
  window.calendarEvents =
  calendarEvents;
    
    calendarEvents.sort(
      (a, b) =>
        a.st.localeCompare(b.st)
    );

   console.table(
        calendarEvents.map(event => ({
          type: event.type,
          day: event.day,
          time: event.st,
          field:
            window.tournamentFields[
              event.field
            ]?.name || event.field
        }))
      );

  };
    document
  .getElementById('generateBtn')
  .addEventListener(
    'click',
    generateCalendar
  );


await loadTournamentInfo();
await loadTeams();

(async () => {

  await loadTournamentInfo();
  await loadTeams();

})();
