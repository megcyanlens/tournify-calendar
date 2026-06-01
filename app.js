const params =
  new URLSearchParams(
    window.location.search
  );

const LIVE_LINK =
  params.get('tournament');

window.loadTournamentFromLiveLink =
  async () => {

    const q = query(
      collection(
        db,
        'tournaments'
      ),
      where(
        'liveLink',
        '==',
        LIVE_LINK
      )
    );

    const snapshot =
      await getDocs(q);

    if (!snapshot.docs.length) {

      throw new Error(
        `Tournament not found: ${LIVE_LINK}`
      );

    }

    const tournamentDoc =
      snapshot.docs[0];

    window.tournamentId =
      tournamentDoc.id;

    window.tournamentInfo =
      tournamentDoc.data();

    window.tournamentFields =
      window.tournamentInfo.fields;

    document.getElementById(
  'pageTitle'
).textContent =
  tournament.name;
    
  };

//function getVenue() {
//  return `${window.tournamentInfo.place},
//${window.tournamentInfo.placeSecondaryName}`;
//}

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


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.testFirestore = async () => {

  const snapshot =
    await getDocs(collection(db, 'tournaments'));

//  console.log(
 //   'count:',
 //   snapshot.docs.length
//  );

  //console.log(
   // snapshot.docs.slice(0, 3).map(doc => ({
   //   id: doc.id,
    //  ...doc.data()
  //  }))
 // );

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

   // console.log(
   //   snapshot.exists()
   // );

 //   console.log(
    //  snapshot.data()
   // );

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

 // console.log(
  //  snapshot.docs.map(doc => ({
  //    id: doc.id,
  //    ...doc.data()
  //  }))
  //);

};
window.tournamentFields = {};

window.loadTournamentInfo = async () => {

  const snapshot = await getDoc(
    doc(
      db,
      'tournaments',
      window.tournamentId
    )
  );

  const tournament =
    snapshot.data();

  window.tournamentInfo =
    tournament;

  
document.getElementById(
  'pageTitle'
).textContent =
  `${tournament.name} Calendar Exporter`;

  
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

window.loadTeams = async () => {

  try {

    //console.log('loading teams');

    const snapshot = await getDocs(
      collection(
        db,
        'tournaments',
        window.tournamentId,
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

   // console.log('select:', select );

    select.innerHTML = '';

      const placeholder =
  document.createElement('option');

placeholder.value = '';
placeholder.textContent =
  'Select a team...';

placeholder.selected = true;
placeholder.disabled = true;

select.appendChild(
  placeholder
);

    teams.forEach(team => {

      const option =
        document.createElement('option');

      option.value = team.id;
      option.textContent = team.name;

      select.appendChild(option);

    });

  //  console.log(
   //   'loaded',
   //   teams.length,
   //   'teams'
  //  );

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
      window.tournamentId,
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

  //console.log('team', team.name);

  window.selectedTeam = team;
  

  renderMatches(
  team,
  playingMatches,
  refereeMatches
);

  window.currentTeam = team;

  window.currentUpcomingMatches =
    upcomingMatches;

  window.currentRefereeMatches =
    refereeMatches;

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

const now = new Date();

const upcomingMatches =
  playingMatches.filter(match =>
    buildDateTime(
      match.day,
      match.st
    ) > now
  );

const playedMatches =
  playingMatches.filter(match =>
    buildDateTime(
      match.day,
      match.st
    ) <= now
  );
const generateButton =
  document.getElementById(
    'generateBtn'
  );

generateButton.disabled =
  upcomingMatches.length === 0;

  if (
  upcomingMatches.length === 0
) {

  generateButton.textContent =
    'No Upcoming Games';

} else {

  generateButton.textContent =
    'Generate Calendar';

}
  
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
<h3>Upcoming Games</h3>
    <table border="1" cellpadding="6">
      <tr>
        <th>Time</th>
        <th>Field</th>
        <th>Team 1</th>
        <th>Team 2</th>
      </tr>
  `;

  upcomingMatches.forEach(match => {

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
<h3>Played Games</h3>
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


  if (
  refereeMatches.length > 0
) {

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
  }
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
function formatICSDate(date) {

  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');

}

function getTeamName(
  poule,
  teamNum
) {

  const team =
    window.bigBowlTeams.find(
      t =>
        t.poule0 === poule &&
        t.numInPoule0 === teamNum
    );

  return team
    ? team.name
    : teamNum;

}

function downloadICS(
  content,
  filename
) {

  const blob =
    new Blob(
      [content],
      {
        type: 'text/calendar'
      }
    );

  const url =
    URL.createObjectURL(blob);

  const a =
    document.createElement('a');

  a.href = url;
  a.download = filename;

  document.body.appendChild(a);

  a.click();

  document.body.removeChild(a);

  URL.revokeObjectURL(url);

}

window.generateCalendar = () => {
  
if (!window.selectedTeam) {
  alert('Select a team first');
  return;
}
  
  const calendarEvents = [

   ...window.currentUpcomingMatches.map(
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

  calendarEvents.sort(
    (a, b) =>
      buildDateTime(a.day, a.st) -
      buildDateTime(b.day, b.st)
  );

  const duration = getEventDurationMinutes();

let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Tournify Calendar Exporter//EN
CALSCALE:GREGORIAN
`;

  calendarEvents.forEach(event => {

    const start =
      buildDateTime(
        event.day,
        event.st
      );

    const end =
      new Date(
        start.getTime() +
        duration * 60000
      );

    const startUtc =
      formatICSDate(start);

    const endUtc =
      formatICSDate(end);

    const fieldName =
      window.tournamentFields[
        event.field
      ]?.name || event.field;

    const team1 =
      getTeamName(event.poule, event.team1);

    const team2 =
      getTeamName(event.poule, event.team2);

    const title =
      event.type === 'PLAYING'
        ? `${team1} vs ${team2}`
        : `Referee: ${team1} vs ${team2}`;

ics += `BEGIN:VEVENT
UID:${crypto.randomUUID()}
DTSTAMP:${formatICSDate(new Date())}
DTSTART:${startUtc}
DTEND:${endUtc}
SUMMARY:${title}
DESCRIPTION:${title}
LOCATION:${fieldName}, ${window.tournamentInfo.place}, ${window.tournamentInfo.placeSecondaryName}
END:VEVENT
`;

  });

ics += `END:VCALENDAR`;
  
//console.log(ics);
window.lastICS = ics;
//console.log(JSON.stringify(ics));

  
  downloadICS(
    ics,
    `${window.selectedTeam.name}.ics`
  );

};


    document
  .getElementById('generateBtn')
  .addEventListener(
    'click',
    generateCalendar
  );

(async () => {

  await loadTournamentFromLiveLink();

  await loadTeams();

})();
