import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getRunner } from '@/lib/session'
import { getLiveHeat, getMySubmission } from '@/lib/data'
import { PostForm } from './post-form'
import styles from './page.module.css'

export const metadata = { title: 'Post your run' }

export default async function PostPage() {
  const runner = await getRunner()
  if (!runner) redirect('/signin?next=/post')

  const live = await getLiveHeat()
  if (!live) {
    return (
      <main className={styles.page}>
        <div className={styles.empty}>
          <h1 className={styles.disp}>No heat is live right now.</h1>
          <Link href="/calendar" className={styles.btn}>
            Back to calendar
          </Link>
        </div>
      </main>
    )
  }

  const mine = await getMySubmission(runner.id, live.id)

  return (
    <PostForm
      heat={live}
      alias={runner.alias}
      attempts={mine?.attempts ?? 0}
      initialNote={mine?.note ?? ''}
      initialStatus={mine?.status ?? null}
      initialReason={mine?.review_reason ?? null}
      initialTime={mine?.time_s ?? null}
      initialStampedAt={mine?.created_at ?? null}
    />
  )
}
