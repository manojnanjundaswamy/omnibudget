# OmniBudget (OMNI-CORE-2026)
### Enterprise Multi-Ledger Personal & Household Financial Engine

OmniBudget unifies personal banking, zero-based envelope budgeting, Splitwise-style peer group expense splitting, and household family pooling into an immutable, double-entry financial ledger.

---

## 🌟 Key Innovations & Mathematical Engines

1. **The "Split-to-Budget" Accounting Invariant:**
   * Eliminates personal burn rate distortion. When you pay a \$180 dinner bill for 3 friends, your dining budget envelope is charged only your personal consumption (\$60). The remaining \$120 is accounted for as a liquid Receivable asset (IOU) owed by peers.
2. **Greedy Debt Minimization Algorithm ($O(V \log V)$):**
   * Uses min/max priority queues to collapse tangled circular group debts (e.g., $A \rightarrow B \rightarrow C \rightarrow A$) into the minimum possible cash flow transfers.
3. **Smart Household Cross-Ledger Offsets:**
   * Offsets internal peer debts against joint family budget obligations (e.g., partner owes you \$50 for dinner $\rightarrow$ system automatically offsets their upcoming joint grocery contribution with zero bank transfer required).
4. **Natural Language Quick Capture (`Ctrl+K`):**
   * Single-line command bar that parses phrases like:  
     `"Spent $45 on groceries at Trader Joe's"` or  
     `"Dinner $180 at Nobu split 3 ways with Liam and Emma"`
5. **Multi-Currency & Regional Formatting:**
   * Instant toggle across USD (`$`), INR (`₹` with Lakhs/Crores formatting), EUR (`€`), GBP (`£`), and JPY (`¥`).
6. **Privacy Shield (`Shift+H`):**
   * 1-click shortcut to blur all numbers and balances when working in public spaces.
7. **Virtual Banking Sandbox & Simulator:**
   * Standalone mock banking environment with 1-click triggers for simulated paycheck arrival, card charges, CSV statement imports, and reset to seed dataset.

---

## 🏗️ System Architecture & Tech Stack

```
                                [ FRONTEND ]
                    React 19 + TypeScript + Vite 8
             Tailwind CSS v4 + Recharts + Lucide Icons + Zustand
                           (Port 5174 / 5173)
                                  │
                                  ▼ /api/ (Reverse Proxy)
                                [ BACKEND ]
                    Spring Boot 4.1.1 (Java 21 LTS)
              Spring Data JPA + Bean Validation + BigDecimal
                               (Port 8088)
                                  │
                                  ▼
                               [ DATABASE ]
                    H2 Database (In-Memory / Dev Mode)
                      PostgreSQL 16 (Production Mode)
```

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Backend Core** | **Java 21 + Spring Boot 4** | `BigDecimal` precision (zero IEEE-754 float drift), strict `@Transactional` boundaries, enterprise-grade ledger integrity. |
| **Frontend UI** | **React 19 + Vite + Tailwind v4** | Sub-16ms optimistic UI updates, dark slate aesthetic, responsive PWA mobile-ready design. |
| **Database** | **H2 (Dev) / PostgreSQL (Prod)** | Zero-setup instant local run; single configuration switch to PostgreSQL. |
| **Containerization** | **Docker & Docker Compose** | Multi-stage production container builds with automated health checks. |

---

## 🚀 Getting Started (Local Development)

### Prerequisites
* **Java 21 LTS**
* **Node.js 20+**
* Git

### 1. Run the Backend (Spring Boot)
```bash
cd backend
# On Windows:
.\gradlew.bat bootRun

# On macOS/Linux:
./gradlew bootRun
```
* Backend API: `http://localhost:8088`
* H2 Database Web Console: `http://localhost:8088/h2-console` (JDBC URL: `jdbc:h2:mem:omnibudget`, User: `sa`)

### 2. Run the Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
* Frontend Web App: `http://localhost:5174` (or `http://localhost:5173`)

---

## 🐳 1-Command Production Deployment (Docker Compose)

To run the complete stack (PostgreSQL + Spring Boot Backend + Nginx React Frontend):

```bash
docker compose up --build
```
* Access the app at: `http://localhost`

---

## 🧪 Phased Implementation Roadmap

- [x] **Phase 1: Standalone Core & Personal Banking / Budgeting (Complete)**
  - Double-entry ledger with `BigDecimal` precision.
  - Multi-account banking ledger (Checking, Savings/HYSA, Credit Card, Investment Vault).
  - 50/30/20 zero-based envelope budget studio with surplus rollover.
  - Natural language quick-capture command palette (`Ctrl+K`).
  - Virtual banking simulator & transaction generator.
  - Multi-currency switcher & Privacy Shield (`Shift+H`).
- [x] **Phase 2: Peer Groups & Splitwise Engine (Complete)**
  - Split-to-Budget Invariant decoupling group fronting from personal envelopes.
  - Greedy debt minimization graph algorithm ($O(V \log V)$).
  - 1-Click Settle-up modal and peer debt tracking.
- [x] **Phase 3: Household Pool & Subscriptions Radar (Complete)**
  - Proportional partner contribution calculator (e.g., 60/40 salary ratio).
  - Dependent / child allowance guardrail.
  - Smart cross-ledger offset engine.
  - Recurring subscriptions renewal calendar & cash drain forecast.
- [ ] **Phase 4: Mobile Companion & Open Banking APIs (Next Up)**
  - React Native / Expo companion app sharing core domain models.
  - Live Open Banking / Plaid / Account Aggregator webhooks.

---

## 📜 License
MIT License. Built with passion for personal financial freedom.
