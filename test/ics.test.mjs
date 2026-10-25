import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildCalendar, escapeText, foldLine } from '../shared/ics.js';

test('text values escape backslashes, commas, semicolons and newlines', () => {
  assert.equal(
    escapeText('Walldorf, Deutschland; Field 1\\2\nLine two'),
    'Walldorf\\, Deutschland\\; Field 1\\\\2\\nLine two'
  );
});

test('long lines are folded at 75 octets', () => {
  const folded = foldLine('DESCRIPTION:' + 'ä'.repeat(60));
  const encoder = new TextEncoder();

  folded.split('\r\n').forEach(line => {
    assert.ok(encoder.encode(line).length <= 75);
  });

  assert.equal(folded.replace(/\r\n /g, ''), 'DESCRIPTION:' + 'ä'.repeat(60));
});

test('calendar uses CRLF and has no space after LOCATION:', () => {
  const ics = buildCalendar({
    name: 'Big Bowl',
    now: new Date('2026-06-01T00:00:00Z'),
    events: [{
      uid: 'abc@example',
      start: new Date('2026-06-06T11:30:00Z'),
      end: new Date('2026-06-06T12:00:00Z'),
      summary: 'A vs B',
      description: 'Field 1\nA vs B',
      location: 'Mörfelden-Walldorf, Deutschland'
    }]
  });

  assert.ok(ics.includes('\r\nDTSTART:20260606T113000Z\r\n'));
  assert.ok(ics.includes('\r\nLOCATION:Mörfelden-Walldorf\\, Deutschland\r\n'));
  assert.ok(ics.includes('\r\nDESCRIPTION:Field 1\\nA vs B\r\n'));
  assert.ok(!/\r(?!\n)|(?<!\r)\n/.test(ics));
});
