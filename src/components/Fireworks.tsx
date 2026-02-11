import { useEffect } from "react";
import confetti from "canvas-confetti";

export function Fireworks() {
  useEffect(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    const colors = ["#FFD700", "#FF4444", "#FF8C00", "#FFB700"];

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();

    // Repeat every 15 seconds
    const interval = setInterval(() => {
      const end2 = Date.now() + 2000;
      const frame2 = () => {
        confetti({ particleCount: 2, angle: 60, spread: 45, origin: { x: 0, y: 0.8 }, colors });
        confetti({ particleCount: 2, angle: 120, spread: 45, origin: { x: 1, y: 0.8 }, colors });
        if (Date.now() < end2) requestAnimationFrame(frame2);
      };
      frame2();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return null;
}
