import FingerprintJS from '@fingerprintjs/fingerprintjs'

type Agent = Awaited<ReturnType<typeof FingerprintJS.load>>

let fpPromise: Promise<Agent> | null = null

/**
 * Initialize FingerprintJS for security tracking
 */
export async function initFingerprint(): Promise<Agent | null> {
  if (!fpPromise) {
    const apiKey = import.meta.env.VITE_FINGERPRINTJS_API_KEY
    if (!apiKey) {
      // Silently return null if not configured - don't block functionality
      return null
    }
    try {
      fpPromise = FingerprintJS.load({ apiKey } as any)
    } catch (error) {
      console.error('Failed to load FingerprintJS:', error)
      return null
    }
  }
  try {
    return await fpPromise
  } catch (error) {
    console.error('Failed to initialize FingerprintJS:', error)
    return null
  }
}

/**
 * Get visitor fingerprint for security tracking
 */
export async function getVisitorFingerprint(): Promise<{ visitorId: string; confidence: { score: number } }> {
  try {
    const fp = await initFingerprint()
    if (!fp) {
      // Return a fallback fingerprint if FingerprintJS is not configured
      return {
        visitorId: `fallback-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        confidence: { score: 0 },
      }
    }
    const result = await fp.get()
    return {
      visitorId: result.visitorId,
      confidence: result.confidence || { score: 0 },
    }
  } catch (error) {
    // Silently fail and return fallback - don't block functionality
    return {
      visitorId: `fallback-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      confidence: { score: 0 },
    }
  }
}


