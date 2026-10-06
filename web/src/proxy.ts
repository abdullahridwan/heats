import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// /post is public so the signed-out "claim your stamp" page works. Everything that writes,
// and admin, is behind auth.
const isProtected = createRouteMatcher([
  '/onboarding(.*)',
  '/p/(.*)',
  '/admin(.*)',
  '/api/((?!story).)*',
])

export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) await auth.protect()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
