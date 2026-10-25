// Team page: pick a team, see its playing and refereeing schedule, and
// export it as a calendar or PDF.

import { getTeams, getMatches, getReferees } from './shared/firebase.js';

import {
  $,
  escapeHtml,
  retry,
  showEmptyState,
  showLoading,
  showLoadError,
  loadTournamentPage,
  renderTournamentInfo,
  timeZoneNoteHtml,
  getFieldName,
  getRefereeIds,
  getTeamSlots,
  createTeamLookup,
  withStartTimes,
  isEventOver,
  splitByTime,
  matchTableHtml,
  setActionButtonsVisible,
  updateGenerateButton,
  setupActionButtons,
  reloadOnResumeIfIncomplete,
  downloadCalendar,
  downloadSchedulePdf
} from './shared/page.js';

const params = new URLSearchParams(window.location.search);

const LIVE_LINK = params.get('tournament');
const TEAM_ID = params.get('team');

// Tournify doesn't publish division names; these are Big Bowl's.
const DIVISION_NAMES = {
  '0': 'MEN / MIX',
  '1683639950': 'WOMEN'
};

const divisionSelect = $('divisionSelect');
const teamSelect = $('teamSelect');

let ctx = null;
let teams = [];
let lookup = null;
let refereeNames = new Map();

// { team, upcoming, upcomingRefereeing } for the selected team.
let selection = null;

function getDivisionName(division) {
  return DIVISION_NAMES[division] || division;
}

function getCountryFlag(country) {
  const code = (country || '').trim().toUpperCase();

  if (!/^[A-Z]{2}$/.test(code)) {
    return code;
  }

  return [...code]
    .map(c => String.fromCodePoint(127397 + c.charCodeAt()))
    .join('');
}

function setUrlTeam(teamId) {
  const url = new URL(window.location);

  if (teamId) {
    url.searchParams.set('team', teamId);
  } else {
    url.searchParams.delete('team');
  }

  window.history.replaceState({}, '', url);
}

function fillDivisionSelect() {
  const divisions = [...new Set(teams.map(t => String(t.division)))];

  divisionSelect.innerHTML =
    '<option value="">All Divisions</option>' +
    divisions
      .map(d => `<option value="${escapeHtml(d)}">${escapeHtml(getDivisionName(d))}</option>`)
      .join('');
}

function fillTeamSelect(division) {
  teamSelect.innerHTML =
    '<option value="" selected disabled>Select a team...</option>' +
    teams
      .filter(t => !division || String(t.division) === division)
      .map(t => `<option value="${escapeHtml(t.id)}">${escapeHtml(t.name)}</option>`)
      .join('');
}

function showNoTeamSelected() {
  selection = null;

  setActionButtonsVisible(false);
  renderTournamentInfo(ctx);

  showEmptyState({
    icon: '👥',
    title: 'No Team Selected',
    text: 'Select a team from the dropdown above to view their schedule and export a calendar.'
  });
}

async function showTeam(team) {
  setUrlTeam(team.id);

  const matches = withStartTimes(ctx, await getMatches(ctx.tournament.id));
  const slots = new Set(getTeamSlots(team));

  const playing = matches.filter(
    m => slots.has(`${m.poule}-${m.team1}`) || slots.has(`${m.poule}-${m.team2}`)
  );

  const refereeing = matches.filter(m => getRefereeIds(m).includes(team.id));

  const { upcoming, played } = splitByTime(playing);
  const upcomingRefereeing = splitByTime(refereeing).upcoming;
  const eventIsOver = isEventOver(matches);

  selection = { team, upcoming, upcomingRefereeing };

  renderTournamentInfo(ctx, `/team/${team.id}`);
  setActionButtonsVisible(true);

  updateGenerateButton({
    upcomingCount: upcoming.length + upcomingRefereeing.length,
    eventIsOver
  });

  $('results').innerHTML = `
    ${eventIsOver ? '<div class="event-over">This event is over!</div>' : ''}

    <div class="team-card">
      <div class="team-card-header">
        <div>
          <h2>${escapeHtml(team.name)}</h2>
          <div class="division-badge">
            ${escapeHtml(getDivisionName(team.division))}
          </div>
        </div>
        <div class="team-country">${escapeHtml(getCountryFlag(team.country))}</div>
      </div>
    </div>

    <div class="stats">
      <div class="stat-card">
        <div class="stat-value">${playing.length}</div>
        <div class="stat-label">Playing</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${refereeing.length}</div>
        <div class="stat-label">Refereeing</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${playing.length + refereeing.length}</div>
        <div class="stat-label">Total</div>
      </div>
    </div>

    ${timeZoneNoteHtml(ctx)}
    ${matchTableHtml({ ctx, lookup, title: 'Upcoming Games', matches: upcoming })}
    ${matchTableHtml({ ctx, lookup, title: 'Played Games', matches: played })}
    ${matchTableHtml({ ctx, lookup, title: 'Referee Games', matches: upcomingRefereeing })}
  `;
}

function describeMatch(match) {
  const teams = `${lookup.nameAt(match.poule, match.team1)} vs ${lookup.nameAt(match.poule, match.team2)}`;
  const referees = getRefereeIds(match)
    .map(id => refereeNames.get(id) || 'Unknown')
    .join(', ');

  return { teams, referees };
}

// Playing and refereeing entries for the selected team, in time order.
function getSelectedEntries() {
  return [
    ...selection.upcoming.map(match => ({ match, kind: 'playing' })),
    ...selection.upcomingRefereeing.map(match => ({ match, kind: 'referee' }))
  ].sort((a, b) => a.match.start - b.match.start);
}

function exportCalendar() {
  if (!selection) {
    alert('Select a team first');
    return;
  }

  const entries = getSelectedEntries().map(entry => {
    const { teams, referees } = describeMatch(entry.match);

    return {
      ...entry,
      summary: entry.kind === 'playing' ? teams : `Referee: ${teams}`,
      description: [
        getFieldName(ctx, entry.match.field),
        teams,
        `Refereeing: ${referees || 'Unknown'}`
      ].join('\n')
    };
  });

  downloadCalendar(ctx, {
    entries,
    filename: `${ctx.tournament.name} - ${selection.team.name}`
  });
}

async function exportPdf() {
  if (!selection) {
    alert('Select a team first');
    return;
  }

  const { team } = selection;
  const shareUrl = new URL(window.location.pathname, window.location.origin);

  shareUrl.searchParams.set('tournament', ctx.tournament.liveLink);
  shareUrl.searchParams.set('team', team.id);

  await downloadSchedulePdf(ctx, {
    heading: 'Team Information',
    details: [
      `Team: ${team.name}`,
      `Division: ${getDivisionName(team.division)}`
    ],
    rows: getSelectedEntries().map(({ match, kind }) => ({
      match,
      type: kind === 'playing' ? 'Playing' : 'Refereeing',
      description: describeMatch(match).teams
    })),
    notes: [
      'This PDF only includes games currently published in Tournify.',
      '',
      'Additional Day 2 games and referee assignments may be added later.',
      '',
      'Scan the QR code for the latest schedule.'
    ],
    shareUrl: shareUrl.toString(),
    filename: `${ctx.tournament.name} - ${team.name}`
  });
}

divisionSelect.addEventListener('change', () => {
  fillTeamSelect(divisionSelect.value);
  setUrlTeam(null);
  showNoTeamSelected();
});

teamSelect.addEventListener('change', async () => {
  const team = teams.find(t => t.id === teamSelect.value);

  if (team) {
    await showTeam(team);
  }
});

setupActionButtons({ onCalendar: exportCalendar, onPdf: exportPdf });

reloadOnResumeIfIncomplete(() => !ctx || teams.length > 0);

(async () => {
  try {
    ctx = await loadTournamentPage(LIVE_LINK);

    if (!ctx) {
      return;
    }

    renderTournamentInfo(ctx);
    showLoading('Loading Teams...');

    const [loadedTeams, referees] = await Promise.all([
      retry(async () => {
        const result = await getTeams(ctx.tournament.id);

        if (!result.length) {
          throw new Error('No teams returned');
        }

        return result;
      }, 3, 1500),
      getReferees(ctx.tournament.id).catch(() => [])
    ]);

    teams = loadedTeams.sort((a, b) => a.name.localeCompare(b.name));
    lookup = createTeamLookup(teams);
    refereeNames = new Map([...teams, ...referees].map(r => [r.id, r.name]));

    fillDivisionSelect();

    const team = teams.find(t => t.id === TEAM_ID);

    if (team) {
      divisionSelect.value = String(team.division);
      fillTeamSelect(divisionSelect.value);
      teamSelect.value = team.id;

      await showTeam(team);
    } else {
      fillTeamSelect('');
      showNoTeamSelected();
    }
  } catch (e) {
    showLoadError(e);
  }
})();
