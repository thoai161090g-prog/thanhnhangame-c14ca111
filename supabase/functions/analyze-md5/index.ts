import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Rate limit: store last request timestamps per user
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // max 10 requests per minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(userId) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW);
  if (recent.length >= RATE_LIMIT_MAX) return false;
  recent.push(now);
  rateLimitMap.set(userId, recent);
  return true;
}

// Server-side MD5 analysis - algorithm hidden from client
function analyzeMd5(md5: string) {
  const x = BigInt("0x" + md5);
  const tai = Number(x % 100n);
  const xiu = 100 - tai;
  const confidence = Math.min(Math.abs(tai - xiu) + 50, 99);
  const result = tai >= 50 ? "Tài" : "Xỉu";
  return { tai, xiu, confidence, result };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify auth
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

    // Rate limit check
    if (!checkRateLimit(user.id)) {
      return new Response(JSON.stringify({ error: 'Quá nhiều yêu cầu. Vui lòng chờ 1 phút.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { md5, game } = await req.json();

    // Validate MD5 input
    if (!md5 || typeof md5 !== 'string' || md5.length !== 32 || !/^[0-9a-fA-F]+$/.test(md5)) {
      return new Response(JSON.stringify({ error: 'MD5 không hợp lệ' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check valid key server-side
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    const { data: hasKey } = await adminClient.rpc('has_valid_key', { _user_id: user.id });
    if (!hasKey) {
      return new Response(JSON.stringify({ error: 'Bạn cần mua key để sử dụng.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Run analysis
    const analysis = analyzeMd5(md5);

    // Save to history
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
