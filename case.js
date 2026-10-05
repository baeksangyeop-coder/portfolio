/* ==========================================================
   case.js — 케이스 스터디 페이지(work.html) 그리기
   - 주소의 ?id= 값으로 works.js 에서 작업을 찾아 화면을 만듦
   - 순서: 돌아가기 → 제목, 한 줄 설명 → 썸네일 → 역할·도구·기간·연도
           → 문제 → 요구사항 → 과정 → 선택과 이유 → 결과 → 다음 작업
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
    if (window.portfolio && media.querySelector(".thumb")) window.portfolio.fitThumb(media);
  }

  render();
})();
