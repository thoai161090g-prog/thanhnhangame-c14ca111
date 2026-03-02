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

      {/* Game Cards Grid */}
      <section className="relative z-10 max-w-2xl mx-auto px-3 pb-8">
        <div className="grid grid-cols-4 gap-2.5">
          {GAMES.map((game) => (
            <div
              key={game.id}
              className="rounded-xl cursor-pointer transition-all hover:scale-[1.03] active:scale-[0.97] hover:ring-2 hover:ring-yellow-400/60"
              style={{
                background: "rgba(30, 41, 59, 0.85)",
                border: "1px solid rgba(100, 116, 139, 0.3)",
              }}
              onClick={() => navigate(`/game/${game.id}`)}
            >
              <div className="rounded-xl p-3 flex flex-col items-center gap-2">
                {game.image ? (
                  <img src={game.image} alt={game.name} className="w-11 h-11 rounded-lg object-cover" />
                ) : (
                  <div className="w-11 h-11 rounded-lg flex items-center justify-center text-2xl" style={{
                    background: "linear-gradient(135deg, rgba(100,116,139,0.4), rgba(51,65,85,0.6))",
                  }}>
                    {game.icon}
                  </div>
                )}
                <div className="text-center">
                  <p className="font-bold text-xs text-white leading-tight truncate w-full">{game.name}</p>
                  <p className="text-[10px] text-slate-400">{game.subtitle}</p>
                </div>
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
