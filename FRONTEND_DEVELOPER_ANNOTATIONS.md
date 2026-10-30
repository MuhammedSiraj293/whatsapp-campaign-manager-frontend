# Frontend Developer Annotations & Architecture Reference Manual

**Application**: WhatsApp Campaign Manager & Live CRM Client  
**Framework**: React 18 (Create React App), React Router v6, Tailwind CSS, Headless UI, ReactFlow  
**WebSocket Engine**: Socket.IO Client  

---

## 1. Frontend Architecture & State Management

The frontend is a single-page application (SPA) structured around three core architectural layers:
1. **Global Context Layer**: Provides tenant context (`WabaContext`), user session/authentication (`AuthContext`), and application-wide notifications (`AlertContext`).
2. **Real-Time WebSocket Layer**: Listens for server push events (`newMessage`, `campaignsUpdated`, `messageStatusUpdate`) to mutate React state without page reloads.
3. **Protected Role-Based Routing**: Restricts page access dynamically based on user role (`admin`, `manager`, `viewer`).

```
                              [ React Router v6 (App.js) ]
                                            │
                     ┌──────────────────────┴──────────────────────┐
                     ▼                                             ▼
            [ Public Routes ]                             [ Protected Routes ]
          - /login                                       (Role Guard Middleware)
          - /privacy-policy                                        │
                                            ┌──────────────────────┴──────────────────────┐
                                            ▼                                             ▼
                                   [ All Roles ]                                 [ Admin & Manager Only ]
                                 - /replies (Live Chat)                        - / (Dashboard Overview)
                                 - /enquiries (CRM Table)                      - /contacts (List Manager)
                                 - /profile (2FA Settings)                     - /create-campaign (Wizard)
                                                                               - /template-manager (Meta API)
                                                                               - /bot-studio (Automation)
                                                                               - /flow-builder/:id (Canvas)
                                                                               - /properties (Real Estate)
                                                                               - /integrations (WABA/Phones)
                                                                               - /analytics (Metrics)
                                                                               - /users (Team RBAC)
                                                                               - /logs (System Audit)
```

---

## 2. Global Context Providers

### 2.1 `src/context/AuthContext.js`
- **Purpose**: Manages authenticated user session, JWT storage, role privileges, and login/logout lifecycles.
- **State & Hooks**:
  - `user`: Object containing `{ _id, name, email, role, assignedWabas, assignedContactLists }`.
  - `token`: Stored in `localStorage.getItem('authToken')`.
  - `login(email, password, token)`: Authenticates against backend, verifies 2FA status, and stores JWT.
  - `logout()`: Clears `authToken` and `activeWaba` from `localStorage`, resets user state, and navigates to `/login`.

### 2.2 `src/context/WabaContext.js`
- **Purpose**: Multi-tenant switcher. Controls which WhatsApp Business Account (WABA) is currently active across all dashboards, templates, and campaign pages.
- **State & Hooks**:
  - `activeWaba`: WABA MongoDB `_id` persisted in `localStorage.getItem('activeWaba')`.
  - `selectWaba(wabaId)`: Updates active tenant across the application.
  - Custom hook: `useWaba()` ensures components safely access context.

### 2.3 `src/context/AlertContext.js`
- **Purpose**: Replaces standard browser alerts with animated, auto-dismissing toast notifications.
- **Features**:
  - `showAlert(message, type)`: Automatically detects status (`success`, `error`, `info`) using regex keywords if type is omitted.
  - Overrides global `window.alert` on mount to capture legacy alerts automatically.
  - Dismisses toasts after 4500ms with smooth fade-out.

---

## 3. Services Layer (API & Real-Time)

### 3.1 `src/services/api.js`
- **`authFetch(endpoint, options)`**:
  - Automatically appends `Authorization: Bearer <token>` to request headers.
  - Prefixes endpoints with dynamic `API_URL` (`http://localhost:5001` or production).
  - Handles JSON parsing and standardized HTTP error extraction.
- **`uploadFile(endpoint, file)`**:
  - Constructs `multipart/form-data` payloads with authenticated headers for media attachments, CSV imports, and image uploads.

### 3.2 `src/services/socket.js`
- **Purpose**: Singleton connection to backend Socket.IO server.
- **Lifecycle**: Establishes persistent connection on app start. Listens for live events:
  - `newMessage`: Injects incoming customer messages into active chat thread.
  - `messageStatusUpdate`: Updates single/double checkmarks and failure icons in real time.
  - `campaignsUpdated`: Re-renders live progress bars on campaign dashboards.

---

## 4. Pages Reference & Developer Walkthrough

| Page Component | Path | Primary Responsibility & Logic |
|---|---|---|
| `Dashboard.js` | `/` | Top-level KPI overview (Total Sent, Delivered, Read, Failed, Reply Rate). Includes DataBot AI query assistant and active campaign progress monitor. |
| `Replies.js` | `/replies` | Full-screen WhatsApp Web style live chat. Features conversation list, message timeline, media attachment viewer, emoji picker, quick responses, and manual unsubscribe/subscribe toggle. |
| `Enquiries.js` | `/enquiries` | Real estate CRM lead management table. Advanced search, date ranges, property filter, status transitions (`pending`, `contacted`, `closed`, `handover`), and CSV export. |
| `Contacts.js` | `/contacts` | Contact segment management. Bulk CSV upload, variable mapping (`var1`, `var2`), unsubscribe reason tracking, and status health distribution. |
| `ContactAnalytics.js` | `/contacts/analytics` | Deep-dive health dashboard displaying contacts classified into `Engaged` (Hot), `Warm` (Unresponsive), `New` (Cold), and `Dead`. |
| `CreateCampaign.js` | `/create-campaign` | Multi-step campaign wizard. Template selection, live interactive preview, dynamic variable binding, exclusion list picker, batch speed config, and scheduler. |
| `TemplateManager.js`| `/template-manager` | Meta approved template catalog. Authoring form (Headers, Variables, Quick Reply / URL buttons), live submission to Meta Graph API, and template analytics. |
| `TemplateAnalytics.js`| `/template-analytics` | Aggregated engagement graph (Sent vs. Read) per template over daily, weekly, or 30-day timeframes using Recharts. |
| `CampaignAnalytics.js`| `/analytics/:id` | Granular delivery log per campaign. Shows individual recipient delivery status, WAMID, delivery timestamp, and Meta error code details (e.g. Error 131026). |
| `BotStudio.js` | `/bot-studio` | Visual hub for automated conversational decision trees. List flows, duplicate flows, create new flows, and associate with phone lines. |
| `FlowBuilder.js` | `/flow-builder/:id` | Drag-and-drop interactive flowchart canvas built with `ReactFlow`. Supports custom node cards, auto-layout (`dagre`), branch connections, and validation. |
| `AutoReply.js` | `/auto-reply` | Simple greeting auto-responder configuration per business phone line. |
| `Properties.js` | `/properties` | Capital Avenue property inventory database (Villas, Apartments, Locations, Developers, Price ranges, brochures). Used by AI for customer recommendations. |
| `Integrations.js` | `/integrations` | WABA account & phone number configuration. Manage tokens, register phone lines, and toggle AI Assistant (`isAiEnabled`), Follow-Up (`isFollowUpEnabled`), and Review (`isReviewEnabled`). |
| `Users.js` | `/users` | Team management console for Administrators. Create users, assign roles (`admin`, `manager`, `viewer`), and allocate WABAs and contact lists. |
| `Profile.js` | `/profile` | Account security settings. Password change and Two-Factor Authentication (2FA) QR code setup. |
| `Logs.js` | `/logs` | Centralized system audit trail recording campaign executions, user mutations, and scheduler triggers. |
| `Login.js` | `/login` | Secure authentication screen with integrated 2FA TOTP code verification step. |
| `PrivacyPolicy.js` | `/privacy-policy` | Public Meta compliance page required for WhatsApp Business verification. |

---

## 5. Key Reusable Components

### 5.1 `Navbar.js`
- Main navigation bar. Features company branding, mobile responsive drawer, active WABA account switcher dropdown, and user profile avatar with role badge.
- **Branding Assets**: Loads local `logo-white.png` (high-contrast gold/white logo for dark mode) and dynamically renders initial monograms for users.

### 5.2 `TemplateForm.js` & `TemplatePreview.js`
- **`TemplateForm`**: Complex form mirroring Meta Business Manager for creating WhatsApp templates. Supports Media headers (Images, Documents, Videos), positional body variables (`{{1}}`, `{{2}}`), Quick Reply buttons, and dynamic URL buttons.
- **`TemplatePreview`**: Real-time WhatsApp chat bubble preview rendering exactly how the message will appear on a customer's phone screen.

### 5.3 `CustomNode.js` & `FlowSidebar.js`
- Used in `FlowBuilder.js` canvas.
- Renders custom styled flowchart nodes (Text, Buttons, List Menus) with input/output connection handles, message previews, and deletion controls.

### 5.4 `Chats.js` & `ChatDetail.js`
- **`Chats.js`**: Searchable conversation sidebar with pagination, unread badges, active state indicators, and search debouncing.
- **`ChatDetail.js`**: Active conversation window with auto-scrolling message stream, date separators, media attachment viewer, and delivery status icons.

---

## 6. Frontend Build & Asset Guidelines

- **Build Tooling**: `react-scripts build` generates optimized, minified production assets in `frontend/build/`.
- **Styling**: Tailwind CSS utility classes with dark-mode color palette (`#111b21`, `#202d33`, `#2a3942`, `#00a884`).
- **Icons**: Heroicons (`@heroicons/react/24/outline`) and FontAwesome (`react-icons/fa`).
- **Media Assets**:
  - `frontend/src/assets/images/logo.png`: High-resolution primary logo.
  - `frontend/src/assets/images/logo-white.png`: Contrast-optimized logo for dark navigation headers.
  - `frontend/public/favicon.png` & `favicon.ico`: Gold emblem favicon.
  - `frontend/src/assets/whatsapp.svg`: Local vector WhatsApp badge.
