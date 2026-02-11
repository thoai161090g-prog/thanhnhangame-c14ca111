import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = isLogin ? await signIn(email, password) : await signUp(email, password);
    setLoading(false);

    if (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } else {
      if (!isLogin) {
        toast({ title: "Thành công", description: "Đăng ký thành công! Đang đăng nhập..." });
      }
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen gradient-vip flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border glow-gold">
        <CardHeader className="text-center">
          <h1 className="text-3xl font-bold text-gold text-shadow-gold mb-2">🏆 Thành Nhân VIP</h1>
          <CardTitle className="text-foreground">{isLogin ? "Đăng Nhập" : "Đăng Ký"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-muted border-border"
            />
            <Input
              type="password"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="bg-muted border-border"
            />
            <Button type="submit" disabled={loading} className="w-full gradient-gold text-primary-foreground font-bold">
              {loading ? "Đang xử lý..." : isLogin ? "Đăng Nhập" : "Đăng Ký"}
            </Button>
          </form>
          <p className="text-center mt-4 text-muted-foreground">
            {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-gold hover:underline">
              {isLogin ? "Đăng ký" : "Đăng nhập"}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
