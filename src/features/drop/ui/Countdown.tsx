import { useEffect, useState } from "react";

import { cn } from "@/shared/lib/utils";

type Remaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
};

function computeRemaining(targetMs: number): Remaining {
  const diff = targetMs - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  }
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    done: false,
  };
}

const pad = (value: number) => value.toString().padStart(2, "0");

/** 오픈 시각까지 남은 시간을 1초 단위로 갱신해 보여주는 카운트다운. */
export function Countdown({ target, className }: { target: string; className?: string }) {
  const targetMs = new Date(target).getTime();
  const [remaining, setRemaining] = useState(() => computeRemaining(targetMs));

  useEffect(() => {
    setRemaining(computeRemaining(targetMs));
    const id = setInterval(() => setRemaining(computeRemaining(targetMs)), 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  if (remaining.done) {
    return <span className={cn("text-muted-foreground text-sm", className)}>곧 오픈</span>;
  }

  const units = [
    { label: "일", value: remaining.days },
    { label: "시간", value: remaining.hours },
    { label: "분", value: remaining.minutes },
    { label: "초", value: remaining.seconds },
  ];

  return (
    <div className={cn("flex items-end gap-4", className)}>
      {units.map((unit) => (
        <div key={unit.label} className="flex flex-col items-center">
          <span className="font-semibold text-3xl text-foreground leading-none tabular-nums sm:text-4xl">
            {pad(unit.value)}
          </span>
          <span className="mt-2 text-[0.65rem] text-muted-foreground uppercase tracking-[0.15em]">
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  );
}
