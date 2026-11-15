import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Code2, 
  Users, 
  Terminal, 
  Zap, 
  Play, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  Cpu, 
  CheckCircle2,
  FolderGit2,
  Share2,
  UploadCloud
} from 'lucide-react';
import Navbar from '../components/Navbar';
import UploadRoomModal from '../components/UploadRoomModal';

export default function LandingPage() {
  const navigate = useNavigate();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0b0d17] text-gray-200 flex flex-col selection:bg-indigo-600/30 selection:text-cyan-200">
      <Navbar onNewRoom={() => setIsUploadModalOpen(true)} />

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-600/20 via-cyan-500/20 to-purple-600/10 blur-[130px] pointer-events-none rounded-full" />

        {/* Pill Tag */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-950/50 border border-indigo-500/30 text-xs font-medium text-cyan-300 mb-8 backdrop-blur-md shadow-lg shadow-indigo-950/40">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Real-Time Collaborative Code Editor & Sandbox Runner</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl leading-[1.15]">
          Code Together in Real Time.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400">
            Google Docs + VS Code.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-lg sm:text-xl text-gray-400 max-w-3xl leading-relaxed">
          Google Docs for programming, designed for hackathons and team coding. Upload your code file, copy the shareable link, invite your teammate, and edit together in real time.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-sm shadow-xl shadow-indigo-600/25 flex items-center space-x-2 transition-all hover:scale-105"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Start Collaborating (Upload Code)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <Link
            to="/dashboard"
            className="px-6 py-3.5 rounded-xl bg-[#141726] hover:bg-[#1a1e32] border border-gray-800 hover:border-gray-700 text-gray-200 font-semibold text-sm transition-all flex items-center space-x-2"
          >
            <span>Open Dashboard</span>
          </Link>
        </div>

        {/* Interactive Workspace Preview Hero Card */}
        <div className="mt-16 w-full max-w-5xl rounded-2xl border border-gray-800 bg-[#121422]/90 shadow-2xl overflow-hidden backdrop-blur-xl">
          {/* Top Window Bar */}
          <div className="h-10 bg-[#0e101c] border-b border-gray-800/80 px-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
              <span className="text-xs font-mono text-gray-400 ml-2">codetogether — main.js</span>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                3 Collaborators Active
              </span>
              <button
                onClick={() => navigate('/room/room-react-dashboard')}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold rounded"
              >
                Join Room
              </button>
            </div>
          </div>

          {/* Fake IDE layout snapshot */}
          <div className="grid grid-cols-12 text-left font-mono text-xs">
            {/* Sidebar preview */}
            <div className="col-span-3 bg-[#0d0f1b] border-r border-gray-800/80 p-3 hidden md:block">
              <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2">Workspace Files</div>
              <div className="space-y-1.5 text-gray-400 text-xs">
                <div className="flex items-center space-x-2 text-cyan-300 bg-indigo-950/30 px-2 py-1 rounded border-l-2 border-cyan-400">
                  <span>📄 index.js</span>
                </div>
                <div className="flex items-center space-x-2 px-2 py-1 hover:text-white">
                  <span>📄 math.py</span>
                </div>
                <div className="flex items-center space-x-2 px-2 py-1 hover:text-white">
                  <span>📁 src/</span>
                </div>
                <div className="flex items-center space-x-2 px-2 py-1 hover:text-white">
                  <span>📄 README.md</span>
                </div>
              </div>
            </div>

            {/* Code Content preview with live remote cursors */}
            <div className="col-span-12 md:col-span-9 p-4 bg-[#181a28] space-y-2 relative">
              {/* Simulated remote cursors */}
              <div className="absolute top-12 left-64 bg-cyan-400 text-black text-[10px] font-bold px-1 rounded shadow-md pointer-events-none">
                Sarah Chen
              </div>
              <div className="absolute top-28 left-96 bg-purple-400 text-black text-[10px] font-bold px-1 rounded shadow-md pointer-events-none">
                Marcus Vance
              </div>

              <div className="text-gray-500">// Real-time collaborative document synchronization</div>
              <div className="text-purple-400">import <span className="text-white">&#123; createEngine &#125;</span> from <span className="text-emerald-400">'@codetogether/runtime'</span>;</div>
              <div className="text-cyan-400">const <span className="text-yellow-300">room</span> = await createEngine(<span className="text-emerald-400">'room-ai-algorithms'</span>);</div>
              <div className="text-gray-300">
                room.on(<span className="text-emerald-400">'cursor:move'</span>, (user) =&gt; &#123;
              </div>
              <div className="pl-6 text-gray-400">
                console.log(<span className="text-emerald-400">&#96;Collaborator &#36;&#123;user.name&#125; edited line &#36;&#123;user.line&#125;&#96;</span>);
              </div>
              <div className="text-gray-300">&#125;);</div>

              {/* Console preview bottom bar */}
              <div className="mt-6 pt-3 border-t border-gray-800 bg-[#0d0f1b]/80 rounded p-2.5 text-xs text-gray-300">
                <div className="text-emerald-400 font-semibold mb-1">=== Execution Output (0.12s) ===</div>
                <div className="text-gray-400">F(0) = 0 | F(1) = 1 | F(2) = 1 | F(3) = 2 | F(4) = 3</div>
                <div className="text-gray-500 text-[10px]">Process exited with status 0</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-xs uppercase font-mono tracking-widest text-cyan-400 mb-2">Engineered For Developers</h2>
          <h3 className="text-3xl sm:text-4xl font-bold text-white">Everything you need for live collaboration</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="p-6 rounded-2xl bg-[#121422] border border-gray-800 hover:border-gray-700 transition-all hover:-translate-y-1">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">Multi-User Cursors</h4>
            <p className="text-sm text-gray-400 leading-relaxed">
              Every collaborator receives a unique cursor color and floating name tag. Watch teammates type, select text, and navigate files in real time.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-2xl bg-[#121422] border border-gray-800 hover:border-gray-700 transition-all hover:-translate-y-1">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
              <Code2 className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">Monaco Code Editor</h4>
            <p className="text-sm text-gray-400 leading-relaxed">
              Full VS Code editing experience: syntax highlighting, brackets colorization, minimap, formatting, and multi-file tabs for JS, TS, Python, C++, and Java.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-2xl bg-[#121422] border border-gray-800 hover:border-gray-700 transition-all hover:-translate-y-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <Terminal className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">Isolated Sandbox Runner</h4>
            <p className="text-sm text-gray-400 leading-relaxed">
              Execute code directly in the browser with realistic stdout, stderr, execution duration metrics, and container memory stats.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-6 rounded-2xl bg-[#121422] border border-gray-800 hover:border-gray-700 transition-all hover:-translate-y-1">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">Shared Project Explorer</h4>
            <p className="text-sm text-gray-400 leading-relaxed">
              Create, rename, and delete project files and organize into folders. File tree changes sync immediately with all room participants.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="p-6 rounded-2xl bg-[#121422] border border-gray-800 hover:border-gray-700 transition-all hover:-translate-y-1">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
              <Share2 className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">Instant Room Sharing</h4>
            <p className="text-sm text-gray-400 leading-relaxed">
              Generate invite links in one click, set permissions (Can Edit vs Can View), and share Room IDs for instant pairing.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="p-6 rounded-2xl bg-[#121422] border border-gray-800 hover:border-gray-700 transition-all hover:-translate-y-1">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">Production-Ready Architecture</h4>
            <p className="text-sm text-gray-400 leading-relaxed">
              Built on Yjs CRDTs and modular Socket.IO services, ready to bridge directly to any Node.js + Express backend or Docker worker pool.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-gray-800/80">
        <div className="text-center mb-16">
          <h2 className="text-xs uppercase font-mono tracking-widest text-indigo-400 mb-2">Hackathon Workflow</h2>
          <h3 className="text-3xl font-bold text-white">How CodeTogether Works</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-[#10121e] rounded-2xl border border-gray-800 relative">
            <div className="text-4xl font-mono font-bold text-gray-700 mb-4">01</div>
            <h4 className="text-lg font-bold text-white mb-2">Upload Code File</h4>
            <p className="text-sm text-gray-400">
              Drag & drop your code file (.py, .js, .cpp, .java, etc.). The editor automatically detects the language and creates your room.
            </p>
          </div>

          <div className="p-6 bg-[#10121e] rounded-2xl border border-gray-800 relative">
            <div className="text-4xl font-mono font-bold text-gray-700 mb-4">02</div>
            <h4 className="text-lg font-bold text-white mb-2">Copy & Invite</h4>
            <p className="text-sm text-gray-400">
              Click Invite Teammates to copy your unique shareable room URL. Send it to your hackathon partner.
            </p>
          </div>

          <div className="p-6 bg-[#10121e] rounded-2xl border border-gray-800 relative">
            <div className="text-4xl font-mono font-bold text-gray-700 mb-4">03</div>
            <h4 className="text-lg font-bold text-white mb-2">Edit in Real Time</h4>
            <p className="text-sm text-gray-400">
              Both teammates edit simultaneously with live colored cursors, conflict-free Yjs synchronization, and an integrated sandbox runner.
            </p>
          </div>
        </div>
      </section>

      {/* Upload Room Modal */}
      <UploadRoomModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-gray-800/80 py-8 px-4 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Code2 className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-gray-300">CodeTogether Collaborative Platform</span>
          </div>
          <div>
            Built with React, Monaco Editor, Tailwind CSS &amp; Yjs.
          </div>
        </div>
      </footer>
    </div>
  );
}
