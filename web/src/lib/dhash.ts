import { createHash } from 'node:crypto'
import sharp from 'sharp'

export function sha256(buf: Buffer | Uint8Array): string {
  return createHash('sha256').update(buf).digest('hex')
}

// Difference hash: resize to 9×8 greyscale, compare each pixel to its right neighbour,
// pack the 64 bits as 16 hex chars. Two different runners' cards over the same park look
// alike at the pixel level, so callers must also compare parsed time and distance.
export async function dhash(buf: Buffer): Promise<string> {
  const { data } = await sharp(buf).greyscale().resize(9, 8, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true })
  let bits = ''
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const left = data[y * 9 + x]
      const right = data[y * 9 + x + 1]
      bits += left > right ? '1' : '0'
    }
  }
  let hex = ''
  for (let i = 0; i < 64; i += 4) hex += parseInt(bits.slice(i, i + 4), 2).toString(16)
  return hex
}

export function hamming(a: string, b: string): number {
  if (a.length !== b.length) return Infinity
  let d = 0
  for (let i = 0; i < a.length; i++) {
    let v = parseInt(a[i], 16) ^ parseInt(b[i], 16)
    while (v) { d += v & 1; v >>= 1 }
  }
  return d
}
