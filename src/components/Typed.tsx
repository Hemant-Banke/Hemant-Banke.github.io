import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../lib/hooks";

/**
 * Types out an array of lines one character at a time. With reduced motion, all
 * lines appear immediately. A blinking caret trails the active line.
 */
export default function Typed({
  lines,
  speed = 34,
  startDelay = 350,
  className,
}: {
  lines: string[];
  speed?: number;
  startDelay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState<string[]>(reduced ? lines : []);
  const [done, setDone] = useState(reduced);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (reduced) {
      setShown(lines);
      setDone(true);
      return;
    }
    setShown([]);
    setDone(false);
    let li = 0;
    let ci = 0;
    const acc: string[] = [];
    const step = () => {
      if (li >= lines.length) {
        setDone(true);
        return;
      }
      const line = lines[li];
      acc[li] = line.slice(0, ci);
      setShown([...acc]);
      ci++;
      if (ci > line.length) {
        li++;
        ci = 0;
        timers.current.push(window.setTimeout(step, 320));
      } else {
        timers.current.push(window.setTimeout(step, speed));
      }
    };
    timers.current.push(window.setTimeout(step, startDelay));
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [lines, speed, startDelay, reduced]);

  return (
    <div className={className} aria-label={lines.join(". ")}>
      {shown.map((l, i) => (
        <div key={i} className="typed-line">
          <span className="accent-green" aria-hidden="true">
            $&nbsp;
          </span>
          {l}
          {!done && i === shown.length - 1 && (
            <span className="blink" aria-hidden="true">
              █
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
