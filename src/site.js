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

/**
 * 서버 내용을 화면 값으로 바꿉니다. 빼빼로 화면은 사진 칸이 3개라 앞의 3장을 씁니다.
 * frames는 config.js의 프레임 이미지 순서를 그대로 씁니다.
 */
export function toGift(content, frames) {
  const photos = (content.documents ?? [])
    .flatMap(document => document.photos ?? [])
    .sort((a, b) => a.documentNo - b.documentNo || a.slot - b.slot)
  return {
    message: content.mainText ?? '',
    photoTypes: frames.map((frame, index) => {
      const photo = photos.length ? photos[index % photos.length] : null
      return { frame, photo: photo?.url ?? '', caption: photo?.caption ?? '' }
    }),
  }
}
