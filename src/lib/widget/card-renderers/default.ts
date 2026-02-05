import type { CardRenderContext, RenderedCard } from './types.js';

export function renderDefaultCard(ctx: CardRenderContext): RenderedCard {
  const authorHtml =
    ctx.config.showAuthor && ctx.author
      ? `
          <div class="card-meta">
            <div class="card-avatar" style="${ctx.authorPicture ? `background-image: url('${ctx.authorPicture}')` : ''}"></div>
            <span class="card-author">${ctx.authorName || 'Unbekannt'}</span>
          </div>
        `
      : '';

  return {
    html: `
      <div class="card-image" style="${ctx.imageUrl ? `background-image: url('${ctx.imageUrl}')` : ''}">
        ${!ctx.imageUrl ? 'NO IMAGE' : ''}
      </div>
      <div class="card-content">
        <span class="card-type">${ctx.typeLabel}</span>
        <h3 class="card-title">${ctx.title}</h3>
        <p class="card-summary">${ctx.summary.length > 100 ? ctx.summary.slice(0, 100) + '...' : ctx.summary}</p>
        ${authorHtml}
        <a class="card-link" href="${ctx.href || '#'}" target="_blank">Öffnen →</a>
      </div>
    `
  };
}

