import { useEffect, useState } from 'react'

// 같은 사이트와 브라우저에서 꾸미기 상태를 복원합니다.
// 저장소가 차단되거나 값이 잘못된 경우 기본값으로 정상 동작합니다.
// key가 없으면(관리자 미리보기) 저장하지 않고 이 화면에서만 씁니다.
export function useBrowserStorage(key, initialValue, isValid) {
  const [value, setValue] = useState(() => {
    if (!key) return initialValue
    try {
      const saved = JSON.parse(localStorage.getItem(key))
      return isValid(saved) ? saved : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    if (!key) return
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // 브라우저 저장이 불가능해도 현재 화면에서는 계속 꾸밀 수 있습니다.
    }
  }, [key, value])

  return [value, setValue]
}
