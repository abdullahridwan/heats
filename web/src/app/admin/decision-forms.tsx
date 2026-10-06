'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function DecisionForms({ id }: { id: string }) {
  const router = useRouter()
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  async function decide(decision: 'verify' | 'reject') {
    setBusy(true)
    try {
      await fetch(`/api/admin/submissions/${id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, reason }),
      })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="row-actions">
      <button className="btn volt sm" type="button" disabled={busy} onClick={() => decide('verify')}>Approve and stamp</button>
      <input className="input" value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason, e.g. distance is 3.2 km" style={{ width: 260, padding: '8px 12px', fontSize: 14 }} aria-label="Reason for rejecting" />
      <button className="btn ghost sm" type="button" disabled={busy} onClick={() => decide('reject')}>Reject</button>
    </div>
  )
}
