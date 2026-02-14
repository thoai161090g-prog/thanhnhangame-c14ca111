import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { validMd5, GAMES } from "@/lib/md5-analyzer";
import { useToast } from "@/hooks/use-toast";

interface AnalysisResult {
  tai: number;
  xiu: number;
  confidence: number;
  result: string;
}

function GoldParticles() {
  const particles = Array.from({ length: 20 });
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${2 + Math.random() * 3}px`,
            height: `${2 + Math.random() * 3}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: `hsl(45, 100%, ${50 + Math.random() * 30}%)`,
            boxShadow: `0 0 6px hsl(45, 100%, 60%)`,
            animation: `particleFloat ${3 + Math.random() * 4}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 3}s`,
            opacity: 0.4 + Math.random() * 0.4,
          }}
        />
      ))}
    </div>
  );
}

export default function GameAnalysis() {
  const { gameId } = useParams<{ gameId: string }>();
  const { user, hasValidKey } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [md5Input, setMd5Input] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [phase, setPhase] = useState<"idle" | "countdown" | "done">("idle");
  const [countdown, setCountdown] = useState(3);

  const game = GAMES.find((g) => g.id === gameId);

  const runCountdown = useCallback(async (md5: string) => {
    setPhase("countdown");
    setResult(null);
    for (let i = 3; i >= 1; i--) {
      setCountdown(i);
      await new Promise((r) => setTimeout(r, 1000));
    }

    const { data, error } = await supabase.functions.invoke("analyze-md5", {
      body: { md5, game: game?.name || "Unknown" },
    });

    if (error || data?.error) {
      toast({ title: "Lỗi", description: data?.error || error?.message || "Lỗi phân tích", variant: "destructive" });
      setPhase("idle");
      return;
    }

    setResult(data as AnalysisResult);
    setPhase("done");
  }, [game, toast]);

  const handleAnalyze = () => {
    if (!validMd5(md5Input)) {
      toast({ title: "Lỗi", description: "Mã MD5 không hợp lệ! Cần 32 ký tự hex.", variant: "destructive" });
      return;
    }
    if (!hasValidKey) {
      toast({ title: "Cần Key", description: "Bạn cần mua key để sử dụng.", variant: "destructive" });
      navigate("/buy-key");
      return;
    }
    runCountdown(md5Input);
  };

  if (!game) return <div className="min-h-screen flex items-center justify-center text-foreground">Game không tồn tại</div>;

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      background: "radial-gradient(circle at 50% 40%, rgba(180,30,0,0.35) 0%, rgba(0,0,0,1) 70%)"
    }}>
      {/* Background glow pulse */}
      <div className="absolute inset-0 pointer-events-none z-0" style={{
        background: "radial-gradient(circle at 50% 50%, rgba(255,170,0,0.12) 0%, rgba(0,0,0,0) 60%)",
        animation: "bgPulse 3s ease-in-out infinite"
      }} />

      <GoldParticles />

      {/* Header */}
      <header className="relative z-10 py-3 px-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button onClick={() => navigate("/")} className="text-gold text-sm font-bold">← Trang chủ</button>
          <h1 className="text-lg font-black tracking-wider" style={{
            background: "linear-gradient(135deg, #ffae00, #ff6a00)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            {game.icon} MD5 VIP
          </h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="relative z-10 max-w-lg mx-auto px-4 py-4 space-y-5">
        {/* Title */}
        <div className="text-center">
          <p className="text-xs tracking-[0.3em] text-gold/70 uppercase">✨ Tool Phân Tích Chuẩn Xác Nhất ✨</p>
        </div>

        {/* Input Card */}
        <div className="rounded-2xl p-[2px]" style={{
          background: "linear-gradient(135deg, #ffae00, #ff6a00, #ffae00)"
        }}>
          <div className="rounded-2xl p-5 space-y-4" style={{ background: "rgba(15,10,5,0.95)" }}>
            <h2 className="text-center text-gold font-bold text-base">Nhập mã MD5 phân tích</h2>
            <input
              type="text"
              placeholder="Nhập mã MD5 (32 ký tự)..."
              value={md5Input}
              onChange={(e) => setMd5Input(e.target.value)}
              maxLength={32}
              className="w-full px-4 py-3 rounded-xl text-center font-mono text-sm tracking-wide"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,174,0,0.3)",
                color: "#eee",
                outline: "none",
              }}
            />
            <button
              onClick={handleAnalyze}
              disabled={phase === "countdown"}
              className="w-full py-4 rounded-xl font-black text-lg tracking-wider transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #ff8c00, #ffae00, #ffd000)",
                color: "#1a0a00",
                boxShadow: "0 4px 20px rgba(255,174,0,0.5)",
              }}
            >
              {phase === "countdown" ? "⏳ Đang phân tích..." : "🎯 PHÂN TÍCH"}
            </button>
            {!hasValidKey && (
              <p className="text-center text-xs" style={{ color: "#ff6a6a" }}>
                ⚠️ Bạn cần mua key.{" "}
                <button onClick={() => navigate("/buy-key")} className="text-gold underline">Mua ngay</button>
              </p>
            )}
          </div>
        </div>

        {/* Countdown */}
        {phase === "countdown" && (
          <div className="flex flex-col items-center py-10 space-y-6" style={{ animation: "fadeIn 0.4s ease-out" }}>
            <div className="relative">
              <div className="w-28 h-28 rounded-full flex items-center justify-center" style={{
                border: "3px solid #ffae00",
                boxShadow: "0 0 30px rgba(255,174,0,0.5), inset 0 0 20px rgba(255,174,0,0.1)",
                animation: "pulse 1.5s ease-in-out infinite"
              }}>
                <span className="text-5xl font-black text-gold" key={countdown} style={{ animation: "countPop 0.5s ease-out" }}>
                  {countdown}
                </span>
              </div>
            </div>
            <p className="text-gold/70 text-sm animate-pulse">🔄 Đang phân tích mã MD5...</p>
          </div>
        )}

        {/* Result Section */}
        {phase === "done" && result && (
          <div className="space-y-5" style={{ animation: "fadeIn 0.6s ease-out" }}>
            {/* Robot + Speech Bubble */}
            <div className="relative flex flex-col items-center">
              {/* Speech bubble */}
              <div className="relative mb-3 px-6 py-3 text-center" style={{
                border: "2px solid #ffae00",
                borderRadius: "25px",
                boxShadow: "0 0 20px rgba(255,174,0,0.5)",
                background: "rgba(20,10,0,0.9)",
                animation: "resultReveal 0.6s ease-out",
              }}>
                <p className="text-gold font-black text-lg tracking-wide">CHỦ NHÂN HÃY ĐÁNH</p>
                {/* Triangle pointer */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0"
                  style={{
                    borderLeft: "12px solid transparent",
                    borderRight: "12px solid transparent",
                    borderTop: "12px solid #ffae00",
                  }}
                />
              </div>

              {/* Robot */}
              <div className="relative" style={{ animation: "float 3s ease-in-out infinite" }}>
                <img src="/robot-vip.png" alt="Robot VIP" className="w-48 h-48 object-contain drop-shadow-2xl" style={{ mixBlendMode: "screen" }} />
              </div>

              {/* Robot platform */}
              <div className="mt-[-10px]" style={{
                width: "160px",
                height: "30px",
                borderRadius: "50%",
                background: "radial-gradient(circle, #ffae00, #ff6a00)",
                boxShadow: "0 0 40px #ffae00, 0 0 80px rgba(255,174,0,0.3)",
              }} />

              {/* Tai / Xiu buttons on sides */}
              <div className="flex items-center justify-center gap-8 mt-4 w-full" style={{ animation: "resultBounce 0.8s ease-out" }}>
                <div className={`px-8 py-3 rounded-[20px] font-black text-xl tracking-widest text-white transition-transform hover:scale-105 cursor-default ${result.result === "Tài" ? "ring-2 ring-white/50" : ""}`}
                  style={{
                    background: "linear-gradient(135deg, #ff3c00, #ff0000)",
                    boxShadow: result.result === "Tài" ? "0 0 30px #ff0000, 0 0 60px rgba(255,0,0,0.3)" : "0 0 20px rgba(255,0,0,0.4)",
                    transform: result.result === "Tài" ? "scale(1.1)" : "scale(1)",
                  }}>
                  TÀI
                </div>
                <div className={`px-8 py-3 rounded-[20px] font-black text-xl tracking-widest text-white transition-transform hover:scale-105 cursor-default ${result.result === "Xỉu" ? "ring-2 ring-white/50" : ""}`}
                  style={{
                    background: "linear-gradient(135deg, #007bff, #00c3ff)",
                    boxShadow: result.result === "Xỉu" ? "0 0 30px #00c3ff, 0 0 60px rgba(0,195,255,0.3)" : "0 0 20px rgba(0,123,255,0.4)",
                    transform: result.result === "Xỉu" ? "scale(1.1)" : "scale(1)",
                  }}>
                  XỈU
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="rounded-2xl p-[2px]" style={{
              background: "linear-gradient(135deg, #ffae00, #ff6a00, #ffae00)",
              animation: "fadeSlideUp 0.6s ease-out 0.3s both",
            }}>
              <div className="rounded-2xl p-5 space-y-4" style={{ background: "rgba(10,5,0,0.95)" }}>
                {/* Percentage labels */}
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: "#ff0000" }} />
                    TÀI {result.tai}%
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: "#007bff" }} />
                    XỈU {result.xiu}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-4 rounded-full overflow-hidden flex" style={{
                  background: "rgba(255,255,255,0.1)",
                  boxShadow: "0 0 15px rgba(255,174,0,0.2)"
                }}>
                  <div className="h-full rounded-l-full transition-all duration-1000" style={{
                    width: `${result.tai}%`,
                    background: "linear-gradient(90deg, #ff3c00, #ff0000)",
                    boxShadow: "0 0 10px #ff0000",
                  }} />
                  <div className="h-full rounded-r-full transition-all duration-1000" style={{
                    width: `${result.xiu}%`,
                    background: "linear-gradient(90deg, #007bff, #00c3ff)",
                    boxShadow: "0 0 10px #00c3ff",
                  }} />
                </div>

                {/* Detail stats */}
                <div className="flex justify-center gap-6 text-sm font-bold text-foreground">
                  <span>📊 TÀI: <span style={{ color: "#ff3c00" }}>{result.tai}%</span></span>
                  <span className="text-gold/30">|</span>
                  <span>XỈU: <span style={{ color: "#00c3ff" }}>{result.xiu}%</span></span>
                </div>

                {/* Confidence */}
                <div className="text-center pt-2 border-t border-gold/20">
                  <span className="text-sm text-gold/70">⭐ ĐỘ TIN CẬY: </span>
                  <span className="text-3xl font-black" style={{
                    color: "#00ff88",
                    textShadow: "0 0 10px #00ff88, 0 0 30px rgba(0,255,136,0.3)",
                  }}>
                    {result.confidence}%
                  </span>
                  <span className="text-sm text-gold/70"> ⭐</span>
                </div>

                {/* MD5 */}
                <div className="text-[10px] text-center font-mono break-all text-gold/40 pt-1">
                  MD5: {md5Input}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes countPop {
          0% { transform: scale(1.8); opacity: 0; }
          50% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes resultReveal {
          0% { transform: scale(0.8) translateY(20px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes resultBounce {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.1); }
          70% { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeSlideUp {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }
        @keyframes bgPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes particleFloat {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          25% { transform: translateY(-20px) translateX(5px); opacity: 0.7; }
          50% { transform: translateY(-35px) translateX(-3px); opacity: 0.5; }
          75% { transform: translateY(-15px) translateX(8px); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
