import { encode, decode } from "https://deno.land/std@0.168.0/encoding/base64url.ts"

interface JWTPayload {
  userId: string
  email: string
  emailVerified: boolean
  iat: number
  exp: number
}

const JWT_SECRET = Deno.env.get('JWT_SECRET') || 'your-super-secret-jwt-key-change-this-in-production'

export async function createJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const fullPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp: now + (365 * 24 * 60 * 60) // 1 year expiration
  }

  const header = {
    alg: 'HS256',
    typ: 'JWT'
  }

  const encodedHeader = encode(JSON.stringify(header))
  const encodedPayload = encode(JSON.stringify(fullPayload))
  
  const signature = await createSignature(`${encodedHeader}.${encodedPayload}`)
  
  return `${encodedHeader}.${encodedPayload}.${signature}`
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    const [encodedHeader, encodedPayload, signature] = parts
    
    // Verify signature
    const expectedSignature = await createSignature(`${encodedHeader}.${encodedPayload}`)
    if (signature !== expectedSignature) {
      return null
    }

    // Decode payload
    const payload = JSON.parse(new TextDecoder().decode(decode(encodedPayload))) as JWTPayload
    
    // Check expiration
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }

    return payload
  } catch (error) {
    console.error('JWT verification error:', error)
    return null
  }
}

async function createSignature(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return encode(new Uint8Array(signature))
}
