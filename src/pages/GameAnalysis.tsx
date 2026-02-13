import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { validMd5, GAMES } from "@/lib/md5-analyzer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface AnalysisResult {
  tai: number;
  xiu: number;
  confidence: number;
  result: string;
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

    // Call server-side analysis (algorithm hidden)
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
      toast({ title: "Cần Key", description: "Bạn cần mua key để sử dụng tính năng này.", variant: "destructive" });
      navigate("/buy-key");
      return;
    }
    runCountdown(md5Input);
  };

  if (!game) return <div className="min-h-screen gradient-vip flex items-center justify-center text-foreground">Game không tồn tại</div>;

  return (
    <div className="min-h-screen gradient-vip">
      <header className="py-4 px-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Button variant="ghost" className="text-gold" onClick={() => navigate("/")}>← Trang chủ</Button>
          <h1 className="text-xl font-bold text-gold">{game.icon} {game.name}</h1>
          <div />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* MD5 Input */}
        <Card className="border-border glow-gold">
          <CardHeader>
            <CardTitle className="text-gold text-center">🔐 Nhập Mã MD5 Để Phân Tích</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Nhập mã MD5 (32 ký tự)..."
              value={md5Input}
              onChange={(e) => setMd5Input(e.target.value)}
              className="bg-muted border-border text-foreground text-center text-lg font-mono"
              maxLength={32}
            />
            <Button
              onClick={handleAnalyze}
              disabled={phase === "countdown"}
              className="w-full gradient-gold text-primary-foreground font-bold text-lg py-6"
            >
              {phase === "countdown" ? "⏳ Đang phân tích..." : "🔍 Phân Tích MD5"}
            </Button>
            {!hasValidKey && (
              <p className="text-center text-accent text-sm">⚠️ Bạn cần mua key để sử dụng.{" "}
                <button onClick={() => navigate("/buy-key")} className="text-gold underline">Mua ngay</button>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Countdown */}
        {phase === "countdown" && (
          <div className="flex flex-col items-center justify-center py-16 space-y-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-primary flex items-center justify-center animate-pulse">
                <span className="text-6xl font-extrabold text-gold" key={countdown} style={{
                  animation: "countPop 0.5s ease-out"
                }}>
                  {countdown}
                </span>
              </div>
              <div className="absolute inset-0 w-32 h-32 rounded-full border-4 border-primary/30 animate-ping" />
            </div>
            <p className="text-muted-foreground text-lg animate-pulse">🔄 Đang phân tích mã MD5...</p>
          </div>
        )}

        {/* Result */}
        {phase === "done" && result && (
          <Card className={`border-2 overflow-hidden ${result.result === "Tài" ? "border-primary glow-gold" : "border-accent glow-red"}`}
            style={{ animation: "resultReveal 0.6s ease-out" }}>
            <CardContent className="py-10 text-center space-y-6">
              {/* Main result */}
              <div style={{ animation: "resultBounce 0.8s ease-out" }}>
                {result.result === "Tài" ? (
                  <div className="space-y-2">
                    <div className="text-7xl">🎯</div>
                    <div className="text-5xl font-black text-gold tracking-wider" style={{ textShadow: "0 0 20px hsl(var(--primary) / 0.5)" }}>
                      TÀI
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-7xl">🎲</div>
                    <div className="text-5xl font-black text-accent tracking-wider" style={{ textShadow: "0 0 20px hsl(var(--accent) / 0.5)" }}>
                      XỈU
                    </div>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 pt-4" style={{ animation: "fadeSlideUp 0.6s ease-out 0.3s both" }}>
                <div className="p-4 rounded-xl bg-muted/80 backdrop-blur-sm border border-border">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Tài</div>
                  <div className="text-3xl font-black text-gold mt-1">{result.tai}%</div>
                </div>
                <div className="p-4 rounded-xl bg-muted/80 backdrop-blur-sm border border-border">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Độ tin cậy</div>
                  <div className="text-3xl font-black text-foreground mt-1">{result.confidence}%</div>
                </div>
                <div className="p-4 rounded-xl bg-muted/80 backdrop-blur-sm border border-border">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Xỉu</div>
                  <div className="text-3xl font-black text-accent mt-1">{result.xiu}%</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="px-4" style={{ animation: "fadeSlideUp 0.6s ease-out 0.5s both" }}>
                <div className="h-3 rounded-full bg-muted overflow-hidden flex">
                  <div
                    className="h-full rounded-l-full transition-all duration-1000"
                    style={{
                      width: `${result.tai}%`,
                      background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))",
                    }}
                  />
                  <div
                    className="h-full rounded-r-full transition-all duration-1000"
                    style={{
                      width: `${result.xiu}%`,
                      background: "linear-gradient(90deg, hsl(var(--accent) / 0.7), hsl(var(--accent)))",
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>Tài</span>
                  <span>Xỉu</span>
                </div>
              </div>

              {/* MD5 */}
              <div className="text-xs text-muted-foreground font-mono break-all px-4" style={{ animation: "fadeSlideUp 0.6s ease-out 0.7s both" }}>
                MD5: {md5Input}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <style>{`
        @keyframes countPop {
          0% { transform: scale(1.8); opacity: 0; }
          50% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes resultReveal {
          0% { transform: scale(0.8) translateY(30px); opacity: 0; }
          60% { transform: scale(1.02); }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes resultBounce {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.15); }
          70% { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeSlideUp {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
