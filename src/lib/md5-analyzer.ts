export function validMd5(s: string): boolean {
  return s.length === 32 && /^[0-9a-fA-F]+$/.test(s);
}

// Analysis is now handled server-side for security
// Do not expose algorithm in client code

export const KEY_PACKAGES = [
  { id: "1day", label: "1 Ngày", price: 25000, days: 1 },
  { id: "3days", label: "3 Ngày", price: 55000, days: 3 },
  { id: "1week", label: "1 Tuần", price: 89000, days: 7 },
  { id: "1month", label: "1 Tháng", price: 120000, days: 30 },
  { id: "lifetime", label: "Vĩnh Viễn", price: 177000, days: null },
] as const;

export const GAMES = [
  { id: "68gb", name: "68 Game Bài", icon: "🎰", image: "/game-68gb.jpeg" },
  { id: "lc79", name: "LC79", icon: "🎲", image: null },
  { id: "thien-duong", name: "Thiên Đường Trò Chơi", icon: "🏆", image: "/game-thien-duong.jpeg" },
  { id: "sao789", name: "Sao 789", icon: "⭐", image: "/game-sao789.png" },
  { id: "ta28", name: "TA28", icon: "🎯", image: "/game-ta28.png" },
  { id: "betvip", name: "BetVIP", icon: "🔥", image: null },
] as const;

export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
}
