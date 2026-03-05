import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const POLL_MS = 8000;

interface HistoryItem {
  type: "B" | "P" | "T";
  count?: number;
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
  if (last === p1 && p1 === p2) return { pattern: "BET", prediction: last, reason: `Cầu Bệt: Đang bệt ${last}, bám dây ngay!` };
  if (n >= 3 && last !== p1 && p1 !== p2) return { pattern: "1-1", prediction: last === "P" ? "B" : "P", reason: "Cầu 1-1: Nhịp nhảy BPB ổn định, đánh đối nghịch." };
  if (n >= 3 && last !== p1 && p1 === p2) return { pattern: "2-2", prediction: last, reason: "Cầu 2-2: Vừa đổi màu, đánh cùng màu để đủ cặp." };
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
  const [loading, setLoading] = useState(true);
  const [gameCount, setGameCount] = useState(0);

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
      dragging: true, startX: e.clientX, startY: e.clientY,
      startLeft: pos.x, startTop: pos.y,
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
    return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  }, [pos]);

  // Poll API
  const pull = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("baccarat-proxy");
      if (error) throw error;
      setApiData(data);
      setOnline(true);
      setLoading(false);

      // Parse results
      if (data && Array.isArray(data.results)) {
        const apiHistory: HistoryItem[] = data.results.map((r: any) => ({
          type: r.winner === "Banker" ? "B" : r.winner === "Player" ? "P" : "T" as "B" | "P" | "T",
        }));
        setHistory(apiHistory);
        setGameCount(apiHistory.length);
      } else if (data && Array.isArray(data)) {
        const apiHistory: HistoryItem[] = data.map((r: any) => {
          const w = (r.winner || r.result || "").toString().toUpperCase();
          if (w.startsWith("B") || w === "BANKER") return { type: "B" as const };
          if (w.startsWith("P") || w === "PLAYER") return { type: "P" as const };
          return { type: "T" as const };
        });
        setHistory(apiHistory);
        setGameCount(apiHistory.length);
      } else if (data && typeof data === "object") {
        // Try to extract from nested structure
        const allResults: HistoryItem[] = [];
        Object.values(data).forEach((val: any) => {
          if (Array.isArray(val)) {
            val.forEach((r: any) => {
              const w = (r.winner || r.result || r.W || "").toString().toUpperCase();
              if (w.startsWith("B") || w === "BANKER") allResults.push({ type: "B" });
              else if (w.startsWith("P") || w === "PLAYER") allResults.push({ type: "P" });
              else if (w.startsWith("T") || w === "TIE") allResults.push({ type: "T" });
            });
          }
        });
        if (allResults.length > 0) {
          setHistory(allResults);
          setGameCount(allResults.length);
        }
      }

      const now = new Date();
      setLastUpdate(`Cập nhật lúc ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`);
    } catch {
      setOnline(false);
      setLoading(false);
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

  const record = (type: "B" | "P" | "T") => {
    setHistory(prev => {
      if (type === "T") {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        if (last.type === "T") return [...prev.slice(0, -1), { ...last, count: (last.count || 1) + 1 }];
        return [...prev, { type: "T", count: 1 }];
      }
      return [...prev, { type }];
    });
  };

  const columns = buildColumns(history);
  const { pattern, prediction, reason } = detectPattern(history);

  const bankerCount = history.filter(h => h.type === "B").length;
  const playerCount = history.filter(h => h.type === "P").length;
  const tieCount = history.filter(h => h.type === "T").length;

  // Last result
  const lastResult = history.length > 0 ? history[history.length - 1].type : null;

  return (
    <div style={{ margin: 0, background: "#0a0a1a", minHeight: "100vh", overflow: "hidden", fontFamily: "'Orbitron', sans-serif", color: "#fff" }}>
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap" rel="stylesheet" />

      {/* Back button */}
      <button onClick={() => navigate("/")} style={{
        position: "fixed", top: 10, left: 10, zIndex: 10001,
        padding: "6px 12px", borderRadius: 10, fontWeight: 700,
        background: "rgba(0,0,0,0.8)", color: "#ffd700",
        border: "1px solid rgba(255,215,0,0.3)", fontSize: 13, cursor: "pointer",
        backdropFilter: "blur(10px)",
      }}>← Trang chủ</button>

      {/* Toggle button */}
      {!popupVisible && (
        <button onClick={() => setPopupVisible(true)} style={{
          position: "fixed", bottom: 20, right: 20, zIndex: 10001,
          width: 56, height: 56, borderRadius: "50%",
          background: "radial-gradient(circle, #1a0030, #000)", border: "2px solid #a855f7",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 20px #a855f7, 0 0 40px rgba(168,85,247,0.3)",
          overflow: "hidden", padding: 0,
        }}>
          <img src="/robot-bcr.gif" alt="Robot" style={{ width: 40, height: 40, objectFit: "contain" }} />
        </button>
      )}

      {/* Loading Screen */}
      {loading && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 20000,
          background: "radial-gradient(ellipse at center, #1a0030 0%, #0a0a1a 70%)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}>
          <img src="/robot-bcr.gif" alt="Robot Loading" style={{
            width: 180, height: 180, objectFit: "contain",
            filter: "drop-shadow(0 0 30px #a855f7)",
          }} />
          <div style={{
            marginTop: 20, fontSize: 16, fontWeight: 900, color: "#ffd700",
            textShadow: "0 0 10px #ffd700",
            animation: "pulse 1.5s infinite",
          }}>
            🤖 ĐANG KẾT NỐI DỮ LIỆU...
          </div>
          <div style={{
            marginTop: 10, fontSize: 11, color: "#a855f7",
            animation: "pulse 2s infinite",
          }}>
            Hệ thống AI đang phân tích ván Baccarat
          </div>
          <div style={{
            marginTop: 20, width: 200, height: 4, background: "#1a1a2e",
            borderRadius: 999, overflow: "hidden",
          }}>
            <div style={{
              height: "100%", background: "linear-gradient(90deg, #a855f7, #ffd700)",
              animation: "loadBar 2s ease-in-out infinite",
            }} />
          </div>
        </div>
      )}

      {/* Draggable Panel */}
      {popupVisible && !loading && (
        <div style={{
          position: "fixed", left: pos.x, top: pos.y, width: 350, zIndex: 10000,
          background: "rgba(10, 10, 30, 0.95)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          borderRadius: 16, padding: 14,
          border: "1px solid rgba(168,85,247,0.3)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(168,85,247,0.15)",
          maxHeight: "90vh", overflowY: "auto",
        }}>
          {/* Neon border */}
          <div style={{
            position: "absolute", inset: -2, borderRadius: 18,
            background: "linear-gradient(45deg, #a855f7, #e63946, #0077b6, #ffd700, #a855f7)",
            zIndex: -1, filter: "blur(8px)", opacity: 0.5,
            animation: "neonGlow 6s linear infinite",
          }} />

          {/* Header */}
          <div onPointerDown={onPointerDown} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 10, cursor: "move", touchAction: "none",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <img src="/robot-bcr.gif" alt="Robot" style={{ width: 32, height: 32, borderRadius: "50%" }} />
              <span style={{ fontWeight: 900, fontSize: 13, color: "#ffd700", letterSpacing: 1 }}>
                SEXY BCR VIP TOOL
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: online ? "#22c55e" : "#f97316",
                boxShadow: online ? "0 0 8px #22c55e" : "0 0 8px #f97316",
              }} />
              <span onClick={() => setPopupVisible(false)} style={{
                color: "rgba(255,255,255,0.5)", fontWeight: "bold", cursor: "pointer", fontSize: 16,
              }}>✕</span>
            </div>
          </div>

          {/* Game Stats Bar */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "6px 10px", borderRadius: 8, marginBottom: 10,
            background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)",
            fontSize: 10,
          }}>
            <span style={{ color: "#a855f7" }}>📊 Tổng ván: <b style={{ color: "#ffd700" }}>#{gameCount}</b></span>
            <span style={{ color: "#e63946" }}>B: {bankerCount}</span>
            <span style={{ color: "#0077b6" }}>P: {playerCount}</span>
            <span style={{ color: "#2a9d8f" }}>T: {tieCount}</span>
          </div>

          {/* Board */}
          <div style={{
            background: "#fff", width: "100%", height: 156, overflowX: "auto",
            display: "flex", border: "2px solid #333", marginBottom: 10, borderRadius: 4,
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
                          <div style={{ position: "absolute", color: "#000", fontSize: 8, fontWeight: "bold", zIndex: 3, right: 1, bottom: 1 }}>
                            {col[ri].ties}
                          </div>
                        )}
                        <div style={{
                          width: 20, height: 20, borderRadius: "50%",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 9, fontWeight: "bold", color: "#fff",
                          background: col[ri].side === "B" ? "#e63946" : "#0077b6",
                          zIndex: 4,
                        }}>{col[ri].side}</div>
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

          {/* Last Result & Prediction */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            <div style={{
              padding: 12, borderRadius: 10, textAlign: "center",
              background: "rgba(30,30,60,0.8)", border: "1px solid #444",
            }}>
              <div style={{ fontSize: 9, color: "#888", marginBottom: 4 }}>KẾT QUẢ</div>
              <div style={{
                fontSize: 20, fontWeight: 900,
                color: lastResult === "B" ? "#e63946" : lastResult === "P" ? "#0077b6" : lastResult === "T" ? "#2a9d8f" : "#444",
                textShadow: lastResult ? `0 0 15px ${lastResult === "B" ? "#e63946" : lastResult === "P" ? "#0077b6" : "#2a9d8f"}` : "none",
              }}>
                {lastResult === "B" ? "BANKER" : lastResult === "P" ? "PLAYER" : lastResult === "T" ? "TIE" : "---"}
              </div>
            </div>
            <div style={{
              padding: 12, borderRadius: 10, textAlign: "center",
              background: "rgba(30,30,60,0.8)", border: `1px solid ${prediction === "B" ? "#e63946" : prediction === "P" ? "#0077b6" : "#444"}`,
              boxShadow: prediction ? `0 0 15px ${prediction === "B" ? "rgba(230,57,70,0.3)" : "rgba(0,119,182,0.3)"}` : "none",
            }}>
              <div style={{ fontSize: 9, color: "#ffd700", marginBottom: 4 }}>DỰ ĐOÁN</div>
              <div style={{
                fontSize: 20, fontWeight: 900,
                color: prediction === "B" ? "#e63946" : prediction === "P" ? "#0077b6" : "#444",
                textShadow: prediction ? `0 0 15px ${prediction === "B" ? "#e63946" : "#0077b6"}` : "none",
                animation: prediction ? "pulse 2s infinite" : "none",
              }}>
                {prediction === "B" ? "BANKER" : prediction === "P" ? "PLAYER" : "---"}
              </div>
            </div>
          </div>

          {/* Pattern info */}
          <div style={{
            padding: 8, borderRadius: 8, marginBottom: 10,
            background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.15)",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 9, color: "#a855f7", marginBottom: 2 }}>
              TRẠNG THÁI: {pattern === "NONE" ? "DÒ CẦU" : `CẦU ${pattern}`}
            </div>
            <div style={{ fontSize: 10, color: "#aaa" }}>{reason}</div>
          </div>

          {/* Controls */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
            <button onClick={() => record("P")} style={{
              padding: 10, fontWeight: "bold", border: "none", borderRadius: 6,
              cursor: "pointer", color: "#fff", background: "linear-gradient(135deg, #0077b6, #00b4d8)",
              fontSize: 11, boxShadow: "0 2px 10px rgba(0,119,182,0.3)",
            }}>PLAYER</button>
            <button onClick={() => record("B")} style={{
              padding: 10, fontWeight: "bold", border: "none", borderRadius: 6,
              cursor: "pointer", color: "#fff", background: "linear-gradient(135deg, #e63946, #ff6b6b)",
              fontSize: 11, boxShadow: "0 2px 10px rgba(230,57,70,0.3)",
            }}>BANKER</button>
            <button onClick={() => record("T")} style={{
              padding: 10, fontWeight: "bold", border: "none", borderRadius: 6,
              cursor: "pointer", color: "#fff", background: "linear-gradient(135deg, #2a9d8f, #52b788)",
              fontSize: 11, boxShadow: "0 2px 10px rgba(42,157,143,0.3)",
            }}>TIE</button>
          </div>
          <button onClick={() => setHistory([])} style={{
            width: "100%", padding: 8, fontWeight: "bold", border: "1px solid #333",
            borderRadius: 6, cursor: "pointer", color: "#888", background: "transparent",
            fontSize: 10, marginBottom: 8,
          }}>XÓA DỮ LIỆU</button>

          {/* History dots */}
          <div style={{
            display: "flex", gap: 3, flexWrap: "wrap", padding: "6px 0",
            borderTop: "1px solid rgba(255,255,255,0.05)", marginBottom: 6,
          }}>
            {history.slice(-30).map((h, i) => (
              <div key={i} style={{
                width: 18, height: 18, borderRadius: "50%", display: "flex",
                alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 900, color: "#fff",
                background: h.type === "B" ? "#e63946" : h.type === "P" ? "#0077b6" : "#2a9d8f",
                boxShadow: `0 0 4px ${h.type === "B" ? "#e63946" : h.type === "P" ? "#0077b6" : "#2a9d8f"}`,
              }}>{h.type}</div>
            ))}
          </div>

          {/* Progress bar */}
          <div>
            <div style={{
              position: "relative", height: 3, background: "#1a1a2e",
              borderRadius: 999, overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", inset: `0 ${(1 - progress) * 100}% 0 0`,
                background: "linear-gradient(90deg, #a855f7, #ffd700)",
                transition: "inset 0.08s linear",
              }} />
            </div>
            <div style={{ marginTop: 3, fontSize: 9, opacity: 0.5 }}>{lastUpdate}</div>
          </div>

          {/* API debug */}
          {apiData && (
            <details style={{ marginTop: 6 }}>
              <summary style={{ fontSize: 9, color: "#555", cursor: "pointer" }}>API Data</summary>
              <pre style={{ fontSize: 8, color: "#666", maxHeight: 80, overflow: "auto", background: "#111", padding: 4, borderRadius: 4, marginTop: 2 }}>
                {JSON.stringify(apiData, null, 2).slice(0, 500)}
              </pre>
            </details>
          )}
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes neonGlow { 0% { filter: hue-rotate(0deg) blur(8px); } 100% { filter: hue-rotate(360deg) blur(8px); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        @keyframes loadBar { 0% { width: 0; } 50% { width: 100%; } 100% { width: 0; } }
      `}</style>
    </div>
  );
}
