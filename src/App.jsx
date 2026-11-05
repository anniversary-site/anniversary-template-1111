import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { PASSWORD, GIFT_MESSAGE, PASSWORD_HINT, PHOTO_TYPES } from './config'
import { toBlob } from 'html-to-image'
import { useBrowserStorage } from './useBrowserStorage'
import { SiteError, forgetToken, getContent, getLock, previewTokenFromLocation, savedToken, siteKeyFromLocation, toGift, unlock } from './site'
import './App.css'

const PhotoPreviewContext = createContext(null)
// 화면에 보여줄 문구·사진. 데모는 config.js, 고객 사이트는 서버 값입니다.
const GiftContext = createContext(null)
const SITE_KEY = siteKeyFromLocation()
const PREVIEW_TOKEN = previewTokenFromLocation(SITE_KEY)
// 꾸미기 상태는 고객 사이트마다 따로 저장합니다.
// 관리자 미리보기는 꾸민 상태를 불러오지도 저장하지도 않아 항상 처음 배치로 열립니다.
const STORAGE_PREFIX = PREVIEW_TOKEN ? null : SITE_KEY ? `pepero:site:${SITE_KEY}:` : 'pepero:v1:'
const DEMO_GIFT = { message: GIFT_MESSAGE, photoTypes: PHOTO_TYPES }
const isValidFlavor = value => Number.isInteger(value) && value >= 0 && value < 3
const isValidPosition = value => value && Number.isFinite(value.x) && Number.isFinite(value.y)
  && Math.abs(value.x) <= 1440 && Math.abs(value.y) <= 1024

function DraggablePhoto({ children, caption, storageKey, ...props }) {
  const openPreview = useContext(PhotoPreviewContext);
  function preview() {
    const image = element.current.querySelectorAll('img');
    openPreview(image[image.length - 1].src);
  }
  const [position, setPosition] = useBrowserStorage(storageKey, { x: 0, y: 0 }, isValidPosition);
  const [dragging, setDragging] = useState(false);
  const drag = useRef(null);
  const lastTouchTap = useRef(0);
  const element = useRef(null);

  function limits() {
    const stage = element.current.closest('.gift-canvas');
    const bounds = stage.getBoundingClientRect();
    const scale = bounds.width / stage.offsetWidth;
    const images = [...element.current.querySelectorAll('img')].map(image => image.getBoundingClientRect());
    return {
      scale,
      minX: position.x + (bounds.left - Math.min(...images.map(image => image.left))) / scale,
      maxX: position.x + (bounds.right - Math.max(...images.map(image => image.right))) / scale,
      minY: position.y + (bounds.top - Math.min(...images.map(image => image.top))) / scale,
      maxY: position.y + (bounds.top + Number(stage.dataset.decorationHeight) * scale - Math.max(...images.map(image => image.bottom))) / scale,
    };
  }
  function move(x, y, bounds) {
    setPosition({ x: Math.max(bounds.minX, Math.min(bounds.maxX, x)), y: Math.max(bounds.minY, Math.min(bounds.maxY, y)) });
  }
  function finish(event) {
    if (drag.current?.pointerId !== event.pointerId) return;
    if (event.type === 'pointerup' && event.pointerType === 'touch' &&
      Math.hypot(event.clientX - drag.current.clientX, event.clientY - drag.current.clientY) < 8) {
      const now = Date.now();
      if (now - lastTouchTap.current < 350) {
        preview();
        lastTouchTap.current = 0;
      } else {
        lastTouchTap.current = now;
      }
    }
    drag.current = null;
    setDragging(false);
  }
  return <div {...props} ref={element} className={`decoration${dragging ? ' is-dragging' : ''}`} role="button" tabIndex={0}
    aria-label={caption ? `${caption} 사진 장식 이동` : '사진 장식 이동'} aria-describedby="decoration-help"
    style={{ transform: `translate(${position.x}px, ${position.y}px)`, zIndex: dragging ? 20 : undefined }}
    onContextMenu={event => { event.preventDefault(); preview(); }}
    onDoubleClick={preview}
    onDragStart={event => event.preventDefault()}
    onPointerDown={event => {
      if (event.button !== 0 || drag.current) return;
      event.preventDefault();
      event.currentTarget.focus({ preventScroll: true });
      event.currentTarget.setPointerCapture(event.pointerId);
      drag.current = { pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY, ...position, ...limits() };
      setDragging(true);
    }}
    onPointerMove={event => {
      const current = drag.current;
      if (!current || current.pointerId !== event.pointerId) return;
      move(current.x + (event.clientX - current.clientX) / current.scale, current.y + (event.clientY - current.clientY) / current.scale, current);
    }}
    onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={finish}
    onKeyDown={event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); preview(); return; }
      const direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
      if (!direction) return;
      event.preventDefault();
      const step = event.shiftKey ? 20 : 5;
      move(position.x + direction[0] * step, position.y + direction[1] * step, limits());
    }}>{children}</div>;
}

const DesktopLoginAssetPrefix = `${import.meta.env.BASE_URL}assets`;
const DesktopLoginimg = `${DesktopLoginAssetPrefix}/login/login.png`;
const DesktopLoginimg1 = `${DesktopLoginAssetPrefix}/login/input.png`;

// 힌트는 길이가 고객마다 달라서 화면 너비 전체를 기준으로 가운데 맞춥니다. 길면 줄바꿈합니다.
const HINT_STYLE_DESKTOP = { left: 0, right: 0, textAlign: 'center', whiteSpace: 'normal', padding: '0 80px' }
const HINT_STYLE_MOBILE = { left: 0, right: 0, alignItems: 'center', textAlign: 'center', whiteSpace: 'normal', padding: '0 24px' }

function DesktopLogin({ password, onPasswordChange, onSubmit, error, hint }) {
  return (
    <div className="background-white position-relative width-100percent" data-node-id="392:662" data-name="암호 입력 배경없">
      <div className="position-absolute background-white height-1024px left-0 overflow-clip top-0 width-1440px" data-node-id="397:697" data-name="빼뺴로 화면">
        <div className="position-absolute height-472px left-423px top-276px width-594px" data-node-id="403:872" data-name="로그인창">
          <img alt="" className="position-absolute inset-0 max-width-none object-position-bottom pointer-events-none width-100percent" src={DesktopLoginimg} />
        </div>
        <div className="position-absolute height-88px left-549px top-546px width-343px" data-node-id="403:875" data-name="비밀번호 입력창">
          <div className="position-absolute inset-0 overflow-hidden pointer-events-none">
            <img alt="" className="position-absolute height-162-24percent left-minus-4-31percent max-width-none top-minus-31-47percent width-108-8percent" src={DesktopLoginimg1} />
          </div>
        </div>
        <form className="translate-x-center word-break-breakminus-word position-absolute font-family-DungGeunMo line-height-19-5px left-686px font-style-normal color-833f22 font-size-18px text-align-center top-579px white-space-nowrap" data-node-id="403:876" onSubmit={onSubmit} style={{width:290,height:50,left:575,top:565,transform:'none'}}><input className="password-input" aria-label="네 자리 비밀번호" aria-describedby="password-error" aria-invalid={Boolean(error)} type="password" inputMode="numeric" maxLength={4} value={password} onChange={onPasswordChange} placeholder="비밀번호를 입력해주세요." style={{fontSize:18}}/><button className="sr-only">입장하기</button></form>
        <p className="word-break-breakminus-word position-absolute font-family-DungGeunMo line-height-40px left-576px font-style-normal color-672f1a font-size-24px top-937px white-space-nowrap" data-node-id="403:877" style={HINT_STYLE_DESKTOP}>{`비밀번호 hint : ${hint}`}</p>
      </div><p className="error" id="password-error" role="alert">{error}</p>
    </div>
  );
}

const MobileLoginAssetPrefix = `${import.meta.env.BASE_URL}assets`;
const MobileLoginimg = `${MobileLoginAssetPrefix}/login/login.png`;
const MobileLoginimg1 = `${MobileLoginAssetPrefix}/login/input.png`;

function MobileLogin({ password, onPasswordChange, onSubmit, error, hint }) {
  return (
    <div className="background-white position-relative width-100percent" data-node-id="403:964" data-name="모바일 배경없">
      <div className="position-absolute display-contents left-55px top-299px" data-node-id="403:966" data-name="비밀번호 창">
        <div className="position-absolute height-224-081px left-55px top-299px width-282px" data-node-id="403:967" data-name="로그인창">
          <img alt="" className="position-absolute inset-0 max-width-none object-position-bottom pointer-events-none width-100percent" src={MobileLoginimg} />
        </div>
        <div className="position-absolute height-41-792px left-114-82px top-427-18px width-162-784px" data-node-id="403:968" data-name="비밀번호 입력창">
          <div className="position-absolute inset-0 overflow-hidden pointer-events-none">
            <img alt="" className="position-absolute height-162-24percent left-minus-4-31percent max-width-none top-minus-31-47percent width-108-8percent" src={MobileLoginimg1} />
          </div>
        </div>
      </div>
      <form className="translate-y-center word-break-breakminus-word position-absolute display-flex flex-direction-column font-family-DungGeunMo justify-content-center line-height-0 left-132px font-style-normal color-7e3e22 font-size-8px top-447px white-space-nowrap" data-node-id="403:969" onSubmit={onSubmit} style={{width:140,height:30,left:126,top:432,transform:'none'}}><input className="password-input" aria-label="네 자리 비밀번호" aria-describedby="password-error" aria-invalid={Boolean(error)} type="password" inputMode="numeric" maxLength={4} value={password} onChange={onPasswordChange} placeholder="비밀번호를 입력해주세요." style={{fontSize:8,padding:0}}/><button className="sr-only">입장하기</button></form>
      <div className="translate-y-center word-break-breakminus-word position-absolute display-flex flex-direction-column font-family-DungGeunMo justify-content-center line-height-0 left-109px font-style-normal color-7e3e22 font-size-10px top-815px white-space-nowrap" data-node-id="403:970" style={HINT_STYLE_MOBILE}>
        <p className="line-height-10px" style={{ lineHeight: '14px' }}>{`비밀번호 hint : ${hint}`}</p>
      </div><p className="error" id="password-error" role="alert">{error}</p>
    </div>
  );
}

const ASSET_PREFIX = `${import.meta.env.BASE_URL}assets`
const FLAVORS = [
  { name: '초콜릿', image: 'type_a.png' },
  { name: '체크무늬', image: 'type_b.png' },
  { name: '니트', image: 'type_c.png' },
]

// 사진 내용은 공통으로 사용하고, 기기에 따라 배치와 크기만 달라집니다.
// 배치 값: x, y, 회전 전 너비, 높이, 회전 각도
const DECORATIONS = [
  { type: 0, desktop: [667, 786, 62.301, 80, 0], mobile: [204, 673, 38.641, 49.619, 0] },
  { type: 0, desktop: [586, 817, 61.916, 79.506, 0], mobile: [131, 619, 38.075, 48.892, 30.69] },
  { type: 1, desktop: [1007, 813, 62.301, 80, 0], mobile: [43, 613, 52.004, 66.778, -19.97] },
  { type: 1, desktop: [752, 805, 62.301, 80, 0], mobile: [239, 606, 38.075, 48.892, 30.69] },
  { type: 1, desktop: [909, 797, 41.528, 49.956, -20.87], mobile: [270, 697, 25.38, 30.531, 9.82] },
  { type: 1, desktop: [371, 789, 83.327, 107, -19.97], mobile: [350, 709, 25.38, 30.531, -9.48] },
  { type: 2, desktop: [841, 826, 49, 62.92, 0], mobile: [321, 653, 30.581, 39.268, 0] },
  { type: 2, desktop: [486, 815, 49, 62.92, -9.48], mobile: [121, 689, 30.581, 39.268, -9.48] },
]

function DecorationImage({ decoration, mobile, index }) {
  const [x, y, width, height, angle] = decoration[mobile ? 'mobile' : 'desktop']
  const radians = Math.abs(angle) * Math.PI / 180
  const boxWidth = width * Math.cos(radians) + height * Math.sin(radians)
  const boxHeight = height * Math.cos(radians) + width * Math.sin(radians)
  const gift = useContext(GiftContext)
  // 프레임은 자리마다 정해져 있고, 고객 사진이 있으면 자리마다 다른 사진을 넣습니다.
  const type = { ...gift.photoTypes[decoration.type], ...(gift.photos?.length ? gift.photos[index % gift.photos.length] : {}) }
  const caption = Array.from(type.caption ?? '').slice(0, 10).join('')
  // 서버 사진은 전체 주소, 데모 사진은 public/assets/photo/의 파일 이름입니다.
  const photoSrc = /^(https?:)?\/\//.test(type.photo) ? type.photo : `${ASSET_PREFIX}/photo/${type.photo}`
  return <DraggablePhoto caption={caption} storageKey={STORAGE_PREFIX && `${STORAGE_PREFIX}photo:${mobile ? 'mobile' : 'desktop'}:${index}`}>
    <div className="photo-slot" style={{ left: x, top: y, width: boxWidth, height: boxHeight }}>
      <div className="photo-frame" style={{ width, height, transform: `rotate(${angle}deg)` }}>
        <img className="photo-paper" src={`${ASSET_PREFIX}/frame/${type.frame}`} alt="" />
        {type.photo && <img className="photo-picture" src={photoSrc} alt="" crossOrigin={photoSrc.startsWith('http') ? 'anonymous' : undefined} />}
      </div>
      {caption && <span className="photo-caption" data-export-exclude>{caption}</span>}
    </div>
  </DraggablePhoto>
}

function Gift({ flavor, setFlavor, mobile }) {
  const { message } = useContext(GiftContext)
  return <section className={`gift-screen ${mobile ? 'gift-mobile' : 'gift-desktop'}`} aria-label="빼빼로 꾸미기">
    <p className="gift-message">{message}</p>
    <div className="gift-sticks" aria-label="교차한 빼빼로">
      {[0, 1].map(index => <div key={index} className={`gift-stick gift-stick-${index}`}>
        <img src={`${ASSET_PREFIX}/pepero/${FLAVORS[flavor].image}`} alt="" />
      </div>)}
    </div>
    {DECORATIONS.map((decoration, index) => <DecorationImage key={`${mobile ? 'mobile' : 'desktop'}:${index}`} index={index} decoration={decoration} mobile={mobile} />)}
    <div className="flavor-controls" data-export-exclude>
      <p className="flavor-label">choose your flavor</p>
      <div className="flavor-options">
        {FLAVORS.map((item, index) => <button key={item.name} className={`flavor-swatch flavor-swatch-${index}`}
          type="button" aria-label={item.name} aria-pressed={flavor === index} onClick={() => setFlavor(index)}>
          <img src={`${ASSET_PREFIX}/pepero/${item.image}`} alt="" />
        </button>)}
      </div>
    </div>
  </section>
}

function PhotoPreview({ src, onClose }) {
  const dialog = useRef(null)
  useEffect(() => { dialog.current.showModal() }, [])
  return <dialog ref={dialog} className="photo-preview" aria-label="사진 크게 보기"
    onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose() }}>
    <div className="photo-preview-content">
      <button className="preview-close" type="button" onClick={onClose} autoFocus aria-label="사진 닫기">×</button>
      <img src={src} alt="확대한 사진" />
    </div>
  </dialog>
}

export default function App() {
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight })
  const [password, setPassword] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [error, setError] = useState('')
  const [flavor, setFlavor] = useBrowserStorage(STORAGE_PREFIX && `${STORAGE_PREFIX}flavor`, 0, isValidFlavor)
  const [gift, setGift] = useState(SITE_KEY ? null : DEMO_GIFT)
  const [hint, setHint] = useState(SITE_KEY ? '' : PASSWORD_HINT)
  const [checking, setChecking] = useState(false)
  const [preview, setPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const giftCanvas = useRef(null)

  // 고객 사이트: 잠금 화면 힌트를 받고, 이미 연 적이 있으면 바로 엽니다.
  useEffect(() => {
    if (!SITE_KEY) return
    let active = true
    const fail = cause => { if (active) setError(cause instanceof SiteError ? cause.message : '사이트를 불러오지 못했어요.') }
    const show = content => { if (active) { setGift(toGift(content, PHOTO_TYPES.map(type => type.frame), DECORATIONS.length, SITE_KEY)); setUnlocked(true) } }
    if (PREVIEW_TOKEN) {
      // 운영자 미리보기: 비밀번호 없이 바로 내용을 엽니다.
      getContent(SITE_KEY, PREVIEW_TOKEN).then(show).catch(cause =>
        fail(cause instanceof SiteError && cause.status === 401 ? new SiteError(401, cause.code, '미리보기 링크가 만료됐어요. 관리자 화면에서 다시 열어주세요.') : cause))
      return () => { active = false }
    }
    getLock(SITE_KEY).then(lock => { if (active) setHint(lock.passwordHint ?? '') }).catch(fail)
    const token = savedToken(SITE_KEY)
    if (token) {
      getContent(SITE_KEY, token)
        .then(show)
        .catch(cause => { forgetToken(SITE_KEY); if (cause instanceof SiteError && cause.status !== 401) fail(cause) })
    }
    return () => { active = false }
  }, [])

  useEffect(() => {
    const resize = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  const mobile = viewport.width < 768
  const width = mobile ? 393 : 1440
  const height = mobile ? 852 : 1024
  // 맛 선택 위 경계를 사진 이동과 이미지 저장에 공통으로 사용합니다.
  const decorationHeight = mobile ? 763 : 927
  const totalHeight = height + (unlocked && gift ? 90 : 0)
  const scale = mobile ? viewport.width / width : Math.min(viewport.width / width, viewport.height / totalHeight)

  function wrongPassword() { setPassword(''); setError('비밀번호가 달라요. 다시 입력해주세요.') }
  async function check(value) {
    if (value.length !== 4 || checking) return
    if (!SITE_KEY) {
      if (value === PASSWORD) { setUnlocked(true); setError('') } else wrongPassword()
      return
    }
    setChecking(true)
    try {
      const token = await unlock(SITE_KEY, value)
      const content = await getContent(SITE_KEY, token)
      setGift(toGift(content, PHOTO_TYPES.map(type => type.frame), DECORATIONS.length, SITE_KEY))
      setUnlocked(true)
      setError('')
    } catch (cause) {
      if (cause instanceof SiteError && cause.code === 'WRONG_SITE_PASSWORD') wrongPassword()
      else { setPassword(''); setError(cause instanceof SiteError ? cause.message : '사이트를 열지 못했어요.') }
    } finally { setChecking(false) }
  }
  function onPasswordChange(event) {
    const value = event.target.value.replace(/\D/g, '').slice(0, 4)
    setPassword(value)
    setError('')
    check(value)
  }
  async function saveGift() {
    if (saving) return
    setSaving(true)
    setSaveError('')
    try {
      await document.fonts.ready
      await Promise.all([...giftCanvas.current.querySelectorAll('img')].map(image => image.decode()))
      const blob = await toBlob(giftCanvas.current, {
        width, height: decorationHeight, pixelRatio: 2, backgroundColor: '#fff',
        style: { transform: 'none', height: `${decorationHeight}px`, overflow: 'hidden' },
        filter: node => !(node instanceof HTMLElement && node.hasAttribute('data-export-exclude')),
      })
      if (!blob) throw new Error('이미지 생성 실패')
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'pepero-decoration.png'
      document.body.append(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch {
      setSaveError('저장하지 못했어요. 다시 시도해주세요.')
    } finally { setSaving(false) }
  }

  const Screen = unlocked && gift ? Gift : (mobile ? MobileLogin : DesktopLogin)
  return <GiftContext.Provider value={gift ?? DEMO_GIFT}><PhotoPreviewContext.Provider value={setPreview}>
    <main className="viewport" style={{ minHeight: Math.max(viewport.height, totalHeight * scale) }}>
      <p id="decoration-help" className="sr-only">사진을 드래그해서 빼빼로를 꾸며보세요. 우클릭 또는 두 번 탭하면 크게 볼 수 있습니다. 방향키로 이동하고 Enter로 크게 볼 수도 있습니다.</p>
      <div className="stage" style={{ width, height: totalHeight, left: (viewport.width - width * scale) / 2, transform: `scale(${scale})` }}>
        <div ref={giftCanvas} className="gift-canvas" data-decoration-height={decorationHeight} style={{ width, height }}>
          <Screen mobile={mobile} password={password} error={error} onPasswordChange={onPasswordChange}
            onSubmit={event => { event.preventDefault(); check(password) }} flavor={flavor} setFlavor={setFlavor} hint={hint} />
        </div>
        {unlocked && gift && <div className="save-controls" style={{ top: height + 12 }}>
          <button className="save-button" type="button" onClick={saveGift} disabled={saving}>{saving ? '이미지 만드는 중…' : '저장하기'}</button>
          <p className="save-error" role="status">{saveError}</p>
        </div>}
      </div>
    </main>
    {PREVIEW_TOKEN && <p className="admin-preview-banner" role="status">관리자 미리보기 · 고객에게는 비밀번호 화면부터 보여요{error ? ` · ${error}` : ''}</p>}
    {preview && <PhotoPreview src={preview} onClose={() => setPreview(null)} />}
  </PhotoPreviewContext.Provider></GiftContext.Provider>
}
