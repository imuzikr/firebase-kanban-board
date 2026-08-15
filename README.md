# 수업용 칸반보드 (Firebase 버전)

트렐로 스타일의 학급 칸반보드입니다. 교사가 학급을 만들면 가입 코드가 생성되고, 학생은 그 코드로 참여합니다. 교사는 학급마다 공지 보드(공개/비공개 카드 선택 가능)를 가지고, 학생은 각자 자신만의 활동 보드를 가집니다 — 다른 학생의 보드는 교사 외에는 아무도 볼 수 없습니다.

React + Vite + Firebase(Firestore, Authentication)로 만들어졌고, **자체 백엔드 서버가 없습니다** — 모든 데이터 접근은 브라우저에서 Firebase 클라이언트 SDK로 직접 이루어지며, `firestore.rules`(보안 규칙)가 유일한 접근 제어 계층입니다.

## 빠른 시작 (실제 Firebase 프로젝트 사용)

1. [Firebase 콘솔](https://console.firebase.google.com)에서 프로젝트 생성, Authentication(이메일/비밀번호)과 Firestore를 활성화합니다.
2. `.env.example`을 `.env`로 복사하고, 콘솔의 "프로젝트 설정 > 내 앱"에서 확인할 수 있는 값들을 채웁니다.
3. `firestore.rules`의 `teacherEmail()`을 본인이 가입할 실제 교사 이메일로 수정합니다(커밋하지 마세요 — 아래 체크리스트 참고).
4. `npx firebase login` 후 `npx firebase deploy --only firestore:rules,firestore:indexes` 로 보안 규칙과 인덱스를 배포합니다.
5. `npm install && npm run dev` → http://localhost:5173

## Firebase 로컬 에뮬레이터 (선택 사항, Java 필요)

실제 Firebase 프로젝트나 결제 계정 없이 로컬에서 전체 기능을 실행해볼 수도 있습니다 — 단, Firestore 에뮬레이터가 **Java 런타임**을 요구합니다(JDK 11 이상, PATH에 등록).

```bash
npm run emulators                          # Firestore + Auth 에뮬레이터 (localhost:4000에서 데이터 확인)
# 다른 터미널에서
VITE_USE_FIREBASE_EMULATOR=true npm run dev
```

## 배포 전 보안/개인정보 체크리스트

- [ ] `firestore.rules`의 `teacherEmail()`이 placeholder(`teacher@example.com`)가 아닌 실제 이메일로 바뀌어 있는가 — 단, 이 변경 사항은 **커밋하지 않습니다** (공개 저장소에 실제 이메일이 남지 않도록).
- [ ] `.env`(실제 프로젝트 설정값)가 커밋되지 않았는가 — `.gitignore`가 이미 막고 있지만 확인.
- [ ] Admin SDK/서비스 계정 키를 전혀 쓰지 않으므로 그런 종류의 비밀키 유출 위험 자체가 없습니다.

## 데이터 구조

(작성 예정 — Firestore 컬렉션 스키마와 설계 의도를 여기 정리합니다.)
