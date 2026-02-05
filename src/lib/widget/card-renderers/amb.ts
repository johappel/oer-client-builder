import type { CardRenderContext, RenderedCard } from './types.js';

function isSafeHttpUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function uniq(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const key = v.trim();
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

function extractPrefLabels(tags: string[][], base: string, lang: string | undefined): string[] {
  const prefTags = tags
    .filter((t) => typeof t[0] === 'string' && t[0].startsWith(`${base}:prefLabel:`))
    .map((t) => ({ key: t[0], value: t[1] }))
    .filter((t) => typeof t.value === 'string' && t.value.trim().length > 0);

  if (prefTags.length === 0) return [];

  if (lang) {
    const exactKey = `${base}:prefLabel:${lang}`;
    const exact = prefTags.filter((t) => t.key === exactKey).map((t) => t.value);
    if (exact.length > 0) return uniq(exact);
  }

  return uniq(prefTags.map((t) => t.value));
}

function firstTagValue(tags: string[][], key: string): string | null {
  const found = tags.find((t) => t[0] === key);
  return typeof found?.[1] === 'string' ? found[1] : null;
}

export function renderAmbCard(ctx: CardRenderContext): RenderedCard {
  const metadata: any = ctx.event.metadata || {};
  const tags = ctx.event.event.tags || [];

  const lang = ctx.config.language || 'de';

  const educationalLevel =
    extractPrefLabels(tags, 'educationalLevel', lang)[0] ||
    extractPrefLabels(tags, 'educationalLevel', undefined)[0] ||
    '';

  const resourceType =
    extractPrefLabels(tags, 'learningResourceType', lang)[0] ||
    extractPrefLabels(tags, 'learningResourceType', undefined)[0] ||
    (typeof metadata?.learningResourceType === 'string' ? metadata.learningResourceType : '') ||
    '';

  const aboutLabels = extractPrefLabels(tags, 'about', lang);
  const audienceLabels = extractPrefLabels(tags, 'audience', lang);

  const license = (typeof metadata?.license === 'string' ? metadata.license : '') || firstTagValue(tags, 'license:id') || '';
  const d = (typeof metadata?.d === 'string' ? metadata.d : '') || firstTagValue(tags, 'd') || '';

  const oerUrl = d && isSafeHttpUrl(d) ? d : null;
  const licenseUrl = license && isSafeHttpUrl(license) ? license : null;

  const creatorPubkeys: string[] = Array.isArray(metadata?.creatorPubkeys) ? metadata.creatorPubkeys : [];
  const creatorNamesPlain = typeof metadata?.creator === 'string' ? metadata.creator.trim() : '';

  const creatorAvatars = creatorPubkeys.slice(0, 6).map((pk) => {
    const prof = ctx.profileByPubkey ? ctx.profileByPubkey(pk) : undefined;
    const picture = typeof prof?.picture === 'string' && isSafeHttpUrl(prof.picture) ? prof.picture : '';
    const name = (prof?.name || prof?.display_name || '').trim();
    const initials = (name || pk.slice(0, 2)).slice(0, 2).toUpperCase();
    const title = name || pk.slice(0, 8) + '…' + pk.slice(-4);
    return `
      <span class="oer-avatar" title="${title}">
        <span class="oer-avatar-img" style="${picture ? `background-image: url('${picture}')` : ''}">${!picture ? initials : ''}</span>
      </span>
    `;
  });
  const creatorsHtml =
    creatorAvatars.length > 0
      ? `<div class="oer-creators" aria-label="Creator">${creatorAvatars.join('')}</div>`
      : creatorNamesPlain
        ? `<div class="oer-creators-text">Creator: ${creatorNamesPlain}</div>`
        : '';

  const keywords = uniq([
    ...ctx.tags,
    ...tags.filter((t) => t[0] === 'keywords' && typeof t[1] === 'string').map((t) => t[1])
  ]).slice(0, 4);
  const keywordsHtml = keywords.length > 0 ? `<div class="oer-keywords">${keywords.map((k) => `<span class="oer-chip">${k}</span>`).join('')}</div>` : '';

  const levelChipHtml = educationalLevel
    ? `<div class="oer-level"><span class="oer-chip oer-chip-level">Bildungsstufe: ${educationalLevel}</span></div>`
    : '';

  const metaRows: string[] = [];
  if (resourceType) metaRows.push(`<div class="oer-row"><span class="oer-label">Typ:</span> <span>${resourceType}</span></div>`);
  if (audienceLabels.length > 0) metaRows.push(`<div class="oer-row"><span class="oer-label">Zielgruppe:</span> <span>${audienceLabels.join(', ')}</span></div>`);
  if (aboutLabels.length > 0) metaRows.push(`<div class="oer-row"><span class="oer-label">Thema:</span> <span>${aboutLabels.slice(0, 3).join(', ')}</span></div>`);
  if (licenseUrl) metaRows.push(`<div class="oer-row"><span class="oer-label">Lizenz:</span> <a href="${licenseUrl}" target="_blank" rel="noopener noreferrer">${licenseUrl}</a></div>`);
  else if (license) metaRows.push(`<div class="oer-row"><span class="oer-label">Lizenz:</span> <span>${license}</span></div>`);

  const description = (typeof metadata?.summary === 'string' && metadata.summary) || (typeof metadata?.description === 'string' && metadata.description) || ctx.summary || '';
  const descriptionShort = description.length > 140 ? description.slice(0, 140) + '…' : description;

  return {
    cardClassName: 'card-amb',
    html: `
      <div class="card-image" style="${ctx.imageUrl ? `background-image: url('${ctx.imageUrl}')` : ''}">
        ${!ctx.imageUrl ? 'NO IMAGE' : ''}
      </div>
      <div class="card-content">
        <span class="card-type">${ctx.typeLabel}</span>
        <h3 class="card-title">${ctx.title}</h3>
        ${levelChipHtml}
        ${creatorsHtml}
        ${metaRows.length > 0 ? `<div class="oer-meta">${metaRows.join('')}</div>` : ''}
        ${descriptionShort ? `<p class="card-summary oer-summary">${descriptionShort}</p>` : ''}
        ${keywordsHtml}
        <a class="card-link" href="${ctx.href || '#'}" target="_blank">Öffnen →</a>
      </div>
    `
  };
}
