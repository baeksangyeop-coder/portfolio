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
   - brief(문제), requirements(요구사항), process(과정), decisions(선택과 이유), outcome(결과)는
     케이스 스터디 페이지(work.html)에 쓰입니다. brief 가 채워진 작업만 상세 페이지가 열립니다.
   - 나중에 Supabase로 옮길 때는 아래 getWorks() 안쪽만 바꾸면 됩니다.
   ========================================================== */
const WORKS = [
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
    requirements: [
      "결제완료 주문만 골라 공급사별 발주서 엑셀을 따로 만들기 (열 구성은 공급사마다 다른 양식을 따름)",
      "연락처 형식 통일, 같은 주문의 중복 발주 방지",
      "미등록 상품이나 이상한 연락처는 '확인필요' 목록으로 따로 알리기",
      "공급사별 건수, 수량, 발주금액 요약 파일",
      "공급사가 늘어도 프로그램은 그대로 두고 기준표만 고치면 되게",
      "공급사 송장 회신(엑셀, CSV)을 모아 플랫폼 업로드 파일 만들기, 택배사 이름 표준화",
      "회신 누락, 송장 충돌, 다른 주문 번호는 업로드에서 빼고 검증리포트로 알리기",
      "송장번호는 앞자리 0까지 한 글자도 바뀌지 않게"
    ],
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
    requirements: [
      "폴더 안의 지점 파일을 모두 자동으로 읽기 (지점이 늘어도 파일만 넣으면 되게)",
      "어느 지점 매출인지 알 수 있는 '지점' 열 추가",
      "다른 열 이름과 순서, 제각각인 날짜 형식, '원'과 쉼표가 붙은 금액 정리",
      "제목 줄, 빈 줄, 합계 줄, 두 번 입력된 행 제거, 표기가 다른 같은 메뉴 이름 통일",
      "결과는 엑셀 1개에 통합데이터, 지점별요약, 메뉴별요약(매출 높은 순) 3개 시트",
      "코딩을 모르는 직원도 실행할 수 있게 실행 방법 정리"
    ],
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
    id: "price-monitor",
    title: "Price Monitor",
    summary: "가격 변동을 감지해 카카오톡으로 알려 주는 데스크톱 프로그램",
    role: "가상 외주 실습",
    tools: ["Python", "Supabase", "tkinter", "exe 포장"],
    year: 2026,
    duration: "",
    brief: "직접 만든 디지털 상품 스토어의 라이선스별 가격을 주기적으로 확인하고, 가격이 바뀌거나 목표가에 닿으면 카카오톡으로 알려 주는 프로그램을 만드는 가상 외주 요청",
    requirements: [
      "정해진 주기(기본 30분, 변경 가능)로 가격 확인",
      "가격이 바뀌면 카카오톡 '나에게 보내기'로 알림",
      "목표가에 닿으면 따로 알림",
      "확인 결과를 엑셀 이력으로 저장",
      "감시 상품, 목표가, 주기를 고르는 설정 화면",
      "exe로 납품, 알림 방식은 나중에 텔레그램으로 바꿀 수 있게"
    ],
    process: [
      "가격이 웹페이지 HTML이 아니라 Supabase 테이블에 있다는 것을 확인하고, 화면 대신 데이터를 직접 조회하는 방식으로 설계",
      "카카오 로그인과 토큰 자동 갱신 구현 (만료 5분 전 미리 갱신, 거절되면 한 번 강제 갱신)",
      "직전 가격과 비교해 변동, 목표가 도달을 판단하고 엑셀 이력에 기록",
      "주기 실행과 tkinter 설정 화면, 화면 안 로그와 카카오 로그인 버튼 추가",
      "exe로 포장하면서 파일 위치를 exe가 있는 폴더 기준으로 바꾸고, 사용 설명서 작성"
    ],
    decisions: [
      "알림 방식을 코드가 아니라 설정 파일 한 줄로 바꾸게 해서, 텔레그램을 붙일 때 기존 코드를 고치지 않도록 함",
      "알림 발송이 실패하면 이력 저장 전에 멈춰서, 다음 실행 때 같은 변동을 다시 잡아내도록 함",
      "목표가 알림은 목표가 위에 있다가 아래로 내려온 순간에만 보내 같은 알림이 반복되지 않게 함",
      "비밀 값은 설정 파일에만 두고, 토큰은 화면이나 로그에 출력하지 않음"
    ],
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
  }
];

/* 상세 페이지(케이스 스터디)가 있는 작업인지: 문제(brief)가 채워져 있으면 있음 */
function hasCase(work) {
  return Boolean(work && work.brief);
}

/* 화면은 이 함수 하나로만 작업 목록을 받아 갑니다. */
async function getWorks() {
  return WORKS.filter((work) => work.visible);
}
