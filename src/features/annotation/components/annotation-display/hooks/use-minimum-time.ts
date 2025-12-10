import { useState, useEffect, useCallback } from "react";

export const useMinimumTime = (seconds: number) => {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    // Reset timer when seconds changes (e.g. new article loaded)
    setTimeLeft(seconds);
  }, [seconds]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const resetTimer = useCallback(() => {
    setTimeLeft(seconds);
  }, [seconds]);

  return {
    timeLeft,
    isCompleted: timeLeft <= 0,
    resetTimer,
    formattedTime: `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, "0")}`,
  };
};
