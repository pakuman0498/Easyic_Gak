# 이직각 (Easyic_Gak)

신입 공고 하나 뚫는 데서 시작해, 회사를 옮겨 다니며 글로벌 빅테크 꼭대기까지 가는 이직 시뮬레이션 게임입니다. AI(Claude)와 함께 만든 1인 개발 실험작이에요.

## 플레이

`ijikgak.html` 파일 하나가 게임 전체입니다. 브라우저로 열면 바로 플레이할 수 있어요. 진행 상황은 브라우저에 저장됩니다.

## 폴더

| 경로 | 내용 |
|---|---|
| `ijikgak.html` | 게임 본체 (HTML 한 파일) |
| `sim/bot.js`, `sim/build.py` | 밸런스 확인용 봇 시뮬레이션. `python sim/build.py`로 `sim/sim.html`을 만든 뒤 로컬 서버에서 열어 실행 |
| `sim/report.html` | 봇 시뮬레이션 결과 보고서 |
| `sim/launch.html` | 앱 스토어 출시 플랜 |
