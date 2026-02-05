import type { CardRenderContext, RenderedCard } from './types.js';
import { renderCalendarCard } from './calendar.js';
import { renderDefaultCard } from './default.js';

export function renderCard(ctx: CardRenderContext): RenderedCard {
  switch (ctx.event.event.kind) {
    case 31922:
    case 31923:
      return renderCalendarCard(ctx);
    default:
      return renderDefaultCard(ctx);
  }
}

