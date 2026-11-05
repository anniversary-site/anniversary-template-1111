// URLUV 백엔드에서 고객 사이트를 불러옵니다.
// 주소가 /pepero/{사이트키} 또는 ?site={사이트키}이면 백엔드 모드, 아니면 config.js 데모 화면입니다.
// 비밀번호 확인과 사진·문구는 모두 서버가 맡고, 이 파일에는 고객 정보가 들어가지 않습니다.

const API_URL = (import.meta.env.VITE_API_URL ?? 'https://dh7rgee1s6v8m.cloudfront.net/api/v1').replace(/\/+$/, '')
const SITE_KEY = /^[a-km-np-z2-9]{12}$/

export function siteKeyFromLocation(location = window.location) {
  const last = location.pathname.split('/').filter(Boolean).pop()
  if (SITE_KEY.test(last ?? '')) return last
  const query = new URLSearchParams(location.search).get('site')
  return SITE_KEY.test(query ?? '') ? query : null
}

/**
 * 운영자 미리보기: 관리자 화면이 연 주소 끝의 #preview={토큰}. 주소창에서는 바로 지워 다른 사람에게 복사되지 않게 하고,
 * 새로고침해도 이어지도록 이 탭에만 기억합니다. 토큰은 30분 뒤 서버가 거절합니다.
 */
export function previewTokenFromLocation(siteKey, location = window.location) {
  if (!siteKey) return null
  const key = `pepero:v1:preview:${siteKey}`
  const fromHash = new URLSearchParams(location.hash.slice(1)).get('preview')
  try {
    if (fromHash) {
      sessionStorage.setItem(key, fromHash)
      history.replaceState(null, '', location.pathname + location.search)
      return fromHash
    }
    return sessionStorage.getItem(key)
  } catch {
    return fromHash
  }
}

export class SiteError extends Error {
  constructor(status, code, message) {
    super(message)
    this.status = status
    this.code = code
  }
}

async function call(path, { method = 'GET', body, token } = {}) {
  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new SiteError(0, 'NETWORK', '연결이 불안정해요. 잠시 후 다시 시도해주세요.')
  }
  const json = await response.json().catch(() => null)
  if (!response.ok || !json?.success) {
    throw new SiteError(response.status, json?.error?.code ?? 'UNKNOWN', json?.error?.message ?? '사이트를 불러오지 못했어요.')
  }
  return json.data
}

const tokenKey = siteKey => `pepero:v1:token:${siteKey}`

export const getLock = siteKey => call(`/sites/${siteKey}/lock`)

export async function unlock(siteKey, password) {
  const result = await call(`/sites/${siteKey}/unlock`, { method: 'POST', body: { password } })
  try { sessionStorage.setItem(tokenKey(siteKey), JSON.stringify(result)) } catch { /* 저장이 막혀도 이번 화면은 열립니다. */ }
  return result.siteAccessToken
}

/** 이전에 연 토큰이 남아 있으면 돌려줍니다. 만료됐거나 없으면 null. */
export function savedToken(siteKey) {
  try {
    const saved = JSON.parse(sessionStorage.getItem(tokenKey(siteKey)))
    return saved?.siteAccessToken && Date.parse(saved.expiresAt) > Date.now() ? saved.siteAccessToken : null
  } catch {
    return null
  }
}

export function forgetToken(siteKey) {
  try { sessionStorage.removeItem(tokenKey(siteKey)) } catch { /* 무시 */ }
}

export const getContent = (siteKey, token) => call(`/sites/${siteKey}`, { token })

/** 사이트 키로 정해지는 난수. 같은 사이트는 새로고침해도 같은 배치가 나옵니다. */
function seededRandom(seed) {
  let h = 2166136261
  for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

/**
 * 고객 사진을 사진 자리 수(slots)만큼 채웁니다. 모든 사진을 한 번씩 쓰고, 남는 자리는 받은 사진 중에서 무작위로 골라
 * 채운 뒤 섞습니다. 무작위는 사이트 키로 정해져서 새로고침해도 같습니다.
 */
export function fillSlots(photos, slots, seed) {
  if (!photos.length) return []
  if (photos.length >= slots) return photos.slice(0, slots)
  const random = seededRandom(seed)
  const filled = [...photos]
  while (filled.length < slots) filled.push(photos[Math.floor(random() * photos.length)])
  for (let i = filled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[filled[i], filled[j]] = [filled[j], filled[i]]
  }
  return filled
}

/**
 * 서버 내용을 화면 값으로 바꿉니다. 고객 사진(3~8장)은 화면의 사진 자리(slots곳)에 한 장씩 들어가고,
 * 8장보다 적으면 fillSlots로 무작위로 채웁니다. photoTypes는 프레임 이미지(config.js 순서)용입니다.
 */
export function toGift(content, frames, slots = 8, seed = '') {
  const photos = (content.documents ?? [])
    .flatMap(document => document.photos ?? [])
    .sort((a, b) => a.documentNo - b.documentNo || a.slot - b.slot)
  return {
    message: content.mainText ?? '',
    photos: fillSlots(photos, slots, seed).map(photo => ({ photo: photo.url ?? '', caption: photo.caption ?? '' })),
    photoTypes: frames.map((frame, index) => {
      const photo = photos.length ? photos[index % photos.length] : null
      return { frame, photo: photo?.url ?? '', caption: photo?.caption ?? '' }
    }),
  }
}
