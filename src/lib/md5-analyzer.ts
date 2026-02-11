export function validMd5(s: string): boolean {
  return s.length === 32 && /^[0-9a-fA-F]+$/.test(s);
}

export function analyzeMd5(md5: string) {
  const x = BigInt("0x" + md5);

  // Enhanced algorithm with multiple hash segments
  const seg1 = Number(x % 100n);
  const seg2 = Number((x >> 8n) % 100n);
  const seg3 = Number((x >> 16n) % 100n);
  const seg4 = Number((x >> 32n) % 100n);

  // Weighted combination
  const weightedScore = (seg1 * 0.4 + seg2 * 0.25 + seg3 * 0.2 + seg4 * 0.15);

  const tai = Math.round(weightedScore);
  const xiu = 100 - tai;
  const confidence = Math.min(Math.abs(tai - xiu) + 50, 99);
  const result = tai >= 50 ? "Tài" : "Xỉu";

  return { tai, xiu, confidence, result };
}

export const KEY_PACKAGES = [
  { id: "1day", label: "1 Ngày", price: 35000, days: 1 },
  { id: "3days", label: "3 Ngày", price: 70000, days: 3 },
  { id: "1week", label: "1 Tuần", price: 111000, days: 7 },
  { id: "1month", label: "1 Tháng", price: 150000, days: 30 },
  { id: "lifetime", label: "Vĩnh Viễn", price: 250000, days: null },
] as const;

export const GAMES = [
  { id: "68gb", name: "68 Game Bài", icon: "🎰" },
  { id: "lc79", name: "LC79", icon: "🎲" },
  { id: "thien-duong", name: "Thiên Đường Trò Chơi", icon: "🏆" },
  { id: "sao789", name: "Sao 789", icon: "⭐" },
  { id: "ta28", name: "TA28", icon: "🎯" },
] as const;

export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
}
