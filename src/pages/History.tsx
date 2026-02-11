import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatVND } from "@/lib/md5-analyzer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function History() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [keys, setKeys] = useState<any[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("license_keys").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => setKeys(data || []));
    supabase.from("analysis_history").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50).then(({ data }) => setAnalyses(data || []));
  }, [user]);

  return (
    <div className="min-h-screen gradient-vip">
      <header className="py-4 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Button variant="ghost" className="text-gold" onClick={() => navigate("/")}>← Trang chủ</Button>
          <h1 className="text-xl font-bold text-gold">📜 Lịch Sử</h1>
          <div />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <Tabs defaultValue="keys">
          <TabsList className="bg-muted w-full">
            <TabsTrigger value="keys" className="flex-1">🔑 Key Đã Mua</TabsTrigger>
            <TabsTrigger value="analysis" className="flex-1">🔍 Lịch Sử Phân Tích</TabsTrigger>
          </TabsList>

          <TabsContent value="keys">
            <Card className="border-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Gói</TableHead>
                      <TableHead>Key</TableHead>
                      <TableHead>Giá</TableHead>
                      <TableHead>Hết hạn</TableHead>
                      <TableHead>Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {keys.map((k) => (
                      <TableRow key={k.id}>
                        <TableCell className="font-semibold">{k.package}</TableCell>
                        <TableCell className="font-mono text-xs">{k.key_string}</TableCell>
                        <TableCell>{formatVND(k.price)}</TableCell>
                        <TableCell>{k.expires_at ? new Date(k.expires_at).toLocaleDateString("vi-VN") : "Vĩnh viễn"}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${k.is_active ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"}`}>
                            {k.is_active ? "Hoạt động" : "Hết hạn"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {keys.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Chưa có key nào</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis">
            <Card className="border-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Game</TableHead>
                      <TableHead>MD5</TableHead>
                      <TableHead>Kết quả</TableHead>
                      <TableHead>Tài/Xỉu</TableHead>
                      <TableHead>Tin cậy</TableHead>
                      <TableHead>Thời gian</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analyses.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{a.game}</TableCell>
                        <TableCell className="font-mono text-xs">{a.md5_input.slice(0, 12)}...</TableCell>
                        <TableCell className={`font-bold ${a.result === "Tài" ? "text-gold" : "text-accent"}`}>{a.result}</TableCell>
                        <TableCell>{a.tai_percent}% / {a.xiu_percent}%</TableCell>
                        <TableCell>{a.confidence}%</TableCell>
                        <TableCell>{new Date(a.created_at).toLocaleString("vi-VN")}</TableCell>
                      </TableRow>
                    ))}
                    {analyses.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Chưa có phân tích nào</TableCell></TableRow>
                    )}
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
