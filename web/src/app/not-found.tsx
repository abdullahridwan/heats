import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="wrap narrow">
      <section className="s first">
        <div className="head">
          <span className="eyebrow">404</span>
          <h2>Wrong turn on the course.</h2>
          <p>That page doesn&apos;t exist. The next heat does.</p>
        </div>
        <Link className="btn" href="/" style={{ justifySelf: 'start' }}>Back to the heat</Link>
      </section>
    </main>
  )
}
