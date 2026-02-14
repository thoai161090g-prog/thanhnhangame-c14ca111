import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { GAMES } from "@/lib/md5-analyzer";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

export default function Index() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      background: "linear-gradient(180deg, #c0392b 0%, #e74c3c 20%, #d35400 50%, #1a0a00 100%)"
    }}>
      {/* Top decorative glow */}
      <div className="absolute top-0 left-0 right-0 h-40 pointer-events-none" style={{
        background: "radial-gradient(ellipse at 50% 0%, rgba(255,200,50,0.3) 0%, transparent 70%)"
      }} />

      {/* Header */}
      <header className="relative z-10 py-4 px-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-xl font-black tracking-wider" style={{
            background: "linear-gradient(135deg, #ffae00, #ffd700)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: "none",
          }}>
            🏆 MD5 VIP Tool
          </h1>
          <Sheet>
            <SheetTrigger asChild>
              <button className="text-gold p-2">
                <Menu className="h-6 w-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-background border-border w-64">
              <nav className="flex flex-col gap-3 mt-8">
                {isAdmin && (
                  <button className="text-left px-4 py-3 rounded-xl font-bold text-sm border border-gold/30 text-gold hover:bg-gold/10 transition" onClick={() => navigate("/admin")}>
                    🔧 Admin
                  </button>
                )}
                <button className="text-left px-4 py-3 rounded-xl font-bold text-sm border border-gold/30 text-gold hover:bg-gold/10 transition" onClick={() => navigate("/buy-key")}>
                  🔑 Mua Key
                </button>
                <button className="text-left px-4 py-3 rounded-xl font-bold text-sm border border-gold/30 text-gold hover:bg-gold/10 transition" onClick={() => navigate("/history")}>
                  📜 Lịch sử
                </button>
                <button className="text-left px-4 py-3 rounded-xl font-bold text-sm text-muted-foreground hover:text-foreground transition" onClick={signOut}>
                  🚪 Đăng xuất
                </button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* User info */}
      <section className="relative z-10 text-center px-4 pb-2">
        <p className="text-sm text-white/80">Xin chào, <span className="text-gold font-bold">{user?.email}</span></p>
      </section>

      {/* Section Title */}
      <section className="relative z-10 text-center py-4 px-4">
        <h2 className="text-xl font-black tracking-wide" style={{
          background: "linear-gradient(135deg, #ffae00, #ffd700)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          🎮 CHỌN NHÀ CÁI - NHẬN LỘC ĐẦU NĂM
        </h2>
      </section>

      {/* Game Cards Grid */}
      <section className="relative z-10 max-w-lg mx-auto px-4 pb-8">
        <div className="grid grid-cols-2 gap-4">
          {GAMES.map((game) => (
            <div
              key={game.id}
              className="rounded-2xl p-[2px] cursor-pointer transition-transform hover:scale-[1.03] active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #ffae00, #ff8c00, #ffae00)",
              }}
              onClick={() => navigate(`/game/${game.id}`)}
            >
              <div className="rounded-2xl p-4 flex flex-col items-center gap-3" style={{
                background: "rgba(255,248,230,0.95)",
              }}>
                {/* Game icon */}
                <div className="w-16 h-16 rounded-xl flex items-center justify-center text-4xl" style={{
                  background: "linear-gradient(135deg, #fff5e0, #ffe4b3)",
                  boxShadow: "0 4px 15px rgba(255,174,0,0.3)",
                }}>
                  {game.icon}
                </div>
                <span className="font-bold text-sm" style={{ color: "#1a0a00" }}>{game.name}</span>
                <button className="w-full py-2.5 rounded-xl font-black text-sm tracking-wider transition-all hover:brightness-110" style={{
                  background: "linear-gradient(135deg, #ff8c00, #ffae00, #ffd000)",
                  color: "#1a0a00",
                  boxShadow: "0 3px 12px rgba(255,174,0,0.4)",
                }}>
                  MỞ TOOL
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Logout Button */}
      <section className="relative z-10 max-w-lg mx-auto px-4 pb-6">
        <button
          onClick={signOut}
          className="w-full py-4 rounded-full font-black text-base tracking-wider"
          style={{
            background: "linear-gradient(135deg, rgba(255,174,0,0.15), rgba(255,174,0,0.05))",
            border: "2px solid rgba(255,174,0,0.4)",
            color: "#ff6a6a",
          }}
        >
          ✨ ĐĂNG XUẤT - HẸN GẶP LẠI ✨
        </button>
      </section>

      {/* Footer */}
      <section className="relative z-10 max-w-lg mx-auto px-4 pb-8">
        <div className="rounded-2xl p-4 text-center" style={{
          background: "rgba(255,174,0,0.1)",
          border: "1px solid rgba(255,174,0,0.2)",
        }}>
          <p className="text-sm font-bold" style={{ color: "#ffd700" }}>
            🎊 CUNG CHÚC TÂN XUÂN - VẠN SỰ NHƯ Ý - PHÁT TÀI PHÁT LỘC 2026 🎊
          </p>
        </div>
        <p className="text-center mt-4 text-xs text-white/50">
          📱 Liên hệ Admin: <a href="https://t.me/nhan161019" target="_blank" className="text-gold hover:underline">@nhan161019</a>
        </p>
      </section>
    </div>
  );
}
