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

// VIP Core Algorithm
function analyzeMd5(md5: string) {
  const lower = md5.toLowerCase();

  // Split into 4 blocks of 8 hex chars
  const a = parseInt(lower.slice(0, 8), 16) >>> 0;
  const b = parseInt(lower.slice(8, 16), 16) >>> 0;
  const c = parseInt(lower.slice(16, 24), 16) >>> 0;
  const d = parseInt(lower.slice(24, 32), 16) >>> 0;

  // XOR mix
  let mix = (a ^ b ^ c ^ d) >>> 0;

  // Multiply by prime for entropy
  mix = Math.imul(mix, 0x9E3779B1) >>> 0; // 2654435761

  // Advanced bit mixing
  mix = mixBits(mix);

  // Normalize to 0–1
  const normalized = mix / 0xffffffff;

  // Convert to percentage and round to integer 1-100
  const rawPercent = normalized * 100;
  let tai = Math.round(rawPercent);
  if (tai < 1) tai = 1;
  if (tai > 99) tai = 99;
  const xiu = 100 - tai;

  const result = tai >= 50 ? "Tài" : "Xỉu";
  const confidence = result === "Tài" ? tai : xiu;

  return { tai, xiu, confidence, result };
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

    const analysis = analyzeMd5(md5);

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
