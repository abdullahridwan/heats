import type { ReactNode } from 'react'

export function LaneFrame({ children, footer }: { children: ReactNode; footer: ReactNode }) {
  return (
    <div className="lane">
      <div className="lane-blue">
        <div className="lane-indigo">
          <div className="lane-navy">
            <div className="lane-card">{children}</div>
            {footer}
          </div>
        </div>
      </div>
    </div>
  )
}
