// Tournify stores match times as tournament-local wall-clock strings
// ("13:30") plus a day reference. These helpers turn them into real
// instants using the tournament's IANA time zone, without any libraries.

export function isValidTimeZone(timeZone) {
  if (!timeZone) {
    return false;
  }

  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function getViewerTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// Calendar date ({ year, month, day }) of an instant as seen in timeZone.
// With no time zone, the browser's own zone is used.
export function calendarDateInZone(date, timeZone) {
  if (!timeZone) {
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate()
    };
  }

  const parts = getParts(date, timeZone);

  return {
    year: parts.year,
    month: parts.month,
    day: parts.day
  };
}

export function addDays({ year, month, day }, days) {
  const date = new Date(Date.UTC(year, month - 1, day + days));

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate()
  };
}

// Milliseconds timeZone is ahead of UTC at the given instant.
export function getZoneOffsetMs(date, timeZone) {
  const parts = getParts(date, timeZone);

  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );

  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

// The instant at which the wall clock in timeZone reads the given date and
// time. The zone offset is looked up at the target instant, so DST is
// respected. Times that fall in a spring-forward gap resolve to the later
// offset; with no time zone, the browser's own zone is used.
export function zonedTimeToDate(
  { year, month, day },
  hours,
  minutes,
  timeZone
) {
  if (!timeZone) {
    return new Date(year, month - 1, day, hours, minutes);
  }

  const wallAsUtc = Date.UTC(year, month - 1, day, hours, minutes);

  const firstOffset = getZoneOffsetMs(new Date(wallAsUtc), timeZone);
  let result = wallAsUtc - firstOffset;

  const secondOffset = getZoneOffsetMs(new Date(result), timeZone);

  if (secondOffset !== firstOffset) {
    result = wallAsUtc - secondOffset;
  }

  return new Date(result);
}

// Formats a calendar date without letting any time zone shift it.
export function formatCalendarDate({ year, month, day }, options) {
  return new Date(Date.UTC(year, month - 1, day, 12)).toLocaleDateString(
    'en-GB',
    { ...options, timeZone: 'UTC' }
  );
}

// Builds the helpers a page needs to place matches in time.
//
// tournament.date and each days[].date are unix-second timestamps that fall
// somewhere on the relevant match day. Match `day` is either "0" (the
// tournament's first day), the id of a document in the tournament's `days`
// collection, or (in older tournaments) a numeric day offset.
export function createClock(tournament, days = []) {
  const timeZone = isValidTimeZone(tournament.timezone)
    ? tournament.timezone
    : null;

  const firstDay = calendarDateInZone(
    new Date(tournament.date * 1000),
    timeZone
  );

  const dayDates = new Map(
    days.map(d => [
      String(d.id),
      calendarDateInZone(new Date(d.date * 1000), timeZone)
    ])
  );

  function resolveDay(day) {
    const key = String(day ?? 0);

    if (dayDates.has(key)) {
      return dayDates.get(key);
    }

    if (/^\d{1,3}$/.test(key)) {
      return addDays(firstDay, Number(key));
    }

    return null;
  }

  // Returns the match's start instant, or null if it can't be placed.
  function matchStart(match) {
    const date = resolveDay(match.day);
    const time = /^(\d{1,2}):(\d{2})$/.exec(match.st || '');

    if (!date || !time) {
      return null;
    }

    return zonedTimeToDate(date, Number(time[1]), Number(time[2]), timeZone);
  }

  // Calendar date of an instant at the tournament.
  function localDate(date) {
    return calendarDateInZone(date, timeZone);
  }

  const lastDay = [...dayDates.values(), firstDay].reduce(
    (latest, d) => (compareDates(d, latest) > 0 ? d : latest),
    addDays(firstDay, Number(tournament.numMatchDays || 1) - 1)
  );

  const firstNoon = zonedTimeToDate(firstDay, 12, 0, timeZone);

  // True when the tournament's clocks differ from the viewer's during the
  // tournament, so displayed times need a zone label.
  const differsFromViewer =
    !!timeZone &&
    getZoneOffsetMs(firstNoon, timeZone) !==
      -firstNoon.getTimezoneOffset() * 60000;

  function zoneLabel() {
    if (!timeZone) {
      return '';
    }

    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      timeZoneName: 'short'
    }).formatToParts(firstNoon);

    const abbreviation = parts.find(p => p.type === 'timeZoneName')?.value;

    return abbreviation ? `${timeZone} (${abbreviation})` : timeZone;
  }

  return {
    timeZone,
    firstDay,
    lastDay,
    differsFromViewer,
    matchStart,
    localDate,
    zoneLabel
  };
}

function compareDates(a, b) {
  return (a.year - b.year) || (a.month - b.month) || (a.day - b.day);
}

function getParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric'
  }).formatToParts(date);

  const get = type => Number(parts.find(p => p.type === type).value);

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second')
  };
}
