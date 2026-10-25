// Tournament search for the picker: which tournaments to list, and how to
// match and rank them against what the user types.

import { createClock, calendarDateInZone } from './time.js';

// Lowercase, accents removed ("Kürbis Cup" -> "kurbis cup").
export function normalize(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

// The tournament slug from a pasted Tournify live link
// (https://tournifyapp.com/live/bigbowl2026/...) or a link to this site
// (...?tournament=bigbowl2026), otherwise null.
export function parseTournamentLink(input) {
  const text = String(input ?? '').trim();

  const tournify = /tournifyapp\.com\/live\/([^/?#\s]+)/i.exec(text);

  if (tournify) {
    return decodeURIComponent(tournify[1]);
  }

  const ours = /[?&]tournament=([^&#\s]+)/.exec(text);

  return ours ? decodeURIComponent(ours[1]) : null;
}

function compareDates(a, b) {
  return (a.year - b.year) || (a.month - b.month) || (a.day - b.day);
}

// Adds each tournament's local first/last day and whether it's on now,
// drops ones that have finished, and sorts ongoing ones first, then by
// start date.
export function prepareTournaments(tournaments, now = new Date()) {
  return tournaments
    .map(tournament => {
      const clock = createClock(tournament);
      const today = calendarDateInZone(now, clock.timeZone);

      return {
        ...tournament,
        firstDay: clock.firstDay,
        lastDay: clock.lastDay,
        isFinished: compareDates(clock.lastDay, today) < 0,
        isLive: compareDates(clock.firstDay, today) <= 0,
        searchText: normalize(
          [
            tournament.name,
            tournament.place,
            tournament.placeSecondaryName,
            tournament.country,
            tournament.liveLink
          ].join(' ')
        )
      };
    })
    .filter(t => !t.isFinished)
    .sort((a, b) =>
      (b.isLive - a.isLive) ||
      compareDates(a.firstDay, b.firstDay) ||
      a.name.localeCompare(b.name)
    );
}

// Tournaments containing every word of the query, best matches first:
// exact slug, then names starting with the query, then names containing it,
// then matches on location only. Ties keep the prepared order.
export function searchTournaments(prepared, query) {
  const q = normalize(query);

  if (!q) {
    return prepared;
  }

  const words = q.split(/\s+/);

  const score = t => {
    const name = normalize(t.name);

    if (normalize(t.liveLink) === q) return 0;
    if (name.startsWith(q)) return 1;
    if (name.includes(q)) return 2;
    if (words.every(w => name.includes(w))) return 3;
    return 4;
  };

  return prepared
    .filter(t => words.every(w => t.searchText.includes(w)))
    .map((t, index) => ({ t, index, score: score(t) }))
    .sort((a, b) => (a.score - b.score) || (a.index - b.index))
    .map(({ t }) => t);
}
