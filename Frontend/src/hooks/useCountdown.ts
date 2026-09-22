import { useState, useEffect, useRef } from 'react';
import { TimeLeft } from '../types';

const calculateTimeLeft = (targetDate: string): TimeLeft => {
  const total = new Date(targetDate).getTime() - Date.now();
  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }
  return {
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((total % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((total % (1000 * 60)) / 1000),
    total,
  };
};

export const useCountdown = (targetDate: string | null): TimeLeft => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(
    targetDate
      ? calculateTimeLeft(targetDate)
      : { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!targetDate) return;

    setTimeLeft(calculateTimeLeft(targetDate));

    intervalRef.current = setInterval(() => {
      const left = calculateTimeLeft(targetDate);
      setTimeLeft(left);
      if (left.total <= 0 && intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [targetDate]);

  return timeLeft;
};
