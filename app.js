const params =
  new URLSearchParams(
    window.location.search
  );

const LIVE_LINK =
  params.get('tournament');

window.renderTournamentPicker =
  async () => {

    document.getElementById(
      'results'
    ).innerHTML = `
      <div class="empty-state">

        <div class="spinner"></div>

        <h3>
          Loading Tournaments...
        </h3>

      </div>
    `;

    const tournaments =
      await getUpcomingTournaments();

    document.getElementById(
      'results'
    ).innerHTML = `
      <div class="empty-state">

        <div class="empty-state__icon">
          🏆
        </div>

        <h3>
          No Tournament Selected
        </h3>

        <p>
          Search for an upcoming tournament.
        </p>

        <input
          id="tournamentSearch"
          list="tournamentList"
          placeholder="Search tournament..."
        >

        <datalist
          id="tournamentList"
        ></datalist>

      </div>
    `;

    const list =
      document.getElementById(
        'tournamentList'
      );

    tournaments.forEach(t => {

      const option =
        document.createElement(
          'option'
        );

     option.value =
        t.name;

      list.appendChild(
        option
      );

    });

const search =
  document.getElementById(
    'tournamentSearch'
  );

search.addEventListener(
  'change',
  () => {

    console.log(
      'search value:',
      search.value
    );

    const selected =
      tournaments.find(
        t =>
          t.name ===
          search.value
      );

    console.log(
      'selected:',
      selected
    );

    if (!selected) {
      return;
    }

    window.location.search =
      '?tournament=' +
      encodeURIComponent(
        selected.liveLink
      );

  }
);
    
};

window.loadTournamentFromLiveLink =
  async () => {

if (!LIVE_LINK) {
  document.getElementById(
  'controls'
).style.display =
  'none';

await renderTournamentPicker();
return false;
}
    

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
      document.getElementById(
          'controls'
        ).style.display =
          'none';

    await renderTournamentPicker();
    return false;
        }

    const tournamentDoc =
      snapshot.docs[0];

    window.tournamentId =
      tournamentDoc.id;

    window.tournamentInfo =
      tournamentDoc.data();
    
    document.documentElement.style.setProperty(
      '--tournament-color',
      window.tournamentInfo.color || '#0b2d69'
    );
    
    window.tournamentFields =
      window.tournamentInfo.fields;

    document.getElementById(
  'pageTitle'
).textContent =
    window.tournamentInfo.name;
    
    document.getElementById(
  'controls'
      ).style.display =
        'block';
    return true;
  };

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
  where, 
  limit
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

  const tournaments =
    snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

  console.log(tournaments);

  return tournaments;
};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.testFirestore = async () => {

  const snapshot =
    await getDocs(collection(db, 'tournaments'));
 
  return snapshot.docs.length;

};

window.getUpcomingTournaments =
  async () => {

const now =
  Math.floor(
    Date.now() / 1000
  );

const fourteenDays =
  now +
  (14 * 24 * 60 * 60);

const q = query(
  collection(
    db,
    'tournaments'
  ),
  where(
    'date',
    '>=',
    now
  ),
  where(
    'date',
    '<=',
    fourteenDays
  ),
  limit(2000)
);

    const snapshot =
      await getDocs(q);

  return snapshot.docs
  .map(doc => ({
    id: doc.id,
    ...doc.data()
  }))
  .filter(
    t =>
      t.liveLink &&
      t.date >= now &&
      t.date <= fourteenDays
  )
  .sort(
    (a, b) =>
      a.date - b.date
  );
   const tournaments =
  snapshot.docs
    .map(...)
    .filter(...)
    .sort(...);

console.log(
  'upcoming tournaments:',
  tournaments.length
);

return tournaments; 
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

};
window.tournamentFields = {};
window.currentDivision = '';

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

    const snapshot = await getDocs(
      collection(
        db,
        'tournaments',
        window.tournamentId,
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


window.bigBowlTeams = teams;

const divisionSelect =
  document.getElementById(
    'divisionSelect'
  );

const divisions =
  [...new Set(
    teams.map(t => t.division)
  )];

divisionSelect.innerHTML =
  '<option value="">All Divisions</option>';

    
window.divisionNames = {
  "0": "MEN / MIX",
  "1683639950": "WOMEN"
};

divisions.forEach(
  division => {

    const option =
      document.createElement(
        'option'
      );

    option.value = division;

    option.textContent =
      window.divisionNames[
        division
      ] || division;

    divisionSelect.appendChild(
      option
    );

  }
);
  } catch (error) {

    console.error(
      'loadTeams failed',
      error
    );

  }

divisionSelect.dispatchEvent(
  new Event('change')
);
  
};

document
  .getElementById(
    'divisionSelect'
  )
  .addEventListener(
    'change',
    e => {

        const selectedDivision =
          e.target.value;
        
        if (
          window.currentDivision !==
          selectedDivision
        ) {
        
          window.selectedTeam = null;
          window.currentTeam = null;
        
          document.getElementById(
            'results'
          ).innerHTML = '';
  
        document.getElementById(
  'generateBtn'
).style.display = 'none';
          
          const generateButton =
            document.getElementById(
              'generateBtn'
            );
        
          generateButton.disabled =
            true;
        
          generateButton.textContent =
            'Generate Calendar';
        
        }
        
        window.currentDivision =
          selectedDivision;
        
        const teamSelect =
            document.getElementById(
              'teamSelect'
            );
          
          // Clear currently selected team
          window.selectedTeam = null;
          window.currentTeam = null;
          
          // Clear rendered results
          document.getElementById(
            'results'
          ).innerHTML = '';
          
          // Reset calendar button
          document.getElementById(
            'generateBtn'
          ).disabled = true;
          
          document.getElementById(
            'generateBtn'
          ).textContent =
            'Generate Calendar';
    

      teamSelect.disabled = false;

      teamSelect.innerHTML = '';

      const placeholder =
        document.createElement(
          'option'
        );

      placeholder.value = '';
      placeholder.textContent =
        'Select a team...';

      placeholder.selected =
        true;

      placeholder.disabled =
        true;

      teamSelect.appendChild(
        placeholder
      );

    window.bigBowlTeams
  .filter(
    team =>
      !selectedDivision ||
      String(team.division) === selectedDivision
  )
      
        .sort(
          (a, b) =>
            a.name.localeCompare(
              b.name
            )
        )
        .forEach(team => {

          const option =
            document.createElement(
              'option'
            );

          option.value =
            team.id;

          option.textContent =
            team.name;

          teamSelect.appendChild(
            option
          );

        });

    }
  );

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
  
  document.getElementById(
  'generateBtn'
).style.display = 'block';

  renderMatches(
  team,
  playingMatches,
  refereeMatches
);

  window.currentTeam = team;

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

  const upcomingRefereeMatches =
  refereeMatches.filter(
    match =>
      buildDateTime(
        match.day,
        match.st
      ) > now
  );
  
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

const latestMatch =
  playingMatches.reduce(
    (latest, match) => {

      const matchDate =
        buildDateTime(
          match.day,
          match.st
        );

      return matchDate > latest
        ? matchDate
        : latest;

    },
    new Date(0)
  );

const eventIsOver =
  latestMatch <
  new Date(
    Date.now() -
    (24 * 60 * 60 * 1000)
  );


  
window.currentUpcomingMatches =
    upcomingMatches;

  window.currentRefereeMatches =
    upcomingRefereeMatches;
  
const generateButton =
  document.getElementById(
    'generateBtn'
  );

generateButton.disabled =
  upcomingMatches.length === 0 ||
  eventIsOver;

  if (eventIsOver) {

  generateButton.textContent =
    'Event Finished';

} else if (
  upcomingMatches.length === 0
) {

  generateButton.textContent =
    'No Upcoming Games';

} else {

  generateButton.textContent =
    'Generate Calendar';

}

 
  let html = '';

if (eventIsOver) {

  html += `
    <div style="
      padding:20px;
      background:#f5f5f5;
      border:1px solid #ddd;
      margin-bottom:20px;
      font-size:20px;
      font-weight:bold;
    ">
      This event is over!
    </div>
  `;

}
  const divisionName =
  window.divisionNames?.[
    team.division
  ] || team.division;

const flag =
  (team.country || '')
    .toUpperCase()
    .replace(
      /./g,
      char =>
        String.fromCodePoint(
          127397 + char.charCodeAt()
        )
    );


html += `
  <div class="team-card">

    <div class="team-card-header">

      <div>

        <h2>
          ${team.name}
        </h2>

        <div class="division-badge">
          ${divisionName}
        </div>

      </div>

     <div class="team-country">
      ${flag}
      </div>

    </div>

  </div>

  <div class="stats">

    <div class="stat-card">

      <div class="stat-value">
        ${playingMatches.length}
      </div>

      <div class="stat-label">
        Upcoming
      </div>

    </div>

    <div class="stat-card">

      <div class="stat-value">
        ${refereeMatches.length}
      </div>

      <div class="stat-label">
        Refereeing
      </div>

    </div>

    <div class="stat-card">

      <div class="stat-value">
        ${
          playingMatches.length +
          refereeMatches.length
        }
      </div>

      <div class="stat-label">
        Total
      </div>

    </div>

  </div>
`;

  

  if (upcomingMatches.length > 0) {

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
  </table>
`;
  }

  
 if (playedMatches.length > 0) {

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

  playedMatches.forEach(match => {

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
 }

  if (
  upcomingRefereeMatches.length > 0
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

upcomingRefereeMatches.forEach(match => {
  
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

  }
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
  
const now = new Date();

const upcomingRefereeMatches =
  window.currentRefereeMatches.filter(
    match =>
      buildDateTime(
        match.day,
        match.st
      ) > now
  );

const calendarEvents = [

  ...window.currentUpcomingMatches.map(
    match => ({
      type: 'PLAYING',
      ...match
    })
  ),

  ...upcomingRefereeMatches.map(
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

  
  const filename =
  `${window.tournamentInfo.name} - ${window.selectedTeam.name}`
    .replace(/[<>:"/\\|?*]/g, '');

downloadICS(
  ics,
  `${filename}.ics`
);

};


    document
  .getElementById('generateBtn')
  .addEventListener(
    'click',
    generateCalendar
  );

(async () => {

  const found =
    await loadTournamentFromLiveLink();

  if (!found) {
    return;
  }

  await loadTeams();

document.getElementById(
  'results'
).innerHTML = `
  <div class="empty-state">

    <div class="empty-state__icon">
      👥
    </div>

    <h3>
      No Team Selected
    </h3>

    <p>
      Select a team from the dropdown above
      to view their schedule and export a
      calendar.
    </p>

  </div>
`;
  document.getElementById(
  'generateBtn'
).style.display = 'none';
})();
