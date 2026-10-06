import 'server-only'
import { renderPng } from './story'

export function pngResponse(svg: string, filename: string, download: boolean) {
  const png = renderPng(svg)
  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
      ...(download ? { 'Content-Disposition': `attachment; filename="${filename}"` } : {}),
    },
  })
}
