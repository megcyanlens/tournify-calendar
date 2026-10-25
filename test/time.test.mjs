import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  createClock,
  zonedTimeToDate,
  formatCalendarDate
} from '../shared/time.js';

// Big Bowl XVIII: tournament.date is 2026-06-06 13:34 UTC, day 2 is a
// document in the `days` collection one day later.
const bigBowl = {
  date: 1780752840,
  timezone: 'Europe/Berlin',
  numMatchDays: 2
};

const bigBowlDays = [{ id: 'UcMhAVJXriBK8qnZcyyE', date: 1780839240 }];

test('day "0" match times are Berlin wall time', () => {
  const clock = createClock(bigBowl, bigBowlDays);

  assert.equal(
    clock.matchStart({ day: '0', st: '13:30' }).toISOString(),
    '2026-06-06T11:30:00.000Z'
  );
});

test('day ids resolve through the days collection', () => {
  const clock = createClock(bigBowl, bigBowlDays);

  assert.equal(
    clock.matchStart({ day: 'UcMhAVJXriBK8qnZcyyE', st: '08:00' }).toISOString(),
    '2026-06-07T06:00:00.000Z'
  );
});

test('numeric day offsets are still supported', () => {
  const clock = createClock(bigBowl, []);

  assert.equal(
    clock.matchStart({ day: 1, st: '08:00' }).toISOString(),
    '2026-06-07T06:00:00.000Z'
  );
});

test('unknown days and bad times return null', () => {
  const clock = createClock(bigBowl, []);

  assert.equal(clock.matchStart({ day: 'missing', st: '08:00' }), null);
  assert.equal(clock.matchStart({ day: '0', st: '' }), null);
});

test('calendar date comes from the tournament zone, not UTC', () => {
  // 23:30 UTC on 6 June is already 7 June in Berlin.
  const clock = createClock(
    { ...bigBowl, date: Date.UTC(2026, 5, 6, 23, 30) / 1000 },
    []
  );

  assert.deepEqual(clock.firstDay, { year: 2026, month: 6, day: 7 });
});

test('DST transitions use the offset at the target instant', () => {
  // Europe/Berlin springs forward on 29 March 2026 and falls back on
  // 25 October 2026.
  const tz = 'Europe/Berlin';

  assert.equal(
    zonedTimeToDate({ year: 2026, month: 3, day: 29 }, 1, 30, tz).toISOString(),
    '2026-03-29T00:30:00.000Z'
  );

  assert.equal(
    zonedTimeToDate({ year: 2026, month: 3, day: 29 }, 3, 30, tz).toISOString(),
    '2026-03-29T01:30:00.000Z'
  );

  assert.equal(
    zonedTimeToDate({ year: 2026, month: 10, day: 25 }, 12, 0, tz).toISOString(),
    '2026-10-25T11:00:00.000Z'
  );
});

test('lastDay covers numMatchDays and the days collection', () => {
  const clock = createClock(bigBowl, bigBowlDays);

  assert.equal(
    formatCalendarDate(clock.lastDay, { day: 'numeric', month: 'long' }),
    '7 June'
  );
});

test('missing time zone falls back to the browser zone', () => {
  const clock = createClock({ ...bigBowl, timezone: undefined }, []);
  const start = clock.matchStart({ day: '0', st: '13:30' });

  assert.equal(clock.timeZone, null);
  assert.equal(start.getHours(), 13);
  assert.equal(start.getMinutes(), 30);
});
