import { useEffect, useState } from 'react'

// 같은 사이트와 브라우저에서 꾸미기 상태를 복원합니다.
// 저장소가 차단되거나 값이 잘못된 경우 기본값으로 정상 동작합니다.
export function useBrowserStorage(key, initialValue, isValid) {
  const [value, setValue] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key))
      return isValid(saved) ? saved : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // 브라우저 저장이 불가능해도 현재 화면에서는 계속 꾸밀 수 있습니다.
    }
  }, [key, value])

  return [value, setValue]
}
