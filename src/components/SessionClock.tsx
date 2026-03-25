import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';

const SessionClock = () => {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const utcHour = time.getUTCHours();
  const isLondon = utcHour >= 7 && utcHour < 10;
  const isNY = utcHour >= 12 && utcHour < 15;
  
  return (
    <div className="flex items-center gap-4 bg-zinc-900/40 px-4 py-2 rounded-2xl border border-zinc-800/50 backdrop-blur-xl">
      <div className="flex flex-col items-center">
        <span className="micro-label text-zinc-500 mb-1">UTC PROTOCOL</span>
        <span className="text-sm font-sans font-bold text-zinc-100 leading-none">
          {time.getUTCHours().toString().padStart(2, '0')}:
          {time.getUTCMinutes().toString().padStart(2, '0')}:
          {time.getUTCSeconds().toString().padStart(2, '0')}
        </span>
      </div>
      <div className="w-px h-6 bg-zinc-800" />
      <div className="flex gap-3">
        <div className="flex flex-col items-center">
          <span className="micro-label text-zinc-500 mb-1">LDN</span>
          <div className={cn("w-2 h-2 rounded-full", isLondon ? "bg-emerald-500 animate-pulse emerald-glow" : "bg-zinc-800")} />
        </div>
        <div className="flex flex-col items-center">
          <span className="micro-label text-zinc-500 mb-1">NYC</span>
          <div className={cn("w-2 h-2 rounded-full", isNY ? "bg-emerald-500 animate-pulse emerald-glow" : "bg-zinc-800")} />
        </div>
      </div>
    </div>
  );
};

export default React.memo(SessionClock);
