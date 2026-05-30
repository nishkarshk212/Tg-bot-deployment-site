"use client";

import { useState, useEffect } from "react";
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
  Lock
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

export default function Dashboard() {
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

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/status");
      const data = await res.json();
      if (Array.isArray(data)) {
        setBots(data);
      }
    } catch (error) {
      console.error("Failed to fetch status:", error);
    }
  };

  const fetchServers = async () => {
    try {
      const res = await fetch("/api/servers");
      const data = await res.json();
      if (Array.isArray(data)) {
        setServers(data);
      }
    } catch (error) {
      console.error("Failed to fetch servers:", error);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchServers();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const envVarsObj = formData.envVars.split('\n').reduce((acc: any, curr) => {
        const [key, value] = curr.split('=');
        if (key && value) acc[key.trim()] = value.trim();
        return acc;
      }, {});

      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          envVars: envVarsObj,
        }),
      });

      if (res.ok) {
        setShowDeployModal(false);
        setFormData({ ...formData, botName: "", repoUrl: "", botToken: "", envVars: "" });
        fetchStatus();
        document.getElementById('dashboard-section')?.scrollIntoView({ behavior: 'smooth' });
      } else {
        const error = await res.json();
        alert(`Deployment failed: ${error.error}`);
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
      const type = botName ? 'bot' : 'server';
      const url = botName 
        ? `/api/logs?name=${botName}&serverId=${serverId}&type=bot`
        : `/api/logs?serverId=${serverId}&type=server`;
        
      const res = await fetch(url);
      const data = await res.json();
      const logKey = botName ? `${botName}-${serverId}` : `server-${serverId}`;
      setLogs((prev) => ({ ...prev, [logKey]: data.logs }));
      setActiveLog({ name: botName, serverId, type });
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
      if (res.ok) {
        fetchStatus();
      }
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
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#dashboard-section" className="hover:text-white transition-colors">Dashboard</a>
            <a href="#servers-section" className="hover:text-white transition-colors">Servers</a>
            <Link href="/docs" className="hover:text-white transition-colors flex items-center gap-1.5">
              <FileText size={16} /> Docs
            </Link>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowServerModal(true)}
              className="bg-[#161b22] border border-[#30363d] text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-[#21262d] transition-all"
            >
              Add Server
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

      {/* Hero Section (Same as before) */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>
        <div className="max-w-7xl mx-auto relative">
          <div className="max-w-3xl">
            <h1 className="text-6xl md:text-8xl font-bold text-white tracking-tight leading-[1.1] mb-8">
              Remote bot <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400">
                management.
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-[#8b949e] leading-relaxed mb-10 max-w-2xl">
              Deploy to any server using SSH and sshpass. Real-time monitoring across your entire infrastructure.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={() => setShowDeployModal(true)}
                className="w-full sm:w-auto bg-white text-[#0d1117] px-8 py-4 rounded-lg font-bold text-lg hover:bg-[#f0f6fc] transition-all flex items-center justify-center gap-2 group shadow-xl shadow-white/5"
              >
                Deploy your bot <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => setShowServerModal(true)}
                className="w-full sm:w-auto bg-[#161b22] border border-[#30363d] text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-[#21262d] transition-all flex items-center justify-center gap-2"
              >
                Add Remote Server
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Servers Management Section */}
      <section id="servers-section" className="py-24 border-t border-[#30363d] bg-[#0d1117]/50 relative">
        <div className="max-w-7xl mx-auto px-6">
          <header className="mb-12">
            <div className="flex items-center gap-2 text-purple-400 font-mono text-sm mb-2">
              <ServerIcon size={14} /> INFRASTRUCTURE
            </div>
            <h2 className="text-4xl font-bold text-white tracking-tight">Connected Servers</h2>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {servers.map((server) => (
              <div key={server.id} className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 hover:border-purple-500/30 transition-all relative group">
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
                <div className="bg-[#0d1117] p-3 rounded-lg w-fit mb-4 border border-[#30363d]">
                  <HardDrive className={server.isLocal ? "text-blue-400" : "text-purple-400"} size={24} />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{server.name}</h3>
                <p className="text-sm text-[#8b949e] font-mono">{server.username}@{server.host}</p>
                {server.isLocal && <span className="mt-4 inline-block text-[10px] font-bold uppercase tracking-widest text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">Current System</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Section */}
      <section id="dashboard-section" className="py-24 border-t border-[#30363d] bg-[#0d1117] relative">
        <div className="max-w-7xl mx-auto px-6">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div>
              <div className="flex items-center gap-2 text-blue-400 font-mono text-sm mb-2">
                <LayoutDashboard size={14} /> SYSTEM DASHBOARD
              </div>
              <h2 className="text-4xl font-bold text-white tracking-tight">Active Deployments</h2>
            </div>
          </header>

          {bots.length === 0 ? (
            <div className="bg-[#161b22] border-2 border-dashed border-[#30363d] rounded-2xl p-20 text-center">
              <h3 className="text-2xl font-bold text-white mb-2">No active bots</h3>
              <p className="text-[#8b949e] mb-8">Deploy your first bot to see its performance metrics here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bots.map((bot) => (
                <div key={`${bot.name}-${bot.serverId}`} className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden hover:border-[#8b949e]/50 transition-all group">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg ${bot.status === 'online' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                          <Activity size={20} />
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

      {/* Deploy Modal */}
      {showDeployModal && (
        <div className="fixed inset-0 bg-[#0d1117]/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-8 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Plus className="text-blue-400" strokeWidth={3} size={24} />
              New Deployment
            </h2>
            <form onSubmit={handleDeploy} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[#8b949e] mb-2 uppercase tracking-wider">Target Server</label>
                <select
                  required
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all appearance-none"
                  value={formData.serverId}
                  onChange={(e) => setFormData({ ...formData, serverId: e.target.value })}
                >
                  {servers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.host})</option>)}
                </select>
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
          </div>
        </div>
      )}

      {/* Server Modal */}
      {showServerModal && (
        <div className="fixed inset-0 bg-[#0d1117]/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-8 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in duration-200">
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
                  <Lock size={14} /> Password (for sshpass)
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

      {/* Logs Modal */}
      {activeLog && (
        <div className="fixed inset-0 bg-[#0d1117]/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-8 max-w-4xl w-full shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Terminal className="text-blue-400" />
                Logs: <span className="text-[#8b949e] font-mono font-normal">{activeLog.name}</span>
              </h2>
              <button 
                onClick={() => setActiveLog(null)}
                className="p-2 hover:bg-[#30363d] rounded-lg text-[#8b949e] transition-colors"
              >
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
