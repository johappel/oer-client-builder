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

export function isHexPubkey(input: string): boolean {
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

