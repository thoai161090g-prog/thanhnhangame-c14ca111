import { useState, useCallback, useRef, useEffect } from "react";
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

interface HistoryDot {
  type: "T" | "X";
}

// Game iframe URLs mapping
const GAME_URLS: Record<string, string> = {
  sunwin: "https://web.sunwin.bi",
  hitclub: "https://hitclub1.com",
  "68gb": "https://68gamebai1.com",
  sao789: "https://sao789.net",
  son789: "https://son789.net",
  sumclub: "https://sumclub.net",
  ta28: "https://ta28.net",
  tik88: "https://tik88.net",
  rikvip: "https://rikvip.net",
  betvip: "https://betvip.net",
  b52: "https://b52.club",
  "789club": "https://789club.net",
  xocdia88: "https://xocdia88.net",
  "thien-duong": "https://thienduong.net",
  baccarat: "https://baccarat.net",
};

export default function GameAnalysis() {
  const { gameId } = useParams<{ gameId: string }>();
  const { hasValidKey } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [md5Input, setMd5Input] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [phase, setPhase] = useState<"idle" | "scanning" | "done">("idle");
  const [scanText, setScanText] = useState("");
  const [history, setHistory] = useState<HistoryDot[]>([]);
  const [popupVisible, setPopupVisible] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Draggable
  const popupRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 20, y: window.innerHeight * 0.15 });
  const dragState = useRef({ dragging: false, startX: 0, startY: 0, startLeft: 0, startTop: 0 });

  const game = GAMES.find((g) => g.id === gameId);
  const iframeUrl = GAME_URLS[gameId || ""] || "";

  // Drag handlers
  const onHeaderPointerDown = useCallback((e: React.PointerEvent) => {
    dragState.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startLeft: pos.x,
      startTop: pos.y,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [pos]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragState.current.dragging) return;
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 280, dragState.current.startLeft + (e.clientX - dragState.current.startX))),
        y: Math.max(0, Math.min(window.innerHeight - 200, dragState.current.startTop + (e.clientY - dragState.current.startY))),
      });
    };
    const onUp = () => { dragState.current.dragging = false; };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  // Scanning animation
  useEffect(() => {
    if (phase !== "scanning") return;
    const interval = setInterval(() => {
      setScanText(String(Math.floor(Math.random() * 999999)).padStart(6, "0"));
    }, 80);
    return () => clearInterval(interval);
  }, [phase]);

  const handleAnalyze = useCallback(async () => {
    setErrorMsg("");
    if (!validMd5(md5Input)) {
      setErrorMsg("⚠️ Vui lòng nhập đúng mã MD5 (32 ký tự hex)!");
      return;
    }
    if (!hasValidKey) {
      toast({ title: "Cần Key", description: "Bạn cần mua key để sử dụng.", variant: "destructive" });
      navigate("/buy-key");
      return;
    }

    setPhase("scanning");
    setResult(null);

    // Delay for scanning effect
    await new Promise((r) => setTimeout(r, 2500));

    const { data, error } = await supabase.functions.invoke("analyze-md5", {
      body: { md5: md5Input, game: game?.name || "Unknown" },
    });

    if (error || data?.error) {
      setErrorMsg("⚠️ " + (data?.error || error?.message || "Lỗi phân tích"));
      setPhase("idle");
      return;
    }

    const res = data as AnalysisResult;
    setResult(res);
    setPhase("done");
    setHistory((prev) => [...prev, { type: (res.result === "Tài" ? "T" : "X") as "T" | "X" }].slice(-8));

    // Auto clear input
    setTimeout(() => setMd5Input(""), 2000);
  }, [md5Input, hasValidKey, game, toast, navigate]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAnalyze();
  };

  if (!game) return <div className="min-h-screen flex items-center justify-center text-white bg-black">Game không tồn tại</div>;

  return (
    <div style={{ margin: 0, width: "100%", height: "100vh", overflow: "hidden", background: "#000", fontFamily: "'Montserrat', sans-serif" }}>
      {/* Game iframe */}
      {iframeUrl && (
        <iframe
          src={iframeUrl}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none", zIndex: 1 }}
          title={game.name}
        />
      )}

      {/* Fallback background if no iframe */}
      {!iframeUrl && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 1,
          background: "linear-gradient(180deg, #0a0a1a, #000)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", gap: 12,
        }}>
          <span style={{ fontSize: 64 }}>{game.icon}</span>
          <span style={{ color: "#ffd700", fontWeight: 900, fontSize: 24, fontFamily: "'Orbitron', sans-serif" }}>{game.name}</span>
        </div>
      )}

      {/* Open Tool Button */}
      {!popupVisible && (
        <button
          onClick={() => setPopupVisible(true)}
          style={{
            position: "fixed", bottom: 20, right: 20, zIndex: 99,
            width: 50, height: 50, borderRadius: "50%",
            background: "#000", border: "2px solid #ffd700", color: "#ffd700",
            fontWeight: "bold", fontSize: 20, cursor: "pointer", display: "flex",
            boxShadow: "0 0 15px #ffd700", alignItems: "center", justifyContent: "center",
          }}
        >
          🤖
        </button>
      )}

      {/* Back button */}
      <button
        onClick={() => navigate("/")}
        style={{
          position: "fixed", top: 10, left: 10, zIndex: 1001,
          padding: "6px 12px", borderRadius: 10, fontWeight: 700,
          background: "rgba(0,0,0,0.7)", color: "#ffd700",
          border: "1px solid rgba(255,215,0,0.3)", fontSize: 13, cursor: "pointer",
          backdropFilter: "blur(10px)",
        }}
      >
        ← Trang chủ
      </button>

      {/* VIP Popup */}
      {popupVisible && (
        <div
          ref={popupRef}
          style={{
            position: "fixed", left: pos.x, top: pos.y, width: 260, zIndex: 1000,
            background: "rgba(10, 10, 10, 0.65)",
            backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            borderRadius: 20, padding: 20,
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
          }}
        >
          {/* Neon border glow */}
          <div style={{
            position: "absolute", inset: -2, borderRadius: 22,
            background: "linear-gradient(45deg, #ff0055, #00ff99, #00ccff, #ff0055)",
            zIndex: -1, filter: "blur(10px)", opacity: 0.7,
            animation: "neonGlow 6s linear infinite",
          }} />

          {/* Header - draggable */}
          <div
            onPointerDown={onHeaderPointerDown}
            style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: 15, cursor: "move",
            }}
          >
            <span style={{
              fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 14,
              background: "linear-gradient(to right, #fff, #ffd700)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              THANH NHÂN VIP ⚡
            </span>
            <span
              onClick={() => setPopupVisible(false)}
              style={{ color: "rgba(255,255,255,0.5)", fontWeight: "bold", cursor: "pointer", fontSize: 16 }}
            >
              ✕
            </span>
          </div>

          {/* MD5 Input */}
          <input
            type="text"
            placeholder="DÁN MÃ MD5 VÀO ĐÂY..."
            value={md5Input}
            onChange={(e) => setMd5Input(e.target.value)}
            onKeyDown={handleKeyPress}
            maxLength={32}
            style={{
              width: "100%", padding: 12, borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(0,0,0,0.5)", color: "#00ff99",
              fontFamily: "'Orbitron', sans-serif", fontSize: 11,
              textAlign: "center", outline: "none", letterSpacing: 1,
            }}
          />

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={phase === "scanning"}
            style={{
              width: "100%", marginTop: 15, padding: 14, borderRadius: 15, border: "none",
              background: "linear-gradient(90deg, #ffd700, #ff8c00)",
              color: "#000", fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 12,
              cursor: phase === "scanning" ? "not-allowed" : "pointer",
              position: "relative", overflow: "hidden",
              boxShadow: "0 5px 15px rgba(255, 140, 0, 0.4)",
              opacity: phase === "scanning" ? 0.7 : 1,
            }}
          >
            {phase === "scanning" ? "SYSTEM SCANNING..." : phase === "done" ? "QUÉT TIẾP (AUTO RESET)" : "BẮT ĐẦU QUÉT AI"}
            {/* Shine effect */}
            <div style={{
              position: "absolute", top: 0, left: "-100%", width: "100%", height: "100%",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
              animation: "btnShine 3s infinite",
            }} />
          </button>

          {/* Error */}
          {errorMsg && (
            <div style={{ color: "#ff5555", fontSize: 12, marginTop: 10 }}>{errorMsg}</div>
          )}

          {/* Scanning animation */}
          {phase === "scanning" && (
            <div style={{ textAlign: "center", marginTop: 15 }}>
              <div style={{
                width: 20, height: 20, border: "3px solid rgba(255,255,255,0.3)",
                borderRadius: "50%", borderTopColor: "#00ff99",
                animation: "spin 1s linear infinite", margin: "0 auto 10px",
              }} />
              <div style={{
                fontFamily: "'Orbitron', sans-serif", fontSize: 30, fontWeight: 900,
                color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`,
                animation: "popIn 0.5s ease",
              }}>
                {scanText}
              </div>
            </div>
          )}

          {/* Result */}
          {phase === "done" && result && (
            <div style={{ textAlign: "center", marginTop: 15 }}>
              <div style={{
                fontFamily: "'Orbitron', sans-serif", fontSize: 48, fontWeight: 900,
                letterSpacing: 2, animation: "popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                color: result.result === "Tài" ? "#00ff99" : "#ff0055",
                textShadow: result.result === "Tài"
                  ? "0 0 20px rgba(0,255,153,0.8)"
                  : "0 0 20px rgba(255,0,85,0.8)",
              }}>
                {result.result === "Tài" ? "TÀI" : "XỈU"}
              </div>
              <div style={{
                fontSize: 10, color: "#00ffff", textTransform: "uppercase",
                letterSpacing: 1, marginBottom: 10,
              }}>
                ĐỘ CHÍNH XÁC: {result.confidence}%
              </div>

              {/* Stats */}
              <div style={{ display: "flex", justifyContent: "center", gap: 12, fontSize: 11, marginBottom: 8 }}>
                <span style={{ color: "#00ff99" }}>TÀI: {result.tai}%</span>
                <span style={{ color: "rgba(255,255,255,0.3)" }}>|</span>
                <span style={{ color: "#ff0055" }}>XỈU: {result.xiu}%</span>
              </div>

              {/* History dots */}
              {history.length > 0 && (
                <div style={{
                  display: "flex", justifyContent: "center", gap: 5, marginTop: 10,
                  paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.1)",
                }}>
                  {history.map((dot, i) => (
                    <div key={i} style={{
                      width: 12, height: 12, borderRadius: "50%",
                      background: dot.type === "T" ? "#00ff99" : "#ff0055",
                      boxShadow: `0 0 5px ${dot.type === "T" ? "#00ff99" : "#ff0055"}`,
                    }} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Keyframe animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Montserrat:wght@400;700&display=swap');
        @keyframes neonGlow { 0% { filter: hue-rotate(0deg) blur(10px); } 100% { filter: hue-rotate(360deg) blur(10px); } }
        @keyframes btnShine { 0% { left: -100%; } 100% { left: 100%; } }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes popIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}
