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
  { id: "sunwin", name: "SUNWIN", subtitle: "Game bài", icon: "👑", image: null },
  { id: "hitclub", name: "HITCLUB", subtitle: "Bắn cá", icon: "🎯", image: null },
  { id: "68gb", name: "68GAMEBAI", subtitle: "Đại lý", icon: "✈️", image: "/game-68gb.jpeg" },
  { id: "sao789", name: "SAO789", subtitle: "Slot game", icon: "🎰", image: "/game-sao789.png" },
  { id: "son789", name: "SON789", subtitle: "Casino", icon: "📊", image: null },
  { id: "sumclub", name: "SUMCLUB", subtitle: "Lộc phát", icon: "🍀", image: null },
  { id: "ta28", name: "TA28", subtitle: "Quay hũ", icon: "💧", image: "/game-ta28.png" },
  { id: "tik88", name: "TIK88", subtitle: "Tài xỉu", icon: "🎲", image: null },
  { id: "rikvip", name: "RIKVIP", subtitle: "Game bài", icon: "👑", image: null },
  { id: "betvip", name: "BETVIP", subtitle: "Nổ hũ", icon: "⭐", image: null },
  { id: "b52", name: "B52", subtitle: "B52 club", icon: "✈️", image: null },
  { id: "789club", name: "789CLUB", subtitle: "Macau", icon: "🎰", image: null },
  { id: "lc79", name: "LC79", subtitle: "Game bài", icon: "👑", image: null },
  { id: "xocdia88", name: "XOCDIA88", subtitle: "Xóc đĩa", icon: "🎵", image: null },
  { id: "thien-duong", name: "THIÊN ĐƯỜNG TRÒ CHƠI", subtitle: "Casino", icon: "🦊", image: "/game-thien-duong.jpeg" },
  { id: "baccarat", name: "BACCARAT", subtitle: "Bài", icon: "♥️", image: "/game-baccarat.png" },
] as const;

export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
}
