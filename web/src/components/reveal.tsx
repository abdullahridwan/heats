'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

// Marks [data-reveal] elements with data-in once they scroll into view, which starts their CSS
// entrance animations. Works the same on phones (no hover needed).
export function RevealObserver() {
  const pathname = usePathname()
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('[data-reveal]:not([data-in])'))
    if (!('IntersectionObserver' in window)) { els.forEach(e => e.setAttribute('data-in', '')); return }
    const io = new IntersectionObserver(entries => {
      for (const e of entries) if (e.isIntersecting) { e.target.setAttribute('data-in', ''); io.unobserve(e.target) }
    }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' })
    els.forEach(e => io.observe(e))
    return () => io.disconnect()
  }, [pathname])
  return null
}
