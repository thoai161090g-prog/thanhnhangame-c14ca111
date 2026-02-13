import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { KEY_PACKAGES, formatVND } from "@/lib/md5-analyzer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function BuyKey() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const pkg = KEY_PACKAGES.find((p) => p.id === selectedPkg);
  const transferContent = user ? `KEY_${user.id.slice(0, 8).toUpperCase()}_${selectedPkg?.toUpperCase()}` : "";

  const handleConfirmPayment = async () => {
    if (!user || !pkg) return;
    setConfirming(true);

    // Create pending transaction (admin will approve and create key)
    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      package: pkg.id,
      amount: pkg.price,
      status: "pending",
      transfer_content: transferContent,
    });

    if (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✅ Đã gửi yêu cầu!", description: "Vui lòng chờ Admin duyệt và kích hoạt key cho bạn." });
      // Send Telegram notification
      try {
        await supabase.functions.invoke("telegram-notify", {
          body: {
            email: user.email,
            amount: pkg.price,
            package_name: pkg.label,
            transfer_content: transferContent,
            status: "pending",
          },
        });
      } catch (e) {
        console.error("Telegram notify failed:", e);
      }
    }
    setSelectedPkg(null);
    setConfirming(false);
  };

  return (
    <div className="min-h-screen gradient-vip">
      <header className="py-4 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button variant="ghost" className="text-gold" onClick={() => navigate("/")}>← Trang chủ</Button>
          <h1 className="text-xl font-bold text-gold">🔑 Mua Key Bản Quyền</h1>
          <div />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {!selectedPkg ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {KEY_PACKAGES.map((p) => (
              <Card
                key={p.id}
                className="border-border hover:border-primary transition-all cursor-pointer hover:glow-gold"
                onClick={() => setSelectedPkg(p.id)}
              >
                <CardContent className="p-6 text-center space-y-3">
                  <div className="text-3xl">🔑</div>
                  <h3 className="text-xl font-bold text-gold">{p.label}</h3>
                  <div className="text-3xl font-extrabold text-foreground">{formatVND(p.price)}</div>
                  <Button className="w-full gradient-gold text-primary-foreground font-bold">Chọn Gói</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="max-w-md mx-auto border-border glow-gold">
            <CardHeader>
              <CardTitle className="text-gold text-center">💳 Thanh Toán - Gói {pkg?.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground mb-4">{pkg && formatVND(pkg.price)}</p>
                <img src="/qr-bidv.jpeg" alt="QR BIDV" className="mx-auto rounded-lg max-w-[250px] border border-border" />
                <div className="mt-4 p-3 bg-muted rounded-lg space-y-1 text-sm">
                  <p className="text-muted-foreground">Ngân hàng: <span className="text-foreground font-semibold">BIDV</span></p>
                  <p className="text-muted-foreground">Chủ TK: <span className="text-foreground font-semibold">Nguyen Thanh Nhan</span></p>
                  <p className="text-muted-foreground">STK: <span className="text-gold font-bold">8887596710</span></p>
                  <p className="text-muted-foreground">Nội dung CK: <span className="text-gold font-mono font-bold">{transferContent}</span></p>
                </div>
              </div>
              <Button onClick={handleConfirmPayment} disabled={confirming} className="w-full gradient-gold text-primary-foreground font-bold">
                {confirming ? "Đang xử lý..." : "✅ Đã Chuyển Khoản - Gửi Yêu Cầu Duyệt"}
              </Button>
              <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setSelectedPkg(null)}>
                ← Quay lại chọn gói
              </Button>
            </CardContent>
          </Card>
        )}

        <p className="text-center mt-8 text-muted-foreground text-sm">
          📱 Hỗ trợ: <a href="https://t.me/nhan161019" target="_blank" className="text-gold hover:underline">Telegram @nhan161019</a>
        </p>
      </main>
    </div>
  );
}
