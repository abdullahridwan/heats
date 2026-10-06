import 'server-only'
import { clerkClient } from '@clerk/nextjs/server'
import { auth } from '@clerk/nextjs/server'

export type Me = { id: string; email: string; name: string | null; avatarUrl: string | null }

// Who is this, and the pieces /api/me/profile needs. Clerk is the only source of identity.
export async function getMe(): Promise<Me | null> {
  const { userId } = await auth()
  if (!userId) return null
  const user = await (await clerkClient()).users.getUser(userId)
  const email =
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    ''
  return {
    id: userId,
    email: email.toLowerCase(),
    name: user.fullName ?? user.username ?? null,
    avatarUrl: user.hasImage ? user.imageUrl : null,
  }
}

// Admin is Clerk publicMetadata.role === "admin". One extra Clerk call, admin routes only.
export async function isAdmin(): Promise<boolean> {
  const { userId } = await auth()
  if (!userId) return false
  const user = await (await clerkClient()).users.getUser(userId)
  return user.publicMetadata?.role === 'admin'
}
