import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { GAMES } from "@/lib/md5-analyzer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Fireworks } from "@/components/Fireworks";

export default function Index() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-vip relative overflow-hidden">
      <Fireworks />

      {/* Header */}
      <header className="relative z-10 py-6 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gold text-shadow-gold">
            🏆 Thành Nhân VIP MD5
          </h1>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Button variant="outline" className="border-gold text-gold" onClick={() => navigate("/admin")}>
                🔧 Admin
              </Button>
            )}
            <Button variant="outline" className="border-gold text-gold" onClick={() => navigate("/buy-key")}>
              🔑 Mua Key
            </Button>
            <Button variant="outline" className="border-gold text-gold" onClick={() => navigate("/history")}>
              📜 Lịch sử
            </Button>
            <Button variant="ghost" className="text-muted-foreground" onClick={signOut}>
              Đăng xuất
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 text-center py-8 px-4">
        <p className="text-foreground text-lg mb-2">Xin chào, <span className="text-gold font-semibold">{user?.email}</span></p>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-1">Dự Đoán Tài Xỉu Chính Xác</h2>
        <p className="text-muted-foreground">Phân tích mã MD5 bằng thuật toán nâng cao</p>
        <p className="mt-4 text-muted-foreground text-sm">
          📱 Liên hệ Admin Telegram: <a href="https://t.me/nhan161019" target="_blank" className="text-gold hover:underline">@nhan161019</a>
        </p>
      </section>

      {/* Game Cards */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 pb-16">
        <h3 className="text-xl font-bold text-gold mb-6 text-center">🎮 Chọn Game Để Phân Tích</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {GAMES.map((game) => (
            <Card
              key={game.id}
              className="cursor-pointer border-border hover:border-primary transition-all duration-300 hover:glow-gold group"
              onClick={() => navigate(`/game/${game.id}`)}
            >
              <CardContent className="p-6 text-center">
                <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">{game.icon}</div>
                <h4 className="font-bold text-foreground group-hover:text-gold transition-colors">{game.name}</h4>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
