import { useEffect, useRef, useState } from "react"

/**
 * True once the element has scrolled into view, then stays true (reveal once, no replay on
 * scroll up). `threshold` is how much of the element must be visible, from 0 to 1.
 */
export function useInView<T extends Element>(threshold = 0.2) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element || inView) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [inView, threshold])

  return { ref, inView }
}
