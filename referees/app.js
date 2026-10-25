// Referee page: pick a referee (team or individual), see their assignments,
// and export them as a calendar or PDF.

import { getTeams, getMatches, getReferees } from '../shared/firebase.js';

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
} from '../shared/page.js';

import { showTournamentPicker } from '../shared/picker.js';

const params = new URLSearchParams(window.location.search);

const LIVE_LINK = params.get('tournament');
const REFEREE_ID = params.get('referee');

const refereeSearch = $('refereeSearch');

let ctx = null;
let referees = [];
let lookup = null;

// { referee, upcoming } for the selected referee.
let selection = null;

function setUrlReferee(refereeId) {
  const url = new URL(window.location);

  if (refereeId) {
    url.searchParams.set('referee', refereeId);
  } else {
    url.searchParams.delete('referee');
  }

  window.history.replaceState({}, '', url);
}

function showNoRefereeSelected() {
  selection = null;

  setActionButtonsVisible(false);
  renderTournamentInfo(ctx);

  showEmptyState({
    icon: '🦓',
    title: 'No Referee Selected',
    text: 'Select a referee team above to view assignments.'
  });
}

async function showReferee(referee) {
  setUrlReferee(referee.id);

  const matches = withStartTimes(ctx, await getMatches(ctx.tournament.id));
  const assignments = matches.filter(m => getRefereeIds(m).includes(referee.id));
  const { upcoming, played } = splitByTime(assignments);
  const eventIsOver = isEventOver(matches);

  selection = { referee, upcoming };

  renderTournamentInfo(ctx, `/referee/${referee.id}`);
  setActionButtonsVisible(true);
  updateGenerateButton({ upcomingCount: upcoming.length, eventIsOver });

  $('results').innerHTML = `
    ${eventIsOver ? '<div class="event-over">This event is over!</div>' : ''}

    <div class="team-card">
      <h2>${escapeHtml(referee.name)}</h2>
      <div class="division-badge">Referee Schedule</div>
    </div>

    ${assignments.length ? '' : '<p>No assignments published yet.</p>'}
    ${timeZoneNoteHtml(ctx)}
    ${matchTableHtml({ ctx, lookup, title: 'Upcoming Assignments', matches: upcoming })}
    ${matchTableHtml({ ctx, lookup, title: 'Past Assignments', matches: played })}
  `;
}

function describeTeams(match) {
  return `${lookup.nameAt(match.poule, match.team1)} vs ${lookup.nameAt(match.poule, match.team2)}`;
}

function exportCalendar() {
  if (!selection) {
    alert('Select a referee first');
    return;
  }

  const entries = selection.upcoming.map(match => ({
    match,
    kind: `referee-${selection.referee.id}`,
    summary: `Referee: ${describeTeams(match)}`,
    description: [getFieldName(ctx, match.field), describeTeams(match)].join('\n')
  }));

  downloadCalendar(ctx, {
    entries,
    filename: `${ctx.tournament.name} - ${selection.referee.name}`
  });
}

async function exportPdf() {
  if (!selection) {
    alert('Select a referee first');
    return;
  }

  const { referee } = selection;
  const shareUrl = new URL(window.location.pathname, window.location.origin);

  shareUrl.searchParams.set('tournament', ctx.tournament.liveLink);
  shareUrl.searchParams.set('referee', referee.id);

  await downloadSchedulePdf(ctx, {
    heading: 'Referee Information',
    details: [`Referee: ${referee.name}`],
    rows: selection.upcoming.map(match => ({
      match,
      type: 'Refereeing',
      description: describeTeams(match)
    })),
    notes: [
      'This PDF only includes games currently published in Tournify.',
      '',
      'Additional Day 2 assignments may be added later.',
      '',
      'Scan the QR code for the latest schedule.'
    ],
    shareUrl: shareUrl.toString(),
    filename: `${ctx.tournament.name} - ${referee.name}`
  });
}

refereeSearch.addEventListener('change', async () => {
  const referee = referees.find(r => r.name === refereeSearch.value);

  if (referee) {
    await showReferee(referee);
  } else {
    setUrlReferee(null);
    showNoRefereeSelected();
  }
});

setupActionButtons({ onCalendar: exportCalendar, onPdf: exportPdf });

reloadOnResumeIfIncomplete(() => !ctx || referees.length > 0);

(async () => {
  try {
    ctx = await loadTournamentPage(LIVE_LINK);

    if (!ctx) {
      showTournamentPicker({ notFound: LIVE_LINK });
      return;
    }

    renderTournamentInfo(ctx);
    showLoading('Loading Referees...');

    const [teams, loadedReferees] = await retry(async () => {
      const result = await Promise.all([
        getTeams(ctx.tournament.id),
        getReferees(ctx.tournament.id)
      ]);

      if (!result[0].length && !result[1].length) {
        throw new Error('No teams or referees returned');
      }

      return result;
    }, 3, 1500);

    lookup = createTeamLookup(teams);

    // Older tournaments with teams as referees may have no referee documents.
    referees = (loadedReferees.length ? loadedReferees : teams)
      .sort((a, b) => a.name.localeCompare(b.name));

    $('refereeList').innerHTML = referees
      .map(r => `<option value="${escapeHtml(r.name)}"></option>`)
      .join('');

    const referee = referees.find(r => r.id === REFEREE_ID);

    if (referee) {
      refereeSearch.value = referee.name;
      await showReferee(referee);
    } else {
      showNoRefereeSelected();
    }
  } catch (e) {
    showLoadError(e);
  }
})();
