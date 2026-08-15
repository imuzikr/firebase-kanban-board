# 수업용 칸반보드 (Firebase 버전)

트렐로 스타일의 학급 칸반보드입니다. 교사가 학급을 만들면 가입 코드가 생성되고, 학생은 그 코드로 참여합니다. 교사는 학급마다 공지 보드(공개/비공개 카드 선택 가능)를 가지고, 학생은 각자 자신만의 활동 보드를 가집니다 — 다른 학생의 보드는 교사 외에는 아무도 볼 수 없습니다.

React + Vite + Firebase(Firestore, Authentication)로 만들어졌고, **자체 백엔드 서버가 없습니다** — 모든 데이터 접근은 브라우저에서 Firebase 클라이언트 SDK로 직접 이루어지며, `firestore.rules`(보안 규칙)가 유일한 접근 제어 계층입니다.

## 빠른 시작 (실제 Firebase 프로젝트 사용)

1. [Firebase 콘솔](https://console.firebase.google.com)에서 프로젝트 생성, Authentication(이메일/비밀번호)과 Firestore를 활성화합니다.
2. `.env.example`을 `.env`로 복사하고, 콘솔의 "프로젝트 설정 > 내 앱"에서 확인할 수 있는 값들을 채웁니다.
3. 아래 두 파일을 본인 값으로 로컬에서 수정합니다. **이 저장소(또는 fork)를 공개로 유지할 계획이라면 둘 다 커밋하지 마세요** (실수 방지가 필요하면 `git update-index --skip-worktree firestore.rules .firebaserc`로 두 파일의 로컬 변경을 git이 무시하게 만들 수 있습니다). 비공개로 쓸 거라면 그냥 실제 값으로 평범하게 커밋해도 무방합니다:
   - `firestore.rules`의 `teacherEmail()` → 본인이 가입할 실제 교사 이메일
   - `.firebaserc`의 `default` → 1번에서 만든 실제 Firebase 프로젝트 ID
4. `npx firebase login` 후 `npx firebase deploy --only firestore:rules,firestore:indexes` 로 보안 규칙과 인덱스를 배포합니다.
5. `npm install && npm run dev` → http://localhost:5173

## 배포 (Vercel)

프론트엔드는 이 저장소를 Vercel에 그대로 import해서 배포할 수 있습니다 (Framework Preset: Vite). SPA 라우팅(React Router)을 위한 rewrite는 `vercel.json`에 이미 포함되어 있습니다.

1. Vercel 프로젝트 → **Settings → Environment Variables**에 `.env.example`과 동일한 키로 실제 값을 등록합니다:
   `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_USE_FIREBASE_EMULATOR`(`false`), `VITE_TEACHER_EMAIL`
2. Vite는 빌드 타임에 환경변수를 번들에 굽기 때문에, 값을 추가/수정한 뒤에는 반드시 **재배포**해야 반영됩니다.
3. Firestore 보안 규칙·인덱스는 Vercel 배포와 무관합니다 — 위 "빠른 시작" 4번대로 Firebase CLI로 별도 배포해야 합니다.

Firebase Hosting을 쓰고 싶다면 `firebase.json`에 이미 같은 목적의 rewrite 설정이 되어 있어 `npm run build && npx firebase deploy --only hosting`으로 대신 배포할 수 있습니다.

## Firebase 로컬 에뮬레이터 (선택 사항, Java 필요)

실제 Firebase 프로젝트나 결제 계정 없이 로컬에서 전체 기능을 실행해볼 수도 있습니다 — 단, Firestore 에뮬레이터가 **Java 런타임**을 요구합니다(JDK 11 이상, PATH에 등록).

```bash
npm run emulators                          # Firestore + Auth 에뮬레이터 (localhost:4000에서 데이터 확인)
# 다른 터미널에서
VITE_USE_FIREBASE_EMULATOR=true npm run dev
```

## 배포 전 보안/개인정보 체크리스트

- [ ] `firestore.rules`의 `teacherEmail()`이 placeholder(`teacher@example.com`)가 아닌 실제 이메일로 바뀌어 있는가 — 단, 이 변경 사항은 **커밋하지 않습니다** (공개 저장소에 실제 이메일이 남지 않도록. 위 "빠른 시작" 3번 참고).
- [ ] `.firebaserc`의 `default`가 placeholder(`your-firebase-project-id`)가 아닌 실제 프로젝트 ID로 바뀌어 있는가 — 이것도 마찬가지로 **커밋하지 않습니다**.
- [ ] `.env`(실제 프로젝트 설정값)가 커밋되지 않았는가 — `.gitignore`가 이미 막고 있지만 확인.
- [ ] Admin SDK/서비스 계정 키를 전혀 쓰지 않으므로 그런 종류의 비밀키 유출 위험 자체가 없습니다.

## 데이터 구조

Firestore 컬렉션은 아래 6개이고, 상세 필드는 `src/lib/types.ts`에 정의되어 있습니다. `boards` 컬렉션이 따로 없는 이유는 학급:보드가 항상 1:1이라 lists/cards가 `classId`를 직접 참조하기 때문입니다.

| 컬렉션 | 문서 ID | 설명 |
|---|---|---|
| `profiles` | `{uid}` | 표시 이름과 역할(`teacher`/`student`). 역할은 가입 시 호출자의 인증된 이메일 클레임을 `firestore.rules`의 `teacherEmail()`과 비교해 **규칙에서만** 결정되며, 이후 절대 바뀌지 않습니다(자가 승격 불가). |
| `classes` | 자동 생성 | 학급 이름, 담당 교사, 가입 코드, 요일/교시 일정(`schedule`), 대시보드 정렬 순서(`position`). |
| `joinCodes` | 가입 코드 문자열 자체 | 코드→학급ID 매핑. 코드 자체가 문서 ID라서 조회가 쿼리가 아닌 단일 `get()`이 되고, 학생에게는 목록 조회(list) 권한이 없어 코드를 열거할 수 없습니다. |
| `classMembers` | `{classId}_{studentId}` | 학급 가입 여부. 결정적(deterministic) ID로 "이미 가입했으면 무시" 동작을 구현합니다. |
| `lists` | 자동 생성(교사 목록) / `student_{classId}_{studentId}`(학생 목록) | 교사의 공지 목록(`listType: "teacher"`) 또는 학생 개인 목록(`listType: "student"`). 학생 목록의 `title`은 가입 시점의 표시 이름을 그대로 복사해와서, 렌더링할 때 `profiles`를 다시 읽지 않아도 됩니다. |
| `cards` | 자동 생성 | 카드 내용, 위치(`position`), 공개 여부(`visibility`). 교사 목록 카드만 공개/비공개 의미가 있고, 학생 개인 목록의 카드는 항상 `public`으로 강제됩니다(그 목록 자체가 이미 본인+교사만 볼 수 있으므로). |

접근 제어는 전적으로 `firestore.rules`가 담당합니다 — 학생은 다른 학생의 목록/카드를 절대 읽을 수 없고, 공개 여부는 교사만 바꿀 수 있으며, 자가 승격도 불가능합니다. 각 규칙 옆에 설계 의도가 주석으로 달려 있으니 참고하세요.

## License

[MIT](LICENSE)
