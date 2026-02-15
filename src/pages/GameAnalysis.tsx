import { useState, useCallback } from "react";
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

interface HistoryItem {
  md5: string;
  result: string;
  tai: number;
}

// Cherry blossom petals floating
function CherryBlossoms() {
  const petals = Array.from({ length: 12 });
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {petals.map((_, i) => (
        <div
          key={i}
          className="absolute text-pink-300/60"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            fontSize: `${12 + Math.random() * 14}px`,
            animation: `petalFloat ${5 + Math.random() * 6}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        >
          🌸
        </div>
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
      background: "radial-gradient(circle at 50% 30%, rgba(180,30,0,0.3) 0%, rgba(0,0,0,1) 70%)"
    }}>
      <CherryBlossoms />

      {/* Header */}
      <header className="relative z-10 pt-6 pb-2 px-4 text-center">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate("/")} className="absolute left-4 top-6 text-sm font-bold" style={{ color: "#ffae00" }}>← Trang chủ</button>
          <h1 className="text-4xl font-black" style={{
            background: "linear-gradient(135deg, #ffae00, #ff6a00)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            🌸 MD5 🧧
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
            Kết nối engine AI phân tích xác suất thông minh
          </p>
        </div>
      </header>

      <main className="relative z-10 max-w-lg mx-auto px-4 py-4 space-y-5">
        {/* MD5 Input */}
        <div className="rounded-xl p-[2px]" style={{ background: "linear-gradient(135deg, #ffae00, #ffd000)" }}>
          <input
            type="text"
            placeholder="Nhập mã MD5 (32 ký tự)..."
            value={md5Input}
            onChange={(e) => setMd5Input(e.target.value)}
            maxLength={32}
            className="w-full px-4 py-4 rounded-xl text-center font-mono text-base tracking-wide"
            style={{
              background: "rgba(20,10,5,0.95)",
              color: "#eee",
              outline: "none",
              border: "none",
            }}
          />
        </div>

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={phase === "countdown"}
          className="w-full py-4 rounded-xl font-black text-xl tracking-wider transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
          style={{
            background: "linear-gradient(135deg, #ff4500, #ff8c00, #ffd000)",
            color: "#fff",
            boxShadow: "0 4px 25px rgba(255,100,0,0.5)",
            textShadow: "0 1px 3px rgba(0,0,0,0.3)",
          }}
        >
          {phase === "countdown" ? "⏳ Đang phân tích..." : "🎯 PHÂN TÍCH"}
        </button>

        {!hasValidKey && (
          <p className="text-center text-xs" style={{ color: "#ff6a6a" }}>
            ⚠️ Bạn cần mua key.{" "}
            <button onClick={() => navigate("/buy-key")} className="underline" style={{ color: "#ffae00" }}>Mua ngay</button>
          </p>
        )}

        {/* Countdown */}
        {phase === "countdown" && (
          <div className="flex flex-col items-center py-10 space-y-4" style={{ animation: "fadeIn 0.4s ease-out" }}>
            <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{
              border: "3px solid #ffae00",
              boxShadow: "0 0 30px rgba(255,174,0,0.5)",
              animation: "pulse 1.5s ease-in-out infinite"
            }}>
              <span className="text-5xl font-black" style={{ color: "#ffae00" }} key={countdown}>
                {countdown}
              </span>
            </div>
            <p className="text-sm animate-pulse" style={{ color: "rgba(255,174,0,0.7)" }}>🔄 Đang phân tích mã MD5...</p>
          </div>
        )}

        {/* Result */}
        {phase === "done" && result && (
          <div className="space-y-5" style={{ animation: "fadeIn 0.6s ease-out" }}>
            {/* Big Result Text */}
            <div className="text-center py-4">
              <span className="text-6xl font-black tracking-widest" style={{
                color: result.result === "Tài" ? "#ff3c00" : "#00c3ff",
                textShadow: result.result === "Tài"
                  ? "0 0 20px rgba(255,60,0,0.5)"
                  : "0 0 20px rgba(0,195,255,0.5)",
              }}>
                {result.result === "Tài" ? "TÀI" : "XỈU"}
              </span>
            </div>

            {/* Percentage Labels */}
            <div className="flex justify-between items-center text-sm font-bold px-1">
              <span style={{ color: "#ff3c00" }}>TÀI {result.tai}%</span>
              <span style={{ color: "#00c3ff" }}>XỈU {result.xiu}%</span>
            </div>

            {/* Progress Bar */}
            <div className="h-3 rounded-full overflow-hidden flex" style={{
              background: "rgba(255,255,255,0.1)",
              boxShadow: "0 0 10px rgba(255,174,0,0.15)"
            }}>
              <div className="h-full rounded-l-full transition-all duration-1000" style={{
                width: `${result.tai}%`,
                background: "linear-gradient(90deg, #ff3c00, #ff6a00)",
                boxShadow: "0 0 8px #ff3c00",
              }} />
              <div className="h-full rounded-r-full transition-all duration-1000" style={{
                width: `${result.xiu}%`,
                background: "linear-gradient(90deg, #007bff, #00c3ff)",
                boxShadow: "0 0 8px #00c3ff",
              }} />
            </div>

            {/* Confidence */}
            <div className="text-center space-y-1 py-2">
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Độ tin cậy</p>
              <span className="text-5xl font-black" style={{
                color: "#00ff88",
                textShadow: "0 0 10px #00ff88, 0 0 30px rgba(0,255,136,0.3)",
              }}>
                {result.confidence}%
              </span>
            </div>

            {/* Đúng / Sai buttons */}
            <div className="flex gap-4">
              <button className="flex-1 py-3 rounded-xl font-black text-lg tracking-wider text-white transition-transform hover:scale-105"
                style={{ background: "linear-gradient(135deg, #1a8c3a, #22c55e)", border: "1px solid rgba(34,197,94,0.4)" }}>
                ✓ ĐÚNG
              </button>
              <button className="flex-1 py-3 rounded-xl font-black text-lg tracking-wider text-white transition-transform hover:scale-105"
                style={{ background: "linear-gradient(135deg, #9c1a1a, #dc2626)", border: "1px solid rgba(220,38,38,0.4)" }}>
                ✗ SAI
              </button>
            </div>

            {/* Recent History */}
            {history.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.7)" }}>📋 Lịch sử gần đây</span>
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{history.length} lần</span>
                </div>
                {history.map((h, i) => (
                  <div key={i} className="flex justify-between items-center px-3 py-2 rounded-lg" style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}>
                    <span className="text-xs font-mono truncate max-w-[200px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                      {h.md5.slice(0, 20)}...
                    </span>
                    <span className="text-sm font-bold" style={{
                      color: h.result === "Tài" ? "#ff3c00" : "#00c3ff"
                    }}>
                      {h.result === "Tài" ? "TÀI" : "XỈU"} ({h.tai}%)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-4">
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          🧧 Chúc Mừng Năm Mới • MD5 Analyzer VIP Pro 🧧
        </p>
      </footer>

      <style>{`
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes petalFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.4; }
          25% { transform: translateY(-15px) rotate(10deg); opacity: 0.7; }
          50% { transform: translateY(-30px) rotate(-5deg); opacity: 0.5; }
          75% { transform: translateY(-10px) rotate(8deg); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
