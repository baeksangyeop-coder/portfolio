/* 공통: 모션 줄이기 설정, 마우스가 있는 기기인지 */
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/* 히어로 등장 연출의 시작 신호: 프리로더가 끝나면(또는 프리로더가 없으면) releaseIntro()가 호출됨 */
let releaseIntro = () => {};
const introDone = new Promise((resolve) => { releaseIntro = resolve; });

/* ==========================================================
   1) 헤더: 모바일 메뉴 열기/닫기, 스크롤 방향에 따라 숨김/표시
   ========================================================== */
(() => {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  const desktop = window.matchMedia("(min-width: 768px)");

  function setMenu(open) {
    header.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
    if (open) header.classList.remove("is-hidden");
    // 부드러운 스크롤(Lenis)에게 메뉴 상태를 알림: 열려 있으면 뒤쪽 페이지 스크롤을 멈춤
    document.dispatchEvent(new CustomEvent("menu:toggle", { detail: open }));
  }

  toggle.addEventListener("click", () => {
    setMenu(!header.classList.contains("is-open"));
  });

  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMenu(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && header.classList.contains("is-open")) {
      setMenu(false);
      toggle.focus();
    }
  });

  desktop.addEventListener("change", (event) => {
    if (event.matches) setMenu(false);
  });

  let anchorY = window.scrollY;
  let ticking = false;

  // 히어로를 지나는 동안에는 헤더를 숨기지 않음 (이름 넘겨받기 장면이 보이도록)
  const hero = document.querySelector(".hero");
  const keepVisibleUntil = () => (hero ? hero.offsetHeight * 0.9 : 80);

  function onScroll() {
    ticking = false;
    const y = window.scrollY;

    if (header.classList.contains("is-open") || y < keepVisibleUntil()) {
      header.classList.remove("is-hidden");
      anchorY = y;
      return;
    }
    if (y - anchorY > 10) {
      header.classList.add("is-hidden");
      anchorY = y;
    } else if (anchorY - y > 10) {
      header.classList.remove("is-hidden");
      anchorY = y;
    }
  }

  window.addEventListener("scroll", () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });
})();

/* ==========================================================
   1-2) 부드러운 스크롤 (Lenis + GSAP)
   - 마우스 휠 스크롤이 관성 있게 미끄러지듯 움직임 (터치 기기는 원래 스크롤 그대로)
   - GSAP의 시계(ticker) 하나로 함께 돌려서, 이후 ScrollTrigger 연출과 박자가 맞음
   - 모션 줄이기 설정이거나 라이브러리를 못 불러오면 원래 스크롤로 동작
   ========================================================== */
const lenis = (() => {
  if (prefersReducedMotion || typeof Lenis === "undefined") return null;

  const instance = new Lenis();

  if (window.gsap) {
    if (window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      instance.on("scroll", ScrollTrigger.update);
    }
    gsap.ticker.add((time) => instance.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    const loop = (time) => {
      instance.raf(time);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  // 모바일 메뉴가 열려 있는 동안에는 뒤쪽 페이지가 스크롤되지 않게 멈춤
  document.addEventListener("menu:toggle", (event) => {
    if (event.detail) instance.stop();
    else instance.start();
  });

  // 페이지 안 링크(#works 등)를 누르면 Lenis로 부드럽게 이동 (헤더 높이만큼 덜 내려감)
  const headerOffset = () => {
    const header = document.querySelector(".site-header");
    return (header ? header.offsetHeight : 64) + 16;
  };

  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || link.classList.contains("skip-link")) return;

    const hash = link.getAttribute("href");
    if (hash.length < 2) return;
    const target = document.querySelector(hash);
    if (!target) return;

    event.preventDefault();
    history.pushState(null, "", hash);

    const toTop = hash === "#top";
    instance.scrollTo(toTop ? 0 : target, {
      offset: toTop ? 0 : -headerOffset(),
      onComplete: () => {
        if (toTop) return;
        // 키보드 사용자를 위해 이동한 섹션으로 포커스도 옮김
        if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      }
    });
  });

  return instance;
})();

/* ==========================================================
   1-3) 프리로더 (첫 방문에만)
   0 → 100 숫자와 선이 차오른 뒤, 막이 위로 걷히면서 히어로 글자가 올라옴
   클릭하거나 아무 키나 누르면 빨리 끝남. 같은 탭에서 다시 열면 생략됨
   ========================================================== */
(() => {
  const root = document.documentElement;
  const loader = document.querySelector(".preloader");

  if (!root.classList.contains("is-loading") || !loader) {
    root.classList.remove("is-loading", "intro-hold");
    releaseIntro();
    return;
  }

  const num = loader.querySelector(".preloader__num");
  const bar = loader.querySelector(".preloader__bar span");
  let finished = false;

  function finish() {
    if (finished) return;
    finished = true;
    root.classList.remove("is-loading", "intro-hold");
    loader.hidden = true;
    try {
      sessionStorage.setItem("introSeen", "1");
    } catch (error) {
      // 저장이 막힌 환경이어도 문제없음 (다음에도 프리로더가 보일 뿐)
    }
    if (lenis) lenis.start();
    releaseIntro();
  }

  setTimeout(finish, 4000);   // 안전장치: 어떤 이유로든 4초 안에는 끝냄

  if (!window.gsap) {
    finish();
    return;
  }

  if (lenis) lenis.stop();

  const counter = { value: 0 };
  const timeline = gsap.timeline({ onComplete: finish });

  timeline
    .to(counter, {
      value: 100,
      duration: 1.1,
      ease: "power2.inOut",
      onUpdate: () => { num.textContent = String(Math.round(counter.value)); }
    }, 0)
    .to(bar, { scaleX: 1, duration: 1.1, ease: "power2.inOut" }, 0)
    .add(() => root.classList.remove("intro-hold"), "+=0.05")   // 히어로 글자 출발
    .to(loader, { yPercent: -100, duration: 0.8, ease: "power4.inOut" }, "<");   // 동시에 막이 걷힘

  const skip = () => timeline.timeScale(6);
  loader.addEventListener("click", skip);
  window.addEventListener("keydown", skip, { once: true });
})();

/* ==========================================================
   2) 작업 카드: getWorks() 데이터로 화면을 그림
   텍스트는 innerHTML 대신 textContent로 넣어서
   나중에 데이터를 외부(Supabase)에서 받아도 안전하게 함
   ========================================================== */
(() => {
  const list = document.getElementById("works-list");

  function make(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  // 모션 썸네일 틀: 이미지가 없을 때 카드 윗부분을 채우는 반복 모션
  // (고정된 코드 조각이라 innerHTML로 넣어도 안전. 작업 데이터 글자는 넣지 않음)
  const THUMBS = {
    price: () => `
      <div class="tp-head">
        <div class="tp-price th-anim th-bump">
          <span class="tp-slot th-anim th-slot"><span>49,000원</span><span>39,000원</span><span>29,000원</span></span>
        </div>
        <span class="tp-badge th-anim th-arrow">▼ 41%</span>
      </div>
      <svg class="tp-chart" viewBox="0 0 200 46">
        <path class="th-anim th-draw" pathLength="1" d="M4 8 L44 12 L74 10 L104 26 L134 24 L164 38 L196 42"/>
      </svg>
      <div class="tp-bubble th-anim th-pop-d">[가격 인하] 29,000원</div>`,

    dispatch: () => `
      <div class="td-flow">
        <div class="td-orders">
          <span class="td-label">주문서</span>
          <i></i><i></i><i></i><i></i>
        </div>
        <svg class="td-arrow" viewBox="0 0 24 12">
          <path class="th-anim th-draw" pathLength="1" d="M1 6h20M16 1.5L21 6l-5 4.5"/>
        </svg>
        <div class="td-suppliers">
          <span class="th-anim th-pop-a">공급사 A</span>
          <span class="th-anim th-pop-b">공급사 B</span>
          <span class="th-anim th-pop-b">공급사 C</span>
          <span class="th-anim th-pop-c">공급사 D</span>
          <span class="th-anim th-pop-c">공급사 E</span>
        </div>
      </div>
      <div class="td-done th-anim th-pop-d">
        <svg viewBox="0 0 24 24"><path class="th-anim th-draw-late" pathLength="1" d="M5 12.5l4.5 4.5L19 7.5"/></svg>
        송장 검증 후 업로드 파일 완성
      </div>`,

    merge: () => `
      <div class="tm-files">
        <span class="th-anim th-merge-a">강남</span>
        <span class="th-anim th-merge-b">홍대</span>
        <span class="th-anim th-merge-c">판교</span>
      </div>
      <div class="tm-report">
        <div class="tm-bars">
          <span class="th-anim th-grow-a" style="--h:82%"></span>
          <span class="th-anim th-grow-b" style="--h:56%"></span>
          <span class="th-anim th-grow-c" style="--h:70%"></span>
        </div>
        <span class="tm-name th-anim th-pop-d">9월_매출보고서.xlsx</span>
      </div>`,

    // 두 쇼핑몰 정산을 합쳐 순이익과 빠진 정산을 찾는 작업 (Settlement Helper)
    settle: () => `
      <div class="tm-files">
        <span class="th-anim th-merge-a">스마트스토어</span>
        <span class="th-anim th-merge-c">쿠팡</span>
      </div>
      <div class="tl-ledger">
        <div class="tl-row th-anim th-pop-a"><span>정산금액</span><b>9,530,313</b></div>
        <div class="tl-row th-anim th-pop-b"><span>원가·광고·반품</span><b>−5,319,000</b></div>
        <div class="tl-row tl-total th-anim th-pop-c"><span>순이익</span><b>4,211,313</b></div>
      </div>
      <span class="tl-alert th-anim th-pop-d">정산 누락 3건 · 받을 돈 189,236원</span>`,

    excel: () => `
      <span class="tx-progress th-anim th-fill"></span>
      <div class="tx-sheet">
        <div class="tx-row tx-head"><i>A</i><i>B</i><i>C</i><i>D</i></div>
        <div class="tx-row th-anim th-pop-a"><i></i><i></i><i></i><i></i></div>
        <div class="tx-row th-anim th-pop-b"><i></i><i></i><i></i><i></i></div>
        <div class="tx-row th-anim th-pop-c"><i></i><i></i><i></i><i></i></div>
        <div class="tx-row tx-total th-anim th-pop-d"><i></i><i></i><i></i><i>합계</i></div>
      </div>
      <span class="tx-file th-anim th-pop-d">result.xlsx</span>`,

    store: () => `
      <div class="ts-grid">
        <span class="ts-tile th-anim th-pop-a"></span>
        <span class="ts-tile th-anim th-pop-b"></span>
        <span class="ts-tile th-anim th-pop-c"></span>
      </div>
      <div class="ts-row">
        <span class="ts-btn th-anim th-press">구매하기</span>
        <span class="ts-done th-anim th-pop-d">
          <svg viewBox="0 0 24 24"><path class="th-anim th-draw-late" pathLength="1" d="M5 12.5l4.5 4.5L19 7.5"/></svg>
          주문 완료
        </span>
      </div>`,

    type: () => `
      <p class="tt-word">${Array.from("MOTION", (letter, i) =>
        `<span class="th-anim th-wave" data-l="${letter}" style="--i:${i}">${letter}</span>`).join("")}</p>`,

    site: () => `
      <div class="tw-frame">
        <div class="tw-bar"><i></i><i></i><i></i></div>
        <div class="tw-page">
          <span class="tw-hero th-anim th-pop-a"></span>
          <span class="tw-line th-anim th-pop-b"></span>
          <div class="tw-cards">
            <span class="th-anim th-pop-b"></span>
            <span class="th-anim th-pop-c"></span>
            <span class="th-anim th-pop-c"></span>
            <span class="th-anim th-pop-d"></span>
          </div>
        </div>
      </div>`
  };

  function buildThumb(key) {
    const template = THUMBS[key];
    if (!template) return null;
    const thumb = document.createElement("div");
    thumb.className = `thumb thumb--${key}`;
    thumb.setAttribute("aria-hidden", "true");   // 장식용: 화면 낭독기는 건너뜀
    thumb.innerHTML = `<div class="thumb__art"><div class="thumb__inner">${template()}</div></div>`;
    return thumb;
  }

  function buildWork(work) {
    const card = make("article", "work");
    // 누르면 갈 곳: 케이스 스터디 페이지가 있으면 그쪽이 우선 (사이트 링크는 상세 페이지 안에서 보여 줌)
    // 상세 페이지가 없는 작업만 따로 적은 link로 바로 이동
    const target = hasCase(work) ? `work.html?id=${encodeURIComponent(work.id)}` : (work.link || "");
    // 커서에 띄울 글자: 갈 곳이 있으면 View, 아직 없으면 Soon
    card.dataset.cursor = target ? "View" : "Soon";

    const media = make("div", "work__media");
    if (work.image) {
      const img = document.createElement("img");
      img.src = work.image;
      img.alt = work.title;
      img.loading = "lazy";
      media.appendChild(img);
    } else if (work.thumb) {
      const thumb = buildThumb(work.thumb);
      if (thumb) media.appendChild(thumb);
    }
    if (work.status) media.appendChild(make("span", "work__status", work.status));
    card.appendChild(media);

    const body = make("div", "work__body");

    const title = make("h3", "work__title");
    if (target) {
      const anchor = make("a", "", work.title);
      anchor.href = target;
      title.appendChild(anchor);
    } else {
      title.textContent = work.title;
    }
    body.appendChild(title);

    body.appendChild(make("p", "work__summary", work.summary));

    const meta = make("p", "work__meta");
    if (work.role) meta.appendChild(make("span", "", work.role));
    if (work.year) meta.appendChild(make("span", "", String(work.year)));
    if (meta.childElementCount) body.appendChild(meta);

    if (work.tools && work.tools.length) {
      const tools = make("ul", "work__tools");
      work.tools.forEach((tool) => tools.appendChild(make("li", "", tool)));
      body.appendChild(tools);
    }

    card.appendChild(body);
    return card;
  }

  // 카드가 화면에 들어올 때마다 튀어오르듯 나타나게 함 (시간 기반 모션)
  // - 들어올 때: is-in 을 붙여서 나타남 (한꺼번에 들어온 카드는 110ms 간격으로 차례로)
  // - 화면 밖으로 완전히 나가면: is-in 을 떼어서 다음에 들어올 때 처음부터 다시 재생
  //   (조금이라도 보이는 동안에는 떼지 않아서, 사라지는 모습이 눈에 띄지 않음)
  function setupReveal() {
    const cards = Array.from(list.querySelectorAll(".work"));
    if (!cards.length || prefersReducedMotion || !("IntersectionObserver" in window)) return;

    list.classList.add("reveal");

    const enter = new IntersectionObserver((entries) => {
      entries
        .filter((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.1)
        .forEach((entry, order) => {
          entry.target.style.setProperty("--d", `${order * 110}ms`);
          entry.target.classList.add("is-in");
        });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

    const leave = new IntersectionObserver((entries) => {
      entries
        .filter((entry) => !entry.isIntersecting)
        .forEach((entry) => {
          const card = entry.target;
          // 아래로 나갔으면 다시 아래에서, 위로 나갔으면 다시 위에서 들어오도록 방향을 준비
          const below = entry.boundingClientRect.top > window.innerHeight / 2;
          card.style.setProperty("--from", below ? "64px" : "-64px");
          card.style.setProperty("--d", "0ms");
          card.classList.remove("is-in");
        });
    }, { threshold: 0 });

    cards.forEach((card) => {
      enter.observe(card);
      leave.observe(card);
    });
  }

  // 썸네일 크기 맞추기: 카드 상자의 가로·세로를 재서, 16:10 그림판이 잘리지 않는 크기(--u)를 계산
  // 카드 크기가 바뀌면(창 크기 변경 등) 자동으로 다시 계산됨
  const thumbObserver = "ResizeObserver" in window
    ? new ResizeObserver((entries) => {
        entries.forEach((entry) => {
          const { width, height } = entry.contentRect;
          const thumb = entry.target.querySelector(".thumb");
          if (thumb) thumb.style.setProperty("--u", `${Math.min(width, height * 1.6) / 100}px`);
        });
      })
    : null;

  // 상자 하나의 썸네일 크기를 맞춤 (케이스 스터디 페이지에서도 씀)
  function fitThumb(media) {
    if (thumbObserver && media.querySelector(".thumb")) thumbObserver.observe(media);
  }

  function fitThumbs() {
    list.querySelectorAll(".work__media").forEach(fitThumb);
  }

  async function renderWorks() {
    try {
      const works = await getWorks();
      if (!works.length) {
        list.replaceChildren(make("p", "works__message", "아직 등록된 작업이 없습니다."));
        return;
      }
      list.replaceChildren(...works.map(buildWork));
      fitThumbs();
      setupReveal();
    } catch (error) {
      console.error(error);
      list.replaceChildren(
        make("p", "works__message", "작업 목록을 불러오지 못했습니다. 새로고침해 주세요.")
      );
    }
  }

  // 케이스 스터디 페이지(case.js)에서도 썸네일을 쓸 수 있게 꺼내 둠
  window.portfolio = { buildThumb, fitThumb };

  if (list) renderWorks();   // 작업 목록이 있는 페이지(첫 화면)에서만
})();

/* ==========================================================
   3) 히어로 이름: 글자 쪼개기 + 3D 인터랙션
   - 글자를 하나씩 쪼개서, 마우스가 가까워지면 그 글자가 위로 뜨고 앞으로 튀어나오고 기울어짐
   - 이름 전체도 마우스 위치에 따라 3D로 기울어짐 (뒤에 깔린 두께 층이 드러나 입체로 보임)
   - 처음 몇 초 동안은 마우스가 없어도 천천히 흔들리다가 멈춤 (계속 움직이면 읽기 불편하므로)
   - 휴대폰용: 글자를 톡 치면 그 자리에서 물결이 퍼지며 글자가 튀어나옴 (마우스 클릭도 동일)
   - 스크롤하면 스크롤 속도만큼 글자가 눕고 두께가 드러남 (휴대폰, 데스크톱 모두)
   - 모션 줄이기 설정을 켠 사용자에게는 쪼개기만 하고 움직임은 없음
   ========================================================== */
(() => {
  const title = document.querySelector(".hero__name");
  const hero = document.querySelector(".hero");
  const lines = title ? Array.from(title.querySelectorAll(".line__text")) : [];
  if (!title || !hero || !lines.length) return;

  /* ---- (1) 글자 쪼개기 ---- */
  // 화면 낭독기에는 쪼개기 전의 이름을 그대로 읽어 줌
  title.setAttribute("aria-label", title.textContent.replace(/\s+/g, " ").trim());

  const chars = [];
  let index = 0;

  lines.forEach((line) => {
    const text = line.textContent.trim();
    line.textContent = "";
    line.setAttribute("aria-hidden", "true");

    Array.from(text).forEach((letter) => {
      const el = document.createElement("span");
      el.className = "char";
      el.dataset.char = letter;
      el.style.setProperty("--i", index);
      index += 1;

      const face = document.createElement("span");
      face.className = "char__face";
      face.textContent = letter;

      el.appendChild(face);
      line.appendChild(el);

      chars.push({
        el,
        line,
        cx: 0,
        cy: 0,
        v: { ty: 0, tz: 0, rx: 0, ry: 0, s: 1, depth: 10 }   // 지금 값 (부드럽게 따라감)
      });
    });
  });

  /* ---- (2) 위치 재기: 글자 중심 좌표와 그라데이션 이동값 ---- */
  function pagePosition(node) {
    let x = 0;
    let y = 0;
    while (node) {
      x += node.offsetLeft;
      y += node.offsetTop;
      node = node.offsetParent;
    }
    return { x, y };
  }

  function measure() {
    chars.forEach((c) => {
      c.el.style.setProperty("--ox", `${c.el.offsetLeft}px`);
      c.el.style.setProperty("--lw", `${c.line.offsetWidth}px`);
      const p = pagePosition(c.el);
      c.cx = p.x + c.el.offsetWidth / 2;
      c.cy = p.y + c.el.offsetHeight / 2;
    });
  }

  measure();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(measure, 120);
  });

  if (prefersReducedMotion) {
    title.classList.add("is-ready");
    return;
  }

  /* ---- (3) 움직임 ---- */
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const lerp = (a, b, k) => a + (b - a) * k;

  const tilt = { x: 0, y: 0 };
  let pointer = null;        // 마우스 위치 { cx, cy } (화면 기준)
  let ready = false;         // 첫 등장 연출이 끝났는가
  let visible = true;        // 히어로가 화면에 보이는가
  let frameId = 0;
  let startedAt = 0;
  let ripples = [];                    // 탭할 때 생기는 물결 { x, y, start } (페이지 좌표)
  let lastScrollY = window.scrollY;
  let scrollVel = 0;                   // 스크롤 속도 (부드럽게 다듬은 값)
  const RIPPLE_LIFE = 1200;            // 물결이 살아 있는 시간(ms)

  function frame(now) {
    frameId = requestAnimationFrame(frame);

    const radius = clamp(window.innerWidth * 0.18, 140, 260);   // 마우스 영향이 닿는 거리
    const rect = hero.getBoundingClientRect();
    const calm = clamp(1 - (now - startedAt - 3000) / 1500, 0, 1);   // 3초 뒤부터 1.5초에 걸쳐 잦아듦
    let moving = false;

    // 스크롤 속도: 이번 프레임에 움직인 거리를 부드럽게 다듬어서, 글자가 기우는 각도로 씀
    const sy = window.scrollY;
    scrollVel = lerp(scrollVel, sy - lastScrollY, 0.25);
    lastScrollY = sy;
    if (Math.abs(scrollVel) > 0.05) moving = true;
    const kick = clamp(scrollVel * 0.9, -22, 22);

    // 오래된 물결은 지움
    ripples = ripples.filter((r) => now - r.start < RIPPLE_LIFE);
    if (ripples.length) moving = true;

    // 이름 전체의 기울기
    let targetX;
    let targetY;
    if (pointer) {
      const nx = clamp(((pointer.cx - rect.left) / rect.width) * 2 - 1, -1, 1);
      const ny = clamp(((pointer.cy - rect.top) / rect.height) * 2 - 1, -1, 1);
      targetY = nx * 9;
      targetX = -ny * 6;
    } else {
      targetY = Math.sin(now / 2600) * 4 * calm;
      targetX = Math.cos(now / 3400) * 2.2 * calm;
    }
    tilt.x = lerp(tilt.x, targetX, 0.08);
    tilt.y = lerp(tilt.y, targetY, 0.08);
    if (Math.abs(tilt.x - targetX) > 0.02 || Math.abs(tilt.y - targetY) > 0.02) moving = true;
    title.style.setProperty("--tilt-x", `${tilt.x.toFixed(2)}deg`);
    title.style.setProperty("--tilt-y", `${tilt.y.toFixed(2)}deg`);

    // 글자마다: 마우스와 가까울수록(e가 1에 가까울수록) 더 많이 튀어나옴
    const px = pointer ? pointer.cx + window.scrollX : 0;
    const py = pointer ? pointer.cy + window.scrollY : 0;

    chars.forEach((c, i) => {
      let target = {
        ty: 0,
        tz: Math.sin(now / 1100 + i * 0.5) * 6 * calm,   // 처음 몇 초의 잔잔한 물결
        rx: 0,
        ry: 0,
        s: 1,
        depth: 10
      };

      if (pointer) {
        const dx = px - c.cx;
        const dy = py - c.cy;
        const near = clamp(1 - Math.hypot(dx, dy) / radius, 0, 1);
        const e = near * near * (3 - 2 * near);           // 부드럽게 커지는 곡선
        target = {
          ty: -e * 16,                                    // 위로 뜸
          tz: e * 80,                                     // 앞으로 튀어나옴
          rx: -clamp(dy / radius, -1, 1) * e * 20,        // 마우스 쪽을 바라보듯 기울어짐
          ry: clamp(dx / radius, -1, 1) * e * 28,
          s: 1 + e * 0.05,
          depth: 10 + e * 22                              // 두께가 두꺼워짐
        };
      }

      // 물결: 퍼져 나가는 둥근 띠가 지나가는 글자가 튀어나옴 (시간이 지날수록 약해짐)
      let wave = 0;
      ripples.forEach((r) => {
        const age = now - r.start;
        const ring = age * 0.9;                                   // 1초에 900px씩 퍼짐
        const d = Math.hypot(r.x - c.cx, r.y - c.cy);
        const band = Math.exp(-(((d - ring) / 70) ** 2));          // 띠에 가까울수록 1
        wave = Math.max(wave, band * (1 - age / RIPPLE_LIFE));
      });
      if (wave > 0.001) {
        target.tz += wave * 90;
        target.ty -= wave * 18;
        target.rx -= wave * 14;
        target.s += wave * 0.06;
        target.depth += wave * 24;
      }

      // 스크롤 반응: 스크롤하는 방향으로 글자가 눕고 두께가 드러남
      target.rx += kick;
      target.depth += Math.min(Math.abs(kick) * 1.1, 22);

      Object.keys(target).forEach((key) => {
        c.v[key] = lerp(c.v[key], target[key], 0.14);
        if (Math.abs(c.v[key] - target[key]) > 0.02) moving = true;
      });

      c.el.style.setProperty("--ty", `${c.v.ty.toFixed(2)}px`);
      c.el.style.setProperty("--tz", `${c.v.tz.toFixed(2)}px`);
      c.el.style.setProperty("--rx", `${c.v.rx.toFixed(2)}deg`);
      c.el.style.setProperty("--ry", `${c.v.ry.toFixed(2)}deg`);
      c.el.style.setProperty("--s", c.v.s.toFixed(3));
      c.el.style.setProperty("--depth", `${c.v.depth.toFixed(2)}px`);
    });

    // 은색 빛의 위치 (줄마다 기준 좌표가 다름)
    lines.forEach((line) => {
      if (pointer) {
        const r = line.getBoundingClientRect();
        line.style.setProperty("--lx", `${pointer.cx - r.left}px`);
        line.style.setProperty("--ly", `${pointer.cy - r.top}px`);
      } else {
        line.style.setProperty("--lx", "-999px");
        line.style.setProperty("--ly", "-999px");
      }
    });

    // 마우스도 없고 모든 값이 제자리면 반복을 멈춰서 배터리를 아낌
    if (!pointer && calm === 0 && !moving) stopLoop();
  }

  function startLoop() {
    if (frameId || !ready || !visible || document.hidden) return;
    frameId = requestAnimationFrame(frame);
  }

  function stopLoop() {
    cancelAnimationFrame(frameId);
    frameId = 0;
  }

  function addRipple(clientX, clientY) {
    ripples.push({ x: clientX + window.scrollX, y: clientY + window.scrollY, start: performance.now() });
    if (ripples.length > 4) ripples.shift();
    startLoop();
  }

  // 첫 등장 연출이 끝나면 가림막을 걷고 움직임을 시작
  function start() {
    if (ready) return;
    ready = true;
    title.classList.add("is-ready");
    measure();
    startedAt = performance.now();
    startLoop();

    // 마우스가 없는 기기: 만질 수 있다는 걸 알려 주려고 물결을 한 번 보여 줌
    if (!hasFinePointer) {
      setTimeout(() => {
        const r = title.getBoundingClientRect();
        addRipple(r.left + r.width * 0.3, r.top + r.height * 0.6);
      }, 500);
    }
  }

  chars[chars.length - 1].el.addEventListener("animationend", start, { once: true });
  // 혹시 animationend가 안 와도 시작되도록 하는 안전장치 (프리로더가 끝난 뒤부터 잼)
  introDone.then(() => setTimeout(start, 2600));

  // 마우스 (터치는 제외: 터치는 스크롤과 겹치므로 잔잔한 흔들림만 보임)
  hero.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") return;
    pointer = { cx: event.clientX, cy: event.clientY };
    startLoop();
  });

  hero.addEventListener("pointerleave", () => {
    pointer = null;
    startLoop();   // 제자리로 돌아오는 움직임을 끝까지 보여 줌
  });

  // 탭 판별: 손가락을 거의 움직이지 않고 짧게 눌렀다 뗀 경우만 (스크롤하려던 터치는 제외)
  // 링크와 버튼을 누른 경우도 제외
  let press = null;
  hero.addEventListener("pointerdown", (event) => {
    if (event.target.closest("a, button")) return;
    press = { x: event.clientX, y: event.clientY, t: performance.now() };
  });
  hero.addEventListener("pointerup", (event) => {
    if (!press) return;
    const moved = Math.hypot(event.clientX - press.x, event.clientY - press.y);
    if (moved < 10 && performance.now() - press.t < 500) addRipple(event.clientX, event.clientY);
    press = null;
  });
  hero.addEventListener("pointercancel", () => { press = null; });

  // 스크롤하면 반응하도록 반복을 깨움 (히어로가 화면에 있을 때만 실제로 돎)
  window.addEventListener("scroll", () => startLoop(), { passive: true });

  // 히어로가 화면 밖이거나 탭이 숨겨지면 멈춤
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) startLoop();
    else stopLoop();
  }).observe(hero);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopLoop();
    else startLoop();
  });
})();

/* ==========================================================
   4) 작업 카드: 마우스를 따라오는 광택
   카드는 나중에 만들어지므로 목록 전체에서 이벤트를 받아 처리(이벤트 위임)
   ========================================================== */
(() => {
  if (prefersReducedMotion || !hasFinePointer) return;

  const list = document.getElementById("works-list");
  if (!list) return;

  list.addEventListener("pointermove", (event) => {
    const card = event.target.closest(".work");
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    card.style.setProperty("--my", `${event.clientY - rect.top}px`);
  });
})();

/* ==========================================================
   5) 소개 문장을 단어별로 나눔 (스크롤하면 단어가 차례로 밝아짐)
   - CSS의 스크롤 연동을 지원하고, 모션 줄이기가 꺼져 있을 때만 나눔
   - 아니면 문장을 그대로 두어 읽기에 지장이 없게 함
   ========================================================== */
(() => {
  const lead = document.querySelector(".about__lead");
  const supported = window.CSS && CSS.supports && CSS.supports("animation-timeline: view()");
  if (!lead || !supported || prefersReducedMotion) return;

  const words = lead.textContent.trim().split(/\s+/);
  lead.textContent = "";

  words.forEach((word, index) => {
    const span = document.createElement("span");
    span.className = "word";
    span.textContent = word;
    lead.appendChild(span);
    if (index < words.length - 1) lead.appendChild(document.createTextNode(" "));
  });
})();

/* ==========================================================
   6) 도구 띠: 소개의 '사용 도구' 목록을 읽어서 채움
   같은 그룹 2개를 이어 붙이면 -50% 이동 시 처음과 똑같아져 끊김 없이 반복됨
   ========================================================== */
(() => {
  const track = document.getElementById("marquee-track");
  const items = document.querySelectorAll("[data-tools] li");
  if (!track || !items.length) return;

  const names = Array.from(items, (li) => li.textContent.trim());

  function makeGroup() {
    const group = document.createElement("div");
    group.className = "marquee__group";
    // 넓은 화면에서도 빈틈이 생기지 않도록 목록을 3번 반복
    for (let i = 0; i < 3; i += 1) {
      names.forEach((name) => {
        const item = document.createElement("span");
        item.className = "marquee__item";
        item.textContent = name;
        group.appendChild(item);
      });
    }
    return group;
  }

  track.append(makeGroup(), makeGroup());
})();

/* ==========================================================
   7) 따라오는 커서 + 자석 버튼 (마우스가 있는 기기에서만)
   - 원래 마우스 커서는 그대로 두고, 금속색 점이 살짝 늦게 따라옴 (사용성을 해치지 않게)
   - 링크·버튼 위: 점이 테두리 고리로 바뀜 / 작업 카드 위: 큰 원으로 커지며 View 또는 Soon 표시
   - 이메일 주소와 히어로 버튼은 마우스가 가까워지면 자석처럼 끌려오고, 멀어지면 통 튀며 제자리로
   ========================================================== */
(() => {
  if (prefersReducedMotion || !hasFinePointer) return;

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

  /* ---- 커서 만들기 ---- */
  const cursor = document.createElement("div");
  cursor.className = "cursor";
  cursor.setAttribute("aria-hidden", "true");
  const label = document.createElement("span");
  label.className = "cursor__label";
  cursor.appendChild(label);
  document.body.appendChild(cursor);

  const pos = { x: -100, y: -100 };      // 지금 그려진 위치
  const target = { x: -100, y: -100 };   // 마우스 위치
  let frame = 0;

  function render() {
    pos.x += (target.x - pos.x) * 0.22;   // 0.22: 클수록 빨리 따라옴
    pos.y += (target.y - pos.y) * 0.22;
    // 위치는 translate(개별 속성)로 넣음. transform에 넣으면 크기(scale)가 위치까지 줄여 버려
    // 점과 고리 모양일 때 커서가 마우스에서 멀리 떨어져 보이는 문제가 생김
    cursor.style.translate = `${pos.x.toFixed(1)}px ${pos.y.toFixed(1)}px`;
    const settled = Math.abs(target.x - pos.x) < 0.1 && Math.abs(target.y - pos.y) < 0.1;
    frame = settled ? 0 : requestAnimationFrame(render);
  }

  /* ---- 자석 버튼 ---- */
  const magnets = Array.from(document.querySelectorAll(".contact__mail, .hero__actions .btn"))
    .map((el) => {
      el.classList.add("is-magnetic");
      const isMail = el.classList.contains("contact__mail");
      return { el, x: 0, y: 0, max: isMail ? 28 : 16 };   // 최대로 끌려오는 거리(px)
    });

  function updateMagnets(x, y) {
    magnets.forEach((m) => {
      const r = m.el.getBoundingClientRect();
      // 지금 끌려가 있는 만큼을 빼서 원래 중심을 구함 (안 그러면 따라가며 계속 밀려남)
      const cx = r.left + r.width / 2 - m.x;
      const cy = r.top + r.height / 2 - m.y;
      const dx = x - cx;
      const dy = y - cy;
      const reach = Math.max(r.width, r.height) * 0.6 + 60;   // 반응하는 거리

      if (Math.hypot(dx, dy) < reach) {
        m.x = clamp(dx * 0.3, -m.max, m.max);
        m.y = clamp(dy * 0.4, -m.max, m.max);
        m.el.classList.add("is-magnet");
      } else if (m.el.classList.contains("is-magnet")) {
        m.x = 0;
        m.y = 0;
        m.el.classList.remove("is-magnet");   // 제자리로 돌아갈 때는 통 튀는 이징
      }
      m.el.style.translate = `${m.x.toFixed(1)}px ${m.y.toFixed(1)}px`;
    });
  }

  /* ---- 마우스 이벤트 ---- */
  window.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse") return;
    target.x = event.clientX;
    target.y = event.clientY;
    if (!cursor.classList.contains("is-visible")) {
      pos.x = target.x;   // 처음 나타날 때는 화면 구석에서 날아오지 않게 바로 그 자리에
      pos.y = target.y;
      cursor.classList.add("is-visible");
    }
    if (!frame) frame = requestAnimationFrame(render);
    updateMagnets(event.clientX, event.clientY);
  }, { passive: true });

  // 창 밖으로 나가면 숨김
  document.addEventListener("pointerout", (event) => {
    if (!event.relatedTarget) cursor.classList.remove("is-visible");
  });

  // 무엇 위에 있는지에 따라 커서 모양을 바꿈
  document.addEventListener("pointerover", (event) => {
    // 작업 카드나 data-cursor 가 있는 요소(쇼릴 미리보기) 위에서는 큰 원 + 글자
    const card = event.target.closest(".work, [data-cursor]");
    const interactive = event.target.closest("a, button");
    cursor.classList.toggle("is-card", Boolean(card));
    cursor.classList.toggle("is-link", !card && Boolean(interactive));
    label.textContent = card ? (card.dataset.cursor || "") : "";
  });
})();

/* ==========================================================
   8) 이름 넘겨받기
   큰 이름(.hero__name)이 화면 위로 완전히 빠져나가면 헤더에 작은 이름을 띄우고,
   다시 내려오면 숨김. (큰 이름이 줄어드는 연출은 style.css의 스크롤 연동이 담당)
   ========================================================== */
(() => {
  const header = document.querySelector(".site-header");
  const name = document.querySelector(".hero__name");
  if (!header || !name || !("IntersectionObserver" in window)) return;

  header.classList.add("site-header--handoff");

  new IntersectionObserver(([entry]) => {
    const above = entry.boundingClientRect.top < 0;   // 위쪽으로 빠져나갔는가
    header.classList.toggle("has-brand", !entry.isIntersecting && above);
  }, { threshold: 0 }).observe(name);
})();

/* ==========================================================
   9) 히어로 위쪽의 한국 시각 (1분마다 갱신)
   ========================================================== */
(() => {
  const clock = document.getElementById("kst-clock");
  if (!clock) return;

  const format = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  function tick() {
    const now = new Date();
    clock.textContent = format.format(now);
    // 다음 '분'이 바뀌는 순간에 맞춰 다시 실행
    setTimeout(tick, 60000 - (now.getSeconds() * 1000 + now.getMilliseconds()) + 50);
  }
  tick();
})();
