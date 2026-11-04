import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { PASSWORD } from './config'
import { toBlob } from 'html-to-image'
import './App.css'

const PhotoPreviewContext = createContext(null)
function DraggablePhoto({ children, ...props }) {
  const openPreview = useContext(PhotoPreviewContext);
  function preview() {
    const image = element.current.querySelectorAll('img');
    openPreview(image[image.length - 1].src);
  }
  const [position, setPosition] = useState({ x: 0, y: 0 });
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
      maxY: position.y + (bounds.bottom - Math.max(...images.map(image => image.bottom))) / scale,
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
    aria-label="사진 장식 이동" aria-describedby="decoration-help"
    style={{ transform: `translate(${position.x}px, ${position.y}px)`, zIndex: dragging ? 20 : 2 }}
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

function DesktopLogin({ password, onPasswordChange, onSubmit, error }) {
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
        <p className="word-break-breakminus-word position-absolute font-family-DungGeunMo line-height-40px left-576px font-style-normal color-672f1a font-size-24px top-937px white-space-nowrap" data-node-id="403:877">{`비밀번호 hint : 내 생일! `}</p>
      </div><p className="error" id="password-error" role="alert">{error}</p>
    </div>
  );
}

const MobileLoginAssetPrefix = `${import.meta.env.BASE_URL}assets`;
const MobileLoginimg = `${MobileLoginAssetPrefix}/login/login.png`;
const MobileLoginimg1 = `${MobileLoginAssetPrefix}/login/input.png`;

function MobileLogin({ password, onPasswordChange, onSubmit, error }) {
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
      <div className="translate-y-center word-break-breakminus-word position-absolute display-flex flex-direction-column font-family-DungGeunMo justify-content-center line-height-0 left-109px font-style-normal color-7e3e22 font-size-10px top-815px white-space-nowrap" data-node-id="403:970">
        <p className="line-height-10px">비밀번호 hint : 우리가 처음 만난 날</p>
      </div><p className="error" id="password-error" role="alert">{error}</p>
    </div>
  );
}

const DesktopGiftAssetPrefix = `${import.meta.env.BASE_URL}assets`;
const DesktopGiftimg2 = `${DesktopGiftAssetPrefix}/pepero/type_a.png`;
const DesktopGiftimg3 = `${DesktopGiftAssetPrefix}/pepero/type_b.png`;
const DesktopGiftimg4 = `${DesktopGiftAssetPrefix}/pepero/type_c.png`;
const DesktopGiftflavorImages = [`${DesktopGiftAssetPrefix}/pepero/type_a.png`, `${DesktopGiftAssetPrefix}/pepero/type_b.png`, `${DesktopGiftAssetPrefix}/pepero/type_c.png`];
const DesktopGiftimgRectangle113 = `${DesktopGiftAssetPrefix}/frame/8ec11.png`;
const DesktopGiftimgRectangle114 = `${DesktopGiftAssetPrefix}/photo/020dd.png`;
const DesktopGiftimgRectangle115 = `${DesktopGiftAssetPrefix}/frame/ce1db.png`;
const DesktopGiftimgRectangle116 = `${DesktopGiftAssetPrefix}/photo/fa4c2.png`;
const DesktopGiftimgRectangle117 = `${DesktopGiftAssetPrefix}/frame/0ad2f.png`;
const DesktopGiftimgRectangle118 = `${DesktopGiftAssetPrefix}/photo/c6c4b.png`;

function DesktopGift({ flavor, setFlavor }) {
  return (
    <div className="background-white position-relative width-100percent" data-node-id="393:664" data-name="빼뺴로 화면">
      <div className="position-absolute display-contents left-398px top-160px" data-node-id="401:809">
        <div className="position-absolute display-flex height-590px align-items-center justify-content-center left-398px top-160px width-546px" data-node-id="397:687">
          <div className="flip-y flex-none rotate-180">
            <div className="height-590px position-relative width-546px" data-name="기본 2">
              <div className="position-absolute inset-0 overflow-hidden pointer-events-none">
                <img alt="" className="position-absolute height-102-52percent left-minus-6-07percent max-width-none top-minus-1-01percent width-116-68percent" src={DesktopGiftflavorImages[flavor]} />
              </div>
            </div>
          </div>
        </div>
        <div className="position-absolute height-590px left-496px top-160px width-546px" data-node-id="397:689" data-name="기본 3">
          <div className="position-absolute inset-0 overflow-hidden pointer-events-none">
            <img alt="" className="position-absolute height-102-52percent left-minus-6-07percent max-width-none top-minus-1-01percent width-116-68percent" src={DesktopGiftflavorImages[flavor]} />
          </div>
        </div>
      </div>
      <div className="position-absolute left-695px border-radius-65536px width-50px top-955px" data-node-id="397:705" data-name="체크무늬 2" role="button" tabIndex={0} aria-label="체크무늬" aria-pressed={flavor === 1} onClick={() => setFlavor(1)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setFlavor(1) } }} style={{cursor:'pointer'}}>
        <div className="position-absolute inset-0 overflow-hidden pointer-events-none border-radius-65536px">
          <img alt="" className="position-absolute height-360-12percent left-minus-111-24percent max-width-none top-minus-112-69percent width-365-03percent" src={DesktopGiftimg3} />
        </div>
      </div>
      <div className="position-absolute display-flex align-items-center justify-content-center left-618px width-50px top-955px" data-node-id="397:707" role="button" tabIndex={0} aria-label="초콜릿" aria-pressed={flavor === 0} onClick={() => setFlavor(0)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setFlavor(0) } }} style={{cursor:'pointer'}}>
        <div className="flip-y flex-none">
          <div className="position-relative border-radius-65536px width-50px" data-name="기본 3">
            <div className="position-absolute inset-0 overflow-hidden pointer-events-none border-radius-65536px">
              <img alt="" className="position-absolute height-386-22percent left-minus-141-33percent max-width-none top-minus-137-2percent width-406-8percent" src={DesktopGiftimg2} />
            </div>
          </div>
        </div>
      </div>
      <div className="position-absolute left-772px border-radius-65536px width-50px top-955px" data-node-id="400:710" data-name="초콜릿 브라운 테두리의 니트 아이스바 패치 2" role="button" tabIndex={0} aria-label="니트" aria-pressed={flavor === 2} onClick={() => setFlavor(2)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setFlavor(2) } }} style={{cursor:'pointer'}}>
        <div className="position-absolute inset-0 overflow-hidden pointer-events-none border-radius-65536px">
          <img alt="" className="position-absolute left-minus-125-65percent max-width-none width-383-49percent top-minus-127-03percent" src={DesktopGiftimg4} />
        </div>
      </div>
      <DraggablePhoto className="position-absolute display-contents left-667px top-786px" data-node-id="401:714" data-name="사진1">
        <div className="position-absolute height-80px left-667px top-786px width-62-301px" data-node-id="401:712">
          <div aria-hidden className="position-absolute inset-0 pointer-events-none">
            <div className="position-absolute background-white inset-0" />
            <img alt="" className="position-absolute max-width-none object-fit-cover opacity--5 width-100percent" src={DesktopGiftimgRectangle113} />
          </div>
        </div>
        <div className="position-absolute height-48-142px left-672-66px top-793-79px width-50-973px" data-node-id="401:713">
          <img alt="" className="position-absolute inset-0 max-width-none object-fit-cover pointer-events-none width-100percent" src={DesktopGiftimgRectangle114} />
        </div>
      </DraggablePhoto>
      <DraggablePhoto className="position-absolute display-contents left-586px top-817px" data-node-id="401:727" data-name="사진1">
        <div className="position-absolute height-79-506px left-586px top-817px width-61-916px" data-node-id="401:728">
          <div aria-hidden className="position-absolute inset-0 pointer-events-none">
            <div className="position-absolute background-white inset-0" />
            <img alt="" className="position-absolute max-width-none object-fit-cover opacity--5 width-100percent" src={DesktopGiftimgRectangle113} />
          </div>
        </div>
        <div className="position-absolute height-47-844px left-591-63px top-824-74px width-50-658px" data-node-id="401:729">
          <img alt="" className="position-absolute inset-0 max-width-none object-fit-cover pointer-events-none width-100percent" src={DesktopGiftimgRectangle114} />
        </div>
      </DraggablePhoto>
      <DraggablePhoto className="position-absolute display-contents left-1007px top-813px" data-node-id="401:715" data-name="사진2">
        <div className="position-absolute height-80px left-1007px top-813px width-62-301px" data-node-id="401:716">
          <div aria-hidden className="position-absolute inset-0 pointer-events-none">
            <div className="position-absolute background-white inset-0" />
            <img alt="" className="position-absolute max-width-none object-fit-cover opacity--5 width-100percent" src={DesktopGiftimgRectangle115} />
          </div>
        </div>
        <div className="position-absolute height-48-142px left-1012-66px top-820-79px width-50-973px" data-node-id="401:717">
          <img alt="" className="position-absolute inset-0 max-width-none object-fit-cover pointer-events-none width-100percent" src={DesktopGiftimgRectangle116} />
        </div>
      </DraggablePhoto>
      <DraggablePhoto className="position-absolute display-contents left-752px top-805px" data-node-id="401:735" data-name="사진2">
        <div className="position-absolute height-80px left-752px top-805px width-62-301px" data-node-id="401:736">
          <div aria-hidden className="position-absolute inset-0 pointer-events-none">
            <div className="position-absolute background-white inset-0" />
            <img alt="" className="position-absolute max-width-none object-fit-cover opacity--5 width-100percent" src={DesktopGiftimgRectangle115} />
          </div>
        </div>
        <div className="position-absolute height-48-142px left-757-66px top-812-79px width-50-973px" data-node-id="401:737">
          <img alt="" className="position-absolute inset-0 max-width-none object-fit-cover pointer-events-none width-100percent" src={DesktopGiftimgRectangle116} />
        </div>
      </DraggablePhoto>
      <DraggablePhoto className="position-absolute display-contents height-61-471px left-909px top-797px width-56-597px" data-node-id="401:739" data-name="사진2">
        <div className="position-absolute display-flex height-61-471px align-items-center justify-content-center left-909px top-797px width-56-597px" data-node-id="401:740">
          <div className="flex-none --rot-minus-20-87deg">
            <div className="height-49-956px position-relative width-41-528px">
              <div aria-hidden className="position-absolute inset-0 pointer-events-none">
                <div className="position-absolute background-white inset-0" />
                <img alt="" className="position-absolute max-width-none object-fit-cover opacity--5 width-100percent" src={DesktopGiftimgRectangle115} />
              </div>
            </div>
          </div>
        </div>
        <div className="position-absolute display-flex height-40-193px align-items-center justify-content-center left-914-26px top-802-89px width-42-456px" data-node-id="401:741">
          <div className="flex-none --rot-minus-20-87deg">
            <div className="height-30-062px position-relative width-33-977px">
              <img alt="" className="position-absolute inset-0 max-width-none object-fit-cover pointer-events-none width-100percent" src={DesktopGiftimgRectangle116} />
            </div>
          </div>
        </div>
      </DraggablePhoto>
      <DraggablePhoto className="position-absolute display-contents height-129-028px left-371px top-789px width-114-866px" data-node-id="401:723" data-name="사진2">
        <div className="position-absolute display-flex height-129-028px align-items-center justify-content-center left-371px top-789px width-114-866px" data-node-id="401:724">
          <div className="flex-none --rot-minus-19-97deg">
            <div className="height-107px position-relative width-83-327px">
              <div aria-hidden className="position-absolute inset-0 pointer-events-none">
                <div className="position-absolute background-white inset-0" />
                <img alt="" className="position-absolute max-width-none object-fit-cover opacity--5 width-100percent" src={DesktopGiftimgRectangle115} />
              </div>
            </div>
          </div>
        </div>
        <div className="position-absolute display-flex height-83-805px align-items-center justify-content-center left-381-68px top-801-38px width-86-071px" data-node-id="401:725">
          <div className="flex-none --rot-minus-19-97deg">
            <div className="height-64-389px position-relative width-68-177px">
              <img alt="" className="position-absolute inset-0 max-width-none object-fit-cover pointer-events-none width-100percent" src={DesktopGiftimgRectangle116} />
            </div>
          </div>
        </div>
      </DraggablePhoto>
      <DraggablePhoto className="position-absolute display-contents left-841px top-826px" data-node-id="401:719" data-name="사진3">
        <div className="position-absolute height-62-92px left-841px top-826px width-49px" data-node-id="401:720">
          <div aria-hidden className="position-absolute inset-0 pointer-events-none">
            <div className="position-absolute background-white inset-0" />
            <img alt="" className="position-absolute max-width-none object-fit-cover opacity--5 width-100percent" src={DesktopGiftimgRectangle117} />
          </div>
        </div>
        <div className="position-absolute height-37-864px left-845-45px top-832-13px width-40-091px" data-node-id="401:721">
          <img alt="" className="position-absolute inset-0 max-width-none object-fit-cover pointer-events-none width-100percent" src={DesktopGiftimgRectangle118} />
        </div>
      </DraggablePhoto>
      <DraggablePhoto className="position-absolute display-contents height-70-134px left-486px top-815px width-58-697px" data-node-id="401:731" data-name="사진3">
        <div className="position-absolute display-flex height-70-134px align-items-center justify-content-center left-486px top-815px width-58-697px" data-node-id="401:732">
          <div className="flex-none --rot-minus-9-48deg">
            <div className="height-62-92px position-relative width-49px">
              <div aria-hidden className="position-absolute inset-0 pointer-events-none">
                <div className="position-absolute background-white inset-0" />
                <img alt="" className="position-absolute max-width-none object-fit-cover opacity--5 width-100percent" src={DesktopGiftimgRectangle117} />
              </div>
            </div>
          </div>
        </div>
        <div className="position-absolute display-flex height-43-951px align-items-center justify-content-center left-491-4px top-821-77px width-45-781px" data-node-id="401:733">
          <div className="flex-none --rot-minus-9-48deg">
            <div className="height-37-864px position-relative width-40-091px">
              <img alt="" className="position-absolute inset-0 max-width-none object-fit-cover pointer-events-none width-100percent" src={DesktopGiftimgRectangle118} />
            </div>
          </div>
        </div>
      </DraggablePhoto>
      <p className="word-break-breakminus-word position-absolute font-family-DungGeunMo line-height-19-5px left-671px font-style-normal font-size-13px color-black top-927px white-space-nowrap" data-node-id="401:805">
        choose your flavor
      </p>
      <p className="translate-x-center word-break-breakminus-word position-absolute font-family-DungGeunMo line-height-19-5px left-720-5px font-style-normal color-406851 font-size-22px text-align-center top-79px white-space-nowrap" data-node-id="403:960">{`우리 우정 영원히 ~.< !! `}</p>
    </div>
  );
}

const MobileGiftAssetPrefix = `${import.meta.env.BASE_URL}assets`;
const MobileGiftimg4 = `${MobileGiftAssetPrefix}/pepero/type_a.png`;
const MobileGiftflavorImages = [`${MobileGiftAssetPrefix}/pepero/type_a.png`, `${MobileGiftAssetPrefix}/pepero/type_b.png`, `${MobileGiftAssetPrefix}/pepero/type_c.png`];
const MobileGiftimgRectangle113 = `${MobileGiftAssetPrefix}/frame/8ec11.png`;
const MobileGiftimgRectangle114 = `${MobileGiftAssetPrefix}/photo/020dd.png`;
const MobileGiftimgRectangle115 = `${MobileGiftAssetPrefix}/frame/ce1db.png`;
const MobileGiftimgRectangle116 = `${MobileGiftAssetPrefix}/photo/fa4c2.png`;
const MobileGiftimgRectangle117 = `${MobileGiftAssetPrefix}/frame/0ad2f.png`;
const MobileGiftimgRectangle118 = `${MobileGiftAssetPrefix}/photo/c6c4b.png`;
const MobileGiftimg3 = `${MobileGiftAssetPrefix}/pepero/type_b.png`;
const MobileGiftimg5 = `${MobileGiftAssetPrefix}/pepero/type_c.png`;

function MobileGift({ flavor, setFlavor }) {
  return (
    <div className="background-white position-relative width-100percent" data-node-id="401:770" data-name="모바일">
      <div className="position-absolute display-contents left-18px top-248px" data-node-id="403:933">
        <div className="position-absolute display-flex height-327px align-items-center justify-content-center left-18px top-248px width-302-585px" data-node-id="401:771">
          <div className="flip-y flex-none rotate-180">
            <div className="height-327px position-relative width-302-585px" data-name="기본 4">
              <div className="position-absolute inset-0 overflow-hidden pointer-events-none">
                <img alt="" className="position-absolute height-102-52percent left-minus-6-07percent max-width-none top-minus-1-01percent width-116-68percent" src={MobileGiftflavorImages[flavor]} />
              </div>
            </div>
          </div>
        </div>
        <div className="position-absolute height-327px left-72-42px top-248px width-302-585px" data-node-id="401:772" data-name="기본 5">
          <div className="position-absolute inset-0 overflow-hidden pointer-events-none">
            <img alt="" className="position-absolute height-102-52percent left-minus-6-07percent max-width-none top-minus-1-01percent width-116-68percent" src={MobileGiftflavorImages[flavor]} />
          </div>
        </div>
      </div>
      <DraggablePhoto className="position-absolute display-contents left-204px top-673px" data-node-id="401:773" data-name="사진1">
        <div className="position-absolute height-49-619px left-204px top-673px width-38-641px" data-node-id="401:774">
          <div aria-hidden className="position-absolute inset-0 pointer-events-none">
            <div className="position-absolute background-white inset-0" />
            <img alt="" className="position-absolute max-width-none object-fit-cover opacity--5 width-100percent" src={MobileGiftimgRectangle113} />
          </div>
        </div>
        <div className="position-absolute height-29-859px left-207-51px top-677-83px width-31-616px" data-node-id="401:775">
          <img alt="" className="position-absolute inset-0 max-width-none object-fit-cover pointer-events-none width-100percent" src={MobileGiftimgRectangle114} />
        </div>
      </DraggablePhoto>
      <DraggablePhoto className="position-absolute display-contents height-80-526px left-43px top-613px width-71-687px" data-node-id="401:776" data-name="사진2">
        <div className="position-absolute display-flex height-80-526px align-items-center justify-content-center left-43px top-613px width-71-687px" data-node-id="401:777">
          <div className="flex-none --rot-minus-19-97deg">
            <div className="height-66-778px position-relative width-52-004px">
              <div aria-hidden className="position-absolute inset-0 pointer-events-none">
                <div className="position-absolute background-white inset-0" />
                <img alt="" className="position-absolute max-width-none object-fit-cover opacity--5 width-100percent" src={MobileGiftimgRectangle115} />
              </div>
            </div>
          </div>
        </div>
        <div className="position-absolute display-flex height-52-302px align-items-center justify-content-center left-49-66px top-620-72px width-53-717px" data-node-id="401:778">
          <div className="flex-none --rot-minus-19-97deg">
            <div className="height-40-185px position-relative width-42-549px">
              <img alt="" className="position-absolute inset-0 max-width-none object-fit-cover pointer-events-none width-100percent" src={MobileGiftimgRectangle116} />
            </div>
          </div>
        </div>
      </DraggablePhoto>
      <DraggablePhoto className="position-absolute display-contents left-321px top-653px" data-node-id="401:779" data-name="사진3">
        <div className="position-absolute height-39-268px left-321px top-653px width-30-581px" data-node-id="401:780">
          <div aria-hidden className="position-absolute inset-0 pointer-events-none">
            <div className="position-absolute background-white inset-0" />
            <img alt="" className="position-absolute max-width-none object-fit-cover opacity--5 width-100percent" src={MobileGiftimgRectangle117} />
          </div>
        </div>
        <div className="position-absolute height-23-63px left-323-78px top-656-82px width-25-021px" data-node-id="401:781">
          <img alt="" className="position-absolute inset-0 max-width-none object-fit-cover pointer-events-none width-100percent" src={MobileGiftimgRectangle118} />
        </div>
      </DraggablePhoto>
      <DraggablePhoto className="position-absolute display-contents height-43-77px left-121px top-689px width-36-632px" data-node-id="401:782" data-name="사진3">
        <div className="position-absolute display-flex height-43-77px align-items-center justify-content-center left-121px top-689px width-36-632px" data-node-id="401:783">
          <div className="flex-none --rot-minus-9-48deg">
            <div className="height-39-268px position-relative width-30-581px">
              <div aria-hidden className="position-absolute inset-0 pointer-events-none">
                <div className="position-absolute background-white inset-0" />
                <img alt="" className="position-absolute max-width-none object-fit-cover opacity--5 width-100percent" src={MobileGiftimgRectangle117} />
              </div>
            </div>
          </div>
        </div>
        <div className="position-absolute display-flex height-27-43px align-items-center justify-content-center left-124-37px top-693-23px width-28-572px" data-node-id="401:784">
          <div className="flex-none --rot-minus-9-48deg">
            <div className="height-23-63px position-relative width-25-021px">
              <img alt="" className="position-absolute inset-0 max-width-none object-fit-cover pointer-events-none width-100percent" src={MobileGiftimgRectangle118} />
            </div>
          </div>
        </div>
      </DraggablePhoto>
      <DraggablePhoto className="position-absolute display-contents height-61-477px left-131px top-619px width-57-695px" data-node-id="401:785" data-name="사진1">
        <div className="position-absolute display-flex height-61-477px align-items-center justify-content-center left-131px top-619px width-57-695px" data-node-id="401:786">
          <div className="flex-none --rot-30-69deg">
            <div className="height-48-892px position-relative width-38-075px">
              <div aria-hidden className="position-absolute inset-0 pointer-events-none">
                <div className="position-absolute background-white inset-0" />
                <img alt="" className="position-absolute max-width-none object-fit-cover opacity--5 width-100percent" src={MobileGiftimgRectangle113} />
              </div>
            </div>
          </div>
        </div>
        <div className="position-absolute display-flex height-41-2px align-items-center justify-content-center left-141-48px top-624-86px width-41-805px" data-node-id="401:787">
          <div className="flex-none --rot-30-69deg">
            <div className="height-29-422px position-relative width-31-153px">
              <img alt="" className="position-absolute inset-0 max-width-none object-fit-cover pointer-events-none width-100percent" src={MobileGiftimgRectangle114} />
            </div>
          </div>
        </div>
      </DraggablePhoto>
      <DraggablePhoto className="position-absolute display-contents height-61-477px left-239px top-606px width-57-695px" data-node-id="401:788" data-name="사진2">
        <div className="position-absolute display-flex height-61-477px align-items-center justify-content-center left-239px top-606px width-57-695px" data-node-id="401:789">
          <div className="flex-none --rot-30-69deg">
            <div className="height-48-892px position-relative width-38-075px">
              <div aria-hidden className="position-absolute inset-0 pointer-events-none">
                <div className="position-absolute background-white inset-0" />
                <img alt="" className="position-absolute max-width-none object-fit-cover opacity--5 width-100percent" src={MobileGiftimgRectangle115} />
              </div>
            </div>
          </div>
        </div>
        <div className="position-absolute display-flex height-41-2px align-items-center justify-content-center left-249-48px top-611-86px width-41-805px" data-node-id="401:790">
          <div className="flex-none --rot-30-69deg">
            <div className="height-29-422px position-relative width-31-153px">
              <img alt="" className="position-absolute inset-0 max-width-none object-fit-cover pointer-events-none width-100percent" src={MobileGiftimgRectangle116} />
            </div>
          </div>
        </div>
      </DraggablePhoto>
      <DraggablePhoto className="position-absolute display-contents height-34-412px left-270px top-697px width-30-215px" data-node-id="401:791" data-name="사진2">
        <div className="position-absolute display-flex height-34-412px align-items-center justify-content-center left-270px top-697px width-30-215px" data-node-id="401:792">
          <div className="flex-none --rot-9-82deg">
            <div className="height-30-531px position-relative width-25-38px">
              <div aria-hidden className="position-absolute inset-0 pointer-events-none">
                <div className="position-absolute background-white inset-0" />
                <img alt="" className="position-absolute max-width-none object-fit-cover opacity--5 width-100percent" src={MobileGiftimgRectangle115} />
              </div>
            </div>
          </div>
        </div>
        <div className="position-absolute display-flex height-21-645px align-items-center justify-content-center left-273-84px top-700-32px width-23-595px" data-node-id="401:793">
          <div className="flex-none --rot-9-82deg">
            <div className="height-18-373px position-relative width-20-765px">
              <img alt="" className="position-absolute inset-0 max-width-none object-fit-cover pointer-events-none width-100percent" src={MobileGiftimgRectangle116} />
            </div>
          </div>
        </div>
      </DraggablePhoto>
      <div className="position-absolute display-contents left-117px top-763px" data-node-id="403:934">
        <div className="position-absolute left-174px border-radius-65536px width-37px top-791px" data-node-id="401:794" data-name="체크무늬 3" role="button" tabIndex={0} aria-label="체크무늬" aria-pressed={flavor === 1} onClick={() => setFlavor(1)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setFlavor(1) } }} style={{cursor:'pointer'}}>
          <div className="position-absolute inset-0 overflow-hidden pointer-events-none border-radius-65536px">
            <img alt="" className="position-absolute height-360-12percent left-minus-111-24percent max-width-none top-minus-112-69percent width-365-03percent" src={MobileGiftimg3} />
          </div>
        </div>
        <div className="position-absolute display-flex align-items-center justify-content-center left-117px width-37px top-791px" data-node-id="401:795" role="button" tabIndex={0} aria-label="초콜릿" aria-pressed={flavor === 0} onClick={() => setFlavor(0)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setFlavor(0) } }} style={{cursor:'pointer'}}>
          <div className="flip-y flex-none">
            <div className="position-relative border-radius-65536px width-37px" data-name="기본 4">
              <div className="position-absolute inset-0 overflow-hidden pointer-events-none border-radius-65536px">
                <img alt="" className="position-absolute height-386-22percent left-minus-141-33percent max-width-none top-minus-137-2percent width-406-8percent" src={MobileGiftimg4} />
              </div>
            </div>
          </div>
        </div>
        <div className="position-absolute left-231px border-radius-65536px width-37px top-791px" data-node-id="401:796" data-name="초콜릿 브라운 테두리의 니트 아이스바 패치 3" role="button" tabIndex={0} aria-label="니트" aria-pressed={flavor === 2} onClick={() => setFlavor(2)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setFlavor(2) } }} style={{cursor:'pointer'}}>
          <div className="position-absolute inset-0 overflow-hidden pointer-events-none border-radius-65536px">
            <img alt="" className="position-absolute left-minus-125-65percent max-width-none width-383-49percent top-minus-127-03percent" src={MobileGiftimg5} />
          </div>
        </div>
        <p className="word-break-breakminus-word position-absolute font-family-DungGeunMo line-height-19-5px left-152px font-style-normal font-size-11px color-black top-763px white-space-nowrap" data-node-id="401:798">
          choose your flavor
        </p>
      </div>
      <p className="translate-x-center word-break-breakminus-word position-absolute font-family-DungGeunMo line-height-19-5px left-196px font-style-normal color-406851 font-size-15px text-align-center top-150px white-space-nowrap" data-node-id="403:956">
        데모데이 화이팅!
      </p>
    </div>
  );
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
  const [flavor, setFlavor] = useState(0)
  const [preview, setPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const giftCanvas = useRef(null)

  useEffect(() => {
    const resize = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  const mobile = viewport.width < 768
  const width = mobile ? 393 : 1440
  const height = mobile ? 852 : 1024
  const totalHeight = height + (unlocked ? 90 : 0)
  const scale = mobile ? viewport.width / width : Math.min(viewport.width / width, viewport.height / totalHeight)

  function check(value) {
    if (value.length !== 4) return
    if (value === PASSWORD) { setUnlocked(true); setError('') }
    else { setPassword(''); setError('비밀번호가 달라요. 다시 입력해주세요.') }
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
        width, height, pixelRatio: 2, backgroundColor: '#fff',
        style: { transform: 'none' },
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

  const Screen = unlocked ? (mobile ? MobileGift : DesktopGift) : (mobile ? MobileLogin : DesktopLogin)
  return <PhotoPreviewContext.Provider value={setPreview}>
    <main className="viewport" style={{ minHeight: Math.max(viewport.height, totalHeight * scale) }}>
      <p id="decoration-help" className="sr-only">사진을 드래그해서 빼빼로를 꾸며보세요. 우클릭 또는 두 번 탭하면 크게 볼 수 있습니다. 방향키로 이동하고 Enter로 크게 볼 수도 있습니다.</p>
      <div className="stage" style={{ width, height: totalHeight, left: (viewport.width - width * scale) / 2, transform: `scale(${scale})` }}>
        <div ref={giftCanvas} className="gift-canvas" style={{ width, height }}>
          <Screen password={password} error={error} onPasswordChange={onPasswordChange}
            onSubmit={event => { event.preventDefault(); check(password) }} flavor={flavor} setFlavor={setFlavor} />
        </div>
        {unlocked && <div className="save-controls" style={{ top: height + 12 }}>
          <button className="save-button" type="button" onClick={saveGift} disabled={saving}>{saving ? '이미지 만드는 중…' : '저장하기'}</button>
          <p className="save-error" role="status">{saveError}</p>
        </div>}
      </div>
    </main>
    {preview && <PhotoPreview src={preview} onClose={() => setPreview(null)} />}
  </PhotoPreviewContext.Provider>
}
