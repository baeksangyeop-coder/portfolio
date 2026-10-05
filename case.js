/* ==========================================================
   case.js — 케이스 스터디 페이지(work.html) 그리기
   - 주소의 ?id= 값으로 works.js 에서 작업을 찾아 화면을 만듦
   - 순서: 돌아가기 → 제목, 한 줄 설명 → 썸네일 → 역할·도구·기간·연도
           → 작업 흐름(카드가 단계별로 이어지는 그림) → 문제 → 요구사항 → 과정 → 선택과 이유 → 결과
           → 실제 화면 → 다음 작업
   - 내용이 비어 있는 칸은 자동으로 건너뜀
   - 글자는 textContent로 넣어서, 나중에 데이터를 외부에서 받아도 안전함
   ========================================================== */
(() => {
  const root = document.getElementById("case");
  if (!root) return;

  function make(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function backLink() {
    const a = make("a", "case__back", "작업 목록으로 돌아가기");
    a.href = "index.html#works";
    return a;
  }

  function listOf(items, ordered) {
    const list = make(ordered ? "ol" : "ul", "");
    items.forEach((item) => list.appendChild(make("li", "", item)));
    return list;
  }

  // 글 한 덩어리(문자열) 또는 여러 항목(배열) 모두 받음
  function content(value, ordered) {
    if (Array.isArray(value)) return value.length ? listOf(value, ordered) : null;
    return value ? make("p", "", value) : null;
  }

  function section(title, body) {
    const sec = make("section", "case__section");
    const box = make("div", "case__body");
    box.appendChild(body);
    sec.append(make("h2", "", title), box);
    return sec;
  }

  /* ---------------- 크게 보기 (화면 사진) ----------------
     브라우저 기본 대화상자(dialog)를 써서 Esc로 닫기, 포커스 가두기가 자동으로 됨 */
  let viewer = null;
  function getViewer() {
    if (viewer) return viewer;
    const dialog = document.createElement("dialog");
    dialog.className = "lightbox";
    dialog.setAttribute("data-lenis-prevent", "");   // 부드러운 스크롤이 대화상자 안 스크롤을 가로채지 않게
    const close = make("button", "lightbox__close", "닫기");
    close.type = "button";
    const figure = make("figure", "lightbox__figure");
    const img = document.createElement("img");
    const caption = make("figcaption", "");
    figure.append(img, caption);
    dialog.append(close, figure);
    document.body.appendChild(dialog);

    close.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();   // 바깥 어두운 곳을 누르면 닫힘
    });
    dialog.addEventListener("close", () => {
      if (typeof lenis !== "undefined" && lenis) lenis.start();
    });

    viewer = {
      open(src, title, text) {
        img.src = src;
        img.alt = title;
        caption.textContent = text ? `${title}. ${text}` : title;
        dialog.showModal();
        if (typeof lenis !== "undefined" && lenis) lenis.stop();
      }
    };
    return viewer;
  }

  /* ---------------- 작업 흐름 ----------------
     데스크톱: 화면에 고정된 판 위에서, 스크롤할수록 카드가 차례로 나타나고 연결선이 그려짐
     휴대폰, 모션 줄이기: 카드가 위에서 아래로 이어진 목록으로 보임 */
  const SVG_NS = "http://www.w3.org/2000/svg";

  function buildFlow(flow) {
    const nodes = (flow && flow.nodes) || [];
    if (!nodes.length) return null;

    const section = make("section", "flow");
    section.style.setProperty("--steps", nodes.length);
    section.append(
      make("h2", "flow__title", "작업 흐름"),
      make("p", "flow__hint", "스크롤하면 과정이 단계별로 이어지고, 화면이 있는 카드는 누르면 크게 볼 수 있어요.")
    );

    const track = make("div", "flow__track");
    const stage = make("div", "flow__stage");
    const canvas = make("div", "flow__canvas");
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "flow__lines");
    svg.setAttribute("aria-hidden", "true");
    canvas.appendChild(svg);

    const nodeEls = [];
    const byId = {};
    nodes.forEach((node, i) => {
      const hasShot = Boolean(node.image);
      const el = make(hasShot ? "button" : "div", hasShot ? "flow__node flow__node--shot" : "flow__node");
      el.style.setProperty("--x", node.x);
      el.style.setProperty("--y", node.y);
      el.appendChild(make("span", "flow__no", String(i + 1).padStart(2, "0")));

      if (hasShot) {
        el.type = "button";
        el.dataset.cursor = "Zoom";
        el.setAttribute("aria-label", `${node.title}: 화면 크게 보기`);
        const frame = make("span", "flow__shot");
        const img = document.createElement("img");
        img.src = node.image;
        img.alt = "";
        img.loading = "lazy";
        img.decoding = "async";
        frame.appendChild(img);
        el.appendChild(frame);
        el.addEventListener("click", () => getViewer().open(node.image, node.title, node.caption || node.text));
      }

      el.appendChild(make("strong", "flow__name", node.title));
      if (node.text) el.appendChild(make("span", "flow__text", node.text));
      canvas.appendChild(el);
      nodeEls.push(el);
      byId[node.id] = { el, index: i };
    });

    // 연결선: 도착하는 카드가 나타날 때 함께 그려짐
    const lines = (flow.edges || [])
      .filter(([from, to]) => byId[from] && byId[to])
      .map(([from, to]) => {
        const path = document.createElementNS(SVG_NS, "path");
        path.setAttribute("pathLength", "1");
        svg.appendChild(path);
        return { path, from: byId[from], to: byId[to] };
      });

    stage.appendChild(canvas);
    track.appendChild(stage);
    section.appendChild(track);

    return { section, track, canvas, svg, nodeEls, lines };
  }

  function animateFlow(flowParts) {
    const { section, track, canvas, svg, nodeEls, lines } = flowParts;
    const desktop = window.matchMedia("(min-width: 900px)");
    const reduce = typeof prefersReducedMotion !== "undefined" && prefersReducedMotion;
    const steps = nodeEls.length;

    // 카드 중심을 이어 주는 곡선 경로 계산 (카드 위치는 left/top 이 곧 중심)
    function layoutLines() {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      lines.forEach(({ path, from, to }) => {
        const ax = from.el.offsetLeft, ay = from.el.offsetTop;
        const bx = to.el.offsetLeft, by = to.el.offsetTop;
        const dx = (bx - ax) * 0.5;
        path.setAttribute("d", `M ${ax} ${ay} C ${ax + dx} ${ay}, ${bx - dx} ${by}, ${bx} ${by}`);
      });
    }

    let ticking = false;
    function update() {
      ticking = false;
      const live = desktop.matches && !reduce;
      section.classList.toggle("is-live", live);

      if (!live) {
        // 목록 모드: 모든 카드와 선을 다 보여 줌
        nodeEls.forEach((el) => el.classList.add("is-on"));
        lines.forEach(({ path }) => { path.style.strokeDashoffset = "0"; });
        return;
      }

      // 트랙을 지나간 비율(0~1)을 단계 번호로 바꿈. 마지막 카드는 조금 일찍 나타나 머무름
      const total = Math.max(1, track.offsetHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, -track.getBoundingClientRect().top / total));
      const pos = progress * (steps - 1) * 1.15;
      const current = Math.min(steps - 1, Math.floor(pos + 0.15));

      nodeEls.forEach((el, i) => {
        el.classList.toggle("is-on", pos >= i - 0.15);
        el.classList.toggle("is-current", i === current);
      });
      lines.forEach(({ path, to }) => {
        const drawn = Math.min(1, Math.max(0, pos - (to.index - 1)));
        path.style.strokeDashoffset = String(1 - drawn);
      });
    }

    function schedule() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    layoutLines();
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", () => { layoutLines(); schedule(); });
    desktop.addEventListener("change", () => { layoutLines(); schedule(); });
  }

  function renderMissing() {
    document.title = "작업을 찾을 수 없음 | BAEK SANGYEOP";
    root.replaceChildren(
      backLink(),
      make("h1", "case__title", "작업을 찾을 수 없습니다"),
      make("p", "case__summary", "주소가 바뀌었거나 아직 상세 페이지가 준비되지 않은 작업이에요.")
    );
  }

  async function render() {
    const id = new URLSearchParams(window.location.search).get("id");

    let works;
    try {
      works = await getWorks();
    } catch (error) {
      console.error(error);
      renderMissing();
      return;
    }

    const cases = works.filter(hasCase);
    const work = cases.find((item) => item.id === id);
    if (!work) {
      renderMissing();
      return;
    }

    document.title = `${work.title} | BAEK SANGYEOP`;
    const parts = [backLink(), make("h1", "case__title", work.title)];
    if (work.summary) parts.push(make("p", "case__summary", work.summary));

    // 사이트 버튼: 직접 써 볼 수 있는 작업이면 설명 바로 아래에 눈에 띄게 (새 탭으로 열림)
    // linkNote(선택)는 버튼 옆의 작은 안내 문구. 예: 테스트 결제라 돈이 나가지 않음
    if (work.link) {
      const actions = make("div", "case__actions");
      const site = make("a", "btn btn--primary case__site", "사이트 직접 써 보기");
      site.href = work.link;
      site.target = "_blank";
      site.rel = "noopener";
      site.dataset.cursor = "Open";
      site.setAttribute("aria-label", `${work.title} 사이트 직접 써 보기 (새 탭)`);
      const arrow = make("span", "case__site-arrow", "↗");
      arrow.setAttribute("aria-hidden", "true");
      site.appendChild(arrow);
      actions.appendChild(site);
      if (work.linkNote) actions.appendChild(make("p", "case__site-note", work.linkNote));
      parts.push(actions);
    }

    // 큰 썸네일: 이미지가 있으면 이미지, 없으면 카드와 같은 모션 썸네일
    const media = make("div", "case__media");
    if (work.image) {
      const img = document.createElement("img");
      img.src = work.image;
      img.alt = work.title;
      media.appendChild(img);
    } else if (work.thumb && window.portfolio) {
      const thumb = window.portfolio.buildThumb(work.thumb);
      if (thumb) media.appendChild(thumb);
    }
    if (media.childElementCount) parts.push(media);

    // 역할, 도구, 기간, 연도
    const meta = make("dl", "case__meta");
    [
      ["역할", work.role],
      ["도구", (work.tools || []).join(", ")],
      ["기간", work.duration],
      ["연도", work.year ? String(work.year) : ""]
    ].forEach(([label, value]) => {
      if (!value) return;
      const row = make("div", "");
      row.append(make("dt", "", label), make("dd", "", value));
      meta.appendChild(row);
    });

    if (meta.childElementCount) parts.push(meta);

    // 작업 흐름 (works.js 의 flow)
    const flowParts = buildFlow(work.flow);
    if (flowParts) parts.push(flowParts.section);

    // 본문 섹션
    const sections = make("div", "case__sections");
    [
      ["문제", content(work.brief)],
      ["요구사항", content(work.requirements || [])],
      ["과정", content(work.process || [], true)],
      ["선택과 이유", content(work.decisions || [])],
      ["결과", content(work.outcome)]
    ].forEach(([title, body]) => {
      if (body) sections.appendChild(section(title, body));
    });
    parts.push(sections);

    // 실제 화면 (works.js 의 media: [{ src, alt, caption }])
    // 누르면 원본 크기로 새 탭에서 열림
    const shots = (work.media || []).filter((m) => m && m.src);
    if (shots.length) {
      const gallery = make("section", "case__gallery");
      gallery.appendChild(make("h2", "", "실제 화면"));
      const grid = make("div", "case__shots");
      shots.forEach((shot) => {
        const figure = make("figure", "case__shot");
        const link = make("a", "");
        link.href = shot.src;
        link.target = "_blank";
        link.rel = "noopener";
        const img = document.createElement("img");
        img.src = shot.src;
        img.alt = shot.alt || shot.caption || work.title;
        img.loading = "lazy";
        img.decoding = "async";
        link.appendChild(img);
        figure.appendChild(link);
        if (shot.caption) figure.appendChild(make("figcaption", "", shot.caption));
        grid.appendChild(figure);
      });
      gallery.appendChild(grid);
      parts.push(gallery);
    }

    // 다음 작업 (상세 페이지가 있는 작업끼리 돌아가며)
    if (cases.length > 1) {
      const next = cases[(cases.indexOf(work) + 1) % cases.length];
      const link = make("a", "case__next");
      link.href = `work.html?id=${encodeURIComponent(next.id)}`;
      link.dataset.cursor = "Next";
      link.append(make("span", "case__next-label", "다음 작업"), make("span", "case__next-title", next.title));
      parts.push(link);
    }

    root.replaceChildren(...parts);
    if (flowParts) animateFlow(flowParts);   // 화면에 붙인 뒤에 위치를 재야 해서 이 순서
    if (window.portfolio && media.querySelector(".thumb")) window.portfolio.fitThumb(media);
  }

  render();
})();
