# Tournify Calendar Exporter

A small static site that turns a [Tournify](https://tournifyapp.com) tournament
schedule into a calendar file (`.ics`) or a printable PDF for one team or
referee.

Live at <https://tournaments.cyanlens.com>.

## Pages

| URL | What it does |
| --- | --- |
| `/` | Tournament search: everything on now or in the next 30 days, searchable by name, town or country. Pasting a Tournify live link opens that tournament directly, whatever its date. |
| `/?tournament=<liveLink>` | Team picker for a tournament. `<liveLink>` is the slug from the Tournify live URL, e.g. `bigbowl2026`. |
| `/?tournament=<liveLink>&team=<teamId>` | A team's playing and refereeing schedule, with calendar and PDF export. |
| `/referees/?tournament=<liveLink>&referee=<refereeId>` | A referee's assignments, with calendar and PDF export. |

The selected team or referee is kept in the URL so links can be shared, and
the PDF includes a QR code that points back to it.

## How it works

There's no backend. The pages read Tournify's public Firestore data straight
from the browser using the Firebase web SDK:

- `tournaments`, which is looked up by `liveLink`
- `tournaments/<id>/teams`, `matches`, `referees` and `days`

The tournament search is the exception. Full tournament documents are large
and the web SDK can't fetch only some fields, so `getTournamentsBetween()`
calls Firestore's REST API with a field mask. That's about a tenth of the
data for the same date range.

### Times and time zones

Tournify stores each match start as a wall-clock time (`match.st`, e.g.
`"13:30"`) that is local to the tournament, plus a day reference
(`match.day`):

- `"0"` is the tournament's first day, which is the calendar date of
  `tournament.date` (a unix timestamp)
- any other value is the id of a document in `tournaments/<id>/days`, whose
  `date` gives that day

The app uses the tournament's IANA time zone (`tournament.timezone`, e.g.
`Europe/Berlin`) to turn the day and time into a real instant. It does this
with the built-in `Intl` API, so DST is handled and no extra libraries are
needed. The result is that:

- calendar exports are written in UTC, so they show up at the right time in
  any calendar app, wherever the viewer is
- on-screen tables and PDFs show the tournament's local times, which match
  what's on the schedule at the venue. When the viewer's time zone is
  different, the page says so.

If a tournament has no time zone set, the viewer's browser time zone is used.

## Project layout

```
index.html, app.js          Team page
referees/index.html, app.js Referee page
shared/firebase.js          Firestore queries
shared/time.js              Time zone and match-day maths
shared/ics.js               iCalendar writer (escaping, line folding)
shared/search.js            Tournament search matching and ranking
shared/picker.js            Tournament search page
shared/page.js              UI, tournament info card and PDF/ICS export code
                            used by both pages
styles.css                  Stylesheet for both pages
overrides.js                Per-tournament fixes (e.g. a better venue address)
test/                       Unit tests for the time, ICS and search code
```

### Tournament overrides

When Tournify's venue data is wrong or too vague, add an entry to
`overrides.js`, keyed by `liveLink`:

```js
window.TOURNAMENT_OVERRIDES = {
  bigbowl2026: {
    location: 'Full venue address',
    mapsUrl: 'https://www.google.com/maps/...'
  }
};
```

## Development

The pages use ES modules, so they have to be served over HTTP rather than
opened as files:

```sh
python3 -m http.server 8000
# open http://localhost:8000/?tournament=bigbowl2026
```

To check time zone handling, load a tournament with your browser (or
DevTools' sensor settings) set to a different time zone. The times in the
exported `.ics` should still match the tournament's local schedule.

### Tests

The time zone, calendar and search logic have unit tests, which need Node 22
or later:

```sh
node --test test/*.test.mjs

# Run them as if you were somewhere else:
TZ=America/New_York node --test test/*.test.mjs
```

## Deployment

The site is deployed as static assets on Cloudflare Workers (see
`wrangler.jsonc`):

```sh
npx wrangler deploy
```

## Known limitations

- Division names aren't in Tournify's public data. The team page has a
  hard-coded map for Big Bowl's divisions and shows the raw division id for
  any others.
- Bracket games only appear once Tournify has placed a team into the bracket.
  The PDF reminds people to check back for later games.
