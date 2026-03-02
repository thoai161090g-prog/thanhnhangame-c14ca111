import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const API_URL = "https://lc79dudoan-1.onrender.co/api/sundaicho";
const POLL_MS = 8000;

interface BotData {
  phien: number;
  du_doan: string;
  confidence: string;
  ty_le_thanh_cong: string;
}

function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max);
}

export default function GameLC79() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // Bot data
  const [botData, setBotData] = useState<BotData | null>(null);
  const [online, setOnline] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>("Đang tải dữ liệu…");
  const [progress, setProgress] = useState(0);

  // Draggable
  const botWrapRef = useRef<HTMLDivElement>(null);
  const [showHint, setShowHint] = useState(true);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const dragState = useRef({ dragging: false, startX: 0, startY: 0, startLeft: 0, startTop: 0 });

  const POS_KEY = "lc79_bot_pos";

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(POS_KEY) || "null");
      if (saved) setPos({ x: saved.x, y: saved.y });
    } catch {}
    const t = setTimeout(() => setShowHint(false), 4000);
    return () => clearTimeout(t);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragState.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startLeft: pos.x,
      startTop: pos.y,
    };
    setShowHint(false);
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

  // Polling
  const pull = useCallback(async () => {
    try {
      const resp = await fetch(API_URL, { cache: "no-store" });
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      const j = await resp.json();
      setBotData({
        phien: Number(j.phien) + 1,
        du_doan: j.du_doan ?? "—",
        confidence: j.confidence ?? "—",
        ty_le_thanh_cong: j.ty_le_thanh_cong ?? "—",
      });
      setOnline(true);
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

  // Progress bar animation
  useEffect(() => {
    let raf: number;
    let start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const p = Math.min(elapsed / POLL_MS, 1);
      setProgress(p);
      if (p >= 1) {
        start = now;
        setProgress(0);
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  const duDoan = botData?.du_doan?.toLowerCase() || "";
  const isTai = duDoan.includes("tài") || duDoan.includes("tai");
  const isXiu = duDoan.includes("xỉu") || duDoan.includes("xiu");

  return (
    <div style={{ margin: 0, background: "linear-gradient(180deg, #001a26, #000814)", minHeight: "100vh", overflow: "hidden", fontFamily: "Inter, system-ui, sans-serif", color: "#eaf6ff" }}>
      {/* Top pills */}
      <div
        onClick={() => navigate("/")}
        style={{
          position: "fixed", top: 10, left: 10, padding: "6px 12px", borderRadius: 10,
          fontWeight: 700, zIndex: 10000, background: "#00ccff", color: "#001018",
          boxShadow: "0 6px 18px rgba(0,204,255,.25)", cursor: "pointer", fontSize: 14,
        }}
      >
        ← Trang chủ
      </div>
      <div style={{
        position: "fixed", top: 10, right: 10, padding: "6px 12px", borderRadius: 10,
        fontWeight: 700, zIndex: 10000, background: "#00ccff", color: "#001018",
        boxShadow: "0 6px 18px rgba(0,204,255,.25)", fontSize: 14,
      }}>
        LC79
      </div>

      {/* Draggable Bot */}
      <div
        ref={botWrapRef}
        onPointerDown={onPointerDown}
        style={{
          position: "fixed", left: pos.x, top: pos.y, zIndex: 9999,
          display: "flex", alignItems: "center", gap: 10, touchAction: "none",
          cursor: dragState.current.dragging ? "grabbing" : "grab",
        }}
      >
        {/* Hint */}
        {showHint && (
          <div style={{
            position: "absolute", top: -24, left: 0, background: "#03202b",
            border: "1px solid #075b6b", color: "#b9ecff", padding: "2px 8px",
            borderRadius: 8, fontSize: 12, whiteSpace: "nowrap",
            boxShadow: "0 6px 18px rgba(0,0,0,.2)",
          }}>
            Kéo giữ để di chuyển
          </div>
        )}

        {/* Robot image */}
        <img
          src="/robot-vip.png"
          alt="Robot"
          draggable={false}
          style={{ width: 120, height: "auto", userSelect: "none", pointerEvents: "none" }}
          onError={(e) => { (e.target as HTMLImageElement).src = "https://i.postimg.cc/63bdy9D9/robotics-1.gif"; }}
        />

        {/* Bot Panel */}
        <div style={{
          minWidth: 260, maxWidth: "min(70vw, 420px)",
          background: "rgba(11,34,48,0.8)", backdropFilter: "blur(6px)",
          border: "1px solid #0ea5b7", borderRadius: 12, padding: "10px 12px",
          color: "#eaf6ff", boxShadow: "0 8px 24px rgba(0,0,0,.35), inset 0 0 0 1px rgba(255,255,255,.04)",
        }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
            <div style={{
              background: "#012734", border: "1px solid #0ea5b7", padding: "2px 8px",
              borderRadius: 999, fontSize: 12, fontWeight: 700, letterSpacing: 0.3,
            }}>
              BOT DỰ ĐOÁN
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12 }}>Trạng thái</span>
              <div style={{
                width: 10, height: 10, borderRadius: "50%",
                background: online ? "#22c55e" : "#f97316",
                boxShadow: online ? "0 0 0 6px #16a34a22" : "0 0 0 6px #ff7d1a22",
                marginLeft: 6,
              }} />
            </div>
          </div>

          {/* Summary */}
          <div style={{ fontWeight: 800, fontSize: 16, margin: "6px 0 8px" }}>
            {botData
              ? `${botData.ty_le_thanh_cong} • ${botData.confidence} • ${botData.du_doan} • Phiên: ${botData.phien}`
              : "Đang tải…"}
          </div>

          {/* Details */}
          <div>
            <p style={{ margin: "4px 0", fontSize: 14, opacity: 0.9 }}>
              Tỉ lệ: <span style={{ fontWeight: 800, color: "#22d3ee" }}>{botData?.ty_le_thanh_cong ?? "…"}</span>
            </p>
            <p style={{ margin: "4px 0", fontSize: 14, opacity: 0.9 }}>
              Độ tin cậy: <span style={{ fontWeight: 800, color: "#facc15" }}>{botData?.confidence ?? "…"}</span>
            </p>
            <p style={{ margin: "4px 0", fontSize: 14, opacity: 0.9 }}>
              Dự đoán: <span style={{
                fontWeight: 800,
                color: isTai ? "#22d3ee" : isXiu ? "#fca5a5" : "#eaf6ff",
              }}>{botData?.du_doan ?? "…"}</span>
            </p>
            <p style={{ margin: "4px 0", fontSize: 14, opacity: 0.9 }}>
              Phiên: <span style={{ fontWeight: 800 }}>{botData?.phien ?? "…"}</span>
            </p>

            {/* Progress bar */}
            <div style={{
              position: "relative", height: 6, background: "#0a2a38",
              borderRadius: 999, overflow: "hidden", marginTop: 8,
            }}>
              <div style={{
                position: "absolute", inset: `0 ${(1 - progress) * 100}% 0 0`,
                background: "linear-gradient(90deg, #22d3ee, #0ea5b7)",
                transition: "inset 0.08s linear",
              }} />
            </div>

            <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>{lastUpdate}</div>
          </div>
        </div>
      </div>

      {/* Embedded iframe */}
      <iframe
        src="https://web.lc79.org"
        style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", border: "none" }}
        title="LC79 Game"
      />
    </div>
  );
}
