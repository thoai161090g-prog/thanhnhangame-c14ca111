import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 10;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(userId) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW);
  if (recent.length >= RATE_LIMIT_MAX) return false;
  recent.push(now);
  rateLimitMap.set(userId, recent);
  return true;
}

// VIP Bit Mixing Function
function mixBits(x: number): number {
  x ^= (x >>> 16);
  x = Math.imul(x, 0x7feb352d) >>> 0;
  x ^= (x >>> 15);
  x = Math.imul(x, 0x846ca68b) >>> 0;
  x ^= (x >>> 16);
  return x;
}

// =============================================
// ALGORITHM 1: VIP (68GB) - XOR bit mixing
// =============================================
function analyzeMd5Vip(md5: string) {
  const lower = md5.toLowerCase();
  const a = parseInt(lower.slice(0, 8), 16) >>> 0;
  const b = parseInt(lower.slice(8, 16), 16) >>> 0;
  const c = parseInt(lower.slice(16, 24), 16) >>> 0;
  const d = parseInt(lower.slice(24, 32), 16) >>> 0;

  let mix = (a ^ b ^ c ^ d) >>> 0;
  mix = Math.imul(mix, 0x9E3779B1) >>> 0;
  mix = mixBits(mix);

  const normalized = mix / 0xffffffff;
  const rawPercent = normalized * 100;
  let tai = Math.round(rawPercent);
  if (tai < 1) tai = 1;
  if (tai > 99) tai = 99;
  const xiu = 100 - tai;
  const result = tai >= 50 ? "Tài" : "Xỉu";
  const confidence = result === "Tài" ? tai : xiu;
  return { tai, xiu, confidence, result };
}

// =============================================
// ALGORITHM 2: LC79 - last char method
// =============================================
function analyzeMd5Lc79(md5: string) {
  const lastChar = md5[31].toLowerCase();
  const taiChars = ['0', '2', '4', '6', '8', 'a', 'c', 'e'];
  const isTai = taiChars.includes(lastChar);

  const lower = md5.toLowerCase();
  const a = parseInt(lower.slice(0, 8), 16) >>> 0;
  const b = parseInt(lower.slice(8, 16), 16) >>> 0;
  let mix = (a ^ b) >>> 0;
  mix = mixBits(mix);
  const normalized = mix / 0xffffffff;
  let confidence = Math.round(55 + normalized * 40);
  if (confidence > 99) confidence = 99;
  if (confidence < 55) confidence = 55;

  const tai = isTai ? confidence : (100 - confidence);
  const xiu = 100 - tai;
  const result = isTai ? "Tài" : "Xỉu";
  return { tai, xiu, confidence, result };
}

// =============================================
// ALGORITHM 3: BetVIP - Multi-formula voting
// =============================================
function entropyHex(h: string): number {
  const freq: Record<string, number> = {};
  for (const c of h) freq[c] = (freq[c] || 0) + 1;
  const n = h.length;
  let ent = 0;
  for (const v of Object.values(freq)) {
    const p = v / n;
    ent -= p * Math.log2(p);
  }
  return ent;
}

function bitDensity(md5: string): number {
  let bits = 0;
  for (const c of md5) {
    const v = parseInt(c, 16);
    bits += ((v >> 0) & 1) + ((v >> 1) & 1) + ((v >> 2) & 1) + ((v >> 3) & 1);
  }
  return bits / 128;
}

function hexEnergy(md5: string): number {
  let s = 0;
  for (const c of md5) s += parseInt(c, 16);
  return s;
}

// Formula functions
function f2(md5: string): number {
  const a = parseInt(md5.slice(0, 8), 16) >>> 0;
  const b = parseInt(md5.slice(8, 16), 16) >>> 0;
  const c = parseInt(md5.slice(16, 24), 16) >>> 0;
  const d = parseInt(md5.slice(24, 32), 16) >>> 0;
  return (((a ^ b) + (c & d) - (a | d)) ^ ((b + c) << (a & 3))) >>> 0;
}

function f3(md5: string): number {
  const x = parseInt(md5.slice(0, 16), 16);
  const y = parseInt(md5.slice(16, 32), 16);
  return ((x * y + (x ^ y) + (x & y)) & 0xffffffff) >>> 0;
}

function f6(md5: string): number {
  return ((parseInt(md5.slice(0, 8), 16) + parseInt(md5.slice(8, 16), 16)) ^
    (parseInt(md5.slice(16, 24), 16) + parseInt(md5.slice(24, 32), 16))) >>> 0;
}

function f7(md5: string): number {
  let s = 0;
  for (const c of md5) { const v = parseInt(c, 16); s += v * v; }
  return s;
}

function f8(md5: string): number {
  let even = '', odd = '';
  for (let i = 0; i < 32; i++) {
    if (i % 2 === 0) even += md5[i]; else odd += md5[i];
  }
  return (parseInt(even, 16) ^ parseInt(odd, 16)) >>> 0;
}

function f10(md5: string): number {
  return (parseInt(md5.slice(0, 16), 16) + parseInt(md5.slice(16), 16)) >>> 0;
}

// Analysis functions
function oddEven(md5: string): number {
  let s = 0;
  for (const c of md5) s += parseInt(c, 16) % 2;
  return s - 16;
}

function runLen(md5: string): number {
  let r = 1, m = 1;
  for (let i = 1; i < 32; i++) {
    if (md5[i] === md5[i - 1]) { r++; m = Math.max(m, r); } else r = 1;
  }
  return m;
}

function gradient(md5: string): number {
  let s = 0;
  for (let i = 0; i < 31; i++) s += parseInt(md5[i + 1], 16) - parseInt(md5[i], 16);
  return s;
}

function byteXor(md5: string): number {
  let x = 0;
  for (let i = 0; i < 32; i += 2) x ^= parseInt(md5.slice(i, i + 2), 16);
  return x;
}

function mirrorXor(md5: string): number {
  return (parseInt(md5.slice(0, 16), 16) ^ parseInt(md5.slice(16), 16)) >>> 0;
}

function highLow(md5: string): number {
  let s = 0;
  for (const c of md5) if ("89abcdef".includes(c)) s++;
  return s - 16;
}

function primeSum(md5: string): number {
  const primes = new Set([2, 3, 5, 7, 11, 13]);
  let s = 0;
  for (const c of md5) { const v = parseInt(c, 16); if (primes.has(v)) s += v; }
  return s;
}

function blockBalance(md5: string): number {
  let a = 0, b = 0;
  for (let i = 0; i < 16; i++) a += parseInt(md5[i], 16);
  for (let i = 16; i < 32; i++) b += parseInt(md5[i], 16);
  return a - b;
}

function varianceHex(md5: string): number {
  const v: number[] = [];
  for (const c of md5) v.push(parseInt(c, 16));
  const m = v.reduce((a, b) => a + b, 0) / 32;
  return v.reduce((a, x) => a + (x - m) ** 2, 0) / 32;
}

function zigzag(md5: string): number {
  let s = 0;
  for (let i = 1; i < 32; i++) {
    const diff = parseInt(md5[i], 16) - parseInt(md5[i - 1], 16);
    if (diff * (i % 2 - 0.5) > 0) s++;
  }
  return s;
}

function voteBetVip(v: number): string {
  return Math.abs(Math.round(v)) % 2 === 0 ? "TÀI" : "XỈU";
}

function analyzeMd5BetVip(md5: string) {
  const lower = md5.toLowerCase();
  let tai = 0, xiu = 0;

  // Formula votes (weight 2)
  const formulas = [f2, f3, f6, f7, f8, f10];
  for (const f of formulas) {
    if (voteBetVip(f(lower)) === "TÀI") tai += 2; else xiu += 2;
  }

  // Analysis votes (weight 1)
  const algos = [
    entropyHex(lower) * 100,
    bitDensity(lower) * 100,
    hexEnergy(lower),
    oddEven(lower),
    runLen(lower),
    gradient(lower),
    byteXor(lower),
    mirrorXor(lower),
    highLow(lower),
    primeSum(lower),
    blockBalance(lower),
    varianceHex(lower),
    zigzag(lower),
  ];
  for (const a of algos) {
    if (voteBetVip(a) === "TÀI") tai += 1; else xiu += 1;
  }

  const total = tai + xiu;
  let taiPct = Math.round(tai / total * 100);
  if (taiPct < 1) taiPct = 1;
  if (taiPct > 99) taiPct = 99;
  const xiuPct = 100 - taiPct;
  const result = taiPct > xiuPct ? "Tài" : "Xỉu";
  const confidence = result === "Tài" ? taiPct : xiuPct;
  return { tai: taiPct, xiu: xiuPct, confidence, result };
}

// =============================================
// ALGORITHM 4: Dice-based (Thiên Đường, Sao789, TA28)
// =============================================
function analyzeMd5Dice(md5: string) {
  const lower = md5.toLowerCase();
  const x1 = parseInt(lower.slice(-6, -4), 16) % 6 + 1;
  const x2 = parseInt(lower.slice(-4, -2), 16) % 6 + 1;
  const x3 = parseInt(lower.slice(-2), 16) % 6 + 1;
  const tong = x1 + x2 + x3;

  let result: string;
  let confidence: number;

  if (tong === 3) {
    result = "Xỉu";
    confidence = 99;
  } else if (tong === 18) {
    result = "Tài";
    confidence = 99;
  } else if (tong >= 4 && tong <= 10) {
    result = "Xỉu";
    confidence = Math.round(60 + (10 - tong) * 3);
  } else {
    result = "Tài";
    confidence = Math.round(60 + (tong - 11) * 3);
  }

  if (confidence > 99) confidence = 99;
  if (confidence < 55) confidence = 55;

  const tai = result === "Tài" ? confidence : (100 - confidence);
  const xiu = 100 - tai;
  return { tai, xiu, confidence, result };
}

// =============================================
// ROUTER
// =============================================
function analyzeMd5(md5: string, game: string) {
  const g = game.toLowerCase();
  if (g.includes('lc79')) return analyzeMd5Lc79(md5);
  if (g.includes('betvip')) return analyzeMd5BetVip(md5);
  if (g.includes('68') || g.includes('game bài')) return analyzeMd5Vip(md5);
  // Thiên Đường, Sao 789, TA28 → dice-based
  return analyzeMd5Dice(md5);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!checkRateLimit(user.id)) {
      return new Response(JSON.stringify({ error: 'Quá nhiều yêu cầu. Vui lòng chờ 1 phút.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { md5, game } = await req.json();

    if (!md5 || typeof md5 !== 'string' || md5.length !== 32 || !/^[0-9a-fA-F]+$/.test(md5)) {
      return new Response(JSON.stringify({ error: 'MD5 không hợp lệ' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    const { data: hasKey } = await adminClient.rpc('has_valid_key', { _user_id: user.id });
    if (!hasKey) {
      return new Response(JSON.stringify({ error: 'Bạn cần mua key để sử dụng.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const analysis = analyzeMd5(md5, game || 'Unknown');

    await adminClient.from('analysis_history').insert({
      user_id: user.id,
      game: game || 'Unknown',
      md5_input: md5,
      result: analysis.result,
      tai_percent: analysis.tai,
      xiu_percent: analysis.xiu,
      confidence: analysis.confidence,
    });

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return new Response(JSON.stringify({ error: 'Lỗi server' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
