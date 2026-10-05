/* ==========================================================
   작업 데이터
   - 이 파일만 고치면 화면의 카드가 바뀝니다.
   - 배열 순서가 곧 카드 순서입니다.
   - visible: false 로 바꾸면 삭제하지 않고 화면에서만 숨길 수 있어요.
   - image 가 비어 있으면 회색 박스, 파일 경로를 적으면 이미지로 바뀝니다.
   - thumb 는 이미지가 없을 때 보여 줄 모션 썸네일 종류입니다.
     price(가격 변동), dispatch(발주·송장 분배), merge(엑셀 통합 보고서), excel(엑셀 표),
     store(주문 흐름), type(키네틱 타이포), site(웹사이트) 중 하나.
     비우면 회색 박스
   - brief ~ outcome, media 는 케이스 스터디 페이지(다음 단계)에서 씁니다.
   - 나중에 Supabase로 옮길 때는 아래 getWorks() 안쪽만 바꾸면 됩니다.
   ========================================================== */
const WORKS = [
  {
    id: "price-monitor",
    title: "Price Monitor",
    summary: "가격 변동을 감지해 카카오톡으로 알려 주는 데스크톱 프로그램",
    role: "가상 외주 실습",
    tools: ["Python", "Supabase", "tkinter", "exe 포장"],
    year: 2026,
    duration: "",
    brief: "",
    process: [],
    decisions: "",
    outcome: "exe 파일과 사용 설명서까지 만들어 실행 확인",
    media: [],
    tags: [],
    link: "",
    image: "",
    thumb: "price",
    status: "",
    visible: true
  },
  {
    // TODO: 과정(process)과 선택 이유(decisions)는 케이스 스터디를 만들 때 채우기
    id: "order-dispatch",
    title: "Order Dispatch Automation",
    summary: "주문 엑셀을 공급사별 발주서로 나누고, 송장 회신을 검증해 업로드 파일로 만드는 자동화",
    role: "가상 외주 실습",
    tools: ["Python", "pandas", "exe 포장"],
    year: 2026,
    duration: "",
    brief: "재고 없이 공급사 5곳이 고객에게 직접 배송하는 쇼핑몰. 매일 주문을 손으로 나눠 발주하고 송장번호를 일일이 붙이느라 하루 2시간 넘게 걸리고, 발주 누락과 송장 오매칭이 생기던 문제",
    process: [],
    decisions: "",
    outcome: "코딩을 모르는 직원도 더블클릭으로 쓸 수 있게 exe 파일로 만들어 실행까지 확인",
    media: [],
    tags: ["엑셀 자동화"],
    link: "",
    image: "",
    thumb: "dispatch",
    status: "",
    visible: true
  },
  {
    // TODO: 과정(process)과 선택 이유(decisions)는 케이스 스터디를 만들 때 채우기
    id: "cafe-sales-report",
    title: "Cafe Sales Report",
    summary: "양식이 제각각인 3개 지점 매출 엑셀을 정리해 하나의 월간 보고서로 합치는 자동화",
    role: "가상 외주 실습",
    tools: ["Python", "pandas", "exe 포장"],
    year: 2026,
    duration: "",
    brief: "지점마다 열 이름, 날짜, 금액 표기가 달라 매달 반나절씩 손으로 합치던 매출 엑셀을 한 번의 실행으로 통합하고 지점별, 메뉴별 요약까지 만들기",
    process: [],
    decisions: "",
    outcome: "코딩을 모르는 직원도 더블클릭으로 쓸 수 있게 exe 파일로 만들어 실행까지 확인",
    media: [],
    tags: ["엑셀 자동화"],
    link: "",
    image: "",
    thumb: "merge",
    status: "",
    visible: true
  },
  {
    id: "digital-goods-store",
    title: "Digital Goods Store",
    summary: "회원가입과 주문 흐름을 갖춘 디지털 상품 스토어",
    role: "개인 프로젝트",
    tools: ["Supabase", "Vercel", "GitHub"],
    year: 2026,
    duration: "",
    brief: "",
    process: [],
    decisions: "",
    outcome: "",
    media: [],
    tags: [],
    link: "",
    image: "",
    thumb: "store",
    status: "",
    visible: true
  },
  {
    id: "kinetic-type-study",
    title: "Kinetic Type Study",
    summary: "타이포그래피 모션 연습. 제작 후 영상으로 채울 자리입니다.",
    role: "개인 연습",
    tools: ["After Effects"],
    year: 2026,
    duration: "",
    brief: "",
    process: [],
    decisions: "",
    outcome: "",
    media: [],
    tags: [],
    link: "",
    image: "",
    thumb: "type",
    status: "준비 중",
    visible: true
  },
  {
    id: "portfolio-site",
    title: "Portfolio Site",
    summary: "반응형 레이아웃과 모션을 직접 구현하는 이 사이트",
    role: "개인 프로젝트",
    tools: ["HTML", "CSS", "JavaScript"],
    year: 2026,
    duration: "",
    brief: "",
    process: [],
    decisions: "",
    outcome: "",
    media: [],
    tags: [],
    link: "",
    image: "",
    thumb: "site",
    status: "제작 중",
    visible: true
  }
];

/* 화면은 이 함수 하나로만 작업 목록을 받아 갑니다. */
async function getWorks() {
  return WORKS.filter((work) => work.visible);
}
