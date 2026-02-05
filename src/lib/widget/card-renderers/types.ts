import type { ParsedEvent, ProfileMetadata, WidgetConfig } from '../../nostr/types.js';

export interface CardRenderContext {
  event: ParsedEvent;
  config: WidgetConfig;
  typeLabel: string;
  title: string;
  summary: string;
  imageUrl: string | null;
  href: string | null;
  tags: string[];
  author?: ProfileMetadata;
  authorName: string | null;
  authorPicture: string | null;
  profileByPubkey?: (pubkey: string) => ProfileMetadata | undefined;
  calendarLocationUrl?: string | null;
  calendarLocationText?: string | null;
}

export interface RenderedCard {
  cardClassName?: string;
  html: string;
}
