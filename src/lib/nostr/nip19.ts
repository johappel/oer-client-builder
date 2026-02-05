const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const GENERATOR = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
const BECH32_CONST = 1;
const BECH32M_CONST = 0x2bc830a3;

function polymod(values: number[]): number {
  let chk = 1;
  for (const value of values) {
    const top = chk >>> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ value;
    for (let i = 0; i < 5; i++) {
      if (((top >>> i) & 1) === 1) chk ^= GENERATOR[i];
    }
  }
  return chk;
}

function hrpExpand(hrp: string): number[] {
  const ret: number[] = [];
  for (let i = 0; i < hrp.length; i++) ret.push(hrp.charCodeAt(i) >>> 5);
  ret.push(0);
  for (let i = 0; i < hrp.length; i++) ret.push(hrp.charCodeAt(i) & 31);
  return ret;
}

function verifyChecksum(hrp: string, data: number[]): 'bech32' | 'bech32m' | null {
  const check = polymod([...hrpExpand(hrp), ...data]);
  if (check === BECH32_CONST) return 'bech32';
  if (check === BECH32M_CONST) return 'bech32m';
  return null;
}

function decodeBech32(input: string): { hrp: string; data: number[] } | null {
  const str = input.trim();
  if (str.length < 8) return null;

  // Reject mixed case
  const lower = str.toLowerCase();
  const upper = str.toUpperCase();
  if (str !== lower && str !== upper) return null;

  const s = lower;
  const pos = s.lastIndexOf('1');
  if (pos < 1 || pos + 7 > s.length) return null;

  const hrp = s.slice(0, pos);
  const dataPart = s.slice(pos + 1);
  const data: number[] = [];

  for (let i = 0; i < dataPart.length; i++) {
    const c = dataPart[i];
    const v = CHARSET.indexOf(c);
    if (v === -1) return null;
    data.push(v);
  }

  if (!verifyChecksum(hrp, data)) return null;
  return { hrp, data: data.slice(0, -6) };
}

function createChecksum(hrp: string, data: number[], spec: 'bech32' | 'bech32m'): number[] {
  const constVal = spec === 'bech32m' ? BECH32M_CONST : BECH32_CONST;
  const values = [...hrpExpand(hrp), ...data, 0, 0, 0, 0, 0, 0];
  const mod = polymod(values) ^ constVal;
  const ret: number[] = [];
  for (let p = 0; p < 6; p++) ret.push((mod >>> (5 * (5 - p))) & 31);
  return ret;
}

function encodeBech32(hrp: string, data: number[], spec: 'bech32' | 'bech32m' = 'bech32'): string {
  const checksum = createChecksum(hrp, data, spec);
  const combined = [...data, ...checksum];
  let out = `${hrp}1`;
  for (const v of combined) out += CHARSET[v];
  return out;
}

function convertBits(data: number[], from: number, to: number, pad: boolean): number[] | null {
  let acc = 0;
  let bits = 0;
  const ret: number[] = [];
  const maxv = (1 << to) - 1;

  for (const value of data) {
    if (value < 0 || value >> from !== 0) return null;
    acc = (acc << from) | value;
    bits += from;
    while (bits >= to) {
      bits -= to;
      ret.push((acc >> bits) & maxv);
    }
  }

  if (pad) {
    if (bits > 0) ret.push((acc << (to - bits)) & maxv);
  } else {
    if (bits >= from) return null;
    if (((acc << (to - bits)) & maxv) !== 0) return null;
  }

  return ret;
}

function bytesToHex(bytes: number[]): string {
  return bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): number[] | null {
  const s = hex.trim().toLowerCase().startsWith('0x') ? hex.trim().slice(2) : hex.trim();
  if (s.length % 2 !== 0) return null;
  if (!/^[0-9a-f]*$/.test(s)) return null;
  const bytes: number[] = [];
  for (let i = 0; i < s.length; i += 2) {
    bytes.push(parseInt(s.slice(i, i + 2), 16));
  }
  return bytes;
}

function utf8ToBytes(input: string): number[] {
  return Array.from(new TextEncoder().encode(input));
}

function uint32ToBytesBE(value: number): number[] {
  const v = value >>> 0;
  return [(v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff];
}

export function isHexPubkey(input: string): boolean {
  const s = input.trim().toLowerCase();
  return /^[0-9a-f]{64}$/.test(s);
}

export function isHexId32(input: string): boolean {
  const s = input.trim().toLowerCase();
  return /^[0-9a-f]{64}$/.test(s);
}

export function npubToHex(npub: string): string | null {
  const decoded = decodeBech32(npub);
  if (!decoded || decoded.hrp !== 'npub') return null;
  const bytes = convertBits(decoded.data, 5, 8, false);
  if (!bytes || bytes.length !== 32) return null;
  return bytesToHex(bytes);
}

function encodeTlv(entries: Array<{ type: number; value: number[] }>): number[] {
  const out: number[] = [];
  for (const { type, value } of entries) {
    if (value.length > 255) {
      throw new Error(`TLV value too long (type ${type}): ${value.length}`);
    }
    out.push(type, value.length, ...value);
  }
  return out;
}

export function encodeNprofile(pubkeyHex: string, relays: string[] = []): string {
  if (!isHexPubkey(pubkeyHex)) throw new Error('encodeNprofile: invalid pubkey hex');
  const pk = hexToBytes(pubkeyHex);
  if (!pk || pk.length !== 32) throw new Error('encodeNprofile: invalid pubkey bytes');

  const entries: Array<{ type: number; value: number[] }> = [{ type: 0, value: pk }];
  for (const relay of relays) entries.push({ type: 1, value: utf8ToBytes(relay) });

  const tlv = encodeTlv(entries);
  const words = convertBits(tlv, 8, 5, true);
  if (!words) throw new Error('encodeNprofile: convertBits failed');
  return encodeBech32('nprofile', words, 'bech32');
}

export function encodeNevent(eventIdHex: string, relays: string[] = []): string {
  if (!isHexId32(eventIdHex)) throw new Error('encodeNevent: invalid event id hex');
  const id = hexToBytes(eventIdHex);
  if (!id || id.length !== 32) throw new Error('encodeNevent: invalid event id bytes');

  const entries: Array<{ type: number; value: number[] }> = [{ type: 0, value: id }];
  for (const relay of relays) entries.push({ type: 1, value: utf8ToBytes(relay) });

  const tlv = encodeTlv(entries);
  const words = convertBits(tlv, 8, 5, true);
  if (!words) throw new Error('encodeNevent: convertBits failed');
  return encodeBech32('nevent', words, 'bech32');
}

export function encodeNaddr(kind: number, pubkeyHex: string, identifier: string, relays: string[] = []): string {
  if (!Number.isInteger(kind) || kind < 0) throw new Error('encodeNaddr: invalid kind');
  if (!isHexPubkey(pubkeyHex)) throw new Error('encodeNaddr: invalid pubkey hex');
  const pk = hexToBytes(pubkeyHex);
  if (!pk || pk.length !== 32) throw new Error('encodeNaddr: invalid pubkey bytes');

  const entries: Array<{ type: number; value: number[] }> = [
    { type: 0, value: utf8ToBytes(identifier) },
    { type: 2, value: pk },
    { type: 3, value: uint32ToBytesBE(kind) }
  ];

  for (const relay of relays) entries.push({ type: 1, value: utf8ToBytes(relay) });

  const tlv = encodeTlv(entries);
  const words = convertBits(tlv, 8, 5, true);
  if (!words) throw new Error('encodeNaddr: convertBits failed');
  return encodeBech32('naddr', words, 'bech32');
}

export function decodeNaddrKind(input: string): number | null {
  const raw = input.trim();
  const s = raw.toLowerCase().startsWith('nostr:') ? raw.slice('nostr:'.length).trim() : raw;
  if (!s.toLowerCase().startsWith('naddr1')) return null;

  const decoded = decodeBech32(s);
  if (!decoded || decoded.hrp !== 'naddr') return null;
  const bytes = convertBits(decoded.data, 5, 8, false);
  if (!bytes) return null;

  // TLV parse: [type, len, ...value] repeated
  let i = 0;
  while (i + 2 <= bytes.length) {
    const t = bytes[i];
    const len = bytes[i + 1];
    i += 2;
    if (i + len > bytes.length) return null;
    const value = bytes.slice(i, i + len);
    i += len;

    // Kind (type 3) is 4 bytes big-endian uint32
    if (t === 3 && len === 4) {
      const kind = ((value[0] << 24) | (value[1] << 16) | (value[2] << 8) | value[3]) >>> 0;
      return kind;
    }
  }

  return null;
}

/**
 * Accepts either a 64-char hex pubkey or an `npub1...` and returns hex pubkey.
 */
export function normalizePubkey(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  const hex = s.toLowerCase().startsWith('0x') ? s.slice(2) : s;
  if (isHexPubkey(hex)) return hex.toLowerCase();
  if (hex.toLowerCase().startsWith('npub1')) return npubToHex(hex);
  return null;
}

export function safeNostrUri(uri: string): string | null {
  const s = uri.trim();
  if (!s) return null;
  if (s.toLowerCase().startsWith('nostr:')) return s;
  return null;
}
