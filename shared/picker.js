// Tournament picker, shown when the URL doesn't name a tournament (or names
// one that doesn't exist).

import { getTournamentsBetween } from './firebase.js';
import { formatCalendarDate } from './time.js';
import { $, escapeHtml, getCountryFlag } from './page.js';

import {
  parseTournamentLink,
  prepareTournaments,
  searchTournaments
} from './search.js';

const DAY_SECONDS = 24 * 60 * 60;

// Look back a few days so tournaments that are on now (single-day events
// that started earlier today, or multi-day ones) are still listed.
const DAYS_BACK = 3;
const DAYS_AHEAD = 30;
const MAX_RESULTS = 50;

const SHORT_DATE = { day: 'numeric', month: 'short' };

const LOADING_HTML =
  '<span class="spinner spinner--small"></span> Loading tournaments...';

function tournamentUrl(liveLink) {
  return `?tournament=${encodeURIComponent(liveLink)}`;
}

function formatDates(t) {
  const start = formatCalendarDate(t.firstDay, SHORT_DATE);
  const end = formatCalendarDate(t.lastDay, SHORT_DATE);

  return start === end ? start : `${start} – ${end}`;
}

function resultHtml(t) {
  const place = t.place || t.placeSecondaryName || '';
  const flag = getCountryFlag(t.country);

  return `
    <li>
      <a class="picker-result" href="${tournamentUrl(t.liveLink)}">
        <span class="picker-result__name">${escapeHtml(t.name)}</span>
        <span class="picker-result__meta">
          ${t.isLive ? '<span class="picker-result__live">On now</span>' : ''}
          <span>${escapeHtml(formatDates(t))}</span>
          ${place ? `<span>${escapeHtml(place)}</span>` : ''}
          ${flag ? `<span>${escapeHtml(flag)}</span>` : ''}
        </span>
      </a>
    </li>
  `;
}

function directLinkHtml(liveLink, label) {
  return `
    <li>
      <a class="picker-result picker-result--direct" href="${tournamentUrl(liveLink)}">
        <span class="picker-result__name">${escapeHtml(label)}</span>
        <span class="picker-result__meta">
          <span>tournifyapp.com/live/${escapeHtml(liveLink)}</span>
        </span>
      </a>
    </li>
  `;
}

function setQueryInUrl(query) {
  const url = new URL(window.location);

  if (query) {
    url.searchParams.set('q', query);
  } else {
    url.searchParams.delete('q');
  }

  url.searchParams.delete('tournament');
  window.history.replaceState({}, '', url);
}

export function showTournamentPicker({ notFound } = {}) {
  $('controls').style.display = 'none';
  $('tournamentInfoCard').innerHTML = '';
  $('pageTitle').textContent = 'Find a Tournament';

  const footerBtn = document.querySelector('.footer-btn');

  if (footerBtn) {
    footerBtn.style.display = 'none';
  }

  $('results').innerHTML = `
    <div class="picker">
      ${notFound ? `
        <p class="picker__notice" role="alert">
          We couldn't find a tournament with the link
          “${escapeHtml(notFound)}”. Check the link, or search below.
        </p>
      ` : ''}

      <label class="picker__label" for="tournamentSearch">
        Find your tournament
      </label>

      <input
        id="tournamentSearch"
        type="search"
        autocomplete="off"
        spellcheck="false"
        placeholder="Tournament name, town, or a Tournify link"
        aria-describedby="pickerStatus"
        aria-controls="tournamentResults"
      >

      <p id="pickerStatus" class="picker__status" aria-live="polite"></p>

      <ul id="tournamentResults" class="picker__results"></ul>
    </div>
  `;

  const input = $('tournamentSearch');
  const status = $('pickerStatus');
  const list = $('tournamentResults');

  let tournaments = null;

  input.value = new URLSearchParams(window.location.search).get('q') || '';

  // Don't pop up the keyboard on phones; do focus on desktop.
  if (window.matchMedia('(pointer: fine)').matches) {
    input.focus();
  }

  function render() {
    const query = input.value.trim();
    const pasted = parseTournamentLink(query);

    setQueryInUrl(query);

    if (pasted) {
      list.innerHTML = directLinkHtml(pasted, 'Open this tournament');
      status.textContent = 'Press Enter to open the tournament from your link.';
      return;
    }

    if (!tournaments) {
      list.innerHTML = '';
      status.innerHTML = LOADING_HTML;
      return;
    }

    const matches = searchTournaments(tournaments, query);
    const shown = matches.slice(0, MAX_RESULTS);

    let html = shown.map(resultHtml).join('');

    // A single word with no matches might be a slug for a tournament
    // outside the search window.
    if (!matches.length && /^[\w-]+$/.test(query)) {
      html = directLinkHtml(query, `Try opening “${query}” directly`);
    }

    list.innerHTML = html;

    if (!query) {
      status.textContent =
        `${tournaments.length} tournaments on now or in the next ${DAYS_AHEAD} days. ` +
        'Not listed? Paste its Tournify link.';
    } else if (!matches.length) {
      status.textContent =
        'No tournaments match. Try fewer words, or paste the Tournify link.';
    } else if (matches.length > shown.length) {
      status.textContent =
        `Showing ${shown.length} of ${matches.length} matches. Keep typing to narrow it down.`;
    } else {
      status.textContent =
        `${matches.length} ${matches.length === 1 ? 'match' : 'matches'}`;
    }
  }

  function resultLinks() {
    return [...list.querySelectorAll('a')];
  }

  input.addEventListener('input', render);

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const first = resultLinks()[0];

      if (first) {
        e.preventDefault();
        window.location.href = first.href;
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      resultLinks()[0]?.focus();
    }
  });

  // Arrow keys move between results; Escape goes back to the search box.
  list.addEventListener('keydown', e => {
    const links = resultLinks();
    const index = links.indexOf(document.activeElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      links[Math.min(index + 1, links.length - 1)]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      (index > 0 ? links[index - 1] : input).focus();
    } else if (e.key === 'Escape') {
      input.focus();
    }
  });

  render();

  const now = Math.floor(Date.now() / 1000);

  getTournamentsBetween(
    now - DAYS_BACK * DAY_SECONDS,
    now + DAYS_AHEAD * DAY_SECONDS
  )
    .then(result => {
      tournaments = prepareTournaments(result);
      render();
    })
    .catch(e => {
      console.error('Tournament picker failed', e);
      status.textContent =
        'Unable to load tournaments. Refresh to try again, or paste a Tournify link.';
    });
}
