import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { validMd5, analyzeMd5, GAMES } from "@/lib/md5-analyzer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function GameAnalysis() {
  const { gameId } = useParams<{ gameId: string }>();
  const { user, hasValidKey } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [md5Input, setMd5Input] = useState("");
  const [result, setResult] = useState<ReturnType<typeof analyzeMd5> | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const game = GAMES.find((g) => g.id === gameId);
  if (!game) return <div className="min-h-screen gradient-vip flex items-center justify-center text-foreground">Game không tồn tại</div>;

  const handleAnalyze = async () => {
    if (!validMd5(md5Input)) {
      toast({ title: "Lỗi", description: "Mã MD5 không hợp lệ! Cần 32 ký tự hex.", variant: "destructive" });
      return;
    }
    if (!hasValidKey) {
      toast({ title: "Cần Key", description: "Bạn cần mua key để sử dụng tính năng này.", variant: "destructive" });
      navigate("/buy-key");
      return;
    }

    setAnalyzing(true);
    await new Promise((r) => setTimeout(r, 1500)); // animation delay
    const res = analyzeMd5(md5Input);
    setResult(res);

    // Save to history
    if (user) {
      await supabase.from("analysis_history").insert({
        user_id: user.id,
        game: game.name,
        md5_input: md5Input,
        result: res.result,
        tai_percent: res.tai,
        xiu_percent: res.xiu,
        confidence: res.confidence,
      });
    }
    setAnalyzing(false);
  };

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
              disabled={analyzing}
              className="w-full gradient-gold text-primary-foreground font-bold text-lg py-6"
            >
              {analyzing ? "⏳ Đang phân tích..." : "🔍 Phân Tích MD5"}
            </Button>
            {!hasValidKey && (
              <p className="text-center text-accent text-sm">⚠️ Bạn cần mua key để sử dụng.{" "}
                <button onClick={() => navigate("/buy-key")} className="text-gold underline">Mua ngay</button>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Result */}
        {result && (
          <Card className={`border-2 ${result.result === "Tài" ? "border-primary glow-gold" : "border-accent glow-red"} animate-in fade-in-0 zoom-in-95 duration-500`}>
            <CardContent className="py-8 text-center space-y-4">
              <div className="text-6xl font-extrabold animate-in slide-in-from-bottom-4 duration-700">
                {result.result === "Tài" ? (
                  <span className="text-gold text-shadow-gold">🎯 TÀI</span>
                ) : (
                  <span className="text-accent">🎲 XỈU</span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="p-3 rounded-lg bg-muted">
                  <div className="text-sm text-muted-foreground">Tài</div>
                  <div className="text-2xl font-bold text-gold">{result.tai}%</div>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <div className="text-sm text-muted-foreground">Độ tin cậy</div>
                  <div className="text-2xl font-bold text-foreground">{result.confidence}%</div>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <div className="text-sm text-muted-foreground">Xỉu</div>
                  <div className="text-2xl font-bold text-accent">{result.xiu}%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
