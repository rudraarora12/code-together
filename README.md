# CodeTogether — Full Project Collaboration IDE 🚀

A modern, browser-based collaborative development environment designed like **VS Code + Google Docs + Replit**, specifically engineered for hackathons and team development.

**Core Workflow: Upload Project Folder / ZIP → Create One Room → Invite Teammates via One Link → Collaborate on Entire Project Tree Concurrently → Run Project Together in an Isolated Sandbox.**

---

## ⚡ Key Capabilities

### 1. Upload an Entire Project Folder / ZIP Archive
- **Folder Picker & ZIP Upload:** Upload complete project folders directly from your computer preserving full relative directory hierarchies, or drop a `.zip` archive.
- **Smart Language & Framework Detection:** Automatically detects project types (React + Vite, Node.js + Express, Python, Java, C++, static HTML/CSS/JS) without requiring manual configuration.
- **Configurable Ignore Filtering:** Skips `node_modules`, `.git`, `dist`, `build`, `.next`, `__pycache__`, `.venv`, and `vendor` by default.
- **Secret & Traversal Protection:** Excludes `.env` files by default to prevent leaking credentials, sanitizes archive entries against path traversal / zip slip attacks, and validates file counts and size limits.
- **Interactive Pre-Upload Review:** Inspect the complete project tree structure, total file count, total size, and detected start command before launching the room.

### 2. One Room for the Entire Project
- Exactly **one room** represents the complete multi-file project workspace.
- Every file in the project belongs to the same collaborative room URL (`http://localhost:5173/room/<roomId>`).
- Creator is assigned room ownership with administrative rights.

### 3. VS Code-Style Project File Explorer
- Hierarchical tree view on the left sidebar with expand / collapse controls.
- File icons for all popular programming languages and configurations.
- Real-time file & folder operations: create files, create folders, rename entries, and delete with confirmation.
- **Live Peer Presence in Tree:** Displays which file each teammate is actively viewing or editing directly on the file tree and editor tab bar.
- Search across project files and symbols.
- 1-click **Download Complete Project as ZIP**.

### 4. Real-Time Multi-File Collaboration
- **Monaco Editor + Yjs CRDT + y-monaco + Socket.IO:**
  - Multiple users can edit the **same file simultaneously** without conflicts or overwrites.
  - Different users can edit **different files concurrently** across the project tree.
  - Live colored cursors with floating collaborator name badges.
  - Separate collaborative CRDT document state maintained per file using stable identifiers.
  - Automatic debounced persistence of modified files to backend storage.
  - Complete document recovery upon network reconnection.

### 5. Secure, Isolated Project Execution & Live Web Preview
- **Isolated Sandbox Execution:** Projects run in a dedicated disposable sandbox workspace with sanitized environment variables (stripping host tokens, keys, and credentials), process tree management (`tree-kill`), output buffer caps, and strict execution timeouts.
- **Shared Runtime:** One shared project runtime per room. When one collaborator runs the project, build logs and runtime stdout/stderr stream live to all teammates' terminals.
- **Application Web Preview Panel:** When a project launches a web server (e.g. Vite dev server or Express), an embedded preview panel opens with responsive viewport toggles (Desktop, Tablet, Mobile), address bar, reload button, and open in new tab.

### 6. Integrated Collaboration Suite
- **Team Chat:** Real-time messages with timestamps, sender avatars, unread message count badges, and quick emoji reactions.
- **Collaborator Presence Panel:** Shows online status, active file indicators (e.g. "Editing: `src/App.jsx`"), room owner badge, and quick invite link.
- **Shared Terminal:** Multi-tab console with project build logs, runtime streaming output, and interactive sandbox CLI.

---

## 🛠 Tech Stack

- **Frontend:** React 18, Vite 6, Monaco Editor (`@monaco-editor/react`), Yjs (`yjs`, `y-webrtc`, custom `MonacoBinding`), Socket.IO Client, Tailwind CSS v3, Lucide React, JSZip.
- **Backend:** Node.js, Express, Socket.IO Server, Yjs CRDT Synchronization, Tree-Kill, JSZip, Isolated Sandbox Process & Docker Runner.

---

## 🚀 Running the Platform

### 1. Start the Fullstack Platform (Backend + Frontend)
```bash
npm run fullstack
```
This concurrently starts:
- The Express + Socket.IO Collaboration Server on **`http://localhost:5001`**
- The Vite Frontend Development Server on **`http://localhost:5173`**

### 2. Run the Automated Integration Test Suite
```bash
npm test
```
Executes the automated end-to-end verification suite testing health checks, multi-file project upload, language detection, file CRUD, ZIP export, isolated sandbox execution, and multi-client real-time Socket.IO + Yjs synchronization.

---

## 🧪 Testing with Teammates (Two Browser Sessions)

1. Open **[http://localhost:5173](http://localhost:5173)** in Browser Window 1.
2. Click **"Upload Project Folder / ZIP"** and select a project folder or `.zip` file.
3. Review the project structure and click **"Create Collaborative Room"**.
4. In Browser Window 1, click **"Invite Teammates"** in the top toolbar and copy the link.
5. Paste the invitation link into Browser Window 2 (or an incognito tab).
6. Open different files in each window — observe collaborator presence indicators showing what file each teammate is in.
7. Open the same file in both windows — type simultaneously and observe real-time conflict-free CRDT synchronization with colored cursor badges and name tags.
8. Click **"Run Project"** — watch build logs stream live in both windows, and inspect the running application in the **Web Preview** panel.
