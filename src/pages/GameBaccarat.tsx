import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const POLL_MS = 8000;

interface BaccaratResult {
  winner: string; // "B" | "P" | "T"
}

interface HistoryItem {
  type: "B" | "P" | "T";
  count?: number; // for ties
}

interface BoardCell {
  side: string;
  ties: number;
}

function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max);
}

function detectPattern(history: HistoryItem[]): { pattern: string; prediction: string; reason: string } {
  const h = history.filter(x => x.type !== "T").map(x => x.type);
  const n = h.length;

  if (n < 2) return { pattern: "NONE", prediction: "", reason: "Cần thêm dữ liệu kết quả thực tế." };

  const last = h[n - 1];
  const p1 = h[n - 2];
  const p2 = n >= 3 ? h[n - 3] : undefined;

  // Cầu Bệt (3+ same)
  if (last === p1 && p1 === p2) {
    return { pattern: "BET", prediction: last, reason: `Cầu Bệt: Đang bệt ${last}, bám dây ngay!` };
  }
  // Cầu 1-1
  if (n >= 3 && last !== p1 && p1 !== p2) {
    return { pattern: "1-1", prediction: last === "P" ? "B" : "P", reason: "Cầu 1-1: Nhịp nhảy BPB ổn định, đánh đối nghịch." };
  }
  // Cầu 2-2
  if (n >= 3 && last !== p1 && p1 === p2) {
    return { pattern: "2-2", prediction: last, reason: "Cầu 2-2: Vừa đổi màu, đánh cùng màu để đủ cặp." };
  }

  return { pattern: "NONE", prediction: last, reason: "Đang chờ form cầu rõ ràng (1-1, 2-2 hoặc Bệt)." };
}

function buildColumns(history: HistoryItem[]): BoardCell[][] {
  const columns: BoardCell[][] = [];
  let cur: BoardCell[] = [];
  let lastS: string | null = null;

  history.forEach(item => {
    if (item.type !== "T") {
      if (item.type !== lastS) {
        if (cur.length > 0) columns.push(cur);
        cur = [{ side: item.type, ties: 0 }];
        lastS = item.type;
      } else {
        cur.push({ side: item.type, ties: 0 });
      }
    } else if (cur.length > 0) {
      cur[cur.length - 1].ties += (item.count || 1);
    }
  });
  if (cur.length > 0) columns.push(cur);
  return columns;
}

export default function GameBaccarat() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [apiData, setApiData] = useState<any>(null);
  const [online, setOnline] = useState(false);
  const [lastUpdate, setLastUpdate] = useState("Đang tải dữ liệu…");
  const [progress, setProgress] = useState(0);

  // Draggable
  const [pos, setPos] = useState({ x: 20, y: 60 });
  const [popupVisible, setPopupVisible] = useState(true);
  const dragState = useRef({ dragging: false, startX: 0, startY: 0, startLeft: 0, startTop: 0 });
  const POS_KEY = "bcr_bot_pos";

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(POS_KEY) || "null");
      if (saved) setPos({ x: saved.x, y: saved.y });
    } catch {}
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
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
      const newX = clamp(dragState.current.startLeft + (e.clientX - dragState.current.startX), 0, window.innerWidth - 300);
      const newY = clamp(dragState.current.startTop + (e.clientY - dragState.current.startY), 0, window.innerHeight - 200);
      setPos({ x: newX, y: newY });
    };
    const onUp = () => {
      if (!dragState.current.dragging) return;
      dragState.current.dragging = false;
      localStorage.setItem(POS_KEY, JSON.stringify(pos));
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [pos]);

  // Poll API
  const pull = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("baccarat-proxy");
      if (error) throw error;
      setApiData(data);
      setOnline(true);

      // Auto-populate history from API if it returns results
      if (data && Array.isArray(data.results)) {
        const apiHistory: HistoryItem[] = data.results.map((r: any) => ({
          type: r.winner === "Banker" ? "B" : r.winner === "Player" ? "P" : "T" as "B" | "P" | "T",
        }));
        setHistory(apiHistory);
      } else if (data && Array.isArray(data)) {
        // If API returns array directly
        const apiHistory: HistoryItem[] = data.map((r: any) => {
          const w = (r.winner || r.result || "").toString().toUpperCase();
          if (w.startsWith("B") || w === "BANKER") return { type: "B" as const };
          if (w.startsWith("P") || w === "PLAYER") return { type: "P" as const };
          return { type: "T" as const };
        });
        setHistory(apiHistory);
      }

      const now = new Date();
      setLastUpdate(`Cập nhật lúc ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`);
    } catch {
      setOnline(false);
      setLastUpdate("Lỗi tải dữ liệu, sẽ thử lại…");
    }
  }, []);

  useEffect(() => {
    pull();
    const interval = setInterval(pull, POLL_MS);
    return () => clearInterval(interval);
  }, [pull]);

  // Progress bar
  useEffect(() => {
    let raf: number;
    let start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const p = Math.min(elapsed / POLL_MS, 1);
      setProgress(p);
      if (p >= 1) { start = now; setProgress(0); }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Manual record
  const record = (type: "B" | "P" | "T") => {
    setHistory(prev => {
      if (type === "T") {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        if (last.type === "T") {
          return [...prev.slice(0, -1), { ...last, count: (last.count || 1) + 1 }];
        }
        return [...prev, { type: "T", count: 1 }];
      }
      return [...prev, { type }];
    });
  };

  const resetAll = () => {
    setHistory([]);
  };

  const columns = buildColumns(history);
  const { pattern, prediction, reason } = detectPattern(history);

  return (
    <div style={{ margin: 0, background: "#111", minHeight: "100vh", overflow: "hidden", fontFamily: "sans-serif", color: "#fff" }}>
      {/* Game iframe */}
      <iframe
        src="https://baccarat.net"
        style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", border: "none", zIndex: 1 }}
        title="Baccarat Game"
      />

      {/* Back button */}
      <button
        onClick={() => navigate("/")}
        style={{
          position: "fixed", top: 10, left: 10, zIndex: 10001,
          padding: "6px 12px", borderRadius: 10, fontWeight: 700,
          background: "rgba(0,0,0,0.8)", color: "#ffd700",
          border: "1px solid rgba(255,215,0,0.3)", fontSize: 13, cursor: "pointer",
          backdropFilter: "blur(10px)",
        }}
      >
        ← Trang chủ
      </button>

      {/* Toggle button */}
      {!popupVisible && (
        <button
          onClick={() => setPopupVisible(true)}
          style={{
            position: "fixed", bottom: 20, right: 20, zIndex: 10001,
            width: 50, height: 50, borderRadius: "50%",
            background: "#000", border: "2px solid #e63946", color: "#e63946",
            fontWeight: "bold", fontSize: 20, cursor: "pointer", display: "flex",
            boxShadow: "0 0 15px #e63946", alignItems: "center", justifyContent: "center",
          }}
        >
          🎴
        </button>
      )}

      {/* Draggable Panel */}
      {popupVisible && (
        <div
          style={{
            position: "fixed", left: pos.x, top: pos.y, width: 340, zIndex: 10000,
            background: "rgba(17, 17, 17, 0.92)",
            backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            borderRadius: 16, padding: 14,
            border: "1px solid rgba(255,255,255,0.15)",
            boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
            maxHeight: "85vh", overflowY: "auto",
          }}
        >
          {/* Neon border */}
          <div style={{
            position: "absolute", inset: -2, borderRadius: 18,
            background: "linear-gradient(45deg, #e63946, #0077b6, #2a9d8f, #e63946)",
            zIndex: -1, filter: "blur(8px)", opacity: 0.6,
            animation: "neonGlow 6s linear infinite",
          }} />

          {/* Header */}
          <div
            onPointerDown={onPointerDown}
            style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: 10, cursor: "move", touchAction: "none",
            }}
          >
            <span style={{ fontWeight: 900, fontSize: 14, color: "#ffd700", letterSpacing: 1 }}>
              🎴 BACCARAT AI VIP
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: online ? "#22c55e" : "#f97316",
                boxShadow: online ? "0 0 6px #22c55e" : "0 0 6px #f97316",
              }} />
              <span
                onClick={() => setPopupVisible(false)}
                style={{ color: "rgba(255,255,255,0.5)", fontWeight: "bold", cursor: "pointer", fontSize: 16 }}
              >
                ✕
              </span>
            </div>
          </div>

          {/* Board */}
          <div style={{
            background: "#fff", width: "100%", height: 156, overflowX: "auto",
            display: "flex", border: "2px solid #444", marginBottom: 10, borderRadius: 4,
          }}>
            {columns.map((col, ci) => (
              <div key={ci} style={{ display: "flex", flexDirection: "column", minWidth: 26, borderRight: "1px solid #eee" }}>
                {Array.from({ length: 6 }).map((_, ri) => (
                  <div key={ri} style={{
                    width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center",
                    borderBottom: "1px solid #eee", position: "relative",
                  }}>
                    {col[ri] && (
                      <>
                        {col[ri].ties > 0 && (
                          <div style={{
                            position: "absolute", width: "100%", height: "100%",
                            background: "linear-gradient(45deg, transparent 46%, #2a9d8f 46%, #2a9d8f 54%, transparent 54%)",
                            zIndex: 2,
                          }} />
                        )}
                        {col[ri].ties > 1 && (
                          <div style={{
                            position: "absolute", color: "#000", fontSize: 8, fontWeight: "bold",
                            zIndex: 3, right: 1, bottom: 1,
                          }}>
                            {col[ri].ties}
                          </div>
                        )}
                        <div style={{
                          width: 20, height: 20, borderRadius: "50%",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 9, fontWeight: "bold", color: "#fff",
                          background: col[ri].side === "B" ? "#e63946" : "#0077b6",
                          zIndex: 4,
                        }}>
                          {col[ri].side}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ))}
            {columns.length === 0 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", color: "#999", fontSize: 12 }}>
                Chưa có dữ liệu
              </div>
            )}
          </div>

          {/* Controls */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
            <button onClick={() => record("P")} style={{ padding: 10, fontWeight: "bold", border: "none", borderRadius: 6, cursor: "pointer", color: "#fff", background: "#0077b6", fontSize: 12 }}>PLAYER</button>
            <button onClick={() => record("B")} style={{ padding: 10, fontWeight: "bold", border: "none", borderRadius: 6, cursor: "pointer", color: "#fff", background: "#e63946", fontSize: 12 }}>BANKER</button>
            <button onClick={() => record("T")} style={{ padding: 10, fontWeight: "bold", border: "none", borderRadius: 6, cursor: "pointer", color: "#fff", background: "#2a9d8f", fontSize: 12 }}>TIE</button>
          </div>
          <button onClick={resetAll} style={{ width: "100%", padding: 8, fontWeight: "bold", border: "none", borderRadius: 6, cursor: "pointer", color: "#fff", background: "#333", fontSize: 11, marginBottom: 10 }}>XÓA DỮ LIỆU</button>

          {/* Prediction */}
          <div style={{
            width: "100%", padding: 12, borderRadius: 10,
            background: "#222", textAlign: "center", border: "1px solid #444",
          }}>
            <div style={{ fontSize: 10, background: "#444", padding: "2px 10px", borderRadius: 20, display: "inline-block", marginBottom: 6 }}>
              TRẠNG THÁI: {pattern === "NONE" ? "DÒ CẦU" : `CẦU ${pattern}`}
            </div>
            <div style={{ fontSize: 10, color: "#888" }}>DỰ ĐOÁN TIẾP THEO</div>
            <div style={{
              fontSize: 22, fontWeight: 900, margin: "8px 0", padding: 6, borderRadius: 6,
              color: prediction === "P" ? "#00b4d8" : prediction === "B" ? "#ff4d4d" : "#888",
              border: prediction ? `2px solid ${prediction === "P" ? "#0077b6" : "#e63946"}` : "2px solid #444",
            }}>
              {prediction === "P" ? "PLAYER" : prediction === "B" ? "BANKER" : "---"}
            </div>
            <div style={{ fontSize: 11, color: "#aaa", minHeight: 30 }}>{reason}</div>
          </div>

          {/* API Status */}
          <div style={{ marginTop: 8 }}>
            <div style={{
              position: "relative", height: 4, background: "#0a2a38",
              borderRadius: 999, overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", inset: `0 ${(1 - progress) * 100}% 0 0`,
                background: "linear-gradient(90deg, #e63946, #0077b6)",
                transition: "inset 0.08s linear",
              }} />
            </div>
            <div style={{ marginTop: 4, fontSize: 10, opacity: 0.7 }}>{lastUpdate}</div>
          </div>

          {/* Raw API data preview */}
          {apiData && (
            <details style={{ marginTop: 8 }}>
              <summary style={{ fontSize: 10, color: "#666", cursor: "pointer" }}>API Data</summary>
              <pre style={{ fontSize: 9, color: "#888", maxHeight: 100, overflow: "auto", background: "#1a1a1a", padding: 6, borderRadius: 6, marginTop: 4 }}>
                {JSON.stringify(apiData, null, 2).slice(0, 500)}
              </pre>
            </details>
          )}
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes neonGlow { 0% { filter: hue-rotate(0deg) blur(8px); } 100% { filter: hue-rotate(360deg) blur(8px); } }
      `}</style>
    </div>
  );
}
