const params =
  new URLSearchParams(
    window.location.search
  );
function getTournamentOverride() {

  return (
    window.TOURNAMENT_OVERRIDES?.[
      window.tournamentInfo?.liveLink
    ] || {}
  );
}

const LIVE_LINK =
  params.get('tournament');

const TEAM_ID =
  params.get('team');

window.retry = async (
  fn,
  attempts = 3,
  delay = 1000
) => {

  let lastError;

  for (
    let i = 0;
    i < attempts;
    i++
  ) {

    try {

      return await fn();

    } catch (e) {

      lastError = e;

      console.warn(
        `Attempt ${i + 1} failed`
      );

      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            delay
          )
      );
    }
  }

  throw lastError;

};
window.renderTournamentPicker =
  async () => {

document.getElementById(
      'results'
    ).innerHTML = `
      <div class="empty-state">

        <div class="spinner"></div>

        <h3>
          Loading tournaments...
        </h3>

        <p>
          Fetching upcoming tournaments
        </p>

      </div>
    `;

   const footerBtn =
  document.querySelector(
    '.footer-btn'
  );

if (footerBtn) {
  footerBtn.style.display =
    'none';
}
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

          <p style="
                font-size:14px;
                color:#6b7280;
                margin-bottom:20px;
              ">
                ${tournaments.length} upcoming tournaments found
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

    document.getElementById(
  'pageTitle'
).textContent =
  'Find a Tournament';
    
const search =
  document.getElementById(
    'tournamentSearch'
  );

search.addEventListener(
  'change',
  () => {

    const selected =
      tournaments.find(
        t =>
          t.name ===
          search.value
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
  
const footerBtn =
  document.querySelector(
    '.footer-btn'
  );

if (footerBtn) {
  footerBtn.style.display =
    'inline-flex';
}

document.getElementById(
  'tournamentInfoCard'
).innerHTML = '';
  
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

    document.getElementById('tournamentInfoCard').innerHTML = '';
      
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
    
      renderTournamentInfo();

    window.tournamentFields =
      window.tournamentInfo.fields;

    document.getElementById(
  'pageTitle'
).textContent =
    window.tournamentInfo.name;
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
  limit,
  orderBy
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

window.showNoTeamSelected = () => {

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
  
    document.getElementById('generateBtn').style.display = 'none';
    document.getElementById('pdfBtn').style.display = 'none';

};

window.getUpcomingTournaments =
  async () => {

    const now =
      Math.floor(
        Date.now() / 1000
      );

    const daysLimit =
      now +
      (10 * 24 * 60 * 60);

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
        daysLimit
      ),
      orderBy('date'),
      limit(10000)
    );

    const snapshot =
      await getDocs(q);

    const tournaments =
      snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(
          t =>
            t.liveLink &&
            t.date >= now &&
            t.date <= daysLimit
        )
        .sort(
          (a, b) =>
            a.date - b.date
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
window.getTournamentLocationInfo = () => {

  const override =
    getTournamentOverride();

  return {

    location:
      override.location ||
      `${window.tournamentInfo.place}${
        window.tournamentInfo.placeSecondaryName
          ? `, ${window.tournamentInfo.placeSecondaryName}`
          : ''
      }`,

    mapsUrl:
      override.mapsUrl ||
      `https://www.google.com/maps/place/?q=place_id:${window.tournamentInfo.placeReference}`

  };

};
window.getTournamentDates = () => {

  const startDate =
    new Date(
      window.tournamentInfo.date * 1000
    );

  const endDate =
    new Date(startDate);

  endDate.setDate(
    endDate.getDate() +
    (
      Number(
        window.tournamentInfo.numMatchDays || 1
      ) - 1
    )
  );
  
  const dateText =
  `${startDate.toLocaleDateString(
    'en-GB',
    {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }
  )} - ${endDate.toLocaleDateString(
    'en-GB',
    {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }
  )}`;
  
  return {startDate,endDate, dateText};

};

window.renderTournamentInfo = () => {

  if (!window.tournamentInfo) {
    return;
  }

  
  const card =
    document.getElementById(
      'tournamentInfoCard'
    );

const {startDate,endDate,dateText} = getTournamentDates();
const {location,mapsUrl} = getTournamentLocationInfo();
  
  card.innerHTML = `
  <div class="tournament-info-card">

    <div class="tournament-info-grid">

      <div>

        <div class="tournament-info-label">
          Location
        </div>

        <div class="tournament-info-value">

          <a
              href="${mapsUrl}"
              target="_blank"
              class="tournament-info-link"
            >
              ${location}
            </a>
        </div>

      </div>

      <div>

        <div class="tournament-info-label">
          Dates
        </div>

        <div class="tournament-info-value">
          ${dateText}
        </div>

      </div>

      <div>

        <div class="tournament-info-label">
          Tournify
        </div>

        <div class="tournament-info-value">

          <a
            href="https://tournifyapp.com/live/${window.tournamentInfo.liveLink}"
            target="_blank"
            class="tournament-info-link"
          >
            Open in Tournify ↗
          </a>

        </div>

      </div>

    </div>

  </div>
`;
 
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
    
if (!teams.length) {

  throw new Error(
    'No teams returned'
  );

}
    
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

  throw error;

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
        
          showNoTeamSelected();
    
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

            const url =
              new URL(
                window.location
              );
            
            window.history.replaceState(
              {},
              '',
              url
            );

      
          showNoTeamSelected();

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

      if (!team) {
        return;
      }

      const url =
        new URL(
          window.location
        );

      url.searchParams.set(
        'team',
        team.id
      );

      window.history.replaceState(
        {},
        '',
        url
      );

      await window.getMatchesForTeam(
        team
      );

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


  window.selectedTeam = team;
  
  document.getElementById('generateBtn').style.display = 'block';
  document.getElementById('pdfBtn').style.display = 'block';

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
  const {location,mapsUrl} = getTournamentLocationInfo();
  
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
    const refereeTeam =
  
      window.bigBowlTeams.find(
      t => t.id === event.referee
      );

    const refereeName =
      refereeTeam
        ? refereeTeam.name
        : 'Unknown';

const description = [
  `${fieldName}`,
  `${team1} vs ${team2}`,
  `Refereeing team: ${refereeName}`
    ].join('\\n');

    
ics += `BEGIN:VEVENT
UID:${crypto.randomUUID()}
DTSTAMP:${formatICSDate(new Date())}
DTSTART:${startUtc}
DTEND:${endUtc}
SUMMARY:${title}
DESCRIPTION:${description}
LOCATION: ${location}
END:VEVENT
`;

  });

ics += `END:VCALENDAR`;
  
window.lastICS = ics;

  
  const filename =
  `${window.tournamentInfo.name} - ${window.selectedTeam.name}`
    .replace(/[<>:"/\\|?*]/g, '');

downloadICS(
  ics,
  `${filename}.ics`
);

};
window.generatePDF = async () => {

  if (!window.selectedTeam) {
    alert('Select a team first');
    return;
  }

  const { jsPDF } = window.jspdf;

  const pdf = new jsPDF();

  const {dateText} = getTournamentDates();
  const {location,mapsUrl} = getTournamentLocationInfo();
  const divisionName =
  window.selectedTeam
    ? (
        window.divisionNames?.[
          window.selectedTeam.division
        ] ||
        window.selectedTeam.division
      )
    : '';

  const tournamentColor =window.tournamentInfo.color || '#0b2d69';
  const hex = tournamentColor.replace('#', '');

const tournamentRgb  = [
  parseInt(hex.substring(0, 2), 16),
  parseInt(hex.substring(2, 4), 16),
  parseInt(hex.substring(4, 6), 16)
];
  
  const tournamentUrl =`https://tournifyapp.com/live/${window.tournamentInfo.liveLink}`;

  const shareUrl =
    `${window.location.origin}` +
    `?tournament=${window.tournamentInfo.liveLink}` +
    `&team=${window.selectedTeam.id}`;


let y = 20;

pdf.setFontSize(22);
pdf.setFont(undefined, 'bold');

pdf.text(
  window.tournamentInfo.name,
  15,
  y
);
const descriptionHtml =
  window.tournamentInfo.description ||
  '';

const temp =
  document.createElement('div');

temp.innerHTML =
  descriptionHtml;

const description =
  (
    temp.textContent ||
    temp.innerText ||
    ''
  )
  .replace(/\n\s*\n/g, '\n')
  .trim();
  
    pdf.setFontSize(11);
    y += 10;
    pdf.setFont(undefined, 'normal');
  
// Description
if (description) {
pdf.setFont(
  undefined,
  'bold'
);

pdf.text(
  'Tournify Description:',
  15,
  y
);

y += 7;

pdf.setFont(
  undefined,
  'normal'
);

const wrappedDescription =
  pdf.splitTextToSize(
    description,
    180
  );

pdf.text(
  wrappedDescription,
  15,
  y
);

// smaller gap after description
y +=
  wrappedDescription.length * 5 +
  5;
}
// Tournify URL
pdf.setTextColor(
  ...tournamentRgb
);

pdf.textWithLink(
  tournamentUrl,
  15,
  y,
  {
    url: tournamentUrl
  }
);

pdf.setTextColor(
  0,
  0,
  0
);

y += 15;

// Dates
pdf.setFont(
  undefined,
  'bold'
);

pdf.text(
  'Date(s):',
  15,
  y
);

pdf.setFont(
  undefined,
  'normal'
);

pdf.text(
  dateText,
  40,
  y
);

y += 8;

// Location
pdf.setFont(
  undefined,
  'bold'
);

pdf.text(
  'Location:',
  15,
  y
);

pdf.setFont(
  undefined,
  'normal'
);

pdf.setTextColor(
  ...tournamentRgb
);

pdf.textWithLink(
  location,
  40,
  y,
  {
    url: mapsUrl
  }
);

pdf.setTextColor(
  0,
  0,
  0
);

y += 15;
  
y += 8;
pdf.setTextColor(0, 0, 0);

pdf.setFontSize(16);
pdf.setFont(undefined, 'bold');

pdf.text(
  'Team Information',
  15,
  y
);

y += 10;

pdf.setFontSize(11);
pdf.setFont(undefined, 'normal');

pdf.text(
  `Team: ${window.selectedTeam.name}`,
  15,
  y
);

y += 7;

pdf.text(
  `Division: ${divisionName}`,
  15,
  y
);

y += 15;

pdf.setFontSize(16);
pdf.setFont(undefined, 'bold');

pdf.text(
  'Schedule',
  15,
  y
);

y += 10;

const allEvents = [

  ...window.currentUpcomingMatches.map(
    match => ({
      type: 'Playing',
      ...match
    })
  ),

  ...window.currentRefereeMatches.map(
    match => ({
      type: 'Refereeing',
      ...match
    })
  )

].sort(
  (a, b) =>
    buildDateTime(
      a.day,
      a.st
    ) -
    buildDateTime(
      b.day,
      b.st
    )
);

let currentDay = '';

const dayGroups = {};

allEvents.forEach(event => {

  const date =
    buildDateTime(
      event.day,
      event.st
    );

  const dayLabel =
    date.toLocaleDateString(
      'en-GB',
      {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      }
    );

  if (!dayGroups[dayLabel]) {
    dayGroups[dayLabel] = [];
  }

  dayGroups[dayLabel].push(event);

});

Object.entries(dayGroups)
  .forEach(([day, events]) => {

    pdf.setFontSize(13);
    pdf.setFont(undefined, 'bold');

    pdf.text(
      day,
      15,
      y
    );

    y += 6;

    pdf.autoTable({

      startY: y,

      head: [[
        'Time',
        'Type',
        'Field',
        'Match'
      ]],
      headStyles: {
    fillColor: tournamentRgb,
    textColor: 255,
    fontStyle: 'bold'
  },

      body: events.map(
          event => [
            event.st,
            event.type,
            window.tournamentFields[
              event.field
            ]?.name || event.field,
            `${getTeamName(
              event.poule,
              event.team1
            )} vs ${getTeamName(
              event.poule,
              event.team2
            )}`
          ]
        )
      
      });
    
    y =
      pdf.lastAutoTable.finalY +
      10;

  });

pdf.setFontSize(14);
pdf.setFont(undefined, 'bold');

pdf.text(
  'Important',
  15,
  y
);

y += 8;

pdf.setFontSize(10);
pdf.setFont(undefined, 'normal');

pdf.text(
  [
    'This PDF only includes games currently published in Tournify.',
    '',
    'Additional Day 2 games and referee assignments may be added later.',
    '',
    'Scan the QR code for the latest schedule.'
  ],
  15,
  y
);
  
  const qrContainer =
    document.createElement(
      'div'
    );

  new QRCode(
    qrContainer,
    {
      text: shareUrl,
      width: 150,
      height: 150
    }
  );

  const qrImage =
    qrContainer.querySelector(
      'img'
    );

  await new Promise(
    resolve => {

      const check = () => {

        if (qrImage?.src) {
          resolve();
        } else {
          setTimeout(
            check,
            50
          );
        }

      };

      check();

    }
  );

  pdf.addImage(
    qrImage.src,
    'PNG',
    140,
    220,
    40,
    40
  );

  pdf.text(
    'Scan for live updates',
    135,
    215
  );

  pdf.save(
    `${window.tournamentInfo.name} - ${window.selectedTeam.name}.pdf`
  );

};

document.getElementById('generateBtn').addEventListener('click',generateCalendar);
document.getElementById('generateBtn').style.display = 'none';

document.getElementById('pdfBtn').addEventListener('click',generatePDF);
document.getElementById('pdfBtn').style.display = 'none';

document.addEventListener(
  'visibilitychange',
  () => {

    if (
      document.visibilityState ===
      'visible'
    ) {

      if (
        LIVE_LINK &&
        window.tournamentId &&
        (
          !window.bigBowlTeams ||
          !window.bigBowlTeams.length
        )
      ) {

        console.log(
          'Teams missing after tab resume. Reloading...'
        );

        location.reload();

      }

    }

  }
);




 (async () => {

  try {

    const found =
      await loadTournamentFromLiveLink();

    if (!found) {
      return;
    }

    document.getElementById(
      'results'
    ).innerHTML = `
      <div class="empty-state">
        <div class="spinner"></div>
        <h3>Loading Teams...</h3>
      </div>
    `; 
  
 await retry(
  () => loadTeams(),
  3,
  1500
);

    renderTournamentInfo();

if (TEAM_ID) {

  const team =
    window.bigBowlTeams.find(
      t => t.id === TEAM_ID
    );

  if (team) {

    const divisionSelect =
      document.getElementById(
        'divisionSelect'
      );

    divisionSelect.value =
      String(team.division);

    divisionSelect.dispatchEvent(
      new Event('change')
    );

    const teamSelect =
      document.getElementById(
        'teamSelect'
      );

    teamSelect.value =
      team.id;

    await getMatchesForTeam(
      team
    );

    return;
  }
}

showNoTeamSelected();

  } catch (e) {

        console.error(e);

  document.getElementById(
    'results'
  ).innerHTML = `
    <div class="empty-state">

      <div class="empty-state__icon">
        ⚠️
      </div>

      <h3>
        Failed to load tournament
      </h3>

      <p>
        Please refresh the page.
      </p>

      <button
        onclick="location.reload()"
      >
        Refresh
      </button>

    </div>
  `;
}

})();
