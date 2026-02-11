import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatVND } from "@/lib/md5-analyzer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [keys, setKeys] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    if (!isAdmin) { navigate("/"); return; }
    loadData();
  }, [isAdmin]);

  const loadData = async () => {
    const [keysRes, txRes, usersRes] = await Promise.all([
      supabase.from("license_keys").select("*").order("created_at", { ascending: false }),
      supabase.from("transactions").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    ]);
    setKeys(keysRes.data || []);
    setTransactions(txRes.data || []);
    setUsers(usersRes.data || []);
    setTotalRevenue((txRes.data || []).filter((t) => t.status === "completed").reduce((s, t) => s + t.amount, 0));
  };

  const toggleKey = async (keyId: string, currentActive: boolean) => {
    await supabase.from("license_keys").update({ is_active: !currentActive }).eq("id", keyId);
    toast({ title: currentActive ? "Đã hủy key" : "Đã kích hoạt key" });
    loadData();
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen gradient-vip">
      <header className="py-4 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Button variant="ghost" className="text-gold" onClick={() => navigate("/")}>← Trang chủ</Button>
          <h1 className="text-xl font-bold text-gold">🔧 Quản Trị Admin</h1>
          <div />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Revenue Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border glow-gold">
            <CardContent className="p-6 text-center">
              <div className="text-sm text-muted-foreground">Tổng Doanh Thu</div>
              <div className="text-3xl font-bold text-gold">{formatVND(totalRevenue)}</div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-6 text-center">
              <div className="text-sm text-muted-foreground">Tổng Key</div>
              <div className="text-3xl font-bold text-foreground">{keys.length}</div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-6 text-center">
              <div className="text-sm text-muted-foreground">Tổng Người Dùng</div>
              <div className="text-3xl font-bold text-foreground">{users.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="keys">
          <TabsList className="bg-muted w-full">
            <TabsTrigger value="keys" className="flex-1">🔑 Quản Lý Key</TabsTrigger>
            <TabsTrigger value="transactions" className="flex-1">💰 Giao Dịch</TabsTrigger>
            <TabsTrigger value="users" className="flex-1">👥 Người Dùng</TabsTrigger>
          </TabsList>

          <TabsContent value="keys">
            <Card className="border-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Key</TableHead>
                      <TableHead>Gói</TableHead>
                      <TableHead>Giá</TableHead>
                      <TableHead>Hết hạn</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {keys.map((k) => (
                      <TableRow key={k.id}>
                        <TableCell className="font-mono text-xs">{k.user_id.slice(0, 8)}</TableCell>
                        <TableCell className="font-mono text-xs">{k.key_string.slice(0, 12)}...</TableCell>
                        <TableCell>{k.package}</TableCell>
                        <TableCell>{formatVND(k.price)}</TableCell>
                        <TableCell>{k.expires_at ? new Date(k.expires_at).toLocaleDateString("vi-VN") : "∞"}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${k.is_active ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"}`}>
                            {k.is_active ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant={k.is_active ? "destructive" : "default"} onClick={() => toggleKey(k.id, k.is_active)}>
                            {k.is_active ? "Hủy" : "Kích hoạt"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card className="border-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Gói</TableHead>
                      <TableHead>Số tiền</TableHead>
                      <TableHead>Nội dung CK</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Thời gian</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono text-xs">{t.user_id.slice(0, 8)}</TableCell>
                        <TableCell>{t.package}</TableCell>
                        <TableCell className="text-gold font-bold">{formatVND(t.amount)}</TableCell>
                        <TableCell className="font-mono text-xs">{t.transfer_content}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded text-xs font-bold bg-green-900 text-green-300">{t.status}</span>
                        </TableCell>
                        <TableCell>{new Date(t.created_at).toLocaleString("vi-VN")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="border-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Ngày đăng ký</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>{u.email}</TableCell>
                        <TableCell className="font-mono text-xs">{u.user_id.slice(0, 8)}</TableCell>
                        <TableCell>{new Date(u.created_at).toLocaleDateString("vi-VN")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
