"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Plus, 
  Square, 
  RotateCcw, 
  Trash2, 
  Terminal, 
  Activity, 
  Globe, 
  ShieldCheck, 
  Zap, 
  Cpu, 
  Shield, 
  Code, 
  ArrowRight,
  LayoutDashboard,
  FileText,
  Server as ServerIcon,
  HardDrive,
  Settings,
  Lock,
  LogOut,
  User
} from "lucide-react";

interface BotStatus {
  name: string;
  status: string;
  cpu: number;
  memory: number;
  uptime: number;
  serverId: string;
  serverName: string;
}

interface Server {
  id: string;
  name: string;
  host: string;
  username: string;
  isLocal?: boolean;
}

export default function Page() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bots, setBots] = useState<BotStatus[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [showServerModal, setShowServerModal] = useState(false);
  const [formData, setFormData] = useState({
    botName: "",
    repoUrl: "",
    botToken: "",
    envVars: "",
    serverId: "local",
  });
  const [serverFormData, setServerFormData] = useState({
    name: "",
    host: "",
    username: "",
    password: "",
  });
  const [logs, setLogs] = useState<{ [key: string]: string }>({});
  const [activeLog, setActiveLog] = useState<{ name?: string; serverId: string; type: 'bot' | 'server' } | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isFetchingStatus = useRef(false);

  const fetchStatus = async () => {
    if (status !== "authenticated" || isFetchingStatus.current) return;
    isFetchingStatus.current = true;
    try {
      const res = await fetch("/api/status");
      if (!res.ok) {
        const errorData = await res.json();
        console.error("Status API error:", errorData);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setBots(data);
      }
    } catch (error) {
      console.error("Failed to fetch status:", error);
    } finally {
      isFetchingStatus.current = false;
    }
  };

  const fetchServers = async () => {
    if (status !== "authenticated") return;
    try {
      const res = await fetch("/api/servers");
      const data = await res.json();
      if (Array.isArray(data)) {
        setServers(data);
        // If current selected server is gone, reset to local
        // Using both id and _id check for maximum compatibility
        const serverExists = data.some((s: any) => (s.id === formData.serverId || s._id === formData.serverId));
        if (formData.serverId !== "local" && formData.serverId !== "" && !serverExists) {
          setFormData(prev => ({ ...prev, serverId: "local" }));
        }
      }
    } catch (error) {
      console.error("Failed to fetch servers:", error);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchStatus();
      fetchServers();
      const interval = setInterval(fetchStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [status]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Zap className="text-blue-400" size={48} fill="currentColor" />
          <p className="text-[#8b949e] font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  // Render Landing Page if unauthenticated
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] font-sans overflow-x-hidden">
        {/* Navbar */}
        <nav className={`fixed top-0 w-full z-50 transition-all duration-300 border-b ${
          scrolled ? "bg-[#0d1117]/80 backdrop-blur-md border-[#30363d] py-3" : "bg-transparent border-transparent py-5"
        }`}>
          <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
            <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="bg-white/10 p-1.5 rounded-lg border border-white/10 group-hover:scale-110 transition-transform">
                <Zap className="text-blue-400" size={24} fill="currentColor" />
              </div>
              <span className="text-xl font-semibold text-white tracking-tight">BotDeploy</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#8b949e]">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#security" className="hover:text-white transition-colors">Security</a>
              <Link href="/docs" className="hover:text-white transition-colors flex items-center gap-1.5">
                <FileText size={16} /> Docs
              </Link>
            </div>
            <div className="flex gap-4">
              <Link href="/login" className="text-sm font-semibold text-[#8b949e] hover:text-white transition-colors py-2 px-4">
                Sign In
              </Link>
              <Link
                href="/register"
                className="bg-white text-[#0d1117] px-5 py-2 rounded-lg text-sm font-bold hover:bg-[#f0f6fc] transition-all shadow-lg shadow-white/5"
              >
                Get Started
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative pt-48 pb-32 px-6">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none overflow-hidden -z-10">
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          </div>
          
          <div className="max-w-7xl mx-auto relative">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-widest uppercase mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <Activity size={12} /> The Future of Bot Management
              </div>
              <h1 className="text-6xl md:text-8xl font-bold text-white tracking-tight leading-[1.1] mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
                Deploy bots <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400">
                  in seconds.
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-[#8b949e] leading-relaxed mb-12 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
                A professional platform for hosting and managing your Telegram bots. Scalable, secure, and lightning fast.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
                <Link
                  href="/register"
                  className="w-full sm:w-auto bg-white text-[#0d1117] px-10 py-5 rounded-xl font-bold text-lg hover:bg-[#f0f6fc] hover:scale-105 transition-all flex items-center justify-center gap-3 group shadow-2xl shadow-white/10"
                >
                  Start for free <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="#features"
                  className="w-full sm:w-auto bg-[#161b22] border border-[#30363d] text-white px-10 py-5 rounded-xl font-bold text-lg hover:bg-[#21262d] hover:border-[#8b949e] transition-all flex items-center justify-center gap-3"
                >
                  Explore Features
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-32 px-6 border-t border-[#30363d]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl font-bold text-white mb-4">Everything you need</h2>
              <p className="text-[#8b949e] text-lg">One platform to deploy, monitor, and scale.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: <Zap className="text-blue-400" />, title: "Instant Deploy", desc: "Push your code and watch it go live in seconds with automatic dependency resolution." },
                { icon: <Shield className="text-purple-400" />, title: "Secure by Default", desc: "Enterprise-grade SSH encryption and password-less authentication for your peace of mind." },
                { icon: <Cpu className="text-emerald-400" />, title: "Live Metrics", desc: "Real-time monitoring of CPU, memory, and uptime for every bot in your infrastructure." }
              ].map((f, i) => (
                <div key={i} className="bg-[#161b22] border border-[#30363d] p-8 rounded-2xl hover:border-blue-500/30 transition-all group hover:-translate-y-2 duration-300">
                  <div className="bg-[#0d1117] w-14 h-14 rounded-xl flex items-center justify-center mb-6 border border-[#30363d] group-hover:scale-110 transition-transform">
                    {f.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                  <p className="text-[#8b949e] leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-6 border-t border-[#30363d] bg-[#0d1117]">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <Zap className="text-blue-400" size={20} fill="currentColor" />
              <span className="text-lg font-bold text-white">BotDeploy</span>
            </div>
            <p className="text-[#8b949e] text-sm">© 2026 BotDeploy. Built for the modern developer.</p>
            <div className="flex gap-6 text-sm text-[#8b949e]">
              <a href="#" className="hover:text-white">Terms</a>
              <a href="#" className="hover:text-white">Privacy</a>
              <a href="#" className="hover:text-white">Twitter</a>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // Dashboard logic remains the same but with added entrance animations
  const [deployProgress, setDeployProgress] = useState<{ phase: string, message: string, status: string }[]>([]);

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setDeployProgress([]);
    try {
      const envVarsLines = formData.envVars.split('\n');
      const envVarsObj: { [key: string]: string } = {};
      envVarsLines.forEach(line => {
        const [key, ...rest] = line.split('=');
        const value = rest.join('=');
        if (key && value) envVarsObj[key.trim()] = value.trim();
      });

      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          envVars: envVarsObj,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(`Deployment failed: ${error.error}`);
        setLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(l => l.trim());
          
          lines.forEach(line => {
            try {
              const update = JSON.parse(line);
              setDeployProgress(prev => {
                const existing = prev.findIndex(p => p.phase === update.phase);
                if (existing !== -1) {
                  const newProgress = [...prev];
                  newProgress[existing] = update;
                  return newProgress;
                }
                return [...prev, update];
              });

              if (update.status === 'error') {
                alert(`Deployment failed: ${update.message}`);
                setLoading(false);
              }
            } catch (e) {
              console.error("Failed to parse progress update:", e);
            }
          });
        }
      }

      const finalStatus = deployProgress[deployProgress.length - 1];
      if (finalStatus?.status === 'completed' && finalStatus.phase === 'deploying') {
        setTimeout(() => {
          setShowDeployModal(false);
          setFormData({ ...formData, botName: "", repoUrl: "", botToken: "", envVars: "" });
          setDeployProgress([]);
          fetchStatus();
        }, 2000);
      }
    } catch (error) {
      alert("An error occurred during deployment");
    } finally {
      setLoading(false);
    }
  };

  const handleAddServer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(serverFormData),
      });

      if (res.ok) {
        setShowServerModal(false);
        setServerFormData({ name: "", host: "", username: "", password: "" });
        fetchServers();
      } else {
        const error = await res.json();
        alert(`Failed to add server: ${error.error}`);
      }
    } catch (error) {
      alert("An error occurred while adding server");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteServer = async (id: string) => {
    if (!confirm("Are you sure you want to remove this server?")) return;
    try {
      const res = await fetch(`/api/servers?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchServers();
    } catch (error) {
      console.error("Failed to delete server:", error);
    }
  };

  const fetchLogs = async (serverId: string, botName?: string) => {
    try {
      const url = botName 
        ? `/api/logs?name=${botName}&serverId=${serverId}&type=bot`
        : `/api/logs?serverId=${serverId}&type=server`;
        
      const res = await fetch(url);
      const data = await res.json();
      const logKey = botName ? `${botName}-${serverId}` : `server-${serverId}`;
      setLogs((prev) => ({ ...prev, [logKey]: data.logs }));
      setActiveLog({ name: botName, serverId, type: botName ? 'bot' : 'server' });
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    }
  };

  const handleAction = async (action: string, name: string, serverId: string) => {
    try {
      const res = await fetch(`/api/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, name, serverId }),
      });
      if (res.ok) fetchStatus();
    } catch (error) {
      console.error(`Action ${action} failed:`, error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] font-sans selection:bg-blue-500/30">
      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 border-b ${
        scrolled ? "bg-[#0d1117]/80 backdrop-blur-md border-[#30363d] py-3" : "bg-transparent border-transparent py-5"
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 p-1.5 rounded-lg border border-white/10">
              <Zap className="text-blue-400" size={24} fill="currentColor" />
            </div>
            <span className="text-xl font-semibold text-white tracking-tight">BotDeploy</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#8b949e]">
            <a href="#dashboard-section" className="hover:text-white transition-colors">Dashboard</a>
            <a href="#servers-section" className="hover:text-white transition-colors">Servers</a>
            <Link href="/docs" className="hover:text-white transition-colors flex items-center gap-1.5">
              <FileText size={16} /> Docs
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#161b22] border border-[#30363d] rounded-full text-xs font-medium">
              <User size={14} className="text-blue-400" />
              <span className="text-white max-w-[120px] truncate">{session?.user?.email}</span>
            </div>
            <button
              onClick={() => signOut()}
              title="Sign Out"
              className="p-2 bg-[#161b22] border border-[#30363d] text-[#8b949e] hover:text-red-400 hover:border-red-500/30 rounded-lg transition-all"
            >
              <LogOut size={18} />
            </button>
            <button
              onClick={() => setShowDeployModal(true)}
              className="bg-[#238636] hover:bg-[#2ea043] text-white px-4 py-2 rounded-md text-sm font-semibold transition-all shadow-sm border border-[#2ea043]/50"
            >
              New Deploy
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-24 animate-in fade-in duration-700">
        {/* Servers Management Section */}
        <section id="servers-section" className="py-12 px-6 relative">
          <div className="max-w-7xl mx-auto">
            <header className="flex justify-between items-center mb-10">
              <div>
                <div className="flex items-center gap-2 text-purple-400 font-mono text-sm mb-2">
                  <ServerIcon size={14} /> INFRASTRUCTURE
                </div>
                <h2 className="text-4xl font-bold text-white tracking-tight">Connected Servers</h2>
              </div>
              <button
                onClick={() => setShowServerModal(true)}
                className="bg-[#161b22] border border-[#30363d] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#21262d] transition-all flex items-center gap-2"
              >
                <Plus size={16} /> Add Server
              </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {servers.map((server, i) => (
                <div 
                  key={server.id} 
                  className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 hover:border-purple-500/30 transition-all relative group animate-in fade-in zoom-in duration-500"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button 
                      onClick={() => fetchLogs(server.id)}
                      title="Server Logs"
                      className="text-[#8b949e] hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Terminal size={16} />
                    </button>
                    {!server.isLocal && (
                      <button 
                        onClick={() => handleDeleteServer(server.id)}
                        className="text-[#8b949e] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div className="bg-[#0d1117] p-3 rounded-lg w-fit mb-4 border border-[#30363d] group-hover:scale-110 transition-transform">
                    <HardDrive className={server.isLocal ? "text-blue-400" : "text-purple-400"} size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">{server.name}</h3>
                  <p className="text-sm text-[#8b949e] font-mono">{server.username}@{server.host}</p>
                  {server.isLocal && <span className="mt-4 inline-block text-[10px] font-bold uppercase tracking-widest text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">Current System</span>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Dashboard Section */}
        <section id="dashboard-section" className="py-12 border-t border-[#30363d] bg-[#0d1117]/50 relative">
          <div className="max-w-7xl mx-auto px-6">
            <header className="mb-10">
              <div className="flex items-center gap-2 text-blue-400 font-mono text-sm mb-2">
                <LayoutDashboard size={14} /> SYSTEM DASHBOARD
              </div>
              <h2 className="text-4xl font-bold text-white tracking-tight">Active Deployments</h2>
            </header>

            {bots.length === 0 ? (
              <div className="bg-[#161b22] border-2 border-dashed border-[#30363d] rounded-2xl p-20 text-center animate-in fade-in duration-700">
                <h3 className="text-2xl font-bold text-white mb-2">No active bots</h3>
                <p className="text-[#8b949e] mb-8">Deploy your first bot to see its performance metrics here.</p>
                <button
                  onClick={() => setShowDeployModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
                >
                  Create Deployment
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bots.map((bot, i) => (
                  <div 
                    key={`${bot.name}-${bot.serverId}`} 
                    className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden hover:border-blue-500/30 transition-all group animate-in fade-in slide-in-from-bottom-4 duration-500"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-lg ${bot.status === 'online' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                            <Activity size={20} className={bot.status === 'online' ? 'animate-pulse' : ''} />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{bot.name}</h3>
                            <p className="text-[10px] text-[#8b949e] uppercase font-bold tracking-wider mt-0.5 flex items-center gap-1">
                              <ServerIcon size={10} /> {bot.serverName}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          bot.status === 'online' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {bot.status}
                        </span>
                      </div>

                      <div className="space-y-4 mb-8">
                        <div className="flex justify-between items-end">
                          <span className="text-[#8b949e] text-sm">CPU Usage</span>
                          <span className="text-white font-mono">{bot.cpu}%</span>
                        </div>
                        <div className="w-full bg-[#0d1117] h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${bot.cpu > 80 ? 'bg-red-500' : bot.cpu > 50 ? 'bg-amber-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min(bot.cpu, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-end">
                          <span className="text-[#8b949e] text-sm">Memory</span>
                          <span className="text-white font-mono">{(bot.memory / (1024 * 1024)).toFixed(1)} MB</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => fetchLogs(bot.serverId, bot.name)}
                          className="flex-1 flex items-center justify-center gap-2 bg-[#21262d] border border-[#30363d] hover:border-[#8b949e] text-white py-2.5 rounded-lg transition-all text-sm font-bold"
                        >
                          <Terminal size={16} /> Logs
                        </button>
                        <button 
                          onClick={() => handleAction('restart', bot.name, bot.serverId)}
                          title="Restart Service"
                          className="p-2.5 bg-[#21262d] border border-[#30363d] hover:border-blue-400/50 text-blue-400 rounded-lg transition-all"
                        >
                          <RotateCcw size={16} />
                        </button>
                        <button 
                          onClick={() => handleAction('stop', bot.name, bot.serverId)}
                          title="Stop Service"
                          className="p-2.5 bg-[#21262d] border border-[#30363d] hover:border-amber-400/50 text-amber-400 rounded-lg transition-all"
                        >
                          <Square size={16} />
                        </button>
                        <button 
                          onClick={() => handleAction('delete', bot.name, bot.serverId)}
                          title="Undeploy (Delete)"
                          className="p-2.5 bg-[#21262d] border border-[#30363d] hover:border-red-400/50 text-red-400 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Modals & Logs (Same as before) */}
      {showDeployModal && (
        <div className="fixed inset-0 bg-[#0d1117]/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-8 max-w-lg w-full shadow-2xl animate-in zoom-in duration-300">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Plus className="text-blue-400" strokeWidth={3} size={24} />
              New Deployment
            </h2>

            {deployProgress.length > 0 ? (
              <div className="space-y-6 py-4">
                {['creating', 'building', 'deploying'].map((phase, i) => {
                  const step = deployProgress.find(p => p.phase === phase);
                  const isCurrent = step?.status === 'in_progress';
                  const isDone = step?.status === 'completed';
                  const isError = step?.status === 'error';
                  
                  return (
                    <div key={phase} className={`flex items-start gap-4 transition-all duration-500 ${!step && 'opacity-30'}`}>
                      <div className="relative mt-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                          isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 
                          isError ? 'bg-red-500 border-red-500 text-white' :
                          isCurrent ? 'border-blue-500 animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'border-[#30363d]'
                        }`}>
                          {isDone ? (
                            <ShieldCheck size={18} />
                          ) : isError ? (
                            <Trash2 size={18} />
                          ) : (
                            <span className="text-xs font-bold">{i + 1}</span>
                          )}
                        </div>
                        {i < 2 && (
                          <div className={`absolute top-8 left-1/2 -translate-x-1/2 w-0.5 h-10 transition-colors duration-500 ${
                            isDone ? 'bg-emerald-500' : 'bg-[#30363d]'
                          }`} />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-bold uppercase tracking-wider text-xs mb-1 transition-colors duration-500 ${
                          isDone ? 'text-emerald-400' : isCurrent ? 'text-blue-400' : 'text-[#8b949e]'
                        }`}>
                          {phase}
                        </h3>
                        <p className={`text-sm transition-colors duration-500 ${
                          isDone || isCurrent ? 'text-white' : 'text-[#8b949e]'
                        }`}>
                          {step?.message || `Waiting to start ${phase}...`}
                        </p>
                        {isCurrent && (
                          <div className="mt-3 w-full bg-[#0d1117] h-1 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 animate-[loading_2s_infinite_linear]" style={{ width: '40%' }} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <form onSubmit={handleDeploy} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-[#8b949e] mb-2 uppercase tracking-wider">Target Server</label>
                  <select
                    required
                    className={`w-full bg-[#0d1117] border ${!servers.find(s => (s.id === formData.serverId || (s as any)._id === formData.serverId)) ? 'border-red-500' : 'border-[#30363d]'} rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all appearance-none`}
                    value={formData.serverId}
                    onChange={(e) => setFormData({ ...formData, serverId: e.target.value })}
                  >
                    {!servers.find(s => (s.id === formData.serverId || (s as any)._id === formData.serverId)) && formData.serverId !== "" && (
                      <option value={formData.serverId} disabled>Missing Server ({formData.serverId})</option>
                    )}
                    {servers.map(s => <option key={s.id || (s as any)._id} value={s.id || (s as any)._id}>{s.name} ({s.host})</option>)}
                  </select>
                  {!servers.find(s => (s.id === formData.serverId || (s as any)._id === formData.serverId)) && formData.serverId !== "" && (
                    <p className="text-red-400 text-xs mt-1">The previously selected server is no longer available. Please select a different server.</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#8b949e] mb-2 uppercase tracking-wider">Bot Name</label>
                  <input
                    required
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                    placeholder="e.g. notification-bot"
                    value={formData.botName}
                    onChange={(e) => setFormData({ ...formData, botName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#8b949e] mb-2 uppercase tracking-wider flex items-center gap-2">
                    <Globe size={14} /> Repository URL
                  </label>
                  <input
                    required
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                    placeholder="https://github.com/username/repo"
                    value={formData.repoUrl}
                    onChange={(e) => setFormData({ ...formData, repoUrl: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#8b949e] mb-2 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck size={14} /> Telegram Bot Token
                  </label>
                  <input
                    required
                    type="password"
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                    placeholder="123456789:ABCDEF..."
                    value={formData.botToken}
                    onChange={(e) => setFormData({ ...formData, botToken: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#8b949e] mb-2 uppercase tracking-wider">Env Vars (KEY=VALUE)</label>
                  <textarea
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all h-24 font-mono text-sm"
                    placeholder="DATABASE_URL=mongodb://..."
                    value={formData.envVars}
                    onChange={(e) => setFormData({ ...formData, envVars: e.target.value })}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowDeployModal(false)}
                    className="flex-1 bg-[#21262d] border border-[#30363d] hover:bg-[#30363d] text-white py-3 rounded-lg font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 text-white py-3 rounded-lg font-bold transition-all"
                  >
                    {loading ? "Deploying..." : "Create Deployment"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {showServerModal && (
        <div className="fixed inset-0 bg-[#0d1117]/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-8 max-w-lg w-full shadow-2xl animate-in zoom-in duration-300">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <ServerIcon className="text-purple-400" size={24} />
              Add Remote Server
            </h2>
            <form onSubmit={handleAddServer} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[#8b949e] mb-2 uppercase tracking-wider">Server Name</label>
                <input
                  required
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all"
                  placeholder="e.g. Production VPS"
                  value={serverFormData.name}
                  onChange={(e) => setServerFormData({ ...serverFormData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#8b949e] mb-2 uppercase tracking-wider">Host (IP/Domain)</label>
                  <input
                    required
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all"
                    placeholder="1.2.3.4"
                    value={serverFormData.host}
                    onChange={(e) => setServerFormData({ ...serverFormData, host: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#8b949e] mb-2 uppercase tracking-wider">Username</label>
                  <input
                    required
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all"
                    placeholder="root"
                    value={serverFormData.username}
                    onChange={(e) => setServerFormData({ ...serverFormData, username: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#8b949e] mb-2 uppercase tracking-wider flex items-center gap-2">
                  <Lock size={14} /> Password (for SSH)
                </label>
                <input
                  required
                  type="password"
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all"
                  placeholder="••••••••"
                  value={serverFormData.password}
                  onChange={(e) => setServerFormData({ ...serverFormData, password: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowServerModal(false)}
                  className="flex-1 bg-[#21262d] border border-[#30363d] hover:bg-[#30363d] text-white py-3 rounded-lg font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-3 rounded-lg font-bold transition-all"
                >
                  {loading ? "Adding..." : "Add Server"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeLog && (
        <div className="fixed inset-0 bg-[#0d1117]/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-8 max-w-4xl w-full shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Terminal className="text-blue-400" />
                Logs: <span className="text-[#8b949e] font-mono font-normal">{activeLog.name || 'Server'}</span>
              </h2>
              <button onClick={() => setActiveLog(null)} className="p-2 hover:bg-[#30363d] rounded-lg text-[#8b949e] transition-colors">
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-6 font-mono text-sm overflow-auto flex-1 text-[#c9d1d9] shadow-inner">
              <pre className="whitespace-pre-wrap">
                {activeLog.type === 'bot' 
                  ? (logs[`${activeLog.name}-${activeLog.serverId}`] || "Fetching logs...")
                  : (logs[`server-${activeLog.serverId}`] || "Fetching system logs...")
                }
              </pre>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => fetchLogs(activeLog.serverId, activeLog.name)}
                className="bg-[#21262d] border border-[#30363d] hover:border-[#8b949e] text-white px-6 py-2 rounded-lg font-bold transition-all"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
