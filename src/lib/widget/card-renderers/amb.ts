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

  const d = (typeof metadata?.d === 'string' ? metadata.d : '') || firstTagValue(tags, 'd') || '';

  const oerUrl = d && isSafeHttpUrl(d) ? d : null;

  const creatorPubkeys: string[] = Array.isArray(metadata?.creatorPubkeys) ? metadata.creatorPubkeys : [];
  const creatorNamesPlain = typeof metadata?.creator === 'string' ? metadata.creator.trim() : '';

  const creatorNamesFromTags = uniq(
    tags.filter((t) => t[0] === 'creator:name' && typeof t[1] === 'string').map((t) => String(t[1]))
  );

  const creatorEntries: Array<{ key: string; name: string; picture?: string }> = [];
  for (const pk of creatorPubkeys.slice(0, 6)) {
    const prof = ctx.profileByPubkey ? ctx.profileByPubkey(pk) : undefined;
    const picture = typeof prof?.picture === 'string' && isSafeHttpUrl(prof.picture) ? prof.picture : undefined;
    const name = (prof?.name || prof?.display_name || '').trim() || pk.slice(0, 8) + '…' + pk.slice(-4);
    creatorEntries.push({ key: pk, name, picture });
  }
  if (creatorEntries.length === 0) {
    for (const n of creatorNamesFromTags.slice(0, 6)) creatorEntries.push({ key: n, name: n });
  }

  const creatorsHtml =
    creatorEntries.length > 0
      ? `
        <div class="oer-creators" aria-label="Creator">
          ${creatorEntries
            .map(({ key, name, picture }) => {
              const initials = (name || key).slice(0, 2).toUpperCase();
              const title = name || key;
              return `
                <span class="oer-avatar" title="${title}">
                  <span class="oer-avatar-img" style="${picture ? `background-image: url('${picture}')` : ''}">${!picture ? initials : ''}</span>
                  <span class="oer-avatar-name">${name}</span>
                </span>
              `;
            })
            .join('')}
        </div>
      `
      : creatorNamesPlain
        ? `<div class="oer-creators-text">Creator: ${creatorNamesPlain}</div>`
        : '';

  const keywords = uniq([
    ...ctx.tags,
    ...tags.filter((t) => t[0] === 'keywords' && typeof t[1] === 'string').map((t) => t[1])
  ]).slice(0, 4);
  const keywordsHtml = keywords.length > 0 ? `<div class="oer-keywords">${keywords.map((k) => `<span class="oer-chip">${k}</span>`).join('')}</div>` : '';

  const chips: string[] = [];
  if (educationalLevel) chips.push(`<span class="oer-chip oer-chip-level">${educationalLevel}</span>`);
  if (resourceType) chips.push(`<span class="oer-chip oer-chip-type">${resourceType}</span>`);
  const chipsHtml = chips.length > 0 ? `<div class="oer-chips">${chips.join('')}</div>` : '';

  const metaPieces: string[] = [];
  if (audienceLabels.length > 0) metaPieces.push(`<span title="Zielgruppe">${audienceLabels[0]}</span>`);
  if (aboutLabels.length > 0) metaPieces.push(`<span title="Thema">${aboutLabels.slice(0, 3).join(', ')}</span>`);
  const metaHtml = metaPieces.length > 0 ? `<div class="oer-meta">${metaPieces.join('')}</div>` : '';

  const description = (typeof metadata?.summary === 'string' && metadata.summary) || (typeof metadata?.description === 'string' && metadata.description) || ctx.summary || '';
  const descriptionShort = description.length > 140 ? description.slice(0, 140) + '…' : description;

  const overlayTypes = uniq(
    tags
      .filter((t) => t[0] === 'type' && typeof t[1] === 'string')
      .map((t) => String(t[1]))
      .filter((t) => t && t !== 'LearningResource')
  ).slice(0, 2);
  const overlayHtml =
    overlayTypes.length > 0
      ? `<div class="oer-image-overlay">${overlayTypes.map((t) => `<span class="oer-overlay-chip">${t}</span>`).join('')}</div>`
      : '<div class="oer-image-overlay"></div>';

  return {
    cardClassName: 'card-amb',
    html: `
      <div class="card-image" style="${ctx.imageUrl ? `background-image: url('${ctx.imageUrl}')` : ''}">
        ${!ctx.imageUrl ? 'NO IMAGE' : ''}
        ${overlayHtml}
      </div>
      ${creatorsHtml}
      <div class="card-content">
        <span class="card-type">${ctx.typeLabel}</span>
        <h3 class="card-title">${ctx.title}</h3>
        ${chipsHtml}
        ${metaHtml}
        ${descriptionShort ? `<p class="card-summary oer-summary">${descriptionShort}</p>` : ''}
        ${keywordsHtml}
        <a class="card-link" href="${ctx.href || '#'}" target="_blank">Öffnen →</a>
      </div>
    `
  };
}
