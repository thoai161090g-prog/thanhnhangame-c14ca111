import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const POLL_MS = 8000;

interface TableData {
  ban: string;
  cau: string;
  du_doan: string;
  ket_qua: string;
  phien: number;
  phien_hien_tai: number;
  thuong_thuat: string;
  time: string;
}

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

function parseKetQua(kq: string): HistoryItem[] {
  return kq.split("").map(c => ({
    type: (c === "B" ? "B" : c === "P" ? "P" : "T") as "B" | "P" | "T",
  }));
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
      cur[cur.length - 1].ties += 1;
    }
  });
  if (cur.length > 0) columns.push(cur);
  return columns;
}

/* ── Table Selection Screen ── */
function TableSelect({ tables, onSelect, onBack }: {
  tables: TableData[];
  onSelect: (t: TableData) => void;
  onBack: () => void;
}) {
  return (
    <div style={{
      minHeight: "100vh", background: "radial-gradient(ellipse at top, #1a0030 0%, #0a0a1a 60%)",
      fontFamily: "'Orbitron', sans-serif", color: "#fff", padding: "16px 12px",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap" rel="stylesheet" />

      <button onClick={onBack} style={{
        padding: "6px 14px", borderRadius: 10, fontWeight: 700,
        background: "rgba(0,0,0,0.6)", color: "#ffd700",
        border: "1px solid rgba(255,215,0,0.3)", fontSize: 13, cursor: "pointer",
        marginBottom: 16,
      }}>← Trang chủ</button>

      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <img src="/robot-bcr.gif" alt="Robot" style={{
          width: 80, height: 80, margin: "0 auto",
          filter: "drop-shadow(0 0 20px #a855f7)",
        }} />
        <h1 style={{
          fontSize: 20, fontWeight: 900, color: "#ffd700",
          textShadow: "0 0 15px rgba(255,215,0,0.5)", marginTop: 8,
        }}>SEXY BCR VIP TOOL</h1>
        <p style={{ fontSize: 11, color: "#a855f7", marginTop: 4 }}>Chọn bàn để vào phân tích</p>
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
        gap: 10, maxWidth: 600, margin: "0 auto",
      }}>
        {tables.map(t => {
          const kq = t.ket_qua;
          const bCount = (kq.match(/B/g) || []).length;
          const pCount = (kq.match(/P/g) || []).length;
          const tCount = (kq.match(/T/g) || []).length;
          const lastChar = kq.length > 0 ? kq[kq.length - 1] : "";
          const duDoan = t.du_doan;

          return (
            <div key={t.ban} onClick={() => onSelect(t)} style={{
              background: "rgba(20,20,50,0.9)",
              border: "1px solid rgba(168,85,247,0.25)",
              borderRadius: 12, padding: 12, cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.border = "1px solid #a855f7";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(168,85,247,0.3)";
                (e.currentTarget as HTMLElement).style.transform = "scale(1.03)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.border = "1px solid rgba(168,85,247,0.25)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.4)";
                (e.currentTarget as HTMLElement).style.transform = "scale(1)";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{
                  fontSize: 14, fontWeight: 900, color: "#ffd700",
                  textShadow: "0 0 8px rgba(255,215,0,0.4)",
                }}>BÀN {t.ban}</span>
                <span style={{
                  fontSize: 9, padding: "2px 6px", borderRadius: 10,
                  background: "rgba(168,85,247,0.2)", color: "#a855f7",
                }}>#{t.phien_hien_tai}</span>
              </div>

              {/* Mini history dots */}
              <div style={{ display: "flex", gap: 2, flexWrap: "wrap", marginBottom: 8, minHeight: 16 }}>
                {kq.slice(-15).split("").map((c, i) => (
                  <div key={i} style={{
                    width: 14, height: 14, borderRadius: "50%", fontSize: 7, fontWeight: 900,
                    display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
                    background: c === "B" ? "#e63946" : c === "P" ? "#0077b6" : "#2a9d8f",
                  }}>{c}</div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#888", marginBottom: 6 }}>
                <span style={{ color: "#e63946" }}>B:{bCount}</span>
                <span style={{ color: "#0077b6" }}>P:{pCount}</span>
                <span style={{ color: "#2a9d8f" }}>T:{tCount}</span>
              </div>

              <div style={{
                textAlign: "center", padding: "4px 0", borderRadius: 6, fontSize: 10, fontWeight: 700,
                background: duDoan.includes("Cái") ? "rgba(230,57,70,0.15)" : "rgba(0,119,182,0.15)",
                color: duDoan.includes("Cái") ? "#ff6b6b" : "#00b4d8",
                border: `1px solid ${duDoan.includes("Cái") ? "rgba(230,57,70,0.3)" : "rgba(0,119,182,0.3)"}`,
              }}>
                🎯 {duDoan}
              </div>

              {t.cau && (
                <div style={{ fontSize: 8, color: "#a855f7", marginTop: 4, textAlign: "center" }}>
                  {t.cau}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Analysis Panel for selected table ── */
export default function GameBaccarat() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [allTables, setAllTables] = useState<TableData[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(false);
  const [lastUpdate, setLastUpdate] = useState("Đang tải…");
  const [progress, setProgress] = useState(0);

  // Draggable
  const [pos, setPos] = useState({ x: 20, y: 60 });
  const [popupVisible, setPopupVisible] = useState(true);
  const dragState = useRef({ dragging: false, startX: 0, startY: 0, startLeft: 0, startTop: 0 });

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("bcr_bot_pos") || "null");
      if (saved) setPos({ x: saved.x, y: saved.y });
    } catch {}
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragState.current = { dragging: true, startX: e.clientX, startY: e.clientY, startLeft: pos.x, startTop: pos.y };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [pos]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragState.current.dragging) return;
      setPos({
        x: clamp(dragState.current.startLeft + (e.clientX - dragState.current.startX), 0, window.innerWidth - 300),
        y: clamp(dragState.current.startTop + (e.clientY - dragState.current.startY), 0, window.innerHeight - 200),
      });
    };
    const onUp = () => {
      if (!dragState.current.dragging) return;
      dragState.current.dragging = false;
      localStorage.setItem("bcr_bot_pos", JSON.stringify(pos));
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  }, [pos]);

  const pull = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("baccarat-proxy");
      if (error) throw error;
      if (Array.isArray(data)) {
        setAllTables(data);
        // Update selected table data if one is selected
        if (selectedTable) {
          const updated = data.find((t: TableData) => t.ban === selectedTable.ban);
          if (updated) setSelectedTable(updated);
        }
      }
      setOnline(true);
      setLoading(false);
      const now = new Date();
      setLastUpdate(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`);
    } catch {
      setOnline(false);
      setLoading(false);
      setLastUpdate("Lỗi kết nối…");
    }
  }, [selectedTable]);

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

  // Loading screen
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", background: "radial-gradient(ellipse at center, #1a0030 0%, #0a0a1a 70%)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        fontFamily: "'Orbitron', sans-serif",
      }}>
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap" rel="stylesheet" />
        <img src="/robot-bcr.gif" alt="Robot" style={{ width: 150, height: 150, filter: "drop-shadow(0 0 30px #a855f7)" }} />
        <div style={{ marginTop: 20, fontSize: 14, fontWeight: 900, color: "#ffd700", textShadow: "0 0 10px #ffd700", animation: "pulse 1.5s infinite" }}>
          🤖 ĐANG LẤY DỮ LIỆU CÁC BÀN...
        </div>
        <div style={{ marginTop: 10, fontSize: 11, color: "#a855f7", animation: "pulse 2s infinite" }}>
          Hệ thống AI đang kết nối Sexy Baccarat
        </div>
        <div style={{ marginTop: 20, width: 200, height: 4, background: "#1a1a2e", borderRadius: 999, overflow: "hidden" }}>
          <div style={{ height: "100%", background: "linear-gradient(90deg, #a855f7, #ffd700)", animation: "loadBar 2s ease-in-out infinite" }} />
        </div>
        <style>{`
          @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }
          @keyframes loadBar { 0% { width:0 } 50% { width:100% } 100% { width:0 } }
        `}</style>
      </div>
    );
  }

  // Table selection screen
  if (!selectedTable) {
    return <TableSelect tables={allTables} onSelect={setSelectedTable} onBack={() => navigate("/")} />;
  }

  // ── Analysis view for selected table ──
  const history = parseKetQua(selectedTable.ket_qua);
  const columns = buildColumns(history);
  const bankerCount = history.filter(h => h.type === "B").length;
  const playerCount = history.filter(h => h.type === "P").length;
  const tieCount = history.filter(h => h.type === "T").length;
  const lastResult = history.length > 0 ? history[history.length - 1].type : null;
  const prediction = selectedTable.du_doan;
  const predSide = prediction.includes("Cái") ? "B" : "P";

  return (
    <div style={{ margin: 0, background: "#0a0a1a", minHeight: "100vh", overflow: "hidden", fontFamily: "'Orbitron', sans-serif", color: "#fff" }}>
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap" rel="stylesheet" />

      {/* Back to table select */}
      <button onClick={() => setSelectedTable(null)} style={{
        position: "fixed", top: 10, left: 10, zIndex: 10001,
        padding: "6px 12px", borderRadius: 10, fontWeight: 700,
        background: "rgba(0,0,0,0.8)", color: "#ffd700",
        border: "1px solid rgba(255,215,0,0.3)", fontSize: 13, cursor: "pointer",
      }}>← Chọn bàn</button>

      {/* Toggle */}
      {!popupVisible && (
        <button onClick={() => setPopupVisible(true)} style={{
          position: "fixed", bottom: 20, right: 20, zIndex: 10001,
          width: 56, height: 56, borderRadius: "50%",
          background: "radial-gradient(circle, #1a0030, #000)", border: "2px solid #a855f7",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 20px #a855f7", overflow: "hidden", padding: 0,
        }}>
          <img src="/robot-bcr.gif" alt="Robot" style={{ width: 40, height: 40, objectFit: "contain" }} />
        </button>
      )}

      {/* Draggable Panel */}
      {popupVisible && (
        <div style={{
          position: "fixed", left: pos.x, top: pos.y, width: 350, zIndex: 10000,
          background: "rgba(10,10,30,0.95)", backdropFilter: "blur(20px)",
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
              <img src="/robot-bcr.gif" alt="Robot" style={{ width: 28, height: 28, borderRadius: "50%" }} />
              <div>
                <div style={{ fontWeight: 900, fontSize: 12, color: "#ffd700", letterSpacing: 1 }}>BÀN {selectedTable.ban}</div>
                <div style={{ fontSize: 8, color: "#a855f7" }}>SEXY BCR VIP TOOL</div>
              </div>
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

          {/* Stats */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "6px 10px", borderRadius: 8, marginBottom: 10,
            background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)",
            fontSize: 10,
          }}>
            <span style={{ color: "#a855f7" }}>Phiên: <b style={{ color: "#ffd700" }}>#{selectedTable.phien_hien_tai}</b></span>
            <span style={{ color: "#e63946" }}>B:{bankerCount}</span>
            <span style={{ color: "#0077b6" }}>P:{playerCount}</span>
            <span style={{ color: "#2a9d8f" }}>T:{tieCount}</span>
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

          {/* Result + Prediction */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            <div style={{
              padding: 12, borderRadius: 10, textAlign: "center",
              background: "rgba(30,30,60,0.8)", border: "1px solid #444",
            }}>
              <div style={{ fontSize: 9, color: "#888", marginBottom: 4 }}>KẾT QUẢ</div>
              <div style={{
                fontSize: 18, fontWeight: 900,
                color: lastResult === "B" ? "#e63946" : lastResult === "P" ? "#0077b6" : lastResult === "T" ? "#2a9d8f" : "#444",
                textShadow: lastResult ? `0 0 15px ${lastResult === "B" ? "#e63946" : lastResult === "P" ? "#0077b6" : "#2a9d8f"}` : "none",
              }}>
                {lastResult === "B" ? "BANKER" : lastResult === "P" ? "PLAYER" : lastResult === "T" ? "TIE" : "---"}
              </div>
            </div>
            <div style={{
              padding: 12, borderRadius: 10, textAlign: "center",
              background: "rgba(30,30,60,0.8)",
              border: `1px solid ${predSide === "B" ? "#e63946" : "#0077b6"}`,
              boxShadow: `0 0 15px ${predSide === "B" ? "rgba(230,57,70,0.3)" : "rgba(0,119,182,0.3)"}`,
            }}>
              <div style={{ fontSize: 9, color: "#ffd700", marginBottom: 4 }}>DỰ ĐOÁN</div>
              <div style={{
                fontSize: 18, fontWeight: 900,
                color: predSide === "B" ? "#e63946" : "#0077b6",
                textShadow: `0 0 15px ${predSide === "B" ? "#e63946" : "#0077b6"}`,
                animation: "pulse 2s infinite",
              }}>
                {predSide === "B" ? "BANKER" : "PLAYER"}
              </div>
            </div>
          </div>

          {/* Pattern info */}
          <div style={{
            padding: 8, borderRadius: 8, marginBottom: 10,
            background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.15)",
            textAlign: "center",
          }}>
            {selectedTable.cau && <div style={{ fontSize: 10, color: "#ffd700", marginBottom: 2 }}>🎯 {selectedTable.cau}</div>}
            <div style={{ fontSize: 9, color: "#aaa" }}>{selectedTable.thuong_thuat}</div>
            <div style={{ fontSize: 8, color: "#666", marginTop: 2 }}>Cập nhật: {selectedTable.time}</div>
          </div>

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

          {/* Progress */}
          <div>
            <div style={{ position: "relative", height: 3, background: "#1a1a2e", borderRadius: 999, overflow: "hidden" }}>
              <div style={{
                position: "absolute", inset: `0 ${(1 - progress) * 100}% 0 0`,
                background: "linear-gradient(90deg, #a855f7, #ffd700)",
                transition: "inset 0.08s linear",
              }} />
            </div>
            <div style={{ marginTop: 3, fontSize: 9, opacity: 0.5 }}>{lastUpdate}</div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes neonGlow { 0% { filter: hue-rotate(0deg) blur(8px); } 100% { filter: hue-rotate(360deg) blur(8px); } }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.6 } }
        @keyframes loadBar { 0% { width:0 } 50% { width:100% } 100% { width:0 } }
      `}</style>
    </div>
  );
}
