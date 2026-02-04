/**
 * Nostr Client
 * WebSocket-basierter Client für die Kommunikation mit Nostr Relays
 */

import type { NostrEvent, NostrFilter, NostrSubscription, NostrMessage } from './types.js';

export interface NostrClientConfig {
  relays: string[];
  debug?: boolean;
  onEvent?: (event: NostrEvent) => void;
  onNotice?: (notice: string) => void;
  onError?: (error: Error) => void;
  onConnect?: (relay: string) => void;
  onDisconnect?: (relay: string) => void;
}

export class NostrClient {
  private relays: Map<string, WebSocket> = new Map();
  private subscriptions: Map<string, NostrSubscription> = new Map();
  private config: NostrClientConfig;
  private eventCache: Set<string> = new Set();

  constructor(config: NostrClientConfig) {
    this.config = config;
  }

  /**
   * Verbindung zu allen Relays herstellen
   */
  connect(): void {
    console.log('[NostrClient] Connecting to relays:', this.config.relays);
    
    this.config.relays.forEach(relayUrl => {
      if (this.relays.has(relayUrl)) return;

      try {
        console.log('[NostrClient] Creating WebSocket for:', relayUrl);
        const ws = new WebSocket(relayUrl);
        
        ws.onopen = () => {
          console.log(`[NostrClient] Connected to ${relayUrl}`);
          this.flushSubscriptionsToRelay(relayUrl, ws);
          this.config.onConnect?.(relayUrl);
        };

        ws.onmessage = (event) => {
          this.handleMessage(relayUrl, event.data);
        };

        ws.onerror = (error) => {
          console.error(`[NostrClient] Error on ${relayUrl}:`, error);
          this.config.onError?.(new Error(`WebSocket error on ${relayUrl}`));
        };

        ws.onclose = (event) => {
          const closeDetails = { code: event.code, reason: event.reason, wasClean: event.wasClean };
          console.log(`[NostrClient] Disconnected from ${relayUrl}`, closeDetails);
          this.relays.delete(relayUrl);
          this.config.onDisconnect?.(relayUrl);
        };

        this.relays.set(relayUrl, ws);
      } catch (error) {
        console.error(`[NostrClient] Failed to connect to ${relayUrl}:`, error);
        this.config.onError?.(error as Error);
      }
    });
  }

  /**
   * Verbindung zu allen Relays trennen
   */
  disconnect(): void {
    this.relays.forEach((ws, relayUrl) => {
      ws.close();
    });
    this.relays.clear();
  }

  /**
   * Subscription erstellen
   */
  subscribe(subscriptionId: string, filters: NostrFilter[]): void {
    const subscription: NostrSubscription = {
      id: subscriptionId,
      filters
    };
    
    this.subscriptions.set(subscriptionId, subscription);

    // An alle Relays senden
    this.relays.forEach((ws, relayUrl) => {
      this.sendReqIfOpen(relayUrl, ws, subscriptionId, filters);
    });
  }

  /**
   * Subscription beenden
   */
  unsubscribe(subscriptionId: string): void {
    this.subscriptions.delete(subscriptionId);

    this.relays.forEach((ws, relayUrl) => {
      if (ws.readyState === WebSocket.OPEN) {
        this.send(relayUrl, ws, ['CLOSE', subscriptionId]);
      }
    });
  }

  /**
   * Alle Subscriptions beenden
   */
  unsubscribeAll(): void {
    this.subscriptions.forEach((_, subscriptionId) => {
      this.unsubscribe(subscriptionId);
    });
  }

  /**
   * Nachricht von Relay verarbeiten
   */
  private handleMessage(relayUrl: string, data: string): void {
    try {
      const message = JSON.parse(data) as [string, ...any[]];
      const type = message[0] as NostrMessage['type'];

      switch (type) {
        case 'EVENT': {
          const [, subscriptionId, event] = message;
          if (event && !this.eventCache.has(event.id)) {
            this.eventCache.add(event.id);
            this.config.onEvent?.(event);
          }
          break;
        }
        case 'EOSE': {
          // End of Stored Events
          console.log(`[NostrClient] EOSE received from ${relayUrl}`);
          break;
        }
        case 'NOTICE': {
          const [, notice] = message;
          console.log(`[NostrClient] Notice from ${relayUrl}:`, notice);
          this.config.onNotice?.(notice);
          break;
        }
        case 'OK': {
          const [, eventId, accepted, okMessage] = message;
          console.log(`[NostrClient] OK from ${relayUrl}:`, { eventId, accepted, message: okMessage });
          break;
        }
        case 'CLOSED': {
          const [, subscriptionId, closedMessage] = message;
          console.log(`[NostrClient] CLOSED from ${relayUrl}:`, { subscriptionId, message: closedMessage });
          break;
        }
        default:
          console.warn(`[NostrClient] Unknown message type from ${relayUrl}:`, type);
      }
    } catch (error) {
      console.error(`[NostrClient] Failed to parse message from ${relayUrl}:`, error);
    }
  }

  private flushSubscriptionsToRelay(relayUrl: string, ws: WebSocket): void {
    this.subscriptions.forEach((sub) => {
      this.sendReqIfOpen(relayUrl, ws, sub.id, sub.filters);
    });
  }

  private sendReqIfOpen(relayUrl: string, ws: WebSocket, subscriptionId: string, filters: NostrFilter[]): void {
    if (ws.readyState !== WebSocket.OPEN) return;
    this.send(relayUrl, ws, ['REQ', subscriptionId, ...filters]);
  }

  private send(relayUrl: string, ws: WebSocket, message: unknown): void {
    try {
      if (this.config.debug) {
        console.debug('[NostrClient] ->', relayUrl, message);
      }
      ws.send(JSON.stringify(message));
    } catch (error) {
      console.error(`[NostrClient] Failed to send message to ${relayUrl}:`, error);
      this.config.onError?.(error as Error);
    }
  }

  /**
   * Prüfen, ob mit mindestens einem Relay verbunden ist
   */
  isConnected(): boolean {
    return Array.from(this.relays.values()).some(
      ws => ws.readyState === WebSocket.OPEN
    );
  }

  /**
   * Anzahl der verbundenen Relays
   */
  getConnectedRelayCount(): number {
    return Array.from(this.relays.values()).filter(
      ws => ws.readyState === WebSocket.OPEN
    ).length;
  }

  /**
   * Cache leeren
   */
  clearCache(): void {
    this.eventCache.clear();
  }
}
