import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  normalize,
  parseTournamentLink,
  prepareTournaments,
  searchTournaments
} from '../shared/search.js';

const at = iso => Date.parse(iso) / 1000;

// "Now" is 25 October 2026, 13:00 UTC.
const now = new Date('2026-10-25T13:00:00Z');

const tournaments = [
  { liveLink: 'kuerbiscup2026', name: 'Kürbis Cup 2026', place: 'Höhenkirchen', country: 'DE', timezone: 'Europe/Berlin', date: at('2026-10-31T09:00:00Z') },
  { liveLink: 'early-today', name: 'Morning Cup', place: 'Leeds', country: 'GB', timezone: 'Europe/London', date: at('2026-10-25T08:00:00Z') },
  { liveLink: 'weekend', name: 'Weekend Hockey Cup', place: 'Utrecht', country: 'NL', timezone: 'Europe/Amsterdam', numMatchDays: 2, date: at('2026-10-24T08:00:00Z') },
  { liveLink: 'done', name: 'Yesterday Cup', place: 'Paris', country: 'FR', timezone: 'Europe/Paris', date: at('2026-10-24T08:00:00Z') },
  { liveLink: 'cupfinal', name: 'Cup Final', place: 'Cork', country: 'IE', timezone: 'Europe/Dublin', date: at('2026-11-02T10:00:00Z') }
];

test('normalize removes accents and case', () => {
  assert.equal(normalize('  Kürbis CUP '), 'kurbis cup');
});

test('parses pasted Tournify and site links', () => {
  assert.equal(parseTournamentLink('https://www.tournifyapp.com/live/bigbowl2026/schedule'), 'bigbowl2026');
  assert.equal(parseTournamentLink('tournifyapp.com/live/bigbowl2026'), 'bigbowl2026');
  assert.equal(parseTournamentLink('https://tournaments.cyanlens.com/?tournament=bigbowl2026&team=x'), 'bigbowl2026');
  assert.equal(parseTournamentLink('big bowl'), null);
});

test('keeps events that started earlier today or are mid-way through', () => {
  const links = prepareTournaments(tournaments, now).map(t => t.liveLink);

  assert.ok(links.includes('early-today'));
  assert.ok(links.includes('weekend'));
  assert.ok(!links.includes('done'));
});

test('ongoing tournaments come first, then by start date', () => {
  const prepared = prepareTournaments(tournaments, now);

  assert.deepEqual(
    prepared.map(t => [t.liveLink, t.isLive]),
    [
      ['weekend', true],
      ['early-today', true],
      ['kuerbiscup2026', false],
      ['cupfinal', false]
    ]
  );
});

test('search matches all words across name and place, ignoring accents', () => {
  const prepared = prepareTournaments(tournaments, now);

  assert.deepEqual(
    searchTournaments(prepared, 'kurbis hohenkirchen').map(t => t.liveLink),
    ['kuerbiscup2026']
  );

  assert.deepEqual(searchTournaments(prepared, 'utrecht').map(t => t.liveLink), ['weekend']);
  assert.deepEqual(searchTournaments(prepared, 'nothing like this'), []);
});

test('names starting with the query rank above other matches', () => {
  const prepared = prepareTournaments(tournaments, now);

  assert.deepEqual(
    searchTournaments(prepared, 'cup').map(t => t.liveLink).slice(0, 1),
    ['cupfinal']
  );
});
