import { useState, useEffect, useRef } from 'react';
import { Headphones, Play, Pause, X, Volume2 } from 'lucide-react';

interface Props { text: string; }

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

export function TextToSpeech({ text }: Props) {
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(() => Number(localStorage.getItem('tts_speed') || '1'));
  const [volume, setVolume] = useState(1);
  const [supported, setSupported] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) setSupported(false);
    return () => { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); };
  }, []);

  useEffect(() => { localStorage.setItem('tts_speed', String(speed)); }, [speed]);

  const clean = text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

  const start = () => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clean);
    u.rate = speed; u.volume = volume;
    u.onend = () => setPlaying(false);
    utteranceRef.current = u;
    window.speechSynthesis.speak(u);
    setPlaying(true);
  };

  const toggle = () => {
    if (!supported) return;
    if (playing) { window.speechSynthesis.pause(); setPlaying(false); }
    else if (window.speechSynthesis.paused) { window.speechSynthesis.resume(); setPlaying(true); }
    else start();
  };

  const close = () => { window.speechSynthesis.cancel(); setPlaying(false); setOpen(false); };

  if (!supported) return null;

  return (
    <>
      <button onClick={() => { setOpen(true); start(); }}
        className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:border-primary transition-all">
        <Headphones className="h-4 w-4" /> Listen
      </button>
      {open && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 z-40 shadow-lg">
          <div className="container mx-auto flex items-center gap-4 flex-wrap">
            <button onClick={toggle} className="p-3 bg-primary text-primary-foreground rounded-full hover:opacity-90">
              {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-1 text-xs">
              {SPEEDS.map(s => (
                <button key={s} onClick={() => { setSpeed(s); if (playing) start(); }}
                  className={`px-2 py-1 rounded ${speed === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>{s}x</button>
              ))}
            </div>
            <div className="flex items-center gap-2 flex-1 min-w-[150px] max-w-xs">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <input type="range" min={0} max={1} step={0.1} value={volume}
                onChange={e => { const v = Number(e.target.value); setVolume(v); if (utteranceRef.current) utteranceRef.current.volume = v; }}
                className="flex-1" />
            </div>
            <button onClick={close} className="p-2 hover:bg-accent rounded-lg"><X className="h-5 w-5" /></button>
          </div>
        </div>
      )}
    </>
  );
}
