import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'

/** Keeps every control visible without introducing an inner scrollbar. */
export default function FitContent({ children }: { children: ReactNode }) {
  const host = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const outer = host.current
    const inner = content.current
    if (!outer || !inner) return
    const fit = () => setScale(Math.min(1, outer.clientHeight / Math.max(1, inner.scrollHeight)))
    const observer = new ResizeObserver(fit)
    observer.observe(outer)
    observer.observe(inner)
    fit()
    return () => observer.disconnect()
  }, [])

  return <div ref={host} className="fit-content"><div ref={content} className="fit-content-inner" style={{ transform: `scale(${scale})` }}>{children}</div></div>
}
