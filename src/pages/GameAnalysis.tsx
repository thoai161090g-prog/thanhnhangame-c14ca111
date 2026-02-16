import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { validMd5, GAMES } from "@/lib/md5-analyzer";
import { useToast } from "@/hooks/use-toast";
import { Fireworks } from "@/components/Fireworks";

interface AnalysisResult {
  tai: number;
  xiu: number;
  confidence: number;
  result: string;
}

interface HistoryItem {
  md5: string;
  result: string;
  tai: number;
}

function LanternDecor() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Floating lanterns */}
      {[...Array(6)].map((_, i) => (
        <div key={`lantern-${i}`} className="absolute" style={{
          left: `${10 + i * 16}%`,
          top: `${-5 + Math.sin(i) * 8}%`,
          fontSize: `${24 + i * 4}px`,
          animation: `lanternSwing ${3 + i * 0.5}s ease-in-out infinite`,
          animationDelay: `${i * 0.3}s`,
          filter: "drop-shadow(0 0 8px rgba(255,50,0,0.6))",
        }}>🏮</div>
      ))}
      {/* Cherry blossoms */}
      {[...Array(18)].map((_, i) => (
        <div key={`petal-${i}`} className="absolute" style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          fontSize: `${10 + Math.random() * 12}px`,
          animation: `petalFall ${6 + Math.random() * 8}s linear infinite`,
          animationDelay: `${Math.random() * 6}s`,
          opacity: 0.5 + Math.random() * 0.3,
        }}>🌸</div>
      ))}
      {/* Gold coins */}
      {[...Array(5)].map((_, i) => (
        <div key={`coin-${i}`} className="absolute" style={{
          left: `${15 + i * 18}%`,
          bottom: `${5 + Math.random() * 10}%`,
          fontSize: "16px",
          animation: `coinFloat ${4 + i}s ease-in-out infinite`,
          animationDelay: `${i * 0.8}s`,
          opacity: 0.4,
        }}>🪙</div>
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
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showFireworks, setShowFireworks] = useState(false);

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

    const res = data as AnalysisResult;
    setResult(res);
    setPhase("done");
    setShowFireworks(true);
    setTimeout(() => setShowFireworks(false), 4000);
    setHistory((prev) => [{ md5, result: res.result, tai: res.tai }, ...prev].slice(0, 5));
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
      background: "radial-gradient(ellipse at 50% 0%, rgba(200,30,0,0.4) 0%, rgba(80,10,0,0.2) 40%, rgba(0,0,0,1) 80%)"
    }}>
      <LanternDecor />
      {showFireworks && <Fireworks />}

      {/* Decorative top border */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{
        background: "linear-gradient(90deg, transparent, #ffae00, #ff4500, #ffae00, transparent)"
      }} />

      {/* Header */}
      <header className="relative z-10 pt-5 pb-2 px-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-1 text-sm font-bold px-3 py-1.5 rounded-lg transition-all hover:scale-105" style={{
            color: "#ffae00",
            background: "rgba(255,174,0,0.1)",
            border: "1px solid rgba(255,174,0,0.2)",
          }}>
            ← Trang chủ
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-black tracking-wider" style={{
              background: "linear-gradient(135deg, #ffd700, #ffae00, #ff6a00)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              🧧 MD5 VIP PRO 🧧
            </h1>
          </div>
          <div className="w-20" />
        </div>
        <p className="text-center text-xs mt-1" style={{ color: "rgba(255,200,100,0.5)" }}>
          {game.icon} {game.name} • Engine AI VIP • @nhan161019
        </p>
      </header>

      <main className="relative z-10 max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Robot mascot */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full" style={{
              background: "radial-gradient(circle, rgba(255,174,0,0.3) 0%, transparent 70%)",
              filter: "blur(20px)",
              transform: "scale(1.5)",
            }} />
            <img
              src="/robot-vip.png"
              alt="VIP Robot"
              className="relative w-28 h-28 object-contain"
              style={{
                mixBlendMode: "screen",
                animation: "robotFloat 3s ease-in-out infinite",
                filter: "drop-shadow(0 0 15px rgba(255,174,0,0.4))",
              }}
            />
          </div>
        </div>

        {/* MD5 Input with golden dragon border */}
        <div className="rounded-2xl p-[2px] relative overflow-hidden" style={{
          background: "linear-gradient(135deg, #ffd700, #ff6a00, #ffd700, #ff6a00)",
          boxShadow: "0 0 25px rgba(255,174,0,0.3)",
        }}>
          <div className="absolute inset-0" style={{
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
            animation: "shimmer 3s ease-in-out infinite",
          }} />
          <input
            type="text"
            placeholder="🔮 Nhập mã MD5 (32 ký tự)..."
            value={md5Input}
            onChange={(e) => setMd5Input(e.target.value)}
            maxLength={32}
            className="w-full px-5 py-4 rounded-2xl text-center font-mono text-base tracking-widest relative z-10"
            style={{
              background: "rgba(10,5,0,0.95)",
              color: "#ffd700",
              outline: "none",
              border: "none",
              caretColor: "#ffae00",
            }}
          />
        </div>

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={phase === "countdown"}
          className="w-full py-4 rounded-2xl font-black text-xl tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 relative overflow-hidden"
          style={{
            background: phase === "countdown"
              ? "linear-gradient(135deg, #333, #555)"
              : "linear-gradient(135deg, #ff2200, #ff6a00, #ffd000, #ff6a00, #ff2200)",
            backgroundSize: "200% 100%",
            animation: phase !== "countdown" ? "gradientShift 3s ease infinite" : "none",
            color: "#fff",
            boxShadow: phase !== "countdown" ? "0 4px 30px rgba(255,80,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)" : "none",
            textShadow: "0 2px 4px rgba(0,0,0,0.5)",
          }}
        >
          {phase === "countdown" ? "⏳ ĐANG PHÂN TÍCH..." : "🐉 PHÂN TÍCH VIP 🐉"}
        </button>

        {!hasValidKey && (
          <div className="text-center rounded-xl py-2 px-4" style={{
            background: "rgba(255,0,0,0.1)",
            border: "1px solid rgba(255,0,0,0.3)",
          }}>
            <p className="text-xs" style={{ color: "#ff6a6a" }}>
              ⚠️ Bạn cần mua key.{" "}
              <button onClick={() => navigate("/buy-key")} className="underline font-bold" style={{ color: "#ffae00" }}>Mua ngay</button>
            </p>
          </div>
        )}

        {/* Countdown */}
        {phase === "countdown" && (
          <div className="flex flex-col items-center py-8 space-y-4" style={{ animation: "fadeIn 0.4s ease-out" }}>
            <div className="relative">
              {/* Outer ring */}
              <div className="w-28 h-28 rounded-full flex items-center justify-center" style={{
                border: "3px solid transparent",
                backgroundImage: "linear-gradient(rgba(10,5,0,0.9), rgba(10,5,0,0.9)), linear-gradient(135deg, #ffd700, #ff4500, #ffd700)",
                backgroundOrigin: "border-box",
                backgroundClip: "padding-box, border-box",
                boxShadow: "0 0 40px rgba(255,174,0,0.4), 0 0 80px rgba(255,70,0,0.2)",
                animation: "pulse 1.5s ease-in-out infinite",
              }}>
                <span className="text-6xl font-black" style={{
                  background: "linear-gradient(135deg, #ffd700, #ff4500)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 0 10px rgba(255,174,0,0.5))",
                }} key={countdown}>
                  {countdown}
                </span>
              </div>
              {/* Spinning ring */}
              <div className="absolute inset-[-4px] rounded-full" style={{
                border: "2px dashed rgba(255,174,0,0.3)",
                animation: "spin 3s linear infinite",
              }} />
            </div>
            <p className="text-sm font-bold animate-pulse" style={{ color: "rgba(255,200,100,0.7)" }}>
              🐉 Engine AI VIP đang xử lý...
            </p>
          </div>
        )}

        {/* Result */}
        {phase === "done" && result && (
          <div className="space-y-4" style={{ animation: "resultReveal 0.8s ease-out" }}>
            {/* Main Result Card */}
            <div className="rounded-2xl p-[2px] relative" style={{
              background: result.result === "Tài"
                ? "linear-gradient(135deg, #ff2200, #ffd700, #ff2200)"
                : "linear-gradient(135deg, #0066ff, #00ddff, #0066ff)",
              boxShadow: result.result === "Tài"
                ? "0 0 40px rgba(255,50,0,0.4)"
                : "0 0 40px rgba(0,150,255,0.4)",
            }}>
              <div className="rounded-2xl py-6 text-center" style={{
                background: "rgba(5,2,0,0.92)",
              }}>
                <div className="text-lg mb-1" style={{ color: "rgba(255,200,100,0.6)" }}>Kết quả phân tích</div>
                <span className="text-7xl font-black tracking-[0.2em] block" style={{
                  color: result.result === "Tài" ? "#ff3c00" : "#00c3ff",
                  textShadow: result.result === "Tài"
                    ? "0 0 30px rgba(255,60,0,0.6), 0 0 60px rgba(255,60,0,0.3)"
                    : "0 0 30px rgba(0,195,255,0.6), 0 0 60px rgba(0,195,255,0.3)",
                  animation: "resultGlow 2s ease-in-out infinite alternate",
                }}>
                  {result.result === "Tài" ? "🔥 TÀI" : "💎 XỈU"}
                </span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl p-3 text-center" style={{
                background: "rgba(255,60,0,0.1)",
                border: "1px solid rgba(255,60,0,0.3)",
              }}>
                <div className="text-[10px] font-bold mb-1" style={{ color: "rgba(255,60,0,0.7)" }}>TÀI</div>
                <div className="text-xl font-black" style={{ color: "#ff3c00" }}>{result.tai}%</div>
              </div>
              <div className="rounded-xl p-3 text-center" style={{
                background: "rgba(0,255,136,0.08)",
                border: "1px solid rgba(0,255,136,0.3)",
              }}>
                <div className="text-[10px] font-bold mb-1" style={{ color: "rgba(0,255,136,0.7)" }}>ĐỘ TIN CẬY</div>
                <div className="text-xl font-black" style={{
                  color: "#00ff88",
                  textShadow: "0 0 10px rgba(0,255,136,0.4)",
                }}>{result.confidence}%</div>
              </div>
              <div className="rounded-xl p-3 text-center" style={{
                background: "rgba(0,195,255,0.1)",
                border: "1px solid rgba(0,195,255,0.3)",
              }}>
                <div className="text-[10px] font-bold mb-1" style={{ color: "rgba(0,195,255,0.7)" }}>XỈU</div>
                <div className="text-xl font-black" style={{ color: "#00c3ff" }}>{result.xiu}%</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="h-4 rounded-full overflow-hidden flex relative" style={{
                background: "rgba(255,255,255,0.05)",
                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)",
              }}>
                <div className="h-full rounded-l-full transition-all duration-1000 relative" style={{
                  width: `${result.tai}%`,
                  background: "linear-gradient(90deg, #ff2200, #ff6a00, #ffae00)",
                  boxShadow: "0 0 12px #ff3c00",
                }}>
                  <div className="absolute inset-0 rounded-l-full" style={{
                    background: "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%)",
                  }} />
                </div>
                <div className="h-full rounded-r-full transition-all duration-1000 relative" style={{
                  width: `${result.xiu}%`,
                  background: "linear-gradient(90deg, #0066ff, #00aaff, #00ddff)",
                  boxShadow: "0 0 12px #00aaff",
                }}>
                  <div className="absolute inset-0 rounded-r-full" style={{
                    background: "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%)",
                  }} />
                </div>
              </div>
            </div>

            {/* Feedback buttons */}
            <div className="flex gap-3">
              <button className="flex-1 py-3 rounded-xl font-black text-base tracking-wider text-white transition-all hover:scale-105 active:scale-95 relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #0d7a2e, #1db954)",
                  border: "1px solid rgba(29,185,84,0.4)",
                  boxShadow: "0 4px 15px rgba(29,185,84,0.3)",
                }}>
                ✅ ĐÚNG
              </button>
              <button className="flex-1 py-3 rounded-xl font-black text-base tracking-wider text-white transition-all hover:scale-105 active:scale-95 relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #8b1a1a, #dc2626)",
                  border: "1px solid rgba(220,38,38,0.4)",
                  boxShadow: "0 4px 15px rgba(220,38,38,0.3)",
                }}>
                ❌ SAI
              </button>
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <span className="text-xs font-bold" style={{ color: "rgba(255,200,100,0.6)" }}>📜 Lịch sử phiên</span>
                  <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{history.length}/5</span>
                </div>
                {history.map((h, i) => (
                  <div key={i} className="flex justify-between items-center px-3 py-2 rounded-lg transition-all hover:scale-[1.01]" style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,174,0,0.1)",
                  }}>
                    <span className="text-xs font-mono truncate max-w-[180px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {h.md5.slice(0, 16)}...
                    </span>
                    <span className="text-sm font-black" style={{
                      color: h.result === "Tài" ? "#ff3c00" : "#00c3ff",
                      textShadow: h.result === "Tài" ? "0 0 5px rgba(255,60,0,0.3)" : "0 0 5px rgba(0,195,255,0.3)",
                    }}>
                      {h.result === "Tài" ? "🔥 TÀI" : "💎 XỈU"} ({h.tai}%)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-4 space-y-1">
        <p className="text-xs font-bold" style={{ color: "rgba(255,174,0,0.4)" }}>
          🧧 MD5 VIP PRO • Phân Tích AI Thông Minh 🧧
        </p>
        <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>
          Admin: <a href="https://t.me/nhan161019" target="_blank" className="hover:underline" style={{ color: "rgba(255,174,0,0.4)" }}>@nhan161019</a>
        </p>
      </footer>

      <style>{`
        @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
        @keyframes lanternSwing {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
        @keyframes petalFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.4; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
        @keyframes coinFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes robotFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes shimmer {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes resultReveal {
          0% { opacity: 0; transform: translateY(20px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes resultGlow {
          0% { filter: brightness(1); }
          100% { filter: brightness(1.3); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
