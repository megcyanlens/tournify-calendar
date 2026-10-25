// UI and export code shared by the team page (/) and the referee page
// (/referees/).

import { findTournament, getDays } from './firebase.js';

import { createClock, formatCalendarDate } from './time.js';
import { buildCalendar } from './ics.js';

export const isInstagram = navigator.userAgent.includes('Instagram');

const DEFAULT_COLOR = '#0b2d69';
const DATE_FORMAT = { day: 'numeric', month: 'long', year: 'numeric' };
const REFEREE_KEYS = ['referee', 'referee2', 'referee3', 'referee4', 'referee5'];

export const $ = id => document.getElementById(id);

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// "DE" -> 🇩🇪; anything that isn't a two-letter code is returned as is.
export function getCountryFlag(country) {
  const code = (country || '').trim().toUpperCase();

  if (!/^[A-Z]{2}$/.test(code)) {
    return code;
  }

  return [...code]
    .map(c => String.fromCodePoint(127397 + c.charCodeAt()))
    .join('');
}

export async function retry(fn, attempts = 3, delay = 1000) {
  let lastError;

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      console.warn(`Attempt ${i + 1} failed`, e);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// ---------------------------------------------------------------------------
// Empty / loading / error states

export function showEmptyState({ icon, title, text = '', extra = '' }) {
  $('results').innerHTML = `
    <div class="empty-state">
      <div class="empty-state__icon">${icon}</div>
      <h3>${title}</h3>
      ${text ? `<p>${text}</p>` : ''}
      ${extra}
    </div>
  `;
}

export function showLoading(title, text = '') {
  $('results').innerHTML = `
    <div class="empty-state">
      <div class="spinner"></div>
      <h3>${title}</h3>
      ${text ? `<p>${text}</p>` : ''}
    </div>
  `;
}

export function showLoadError(error) {
  console.error(error);

  showEmptyState({
    icon: '⚠️',
    title: 'Failed to load tournament',
    text: 'Please refresh the page.',
    extra: '<button onclick="location.reload()">Refresh</button>'
  });
}

// ---------------------------------------------------------------------------
// Tournament loading

// Loads the tournament named by ?tournament=..., or resolves to null when
// there's no such tournament (the caller then shows the picker).
export async function loadTournamentPage(liveLink) {
  const tournament = liveLink ? await findTournament(liveLink) : null;

  if (!tournament) {
    return null;
  }

  let days = [];

  try {
    days = await getDays(tournament.id);
  } catch (e) {
    console.warn('Could not load match days', e);
  }

  const override =
    window.TOURNAMENT_OVERRIDES?.[tournament.liveLink] || {};

  const placeSuffix = tournament.placeSecondaryName
    ? `, ${tournament.placeSecondaryName}`
    : '';

  const ctx = {
    tournament,
    clock: createClock(tournament, days),
    fields: tournament.fields || {},
    location: override.location || `${tournament.place}${placeSuffix}`,
    mapsUrl:
      override.mapsUrl ||
      `https://www.google.com/maps/place/?q=place_id:${tournament.placeReference}`
  };

  document.documentElement.style.setProperty(
    '--tournament-color',
    tournament.color || DEFAULT_COLOR
  );

  $('pageTitle').textContent = tournament.name;

  return ctx;
}

// ---------------------------------------------------------------------------
// Formatting helpers

export function getDateRangeText(ctx) {
  const { firstDay, lastDay } = ctx.clock;

  const start = formatCalendarDate(firstDay, DATE_FORMAT);
  const end = formatCalendarDate(lastDay, DATE_FORMAT);

  return start === end ? start : `${start} - ${end}`;
}

function isMultiDay(ctx) {
  const { firstDay, lastDay } = ctx.clock;

  return (
    firstDay.year !== lastDay.year ||
    firstDay.month !== lastDay.month ||
    firstDay.day !== lastDay.day
  );
}

export function getFieldName(ctx, fieldId) {
  return ctx.fields[fieldId]?.name || fieldId;
}

export function getMatchDuration(ctx) {
  return (
    Number(ctx.tournament.matchDuration || 0) +
    Number(ctx.tournament.timeBetweenMatches || 0)
  );
}

// Tournament-local time, e.g. "13:30", or "Sat 13:30" for multi-day events.
export function formatMatchTime(ctx, match) {
  if (!isMultiDay(ctx)) {
    return match.st;
  }

  const weekday = formatCalendarDate(
    ctx.clock.localDate(match.start),
    { weekday: 'short' }
  );

  return `${weekday} ${match.st}`;
}

export function formatMatchDay(ctx, match) {
  return formatCalendarDate(
    ctx.clock.localDate(match.start),
    { weekday: 'long', day: 'numeric', month: 'long' }
  );
}

// Note shown above schedules when the viewer is in a different time zone.
export function timeZoneNoteHtml(ctx) {
  if (!ctx.clock.differsFromViewer) {
    return '';
  }

  return `
    <p class="timezone-note">
      🕒 Times are local to the tournament: ${escapeHtml(ctx.clock.zoneLabel())}.
      Calendar exports are converted to your time zone automatically.
    </p>
  `;
}

// ---------------------------------------------------------------------------
// Teams and matches

export function getRefereeIds(match) {
  return REFEREE_KEYS.map(key => match[key]).filter(Boolean);
}

// Every (poule, number) position a team holds. Group-stage positions are
// poule0/numInPoule0; bracket positions are keyed like
// "poule1-4-<bracketId>" / "numInPoule1-4-<bracketId>".
export function getTeamSlots(team) {
  return Object.keys(team)
    .filter(key => key.startsWith('poule') && team[key])
    .map(key => [team[key], team[`numInP${key.slice(1)}`]])
    .filter(([, num]) => num !== undefined && num !== null)
    .map(([poule, num]) => `${poule}-${num}`);
}

export function createTeamLookup(teams) {
  const bySlot = new Map();

  teams.forEach(team => {
    getTeamSlots(team).forEach(slot => bySlot.set(slot, team));
  });

  const teamAt = (poule, num) => bySlot.get(`${poule}-${num}`);

  return {
    teamAt,
    nameAt: (poule, num) => teamAt(poule, num)?.name || 'TBD'
  };
}

// Attaches each match's start instant and drops ones that can't be placed,
// sorted chronologically.
export function withStartTimes(ctx, matches) {
  return matches
    .map(match => ({ ...match, start: ctx.clock.matchStart(match) }))
    .filter(match => match.start)
    .sort((a, b) => a.start - b.start);
}

// True once a day has passed since the tournament's last match.
export function isEventOver(sortedMatches) {
  const lastMatch = sortedMatches[sortedMatches.length - 1];

  return !lastMatch || lastMatch.start < new Date(Date.now() - 24 * 60 * 60 * 1000);
}

export function splitByTime(matches, now = new Date()) {
  return {
    upcoming: matches.filter(match => match.start > now),
    played: matches.filter(match => match.start <= now)
  };
}

export function matchTableHtml({ ctx, title, matches, lookup }) {
  if (!matches.length) {
    return '';
  }

  const rows = matches
    .map(match => `
      <tr>
        <td>${escapeHtml(formatMatchTime(ctx, match))}</td>
        <td>${escapeHtml(getFieldName(ctx, match.field))}</td>
        <td>${escapeHtml(lookup.nameAt(match.poule, match.team1))}</td>
        <td>${escapeHtml(lookup.nameAt(match.poule, match.team2))}</td>
      </tr>
    `)
    .join('');

  return `
    <h3>${title}</h3>
    <div class="table-wrapper">
      <table>
        <tr>
          <th>Time</th>
          <th>Field</th>
          <th>Team 1</th>
          <th>Team 2</th>
        </tr>
        ${rows}
      </table>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Tournament info card

export function renderTournamentInfo(ctx, tournifyPath = '') {
  const tournifyUrl =
    `https://tournifyapp.com/live/${ctx.tournament.liveLink}${tournifyPath}`;

  $('tournamentInfoCard').innerHTML = `
    <div class="tournament-info-card">
      <div class="tournament-info-grid">
        <div>
          <div class="tournament-info-label">Location</div>
          <div class="tournament-info-value">
            <a
              href="${escapeHtml(ctx.mapsUrl)}"
              target="_blank"
              rel="noopener"
              class="tournament-info-link"
            >${escapeHtml(ctx.location)}</a>
          </div>
        </div>

        <div>
          <div class="tournament-info-label">Dates</div>
          <div class="tournament-info-value">
            ${escapeHtml(getDateRangeText(ctx))}
          </div>
        </div>

        <div>
          <div class="tournament-info-label">Tournify</div>
          <div class="tournament-info-value">
            <a
              href="${escapeHtml(tournifyUrl)}"
              target="_blank"
              rel="noopener"
              class="tournament-info-link"
            >Open in Tournify ↗</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Buttons

export function setActionButtonsVisible(visible) {
  $('generateBtn').style.display = visible ? 'block' : 'none';
  $('pdfBtn').style.display = visible ? 'block' : 'none';
}

export function updateGenerateButton({ upcomingCount, eventIsOver }) {
  const button = $('generateBtn');

  button.disabled = !isInstagram && (upcomingCount === 0 || eventIsOver);

  if (isInstagram) {
    button.textContent = '🔒 Open in Browser';
  } else if (eventIsOver) {
    button.textContent = 'Event Finished';
  } else if (upcomingCount === 0) {
    button.textContent = 'No Upcoming Games';
  } else {
    button.textContent = '📅 Generate Calendar';
  }
}

export function setupActionButtons({ onCalendar, onPdf }) {
  $('generateBtn').addEventListener('click', () => {
    if (isInstagram) {
      alert(
        'Instagram blocks calendar downloads.\n\nTap ⋮ and choose "Open in external browser".'
      );
      return;
    }

    onCalendar();
  });

  $('pdfBtn').addEventListener('click', onPdf);

  setActionButtonsVisible(false);
}

// Mobile browsers sometimes resume a tab with a half-loaded page; reload if
// the page never finished loading its data.
export function reloadOnResumeIfIncomplete(isComplete) {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && !isComplete()) {
      location.reload();
    }
  });
}

// ---------------------------------------------------------------------------
// Exports

function safeFilename(name) {
  return name.replace(/[<>:"/\\|?*]/g, '');
}

function downloadFile(content, filename, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');

  a.href = url;
  a.download = filename;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

// entries: [{ match, kind, summary, description }]. `kind` keeps UIDs
// distinct when a team both plays and referees the same match.
export function downloadCalendar(ctx, { entries, filename }) {
  const duration = getMatchDuration(ctx) * 60000;
  const host = window.location.host || 'tournify-calendar';

  const ics = buildCalendar({
    name: filename,
    events: entries.map(entry => ({
      // Stable UIDs let calendar apps update events on re-import instead of
      // duplicating them.
      uid: `${ctx.tournament.id}-${entry.match.id}-${entry.kind}@${host}`,
      start: entry.match.start,
      end: new Date(entry.match.start.getTime() + duration),
      summary: entry.summary,
      description: entry.description,
      location: ctx.location
    }))
  });

  downloadFile(ics, `${safeFilename(filename)}.ics`, 'text/calendar');

  return ics;
}

function hexToRgb(color) {
  const hex = color.replace('#', '');

  return [
    parseInt(hex.substring(0, 2), 16),
    parseInt(hex.substring(2, 4), 16),
    parseInt(hex.substring(4, 6), 16)
  ];
}

function htmlToText(html) {
  const temp = document.createElement('div');
  temp.innerHTML = html || '';

  return (temp.textContent || '').replace(/\n\s*\n/g, '\n').trim();
}

async function createQrDataUrl(text) {
  const container = document.createElement('div');

  new QRCode(container, { text, width: 150, height: 150 });

  const image = container.querySelector('img');

  await new Promise(resolve => {
    const check = () => (image?.src ? resolve() : setTimeout(check, 50));
    check();
  });

  return image.src;
}

// rows: [{ match, type, description }]
export async function downloadSchedulePdf(ctx, {
  heading,
  details,
  rows,
  notes,
  shareUrl,
  filename
}) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  const color = hexToRgb(ctx.tournament.color || DEFAULT_COLOR);
  const tournamentUrl = `https://tournifyapp.com/live/${ctx.tournament.liveLink}`;
  const description = htmlToText(ctx.tournament.description);

  const label = (text, x, y) => {
    pdf.setFont(undefined, 'bold');
    pdf.text(text, x, y);
    pdf.setFont(undefined, 'normal');
  };

  const link = (text, x, y, url) => {
    pdf.setTextColor(...color);
    pdf.textWithLink(text, x, y, { url });
    pdf.setTextColor(0, 0, 0);
  };

  let y = 20;

  pdf.setFontSize(22);
  label(ctx.tournament.name, 15, y);

  pdf.setFontSize(11);
  y += 10;

  if (description) {
    label('Tournify Description:', 15, y);
    y += 7;

    const wrapped = pdf.splitTextToSize(description, 180);
    pdf.text(wrapped, 15, y);
    y += wrapped.length * 5 + 5;
  }

  link(tournamentUrl, 15, y, tournamentUrl);
  y += 15;

  label('Date(s):', 15, y);
  pdf.text(getDateRangeText(ctx), 40, y);
  y += 8;

  label('Location:', 15, y);
  link(ctx.location, 40, y, ctx.mapsUrl);
  y += 8;

  if (ctx.clock.timeZone) {
    label('Times:', 15, y);
    pdf.text(`Local to the tournament, ${ctx.clock.zoneLabel()}`, 40, y);
    y += 8;
  }

  y += 15;

  pdf.setFontSize(16);
  label(heading, 15, y);
  y += 10;

  pdf.setFontSize(11);
  details.forEach(line => {
    pdf.text(line, 15, y);
    y += 7;
  });
  y += 8;

  pdf.setFontSize(16);
  label('Schedule', 15, y);
  y += 10;

  const dayGroups = new Map();

  rows.forEach(row => {
    const day = formatMatchDay(ctx, row.match);

    if (!dayGroups.has(day)) {
      dayGroups.set(day, []);
    }

    dayGroups.get(day).push(row);
  });

  dayGroups.forEach((dayRows, day) => {
    pdf.setFontSize(13);
    label(day, 15, y);
    y += 6;

    pdf.autoTable({
      startY: y,
      head: [['Time', 'Type', 'Field', 'Match']],
      headStyles: {
        fillColor: color,
        textColor: 255,
        fontStyle: 'bold'
      },
      body: dayRows.map(row => [
        row.match.st,
        row.type,
        getFieldName(ctx, row.match.field),
        row.description
      ])
    });

    y = pdf.lastAutoTable.finalY + 10;
  });

  pdf.setFontSize(14);
  label('Important', 15, y);
  y += 8;

  pdf.setFontSize(10);
  pdf.text(notes, 15, y);

  pdf.addImage(await createQrDataUrl(shareUrl), 'PNG', 140, 220, 40, 40);
  pdf.text('Scan for live updates', 135, 215);

  pdf.save(`${safeFilename(filename)}.pdf`);
}
