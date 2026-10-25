// Minimal iCalendar (RFC 5545) writer.

// Escapes a value for a TEXT property (SUMMARY, DESCRIPTION, LOCATION).
export function escapeText(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

// 2026-06-06T11:30:00.000Z -> 20260606T113000Z
export function formatUtc(date) {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

// Splits a content line into 75-octet chunks joined by CRLF + space.
export function foldLine(line) {
  const encoder = new TextEncoder();
  const chunks = [];

  let current = '';
  let currentBytes = 0;

  for (const char of line) {
    const bytes = encoder.encode(char).length;
    const limit = chunks.length ? 74 : 75;

    if (currentBytes + bytes > limit) {
      chunks.push(current);
      current = '';
      currentBytes = 0;
    }

    current += char;
    currentBytes += bytes;
  }

  chunks.push(current);

  return chunks.join('\r\n ');
}

// events: [{ uid, start, end, summary, description, location }]
export function buildCalendar({ name, events, now = new Date() }) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Tournify Calendar Exporter//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  if (name) {
    lines.push(`X-WR-CALNAME:${escapeText(name)}`);
  }

  events.forEach(event => {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${event.uid}`,
      `DTSTAMP:${formatUtc(now)}`,
      `DTSTART:${formatUtc(event.start)}`,
      `DTEND:${formatUtc(event.end)}`,
      `SUMMARY:${escapeText(event.summary)}`
    );

    if (event.description) {
      lines.push(`DESCRIPTION:${escapeText(event.description)}`);
    }

    if (event.location) {
      lines.push(`LOCATION:${escapeText(event.location)}`);
    }

    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');

  return lines.map(foldLine).join('\r\n') + '\r\n';
}
