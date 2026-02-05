import type { CardRenderContext, RenderedCard } from './types.js';

function isUnixSeconds(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function toUnixSeconds(value: unknown): number | null {
  if (isUnixSeconds(value)) return value;
  if (typeof value === 'string' && /^[0-9]+$/.test(value)) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  return null;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function monthShortUpper(date: Date): string {
  const m = new Intl.DateTimeFormat('de-DE', { month: 'short' }).format(date);
  return m.replace('.', '').toUpperCase();
}

function dateBadgeParts(eventKind: number, start: unknown, tzid?: string): { year: string; day: string; month: string } | null {
  try {
    const unix = toUnixSeconds(start);
    if (unix) {
      const date = new Date(unix * 1000);
      const fmt = (opts: Intl.DateTimeFormatOptions) =>
        new Intl.DateTimeFormat('de-DE', tzid ? { ...opts, timeZone: tzid } : opts).format(date);
      return {
        year: fmt({ year: 'numeric' }),
        day: fmt({ day: '2-digit' }),
        month: monthShortUpper(date)
      };
    }
    if (typeof start === 'string' && start) {
      const date = new Date(`${start}T00:00:00`);
      if (!Number.isFinite(date.getTime())) return null;
      return {
        year: String(date.getFullYear()),
        day: pad2(date.getDate()),
        month: monthShortUpper(date)
      };
    }
  } catch {
    return null;
  }
  return null;
}

function formatCalendarWhen(eventKind: number, metadata: any): string | null {
  const start = metadata?.start;
  const end = metadata?.end;

  if (!start) return null;

  const startUnix = toUnixSeconds(start);
  const endUnix = toUnixSeconds(end);

  if (eventKind === 31922 && startUnix) {
    const tz = metadata?.start_tzid || metadata?.start_tz;
    const endTz = metadata?.end_tzid || metadata?.end_tz || tz;
    const fmt = new Intl.DateTimeFormat('de-DE', {
      dateStyle: 'medium',
      ...(tz ? { timeZone: tz } : {})
    });
    const startStr = fmt.format(new Date(startUnix * 1000));
    if (endUnix) {
      const endFmt = new Intl.DateTimeFormat('de-DE', {
        dateStyle: 'medium',
        ...(endTz ? { timeZone: endTz } : {})
      });
      const endStr = endFmt.format(new Date(endUnix * 1000));
      return startStr === endStr ? startStr : `${startStr} – ${endStr}`;
    }
    return startStr;
  }

  if (eventKind === 31923 && isUnixSeconds(start)) {
    const tz = metadata?.start_tzid || metadata?.start_tz;
    const startFmt = new Intl.DateTimeFormat('de-DE', {
      dateStyle: 'medium',
      timeStyle: 'short',
      ...(tz ? { timeZone: tz } : {})
    });
    const startStr = startFmt.format(new Date(start * 1000));

    if (isUnixSeconds(end)) {
      const endTz = metadata?.end_tzid || metadata?.end_tz || tz;
      const endFmt = new Intl.DateTimeFormat('de-DE', {
        dateStyle: 'medium',
        timeStyle: 'short',
        ...(endTz ? { timeZone: endTz } : {})
      });
      return `${startStr} – ${endFmt.format(new Date(end * 1000))}`;
    }

    return startStr;
  }

  if (typeof start === 'string') {
    const startDate = new Date(`${start}T00:00:00`);
    const startStr = Number.isFinite(startDate.getTime())
      ? new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' }).format(startDate)
      : start;

    if (typeof end === 'string' && end) {
      const endDate = new Date(`${end}T00:00:00`);
      const endStr = Number.isFinite(endDate.getTime())
        ? new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' }).format(endDate)
        : end;
      return startStr === endStr ? startStr : `${startStr} – ${endStr}`;
    }

    return startStr;

    if (typeof end === 'string' && end) return `${start} – ${end}`;
    return start;
  }

  return null;
}

function formatCalendarDateShort(eventKind: number, metadata: any): string | null {
  try {
    const start = metadata?.start;
    if (!start) return null;
    const unix = toUnixSeconds(start);
    if (unix) {
      const tz = metadata?.start_tzid || metadata?.start_tz;
      const fmt = new Intl.DateTimeFormat('de-DE', {
        dateStyle: 'short',
        ...(tz ? { timeZone: tz } : {})
      });
      return fmt.format(new Date(unix * 1000));
    }
    if (typeof start === 'string' && start) {
      const date = new Date(`${start}T00:00:00`);
      if (!Number.isFinite(date.getTime())) return start;
      return new Intl.DateTimeFormat('de-DE', { dateStyle: 'short' }).format(date);
    }
  } catch {
    return null;
  }
  return null;
}

const ICON_CLOCK = `
  <svg class="event-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 11h4v-2h-3V7h-2v6Z"></path>
  </svg>
`;

const ICON_PIN = `
  <svg class="event-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z"></path>
  </svg>
`;

export function renderCalendarCard(ctx: CardRenderContext): RenderedCard {
  const metadata: any = ctx.event.metadata || {};
  const when = formatCalendarWhen(ctx.event.event.kind, metadata);
  const dateShort = formatCalendarDateShort(ctx.event.event.kind, metadata);

  const tzid = metadata?.start_tzid || metadata?.start_tz;
  const badge = dateBadgeParts(ctx.event.event.kind, metadata?.start, tzid);

  const overlayTags = ctx.tags.slice(0, 2).map((t) => `<span class="calendar-tag">${t}</span>`).join('');
  const tagsHtml = overlayTags ? `<div class="calendar-tags">${overlayTags}</div>` : '';

  const badgeHtml = badge
    ? `
      <div class="calendar-badge" aria-hidden="true">
        <div class="calendar-badge-year">${badge.year}</div>
        <div class="calendar-badge-day">${badge.day}</div>
        <div class="calendar-badge-month">${badge.month}</div>
      </div>
    `
    : '';

  const onlineLinkHtml =
    ctx.calendarLocationUrl
      ? `<a href="${ctx.calendarLocationUrl}" target="_blank" rel="noopener noreferrer">Link zum Online-Event</a>`
      : ctx.calendarLocationText
        ? `<span>${ctx.calendarLocationText}</span>`
        : '<span>—</span>';
  const locationRow = ctx.calendarLocationUrl || ctx.calendarLocationText
    ? `<div class="event-row">${ICON_PIN}${onlineLinkHtml}</div>`
    : '';

  const authorHtml =
    ctx.config.showAuthor && ctx.author
      ? `
          <div class="card-meta">
            <div class="card-avatar" style="${ctx.authorPicture ? `background-image: url('${ctx.authorPicture}')` : ''}"></div>
            <span class="card-author">${ctx.authorName || 'Unbekannt'}</span>
          </div>
        `
      : '';

  const description = metadata?.summary || metadata?.description || metadata?.content || ctx.event.event.content || '';

  return {
    cardClassName: 'card-calendar',
    html: `
      <div class="card-image" style="${ctx.imageUrl ? `background-image: url('${ctx.imageUrl}')` : ''}">
        ${!ctx.imageUrl ? 'NO IMAGE' : ''}
        ${badgeHtml}
        ${tagsHtml}
      </div>
      <div class="card-content">
        <h3 class="card-title">${ctx.title}${dateShort ? ` <span class="calendar-title-date">(${dateShort})</span>` : ''}</h3>
        <div class="event-meta">
          <div class="event-row">${ICON_CLOCK}<span>${when || '—'}</span></div>
          ${locationRow}
        </div>
        <p class="card-summary">${description.length > 160 ? description.slice(0, 160) + '…' : description}</p>
        ${authorHtml}
        <a class="card-link" href="${ctx.href || '#'}" target="_blank">Öffnen →</a>
      </div>
    `
  };
}
