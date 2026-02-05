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

function asHexPubkey(input: string): string | null {
  const s = input.trim().toLowerCase();
  if (/^[0-9a-f]{64}$/.test(s)) return s;
  return null;
}

function isUrlLike(value: string): boolean {
  const s = value.trim().toLowerCase();
  return s.startsWith('http://') || s.startsWith('https://') || s.startsWith('urn:');
}

function truncate(value: string, maxLen: number): string {
  const s = value.trim();
  if (s.length <= maxLen) return s;
  return s.slice(0, Math.max(0, maxLen - 1)).trimEnd() + '…';
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

  const d = (typeof metadata?.d === 'string' ? metadata.d : '') || firstTagValue(tags, 'd') || '';

  const oerUrl = d && isSafeHttpUrl(d) ? d : null;

  const creatorPubkeys: string[] = Array.isArray(metadata?.creatorPubkeys) ? metadata.creatorPubkeys : [];
  const creatorIdPubkeys = uniq(
    tags
      .filter((t) => t[0] === 'creator:id' && typeof t[1] === 'string')
      .map((t) => String(t[1]))
      .map((v) => (v.toLowerCase().startsWith('nostr:') ? v.slice('nostr:'.length) : v))
      .map((v) => asHexPubkey(v))
      .filter((v): v is string => Boolean(v))
  );
  const allCreatorPubkeys = uniq([...creatorPubkeys, ...creatorIdPubkeys]);
  const creatorNamesPlain = typeof metadata?.creator === 'string' ? metadata.creator.trim() : '';

  const externalCreatorNames = uniq(
    tags
      .filter((t) => t[0] === 'creator:name' && typeof t[1] === 'string')
      .map((t) => String(t[1]))
  );

  const externalPublisherNames = uniq(
    tags
      .filter((t) => t[0] === 'publisher:name' && typeof t[1] === 'string')
      .map((t) => String(t[1]))
  );

  const creatorEntries: Array<{ key: string; name: string; picture?: string }> = [];
  for (const pk of allCreatorPubkeys.slice(0, 6)) {
    const prof = ctx.profileByPubkey ? ctx.profileByPubkey(pk) : undefined;
    const picture = typeof prof?.picture === 'string' && isSafeHttpUrl(prof.picture) ? prof.picture : undefined;
    const profileName = (prof?.name || prof?.display_name || '').trim();
    const name = profileName || `Unbekannt ${pk.slice(-4)}`;
    creatorEntries.push({ key: pk, name, picture });
  }

  const firstCreator = creatorEntries[0];
  const footerAvatarHtml = firstCreator
    ? (() => {
        const { key, name, picture } = firstCreator;
        const initials = (name || key).slice(0, 2).toUpperCase();
        const title = name || key;
        return `
          <button class="oer-footer-avatar oer-avatar" type="button" title="${title}" data-pubkey="${key}">
            <span class="oer-avatar-img" style="${picture ? `background-image: url('${picture}')` : ''}">${!picture ? initials : ''}</span>
            <span class="oer-footer-avatar-name">${truncate(name, 18)}</span>
          </button>
        `;
      })()
    : '';

  const footerLeftHtml = footerAvatarHtml || '<span class="card-footer-spacer"></span>';

  const normalizeName = (value: string) => value.trim().toLowerCase();
  const avatarCreatorNameSet = new Set<string>(creatorEntries.map((c) => normalizeName(c.name)));
  const externalCreatorsText = uniq([
    ...(creatorNamesPlain ? [creatorNamesPlain] : []),
    ...externalCreatorNames
  ])
    .filter((name) => !avatarCreatorNameSet.has(normalizeName(name)))
    .slice(0, 6);

  const creditsPieces: string[] = [];
  if (externalCreatorsText.length > 0) {
    creditsPieces.push(
      `<div class="oer-credit"><span class="oer-credit-label">Creator:</span> <span>${externalCreatorsText.join(', ')}</span></div>`
    );
  }
  if (externalPublisherNames.length > 0) {
    creditsPieces.push(
      `<div class="oer-credit"><span class="oer-credit-label">Publisher:</span> <span>${externalPublisherNames.slice(0, 4).join(', ')}</span></div>`
    );
  }

  const creditsHtml = creditsPieces.length > 0 ? `<div class="oer-credits">${creditsPieces.join('')}</div>` : '';

  const creatorsHtml = creditsHtml;

  // Keywords nicht in der Card anzeigen (nur im Detail-Dialog)

  const aboutChips = aboutLabels
    .map((v) => v.trim())
    .filter((v) => v.length > 0 && !isUrlLike(v))
    .map((v) => truncate(v, 38));

  const chipCandidates = [
    educationalLevel && !isUrlLike(educationalLevel) ? educationalLevel : '',
    resourceType && !isUrlLike(resourceType) ? resourceType : '',
    ...aboutChips
  ];

  const overlayChips = uniq(chipCandidates).filter(Boolean).slice(0, 3);
  const overlayChipsHtml =
    overlayChips.length > 0
      ? `<div class="oer-chip-stack">${overlayChips.map((c) => `<span class="oer-chip oer-chip-overlay">${c}</span>`).join('')}</div>`
      : '';

  const description = (typeof metadata?.summary === 'string' && metadata.summary) || (typeof metadata?.description === 'string' && metadata.description) || ctx.summary || '';
  const descriptionShort = description.length > 140 ? description.slice(0, 140) + '…' : description;

  const overlayTypes = uniq(
    tags
      .filter((t) => t[0] === 'type' && typeof t[1] === 'string')
      .map((t) => String(t[1]))
      .filter((t) => t && t !== 'LearningResource')
  ).slice(0, 2);

  const overlayTags = uniq(ctx.tags).slice(0, 3);

  const keywordsHtml =
    overlayTypes.length > 0 || overlayTags.length > 0
      ? `<div class="oer-keywords-stack">${[...overlayTypes, ...overlayTags].map((t) => `<span class="oer-keyword-chip">${t}</span>`).join('')}</div>`
      : '<div class="oer-keywords-stack"></div>';

  return {
    cardClassName: 'card-amb',
    html: `
      <div class="card-image${ctx.imageUrl ? '' : ' card-image--placeholder'}" style="${ctx.imageUrl ? `background-image: url('${ctx.imageUrl}')` : ''}">
        ${overlayChipsHtml}
      </div>
      <div class="card-content">
        <span class="card-type">${ctx.typeLabel}</span>
        <h3 class="card-title">${ctx.title}</h3>
        ${descriptionShort ? `<p class="card-summary oer-summary">${descriptionShort}</p>` : ''}
        ${keywordsHtml}
        ${creatorsHtml}
        
        
      </div>
      <div class="card-footer">
          ${footerLeftHtml}
          <a class="card-link" href="${ctx.href || '#'}" target="_blank">Öffnen →</a>
      </div>
    `
  };
}
