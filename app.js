import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';

import {
getFirestore,
collection,
getDocs
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const TOURNAMENT_ID =
'6IXXjNnmPXwgWw6GXNPS';

const firebaseConfig = {
apiKey: "AIzaSyDpqIP2y0ZBWjAcknp1szptkyh0fk6zGQI",
authDomain: "tournamentsoftware-a1b3d.firebaseapp.com",
projectId: "tournamentsoftware-a1b3d",
storageBucket: "tournamentsoftware-a1b3d.appspot.com",
messagingSenderId: "659831913509",
appId: "1:659831913509:web:1295743f7e5becfcaf13cc"
};

const app =
initializeApp(firebaseConfig);

const db =
getFirestore(app);

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

window.bigBowlTeams =
teams;

const select =
document.getElementById(
'teamSelect'
);

select.innerHTML = '';

teams.forEach(team => {

```
const option =
  document.createElement('option');

option.value =
  team.id;

option.textContent =
  team.name;

select.appendChild(option);
```

});

};

window.getMatchesForTeam =
async team => {

```
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

window.allMatches =
  matches;

const playingMatches =
  matches.filter(
    m =>
      m.poule === team.poule0 &&
      (
        m.team1 === team.numInPoule0 ||
        m.team2 === team.numInPoule0
      )
  );

const refereeMatches =
  matches.filter(
    m => m.referee === team.id
  );

const teamLookup = {};

window.bigBowlTeams.forEach(t => {

  teamLookup[
    `${t.poule0}-${t.numInPoule0}`
  ] = t.name;

});

const playingEvents =
  playingMatches.map(match => ({

    type: 'PLAYING',

    time: match.st,

    team1:
      teamLookup[
        `${match.poule}-${match.team1}`
      ],

    team2:
      teamLookup[
        `${match.poule}-${match.team2}`
      ],

    field: match.field

  }));

const refereeEvents =
  refereeMatches.map(match => ({

    type: 'REFEREE',

    time: match.st,

    team1:
      teamLookup[
        `${match.poule}-${match.team1}`
      ],

    team2:
      teamLookup[
        `${match.poule}-${match.team2}`
      ],

    field: match.field

  }));

console.log(
  'Playing:',
  playingEvents.length
);

console.log(
  'Refereeing:',
  refereeEvents.length
);

console.table([
  ...playingEvents,
  ...refereeEvents
]);
```

};

document
.getElementById('teamSelect')
.addEventListener(
'change',
async e => {

```
  const team =
    window.bigBowlTeams.find(
      t => t.id === e.target.value
    );

  await window.getMatchesForTeam(
    team
  );

}
```

);

loadTeams();
