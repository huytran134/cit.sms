# CIT-SMS â€” Káº¾ HOáº CH TRIá»‚N KHAI CHI TIáº¾T (ANTYGRAVITY IDE)

**PhiÃªn báº£n:** 2.0 (Locked) | **NgÃ y cáº­p nháº­t:** ThÃ¡ng 5/2026
**NgÆ°á»i kiáº¿n trÃºc:** Senior IT Consultant | **ÄÆ¡n vá»‹:** CiT EDU JSC

---

## 1. Tá»”NG QUAN KIáº¾N TRÃšC Há»† THá»NG

### 1.1 Tech Stack (Chá»‘t cá»©ng)

- **Framework:** Next.js 15 (App Router) - Server Actions & Route Handlers.
- **Language:** TypeScript (Strict Mode - Báº¯t buá»™c Ä‘á»ƒ trÃ¡nh lá»—i logic tiá»n).
- **Database:** MySQL 8 (Hostinger Cloud - 3GB RAM/2 CPU - Äá»§ Ä‘Ã¡p á»©ng).
- **ORM:** Prisma (Type-safe, Migration tá»± Ä‘á»™ng).
- **UI/Styling:** Tailwind CSS + Shadcn UI + Lucide Icons.
- **Auth:** NextAuth.js v5 (Chá»‰ lo Authentication). Authorization (RBAC) tá»± code.
- **AI:** Gemini 2.5 API (Gá»i external, KHÃ”NG cháº¡y model local trÃªn server).

### 1.2 NguyÃªn táº¯c NgÃ¢n hÃ ng (Financial Lock) - TUYá»†T Äá»I KHÃ”NG VI PHáº M

> [!IMPORTANT]
> **Quy trÃ¬nh tráº¡ng thÃ¡i phiáº¿u thu/hoÃ n tiá»n:** `DRAFT` -> `PENDING_APPROVAL` -> `CONFIRMED` [LOCK].

1. **KHÃ”NG BAO GIá»œ** táº¡o nÃºt "Sá»­a" cho tráº¡ng thÃ¡i `CONFIRMED`.
2. **Náº¿u sai sÃ³t:** Pháº£i táº¡o phiáº¿u "Há»§y" (cÃ³ lÆ°u váº¿t Audit Log) -> Táº¡o phiáº¿u má»›i.
3. **Má»i thay Ä‘á»•i tiá»n tá»‡** Ä‘á»u pháº£i cÃ³ AuditLog (Ai, Khi nÃ o, GiÃ¡ trá»‹ cÅ©, GiÃ¡ trá»‹ má»›i).

### 1.3 Báº£o máº­t Dá»¯ liá»‡u CÃ¡ nhÃ¢n (NÄ 13)

- **CCCD:** MÃ£ hÃ³a báº±ng AES-256-GCM táº¡i App Layer (KHÃ”NG dÃ¹ng hÃ m mÃ£ hÃ³a cá»§a MySQL). Key lÆ°u á»Ÿ `.env`.
- **Chá»‘ng trÃ¹ng CCCD:** DÃ¹ng Blind Index (HMAC-SHA256). KhÃ´ng bao giá» giáº£i mÃ£ CCCD Ä‘á»ƒ check trÃ¹ng.
- **Xem CCCD:** Chá»‰ Admin. Má»—i láº§n xem pháº£i ghi `CccdAccessLog`. KhÃ´ng tráº£ CCCD trong API get thÃ´ng thÆ°á»ng, chá»‰ tráº£ qua API chuyÃªn dá»¥ng.

---

## 2. PHÃ‚N QUYá»€N Há»† THá»NG (3 ROLES)

Quyá»n Ä‘Æ°á»£c gá»™p theo máº£ng, 1 User cÃ³ thá»ƒ mang nhiá»u Role (Máº£ng trong DB).

| Chá»©c nÄƒng | Quáº£n lÃ½ (ADMIN) | Giáº£ng viÃªn (TEACHER) | Chá»§ nhiá»‡m (CLASS_LEADER) |
| :--- | :---: | :---: | :---: |
| Quáº£n lÃ½ Lead & Chuyá»ƒn Ä‘á»•i HV | âœ… ToÃ n quyá»n | âŒ | âœ… ToÃ n quyá»n |
| Xem CCCD (MÃ£ hÃ³a) | âœ… (CÃ³ Log) | âŒ | âŒ |
| CÃ i Ä‘áº·t Program / Lá»›p há»c | âœ… | âœ… (Chá»‰ ná»™i dung) | âŒ |
| Xáº¿p lá»›p / Khai giáº£ng | âœ… | âŒ | âœ… (Lá»›p phá»¥ trÃ¡ch) |
| Nháº­p Äiá»ƒm danh / Cáº£m nháº­n | âœ… | âœ… | âœ… (Lá»›p phá»¥ trÃ¡ch) |
| Nháº­p Phiáº¿u thu (NhÃ¡p) | âœ… | âŒ | âœ… |
| Duyá»‡t Phiáº¿u thu (KhÃ³a sá»•) | âœ… **DUY NHáº¤T** | âŒ | âŒ |
| Chuyá»ƒn ná»£ thÃ nh Bad Debt | âœ… **DUY NHáº¤T** | âŒ | âŒ |
| AI Chatbot (Full RAG) | âœ… Truy xuáº¥t má»i data | âŒ | âœ… (Chá»‰ tÃ i liá»‡u) |

---

## 3. Lá»˜ TRÃŒNH TRIá»‚N KHAI THEO PHASE (DÃ nh cho Antigravity)

### PHASE 0: FOUNDATION & DATABASE (Tuáº§n 1)
**Má»¥c tiÃªu:** Khá»Ÿi táº¡o dá»± Ã¡n, káº¿t ná»‘i DB, thiáº¿t láº­p cÆ¡ cháº¿ báº£o máº­t cÆ¡ báº£n.

- [ ] Khá»Ÿi táº¡o Next.js 15 + TypeScript + Tailwind + Shadcn UI trÃªn Antygravity.
- [ ] Cáº¥u hÃ¬nh káº¿t ná»‘i MySQL Hostinger qua Prisma.
- [ ] COPY TOÃ€N Bá»˜ PRISMA SCHEMA (Báº£n váº½ á»Ÿ cuá»‘i cuá»™c há»™i thoáº¡i trÆ°á»›c) vÃ o `schema.prisma`. Cháº¡y `npx prisma migrate dev`.
- [ ] Táº¡o file `lib/crypto/cccd.ts`: Viáº¿t 2 hÃ m `encryptCCCD()` vÃ  `hashCCCDForBlindIndex()`.
- [ ] Táº¡o file `lib/auth/rbac.ts`: Táº¡o helper `requireRole(roles: string[])`.
- [ ] Cáº¥u hÃ¬nh NextAuth v5: Login báº±ng Email/Password. LÆ°u `roles: string[]` vÃ o Session.

**DoD (Definition of Done):** VÃ o Ä‘Æ°á»£c trang Admin, DB táº¡o Ä‘Ãºng toÃ n bá»™ báº£ng cá»™t, test mÃ£ hÃ³a/giáº£i mÃ£ CCCD thÃ nh cÃ´ng.

### PHASE 1: CRM CORE - LEAD & STUDENT (Tuáº§n 2-3)
**Má»¥c tiÃªu:** Giáº£i quyáº¿t bÃ i toÃ¡n Ä‘áº§u vÃ o, tÃ¡ch biá»‡t Lead vÃ  Student, Form Ä‘Äƒng kÃ½ tá»± Ä‘á»™ng.

- [ ] **Public Registration Form** (`/portal/register`):
    - Mobile-first. Gá»“m: TÃªn, SÄT, CCCD (Báº¯t buá»™c), cÃ¡c cÃ¢u há»i tá»± do (Má»¥c tiÃªu, LÃ½ do...).
    - CÃ i Ä‘áº·t Google reCAPTCHA Ä‘á»ƒ chá»‘ng spam.
    - Submit: MÃ£ hÃ³a CCCD -> Táº¡o Blind Index -> LÆ°u tháº³ng vÃ o báº£ng Student (Status: `ASSIGNED`).
- [ ] **Quáº£n lÃ½ Lead** (`/admin/leads` & `/staff/leads`):
    - CNL táº¡o Lead thá»§ cÃ´ng (Chá»‰ cáº§n TÃªn, SÄT. KHÃ”NG cÃ³ CCCD).
    - NÃºt "Chuyá»ƒn thÃ nh Há»c viÃªn": TÃ¬m SÄT trong DB -> Náº¿u chÆ°a cÃ³ Student, yÃªu cáº§u nháº­p CCCD -> Chuyá»ƒn Ä‘á»•i.
- [ ] **Danh sÃ¡ch Há»c viÃªn** (`/admin/students`):
    - Filter theo Tráº¡ng thÃ¡i, Lá»›p.
    - NÃºt "Sá»­a SÄT" (Chá»‰ Admin) - Ghi log sá»­a Ä‘á»•i.
    - NÃºt "Merge Há»“ sÆ¡" (Khi trÃ¹ng láº·p do lá»—i nháº­p liá»‡u).
    - Modal "Xem CCCD": Gá»i API riÃªng -> Log vÃ o `CccdAccessLog` -> Hiá»ƒn thá»‹ 30 giÃ¢y rá»“i áº©n.

**DoD:** HV cÃ³ thá»ƒ tá»± Ä‘Äƒng kÃ½ báº±ng Ä‘iá»‡n thoáº¡i, CNL táº¡o Lead Ä‘Æ°á»£c, khÃ´ng cÃ³ báº¥t ká»³ há»“ sÆ¡ nÃ o trÃ¹ng SÄT hoáº·c CCCD trong DB.

### PHASE 2: ACADEMIC STRUCTURE (Tuáº§n 4-5)
**Má»¥c tiÃªu:** XÃ¢y dá»±ng cÃ¢y chÆ°Æ¡ng trÃ¬nh, quáº£n lÃ½ lá»›p há»c vÃ  phÃ¢n cÃ´ng nhÃ¢n sá»±.

- [ ] **CRUD ChÆ°Æ¡ng trÃ¬nh** (`/admin/programs`):
    - Táº¡o Program: NhÃ¡nh (Thinking/Skill/Mentoring), Há»c phÃ­ chuáº©n, Loáº¡i lá»›p (Regular/Mentoring), Chu ká»³ thu tiá»n (Course/Half_year/Year).
    - Thiáº¿t láº­p Äiá»u kiá»‡n tiÃªn quyáº¿t (VÃ­ dá»¥: TDTD cáº§n TDTN).
- [ ] **CRUD Lá»›p há»c** (`/admin/classes`):
    - Táº¡o lá»›p: Auto-gen MÃ£ lá»›p (TDTN-2026-01). GÃ¡n Program, Chi nhÃ¡nh.
    - Override Há»c phÃ­ (Náº¿u khÃ¡c Program gá»‘c) - Ghi Audit Log.
    - PhÃ¢n cÃ´ng NhÃ¢n sá»± (ClassStaff): GÃ¡n CNL, GV, TG.
- [ ] **Enrollment (Xáº¿p lá»›p):**
    - Modal chá»n HV -> Check Ä‘iá»u kiá»‡n tiÃªn quyáº¿t (Cáº£nh bÃ¡o nhÆ°ng cho phÃ©p tiáº¿p tá»¥c).
    - Check SÄ© sá»‘ tá»‘i Ä‘a (Lá»›p thÆ°á»ng) hoáº·c Bá» qua (Lá»›p Mentoring).
    - HV chuyá»ƒn tá»« `ASSIGNED` -> `enrolled` (trong ClassMember).
- [ ] **Khai giáº£ng:** NÃºt "Khai giáº£ng" cho CNL -> Äá»•i Status Lá»›p -> Äá»•i Status toÃ n bá»™ HV trong lá»›p sang `STUDYING`.

**DoD:** Quáº£n lÃ½ táº¡o Ä‘Æ°á»£c Ä‘áº§y Ä‘á»§ cÃ¢y chÆ°Æ¡ng trÃ¬nh vÃ  lá»›p há»c. HV Ä‘Æ°á»£c xáº¿p lá»›p chÃ­nh xÃ¡c.

### PHASE 3: OPERATIONS - SESSIONS & ATTENDANCE (Tuáº§n 6-7)
**Má»¥c tiÃªu:** Quáº£n lÃ½ lá»‹ch há»c thá»±c táº¿ vÃ  Ä‘iá»ƒm danh hÃ ng ngÃ y.

- [ ] **Tá»± Ä‘á»™ng táº¡o Session (Rolling Window):**
    - Cron job cháº¡y hÃ ng ngÃ y: TÃ¬m lá»›p `IN_PROGRESS` -> Táº¡o thÃªm Session cho 2-3 tuáº§n tá»›i (náº¿u lÃ  lá»‹ch cá»‘ Ä‘á»‹nh).
- [ ] **Äiá»ƒm danh** (`/staff/classes/[id]/attendance`):
    - UI Mobile: Báº£ng danh sÃ¡ch HV + 4 Radio button (CÃ³ máº·t / Váº¯ng cÃ³ phÃ©p / Váº¯ng KP / Há»c bÃ¹).
    - CNL nháº­p xong -> Tá»± Ä‘á»™ng chuyá»ƒn Session sang `COMPLETED`.
- [ ] **Há»c bÃ¹ chÃ©o lá»›p:**
    - Logic: HV váº¯ng `EXCUSED` á»Ÿ Lá»›p A -> Äi há»c á»Ÿ Lá»›p B cÃ¹ng Program -> ÄÃ¡nh dáº¥u `MAKEUP` á»Ÿ Lá»›p B -> TÃ­ch hoÃ n thÃ nh buá»•i váº¯ng á»Ÿ Lá»›p A. (SÄ© sá»‘ Lá»›p B khÃ´ng thay Ä‘á»•i).
- [ ] **Cáº£m nháº­n (Feedback):**
    - Sau khi Ä‘iá»ƒm danh, HV Ä‘iá»n link Form (hoáº·c CNL nháº­p phá»¥): 3 cÃ¢u cháº¥m Emoji 1-5 sao (BÃ i há»c, GV, TG) + Textarea.
- [ ] **Tá»‘t nghiá»‡p:**
    - Há»‡ thá»‘ng Ä‘áº¿m: Sá»‘ buá»•i `PRESENT`/`MAKEUP` >= 80% Tá»•ng buá»•i -> Hiá»‡n nÃºt "Äá» xuáº¥t tá»‘t nghiá»‡p" cho Admin báº¥m.

**DoD:** CNL thao tÃ¡c Ä‘iá»ƒm danh má»—i buá»•i máº¥t dÆ°á»›i 2 phÃºt. Há»c bÃ¹ chÃ©o lá»›p cháº¡y Ä‘Ãºng logic. Tá»· lá»‡ tá»‘t nghiá»‡p tÃ­nh chÃ­nh xÃ¡c 80%.

### PHASE 4: FINANCIAL CORE (Tuáº§n 8-9)
> [!CAUTION]
> **Cáº¢NH BÃO:** Pháº§n dá»… sinh bug nháº¥t. Äáº£m báº£o tÃ­nh chÃ­nh xÃ¡c tuyá»‡t Ä‘á»‘i cá»§a dÃ²ng tiá»n.

- [ ] **Nháº­p Phiáº¿u thu (CNL):**
    - Form nháº­p: Chá»n HV -> Nháº­p sá»‘ tiá»n -> CHá»ŒN HÃ¬nh thá»©c (Tiá»n máº·t/Chuyá»ƒn khoáº£n).
    - **QUAN TRá»ŒNG:** Náº¿u chuyá»ƒn khoáº£n, Báº®T BUá»˜C nháº­p: Há» tÃªn ngÆ°á»i chuyá»ƒn, Sá»‘ TK/NgÃ¢n hÃ ng, Ná»™i dung CK.
    - LÆ°u tráº¡ng thÃ¡i: `PENDING_APPROVAL`.
- [ ] **MÃ n hÃ¬nh Duyá»‡t hÃ ng loáº¡t (Admin):**
    - Báº£ng hiá»ƒn thá»‹ cÃ¡c cá»™t: [Checkbox] | NgÃ y | TÃªn HV | SÄT HV | MÃ£ Lá»›p | Sá»‘ tiá»n | NgÆ°á»i chuyá»ƒn khoáº£n | STK/NgÃ¢n hÃ ng | [Duyá»‡t] | [Tá»« chá»‘i]
    - Admin tick checkbox nhiá»u dÃ²ng -> Báº¥m "XÃ¡c nháº­n hÃ ng loáº¡t" -> Tráº¡ng thÃ¡i chuyá»ƒn `CONFIRMED` (LOCKED).
- [ ] **Cáº­p nháº­t CÃ´ng ná»£ tá»± Ä‘á»™ng:**
    - Má»—i khi phiáº¿u thu `CONFIRMED`, trigger tÃ­nh toÃ¡n láº¡i á»Ÿ `ClassMember.debtStatus`.
    - Logic: CÃ´ng ná»£ = TuitionFeeActual - Tá»•ng(Receipt `CONFIRMED`).
    - Tráº¡ng thÃ¡i: `CLEAR` (0) -> `OWING` (>0 & <= NgÃ y háº¹n) -> `OVERDUE` (>0 & QuÃ¡ ngÃ y háº¹n).
- [ ] **Xá»­ lÃ½ Ná»£ xáº¥u (Bad Debt):**
    - HV RÃºt lui -> Admin Ä‘Ã¡nh dáº¥u pháº§n ná»£ cÃ²n láº¡i thÃ nh `BAD_DEBT` (Chá»‰ Admin Ä‘Æ°á»£c quyá»n).
    - Dashboard TÃ i chÃ­nh: `BAD_DEBT` KHÃ”NG Ä‘Æ°á»£c cá»™ng vÃ o Doanh thu.
- [ ] **HoÃ n tiá»n:**
    - Táº¡o `RefundReceipt` (Chá»‰ Admin). Kiá»ƒm tra: Náº¿u Class lÃ  `MENTORING` -> Cháº·n hoÃ n tiá»n (Toast bÃ¡o lá»—i). Lá»›p `REGULAR` -> Cho phÃ©p.

**DoD:** Tiá»n khÃ´ng bá»‹ máº¥t Ä‘i, khÃ´ng cÃ³ cÃ¡ch nÃ o sá»­a phiáº¿u thu Ä‘Ã£ duyá»‡t, Dashboard Ä‘á»‘i soÃ¡t khá»›p 100% vá»›i sá»• phá»¥ cá»§a Quáº£n lÃ½.

### PHASE 5: AI ASSISTANT (GEMINI RAG) (Tuáº§n 10)
**Má»¥c tiÃªu:** TÃ­ch há»£p Gemini 2.5 Ä‘á»ƒ há»— trá»£ tra cá»©u, chia lÃ m 2 táº§ng quyá»n.

- [ ] **Quáº£n lÃ½ tÃ i liá»‡u** (`/admin/documents`):
    - Admin upload file PDF/Word (BÃ i giáº£ng, Quy trÃ¬nh, CÃ¢u há»i tháº£o luáº­n).
    - LÆ°u file lÃªn Hostinger Storage, lÆ°u Ä‘Æ°á»ng dáº«n vÃ o DB Document.
- [ ] **Thiáº¿t láº­p Gemini API:**
    - Táº¡o file `lib/ai/gemini.ts`. Khá»Ÿi táº¡o Vertex AI hoáº·c Google AI SDK.
    - **LÆ¯U Ã:** Táº¯t cháº¿ Ä‘á»™ *Improve model* trÃªn Google AI Studio Ä‘á»ƒ báº£o máº­t data.
- [ ] **AI Context Builder (Backend):**
    - Náº¿u User role = `ADMIN`: Truy váº¥n DB (Há»c viÃªn, TÃ i chÃ­nh, Äiá»ƒm danh) + File PDF -> GhÃ©p thÃ nh Prompt gá»­i Gemini.
    - Náº¿u User role = `CLASS_LEADER` / `TEACHER`: CHá»ˆ láº¥y dá»¯ liá»‡u tá»« báº£ng Document -> GhÃ©p thÃ nh Prompt. (Cháº·n tuyá»‡t Ä‘á»‘i truy váº¥n báº£ng PII).
- [ ] **UI Chatbox:**
    - Icon gÃ³c dÆ°á»›i mÃ n hÃ¬nh. Giao diá»‡n tÆ°Æ¡ng tá»± ChatGPT. LÆ°u lá»‹ch sá»­ chat vÃ o `AiChatHistory`.

**DoD:** Admin há»i "Tá»•ng ná»£ lá»›p TDTN K15 lÃ  bao nhiÃªu?" -> AI tráº£ lá»i Ä‘Ãºng sá»‘. CNL há»i "BÃ i há»c buá»•i 3 cá»§a TDTN lÃ  gÃ¬?" -> AI tráº£ lá»i Ä‘Ãºng. CNL há»i "HV A ná»£ tiá»n khÃ´ng?" -> AI nÃ³i "TÃ´i khÃ´ng cÃ³ quyá»n truy cáº­p thÃ´ng tin nÃ y".

### PHASE 6: GO-LIVE & DATA MIGRATION (Tuáº§n 11)
**Má»¥c tiÃªu:** ÄÆ°a dá»¯ liá»‡u cÅ© vÃ o, chuáº©n bá»‹ ra máº¯t.

- [ ] **Tool Import Excel:**
    - DÃ¹ng thÆ° viá»‡n `xlsx`. Cho phÃ©p upload 2 sheet: (1) Danh sÃ¡ch HV cÅ© (2) Lá»‹ch sá»­ thu tiá»n cÅ©.
    - Validation: Check trÃ¹ng SÄT/CCCD -> BÃ¡o lá»—i row thá»© máº¥y -> Cho phÃ©p import pháº§n há»£p lá»‡.
    - ToÃ n bá»™ data import vÃ o sáº½ máº·c Ä‘á»‹nh cÃ³ AuditLog lÃ  "Imported from Excel".
- [ ] **Xuáº¥t BÃ¡o cÃ¡o:** Export Excel danh sÃ¡ch lá»›p, cÃ´ng ná»£ (dÃ¹ng `exceljs`).
- [ ] **Smoke Test toÃ n há»‡ thá»‘ng:** Äi láº¡i full flow tá»« Ä‘Äƒng kÃ½ -> xáº¿p lá»›p -> Ä‘iá»ƒm danh -> thu tiá»n -> duyá»‡t tiá»n -> tá»‘t nghiá»‡p.
- [ ] **ÄÃ o táº¡o CNL:** HÆ°á»›ng dáº«n dÃ¹ng Public Form thay vÃ¬ thu giáº¥y.

---

## 4. DANH SÃCH DECISION LOG Cá»T LÃ•I

- **D-21 (CCCD Key):** CCCD lÃ  Unique báº¯t buá»™c khi thÃ nh HV chÃ­nh thá»©c. Lead KHÃ”NG cáº§n CCCD.
- **D-22 (Gá»™p TVV):** Bá» role TVV. CNL lo toÃ n bá»™ tá»« Telesale Ä‘áº¿n váº­n hÃ nh lá»›p.
- **D-23 (Máº­t Tháº¥t):** Lá»›p Mentoring thu theo NÄƒm/6 thÃ¡ng. **KHÃ”NG CHO PHÃ‰P** hoÃ n tiá»n.
- **D-26 (AI Gemini):** DÃ¹ng API ngoÃ i. Full RAG cho Admin. Restricted RAG (chá»‰ file tÄ©nh) cho CNL/GV.
- **D-28 (Duyá»‡t hÃ ng loáº¡t):** Báº¯t buá»™c CNL nháº­p ThÃ´ng tin chuyá»ƒn khoáº£n. MÃ n hÃ¬nh Admin lÃ  Checklist Ä‘á»‘i chiáº¿u.
- **D-29 (Rolling Session):** Chá»‰ táº¡o lá»‹ch há»c 2-3 tuáº§n trÆ°á»›c, KHÃ”NG táº¡o toÃ n bá»™ khÃ³a khi khai giáº£ng.
- **D-34 (Tá»‘t nghiá»‡p):** Hardcode cá»©ng 80% cho má»i lá»›p Regular.

---

## 5. Cáº¤U TRÃšC THÆ¯ Má»¤C CHUáº¨N

```text
sms.cit/
â”œâ”€â”€ prisma/
â”‚   â”œâ”€â”€ schema.prisma          # Äá»‹nh nghÄ©a Database Schema (camelCase, @map)
â”‚   â”œâ”€â”€ seed.ts                # Script náº¡p dá»¯ liá»‡u máº«u (Admin, Programs, Branches)
â”‚   â””â”€â”€ migrations/            # Lá»‹ch sá»­ thay Ä‘á»•i cáº¥u trÃºc Database
â”œâ”€â”€ public/                    # TÃ i nguyÃªn tÄ©nh (Images, Icons, Fonts)
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ app/                   # Next.js 15 App Router
â”‚   â”‚   â”œâ”€â”€ (auth)/            # NhÃ³m Route xÃ¡c thá»±c (Login, Force Change Password)
â”‚   â”‚   â”‚   â”œâ”€â”€ login/         # Trang Ä‘Äƒng nháº­p
â”‚   â”‚   â”‚   â””â”€â”€ change-password/ # Trang buá»™c Ä‘á»•i máº­t kháº©u
â”‚   â”‚   â”œâ”€â”€ (admin)/           # Dashboard dÃ nh riÃªng cho Admin (/admin/...)
â”‚   â”‚   â”‚   â”œâ”€â”€ dashboard/     # BÃ¡o cÃ¡o tá»•ng quan, tÃ i chÃ­nh
â”‚   â”‚   â”‚   â”œâ”€â”€ programs/      # Quáº£n lÃ½ chÆ°Æ¡ng trÃ¬nh há»c
â”‚   â”‚   â”‚   â””â”€â”€ settings/      # Cáº¥u hÃ¬nh há»‡ thá»‘ng
â”‚   â”‚   â”œâ”€â”€ (staff)/           # Dashboard dÃ nh cho CNL, Giáº£ng viÃªn (/staff/...)
â”‚   â”‚   â”‚   â”œâ”€â”€ leads/         # Quáº£n lÃ½ khÃ¡ch hÃ ng tiá»m nÄƒng
â”‚   â”‚   â”‚   â”œâ”€â”€ classes/       # Quáº£n lÃ½ lá»›p há»c & Äiá»ƒm danh
â”‚   â”‚   â”‚   â””â”€â”€ finance/       # Nháº­p phiáº¿u thu (NhÃ¡p) & Äá»‘i soÃ¡t
â”‚   â”‚   â”œâ”€â”€ portal/            # Trang Ä‘Äƒng kÃ½ cÃ´ng khai cho Há»c viÃªn (/portal/register)
â”‚   â”‚   â”œâ”€â”€ api/               # API Route Handlers (AI streaming, Webhooks)
â”‚   â”‚   â”‚   â””â”€â”€ ai/chat/       # Endpoint xá»­ lÃ½ Chatbot Gemini SSE
â”‚   â”‚   â”œâ”€â”€ layout.tsx         # Layout gá»‘c (Root Layout)
â”‚   â”‚   â””â”€â”€ page.tsx           # Trang Landing page/Redirect
â”‚   â”œâ”€â”€ components/            # ThÃ nh pháº§n giao diá»‡n (UI)
â”‚   â”‚   â”œâ”€â”€ ui/                # ThÃ nh pháº§n nguyÃªn tá»­ (Shadcn UI: Button, Input, Modal...)
â”‚   â”‚   â”œâ”€â”€ students/          # UI Ä‘áº·c thÃ¹: Form há»c viÃªn, Modal xem CCCD, Merge há»“ sÆ¡
â”‚   â”‚   â”œâ”€â”€ classes/           # UI Ä‘áº·c thÃ¹: Enrollment modal, Attendance radio buttons
â”‚   â”‚   â”œâ”€â”€ finance/           # UI Ä‘áº·c thÃ¹: Receipt form, Bulk approve table
â”‚   â”‚   â”œâ”€â”€ ai/                # UI Chatbot: Chat window, Message bubble, Tool status
â”‚   â”‚   â””â”€â”€ shared/            # Layout components (Sidebar, Navbar, Audit-log viewer)
â”‚   â”œâ”€â”€ lib/                   # Logic cá»‘t lÃµi vÃ  Tiá»‡n Ã­ch
â”‚   â”‚   â”œâ”€â”€ auth/              # Cáº¥u hÃ¬nh NextAuth.js v5 vÃ  RBAC helpers (rbac.ts)
â”‚   â”‚   â”œâ”€â”€ crypto/            # Báº£o máº­t: cccd.ts (AES-256-GCM + HMAC Blind Index)
â”‚   â”‚   â”œâ”€â”€ validation/        # Zod Schemas kiá»ƒm tra dá»¯ liá»‡u Ä‘áº§u vÃ o
â”‚   â”‚   â”œâ”€â”€ services/          # Business Logic (Payment, Attendance, Eligibility check)
â”‚   â”‚   â”œâ”€â”€ audit/             # Logger: Ghi log tÃ i chÃ­nh vÃ  log truy cáº­p CCCD (Immutable)
â”‚   â”‚   â””â”€â”€ ai/                # Gemini Logic: Prompt builder, Tool registry, RAG service
â”‚   â”œâ”€â”€ hooks/                 # Custom React Hooks (useAuth, useDebounce...)
â”‚   â”œâ”€â”€ styles/                # Cáº¥u hÃ¬nh Tailwind CSS vÃ  Global CSS
â”‚   â””â”€â”€ types/                 # Äá»‹nh nghÄ©a TypeScript interfaces/types dÃ¹ng chung
â”œâ”€â”€ .env                       # Biáº¿n mÃ´i trÆ°á»ng (DATABASE_URL, CCCD_KEY, GEMINI_API_KEY)
â”œâ”€â”€ .env.example               # File máº«u hÆ°á»›ng dáº«n cáº¥u hÃ¬nh mÃ´i trÆ°á»ng
â”œâ”€â”€ CLAUDE.md                  # HÆ°á»›ng dáº«n dá»± Ã¡n & Quy táº¯c phÃ¡t triá»ƒn (Locked Principles)
â”œâ”€â”€ next.config.ts             # Cáº¥u hÃ¬nh Next.js
â”œâ”€â”€ package.json               # Quáº£n lÃ½ dependencies
â””â”€â”€ tsconfig.json              # Cáº¥u hÃ¬nh TypeScript (Strict Mode)
```
<!-- SNAPSHOT --> 2026-05-09 15:29 | OK | Phase: Phase 0 | Last: Created CLAUDE.md (Project Rules) | Next: Start Phase 0 implementation


<!-- SNAPSHOT --> 2026-05-09 15:42 | OK | Phase: Phase 0 | Last: Created docs/CONTEXT.md (Business Logic Brain) | Next: Start Phase 0 implementation
 < ! - -   S N A P S H O T   - - >   2 0 2 6 - 0 5 - 0 9   1 6 : 0 4   |   O K   |   P h a s e :   P h a s e   0   |   L a s t :   U p d a t e d   U s e r   s c h e m a   w i t h   s a f e   r e l a t i o n s   &   a d d e d   p e r f o r m a n c e   r u l e s   t o   C L A U D E . m d   |   N e x t :   F i n a l i z e   P h a s e   0   ( P r i s m a   m i g r a t i o n )  
 
 < ! - -   S N A P S H O T   - - >   2 0 2 6 - 0 5 - 0 9   1 6 : 3 0   |   O K   |   P h a s e :   P h a s e   0   |   L a s t :   C r e a t e d   p a c k a g e . j s o n   ( P r i s m a   6 )   &   I m p l e m e n t e d   U s e r R o l e   j o i n   t a b l e   i n   s c h e m a . p r i s m a   |   N e x t :   F i x   r e m a i n i n g   s c h e m a   e r r o r s  
 
 < ! - -   S N A P S H O T   - - >   2 0 2 6 - 0 5 - 0 9   1 6 : 3 8   |   O K   |   P h a s e :   P h a s e   0   |   L a s t :   F i x e d   S t u d e n t   m o d e l   r e l a t i o n s   i n   s c h e m a . p r i s m a   ( r e m o v e d   d i r e c t   r e c e i p t s ,   a d d e d   c c c d   l o g s )   |   N e x t :   F i x   C l a s s M e m b e r   r e l a t i o n s  
 
 < ! - -   S N A P S H O T   - - >   2 0 2 6 - 0 5 - 0 9   1 6 : 4 3   |   O K   |   P h a s e :   P h a s e   0   |   L a s t :   C r e a t e d   s r c / l i b / c r y p t o / c c c d . t s   ( A E S - 2 5 6 - G C M   E n c r y p t i o n   &   B l i n d   I n d e x )   |   N e x t :   T a s k   0 . 3   ( A u t h   &   R B A C )  
 
 < ! - -   S N A P S H O T   - - >   2 0 2 6 - 0 5 - 0 9   1 6 : 5 0   |   O K   |   P h a s e :   P h a s e   0   |   L a s t :   C r e a t e d   s r c / l i b / a u t h / r b a c . t s   &   n e x t a u t h . c o n f i g . t s   ( N e x t A u t h   v 5   &   R o l e s   s e t u p )   |   N e x t :   P h a s e   0 . 4   ( P r i s m a   S e e d i n g   &   I n i t i a l   A d m i n )  
 
 < ! - -   S N A P S H O T   - - >   2 0 2 6 - 0 5 - 0 9   1 6 : 5 6   |   O K   |   P h a s e :   P h a s e   0   |   L a s t :   C r e a t e d   s r c / l i b / v a l i d a t i o n / l e a d . s c h e m a . t s   ( Z o d   V a l i d a t i o n )   |   N e x t :   P h a s e   1   ( L e a d   M a n a g e m e n t )  
 
