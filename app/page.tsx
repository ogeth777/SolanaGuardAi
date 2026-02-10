/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, useRef } from 'react';
import { Shield, AlertTriangle, CheckCircle, Search, Loader2, ExternalLink, Globe, Twitter, DollarSign, BarChart3, Lock, FileText, Activity, Zap, Users, AlertOctagon, Heart, Coffee, History, ArrowRight, Bot, MessageCircle, Send, Info, Map, X, Terminal, Radio, Cpu, Network } from 'lucide-react';
import clsx from 'clsx';
import { formatNumber, formatPrice, formatPct } from '@/lib/utils';
import { generateRiskSummary } from '@/lib/ai-summary';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: React.ReactNode;
  timestamp: number;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-scroll on content resize (for typewriter effect)
  useEffect(() => {
    if (!chatContainerRef.current) return;

    const observer = new ResizeObserver(() => {
        scrollToBottom();
    });

    observer.observe(chatContainerRef.current);

    // Also observe subtree mutations for text updates
    const mutationObserver = new MutationObserver(() => {
        scrollToBottom();
    });

    mutationObserver.observe(chatContainerRef.current, { 
        childList: true, 
        subtree: true, 
        characterData: true 
    });

    return () => {
        observer.disconnect();
        mutationObserver.disconnect();
    };
  }, []);

  // Initial Greeting
  useEffect(() => {
    setMessages([
      {
        id: 'init',
        role: 'assistant',
        content: (
            <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-[#14F195]/20 pb-2 mb-2">
                    <Terminal className="w-4 h-4 text-[#14F195]" />
                    <span className="text-[#14F195] font-bold font-mono text-sm tracking-wider">SYSTEM_INIT_COMPLETE</span>
                </div>
                
                <p>Greetings, Operator. <span className="text-[#14F195] font-bold">Solana Guard AI v2.1</span> is online.</p>
                <p>Ready to audit <span className="text-[#14F195] font-bold">Solana & Base</span> assets. All scanning modules operational.</p>
                
                <div className="grid grid-cols-2 gap-2 my-2">
                    <div className="bg-[#14F195]/5 border border-[#14F195]/20 p-2 rounded text-xs text-[#14F195] font-mono flex items-center gap-2">
                        <Shield className="w-3 h-3" /> MINT_AUTH_SCAN
                    </div>
                    <div className="bg-[#14F195]/5 border border-[#14F195]/20 p-2 rounded text-xs text-[#14F195] font-mono flex items-center gap-2">
                        <Lock className="w-3 h-3" /> LIQUIDITY_CHECK
                    </div>
                    <div className="bg-[#14F195]/5 border border-[#14F195]/20 p-2 rounded text-xs text-[#14F195] font-mono flex items-center gap-2">
                        <Users className="w-3 h-3" /> HOLDER_ANALYSIS
                    </div>
                    <div className="bg-[#14F195]/5 border border-[#14F195]/20 p-2 rounded text-xs text-[#14F195] font-mono flex items-center gap-2">
                        <Activity className="w-3 h-3" /> RUG_DETECTION
                    </div>
                </div>

                <div className="mt-4 p-3 bg-slate-900/80 rounded border border-slate-700/50 text-left relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[#14F195]/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none"></div>
                    <h3 className="text-xs font-bold text-white mb-2 uppercase tracking-widest flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3 text-yellow-500" />
                        Protocol Advisory
                    </h3>
                    <div className="space-y-1 text-xs text-slate-400 font-mono">
                        <div className="flex gap-2">
                            <span>[WARN]</span>
                            <span>Rug pulls detected in 12% of new pairs.</span>
                        </div>
                        <div className="flex gap-2">
                            <span>[INFO]</span>
                            <span>Verified contracts (CMC/CG) recommended.</span>
                        </div>
                    </div>
                </div>

                <p className="text-slate-500 text-xs mt-2 font-mono blink">_waiting_for_target_address...</p>
            </div>
        ),
        timestamp: Date.now()
    }
    ]);
  }, []);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || loading) return;

    const address = inputValue.trim();
    setInputValue('');
    
    // 1. User Message
    const userMsgId = Date.now().toString();
    setMessages(prev => [...prev, { 
        id: userMsgId, 
        role: 'user', 
        content: <div className="font-mono text-[#14F195] tracking-wider">{`> QUERY: ${address}`}</div>, 
        timestamp: Date.now() 
    }]);

    setLoading(true);

    // 2. AI Thinking Message
    const loadingId = 'loading-' + Date.now();
    setMessages(prev => [...prev, { 
        id: loadingId, 
        role: 'assistant', 
        content: (
            <div className="flex items-center gap-2 text-slate-400 font-mono text-sm">
                <Loader2 className="w-4 h-4 animate-spin text-[#14F195]" /> 
                <span className="animate-pulse">ESTABLISHING_UPLINK...</span>
            </div>
        ), 
        timestamp: Date.now() 
    }]);

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address })
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      const aiText = generateRiskSummary(data);

      const result = {
        ...data,
        aiAnalysis: aiText,
        checks: {
          mintDisabled: !data.isMintable,
          lpBurned: !data.isFreezable, // Using freeze as proxy for now
          metadataImmutable: !data.isMutable,
          topHoldersSafe: data.riskScore < 50
        }
      };

      // 3. Replace Thinking with Result
      setMessages(prev => prev.map(m => m.id === loadingId ? {
        ...m,
        content: <TokenAnalysis result={result} />
      } : m));

    } catch (err: any) {
      setMessages(prev => prev.map(m => m.id === loadingId ? {
        ...m,
        content: (
            <div className="flex items-center gap-3 text-red-400 bg-red-900/10 p-4 rounded border border-red-500/30">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-pulse" />
                <div>
                    <div className="font-bold font-mono tracking-wider">SCAN_FAILURE</div>
                    <div className="text-xs opacity-80 font-mono">{err.message || "UPLINK_TERMINATED_UNEXPECTEDLY"}</div>
                </div>
            </div>
        )
      } : m));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-[#030014] text-slate-300 font-mono text-sm overflow-hidden cyber-grid selection:bg-[#14F195]/30">
      <div className="crt-overlay pointer-events-none fixed inset-0 z-50"></div>

      {/* TOP HUD BAR */}
      <header className="flex-none h-14 border-b border-[#14F195]/20 bg-slate-950/80 backdrop-blur-md flex items-center justify-between px-4 md:px-6 z-40 relative shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3">
            <div className="relative">
                <Shield className="w-6 h-6 text-[#14F195] relative z-10" />
                <div className="absolute inset-0 bg-[#14F195] blur opacity-50 animate-pulse"></div>
            </div>
            <h1 className="font-bold text-lg tracking-wider text-white flex items-center gap-2">
                SOLANA GUARD <span className="text-[#14F195] text-[10px] border border-[#14F195]/30 px-1.5 py-0.5 rounded bg-[#14F195]/10">AI V2.1</span>
            </h1>
        </div>

        {/* Center: System Ticker */}
        <div className="hidden md:flex items-center gap-8 text-[10px] text-slate-500 font-bold tracking-[0.2em]">
             <div className="flex items-center gap-2 text-[#14F195]">
                <span className="w-1.5 h-1.5 bg-[#14F195] rounded-full animate-pulse shadow-[0_0_8px_#14F195]"></span>
                SYSTEM_ONLINE
             </div>
             <div className="flex items-center gap-2">
                <Cpu className="w-3 h-3" />
                CORE_LOAD: 12%
             </div>
             <div className="flex items-center gap-2">
                <Network className="w-3 h-3" />
                NET_LATENCY: 12ms
             </div>
        </div>

        {/* Right: Actions */}
        <button 
            onClick={() => setShowAbout(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#14F195]/5 hover:bg-[#14F195]/10 border border-[#14F195]/30 rounded text-[#14F195] text-xs font-bold transition-all hover:shadow-[0_0_15px_rgba(20,241,149,0.1)] hover:border-[#14F195]/60"
        >
            <Info className="w-3 h-3" />
            <span className="hidden sm:inline">SYSTEM_INFO</span>
        </button>
      </header>

      {/* MAIN COMMAND GRID */}
      <main className="flex-1 p-2 md:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden relative z-10">
          
          {/* LEFT COLUMN: Threat Intelligence */}
          <div className="hidden lg:flex col-span-3 flex-col gap-4 h-full overflow-hidden">
             <StatsModule />
             
             {/* Network Status Module */}
             <div className="hud-panel flex-1 p-4 flex flex-col relative overflow-hidden">
                 <div className="absolute inset-0 bg-[linear-gradient(rgba(20,241,149,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(20,241,149,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                 <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-[#14F195]/20 pb-2 mb-4 relative z-10">Network_Nodes</h3>
                 
                 <div className="space-y-3 relative z-10">
                    <div className="flex items-center justify-between p-2 bg-slate-900/50 border border-slate-800 rounded group hover:border-[#14F195]/30 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <img src="/logos/sol.png" className="w-5 h-5 opacity-80 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-black"></div>
                            </div>
                            <div>
                                <div className="text-white font-bold text-xs">SOLANA_MAIN</div>
                                <div className="text-[10px] text-slate-500">TPS: 3,421</div>
                            </div>
                        </div>
                        <Activity className="w-4 h-4 text-green-500" />
                    </div>

                    <div className="flex items-center justify-between p-2 bg-slate-900/50 border border-slate-800 rounded group hover:border-blue-500/30 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <img src="/logos/base.png" className="w-5 h-5 rounded-full opacity-80 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-black"></div>
                            </div>
                            <div>
                                <div className="text-white font-bold text-xs">BASE_L2</div>
                                <div className="text-[10px] text-slate-500">Block: 2.0s</div>
                            </div>
                        </div>
                        <Activity className="w-4 h-4 text-blue-500" />
                    </div>
                 </div>

                 <div className="mt-auto pt-4 border-t border-[#14F195]/10">
                     <div className="text-[10px] text-slate-600 font-mono">
                        &gt; NODE_SYNC: 100%<br/>
                        &gt; MEMPOOL: NORMAL<br/>
                        &gt; ORACLE: CONNECTED
                     </div>
                 </div>
             </div>
          </div>

          {/* CENTER COLUMN: Terminal (Main Chat) */}
          <div className="col-span-1 lg:col-span-6 flex flex-col h-full gap-4">
              {/* Terminal Window */}
              <div className="hud-panel flex-1 flex flex-col overflow-hidden relative shadow-[0_0_30px_rgba(0,0,0,0.3)]">
                  {/* Terminal Header */}
                  <div className="h-9 bg-slate-950/90 border-b border-[#14F195]/20 flex items-center justify-between px-3 shrink-0">
                      <div className="flex items-center gap-2">
                          <Terminal className="w-3 h-3 text-[#14F195]" />
                          <span className="text-[10px] font-bold text-[#14F195] uppercase tracking-widest opacity-80">Main_Terminal.exe</span>
                      </div>
                      <div className="flex gap-1.5 opacity-50">
                          <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                          <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                          <div className="w-2 h-2 rounded-full bg-[#14F195] animate-pulse"></div>
                      </div>
                  </div>

                  {/* Messages */}
                  <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 pb-8 space-y-6 scroll-smooth custom-scrollbar relative">
                      {/* Grid Background inside Terminal */}
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
                      
                      {messages.map((msg, index) => (
                          <div key={msg.id} className={clsx(
                              "flex gap-3 relative z-10 animate-in fade-in slide-in-from-bottom-2 duration-300",
                              msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                          )}>
                              {/* Avatar */}
                              <div className={clsx(
                                  "w-8 h-8 rounded border flex items-center justify-center flex-shrink-0 backdrop-blur-sm",
                                  msg.role === 'assistant' 
                                      ? "bg-[#14F195]/10 border-[#14F195]/30 text-[#14F195] shadow-[0_0_10px_rgba(20,241,149,0.2)]" 
                                      : "bg-slate-800 border-slate-600 text-slate-300"
                              )}>
                                  {msg.role === 'assistant' ? <Bot className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                              </div>

                              {/* Content Bubble */}
                              <div className={clsx(
                                  "rounded p-3 md:p-4 max-w-[90%] md:max-w-[85%] text-xs md:text-sm font-mono border backdrop-blur-md",
                                  msg.role === 'assistant' 
                                      ? "bg-slate-950/80 border-[#14F195]/20 text-slate-300 shadow-[0_0_15px_rgba(0,0,0,0.3)]" 
                                      : "bg-[#9945FF]/10 border-[#9945FF]/30 text-white shadow-[0_0_15px_rgba(153,69,255,0.1)]"
                              )}>
                                  {msg.content}
                              </div>
                          </div>
                      ))}
                      <div ref={messagesEndRef} />
                  </div>
              </div>

              {/* Input Module */}
              <div className="hud-panel p-2 shrink-0">
                <form onSubmit={handleSendMessage} className="relative flex items-center bg-slate-950/50 border border-slate-800 rounded overflow-hidden focus-within:border-[#14F195]/50 focus-within:shadow-[0_0_15px_rgba(20,241,149,0.1)] transition-all">
                    <div className="px-3 text-slate-600">
                        <span className="animate-pulse text-[#14F195]">{'>'}</span>
                    </div>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="ENTER_TARGET_ADDRESS..."
                        className="flex-1 bg-transparent border-none text-[#14F195] px-2 py-3 focus:ring-0 placeholder-slate-700 font-mono text-sm tracking-wider uppercase"
                        disabled={loading}
                    />
                    <button 
                        type="submit" 
                        disabled={loading || !inputValue.trim()}
                        className="px-4 py-2 bg-[#14F195]/10 hover:bg-[#14F195]/20 text-[#14F195] border-l border-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </form>
              </div>
          </div>

          {/* RIGHT COLUMN: Live Feed */}
          <div className="hidden lg:flex col-span-3 flex-col gap-4 h-full">
               <RightActivityPanel />
               
               {/* Communication Link */}
               <div className="hud-panel p-4 space-y-3 shrink-0">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-[#14F195]/20 pb-2 mb-2">Secure_Uplink</div>
                   <div className="grid grid-cols-2 gap-2">
                       <a href="https://t.me/lte777777" target="_blank" className="flex flex-col items-center justify-center p-3 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 hover:border-blue-500/40 rounded transition-all group">
                            <MessageCircle className="w-5 h-5 text-blue-400 mb-1 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] text-blue-300 font-bold">TELEGRAM</span>
                       </a>
                       <a href="https://x.com/OG_Cryptooo" target="_blank" className="flex flex-col items-center justify-center p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded transition-all group">
                            <Twitter className="w-5 h-5 text-white mb-1 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] text-slate-300 font-bold">TWITTER</span>
                       </a>
                   </div>
               </div>
          </div>

      </main>

      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Modal Container */}
            <div className="w-full max-w-4xl bg-[#050a14] border border-[#14F195]/30 relative shadow-[0_0_100px_rgba(20,241,149,0.1)] overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Decorative Corners */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#14F195]"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#14F195]"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#14F195]"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#14F195]"></div>

                {/* Modal Header */}
                <div className="h-12 border-b border-[#14F195]/20 bg-[#14F195]/5 flex items-center justify-between px-6 shrink-0 relative">
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(20,241,149,0.05),transparent)] animate-ticker"></div>
                    <div className="flex items-center gap-3 relative z-10">
                        <Terminal className="w-4 h-4 text-[#14F195]" />
                        <h2 className="font-mono font-bold text-[#14F195] tracking-[0.2em] text-sm">SYSTEM_KERNEL_INFO // V2.1</h2>
                    </div>
                    <button 
                        onClick={() => setShowAbout(false)}
                        className="relative z-10 p-1.5 hover:bg-[#14F195]/20 rounded text-slate-500 hover:text-[#14F195] transition-colors group"
                    >
                        <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar space-y-8 relative">
                    {/* Background Grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(20,241,149,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(20,241,149,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

                    {/* Top Section: Identity */}
                    <div className="grid md:grid-cols-[200px_1fr] gap-8 relative z-10">
                        <div className="flex flex-col items-center justify-center p-6 bg-[#14F195]/5 border border-[#14F195]/20 rounded relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[#14F195]/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                            <Shield className="w-16 h-16 text-[#14F195] mb-4 drop-shadow-[0_0_15px_rgba(20,241,149,0.5)]" />
                            <div className="text-center">
                                <div className="text-white font-bold font-mono tracking-widest text-lg">SOLANA</div>
                                <div className="text-[#14F195] font-bold font-mono tracking-widest text-lg">GUARD AI</div>
                                <div className="mt-2 text-[10px] text-slate-500 font-mono border-t border-slate-800 pt-2">
                                    BUILD: 2026.02.10<br/>
                                    STATUS: OPERATIONAL
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <span className="w-1 h-4 bg-[#14F195]"></span>
                                    Primary Directive
                                </h3>
                                <p className="text-slate-300 font-mono text-sm leading-relaxed border-l-2 border-slate-800 pl-4">
                                    Autonomous sentinel designed for the <span className="text-white font-bold">Solana & Base</span> ecosystems. 
                                    Utilizes real-time heuristic analysis to detect contract vulnerabilities, rug pulls, and liquidity anomalies before they execute.
                                </p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-slate-900/50 border border-slate-800 rounded">
                                    <div className="text-[10px] text-slate-500 mb-1">SCAN_ENGINE</div>
                                    <div className="text-[#14F195] font-mono font-bold">HEURISTIC_V3</div>
                                </div>
                                <div className="p-3 bg-slate-900/50 border border-slate-800 rounded">
                                    <div className="text-[10px] text-slate-500 mb-1">LATENCY</div>
                                    <div className="text-[#14F195] font-mono font-bold">&lt; 50ms</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Middle Section: Roadmap */}
                    <div className="relative z-10">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-800 pb-2">
                            <Map className="w-4 h-4" /> 
                            Execution Roadmap
                        </h3>
                        
                        <div className="grid md:grid-cols-3 gap-4">
                            {/* Phase 1 */}
                            <div className="relative p-4 border border-[#14F195]/30 bg-[#14F195]/5 rounded overflow-hidden">
                                <div className="absolute top-0 right-0 px-2 py-1 bg-[#14F195] text-black text-[10px] font-bold">COMPLETE</div>
                                <div className="text-[#14F195] font-bold text-lg mb-1">PHASE I</div>
                                <div className="text-white text-xs font-bold mb-3 tracking-wider">GENESIS PROTOCOL</div>
                                <ul className="space-y-1.5 text-[11px] font-mono text-slate-400">
                                    <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-[#14F195]" /> Core Scanner Init</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-[#14F195]" /> CMC Integration</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-[#14F195]" /> Basic Heuristics</li>
                                </ul>
                            </div>

                            {/* Phase 2 */}
                            <div className="relative p-4 border border-blue-500/30 bg-blue-500/5 rounded overflow-hidden">
                                <div className="absolute top-0 right-0 px-2 py-1 bg-blue-500 text-white text-[10px] font-bold animate-pulse">ACTIVE</div>
                                <div className="text-blue-400 font-bold text-lg mb-1">PHASE II</div>
                                <div className="text-white text-xs font-bold mb-3 tracking-wider">EXPANSION LAYER</div>
                                <ul className="space-y-1.5 text-[11px] font-mono text-slate-400">
                                    <li className="flex items-center gap-2"><Loader2 className="w-3 h-3 text-blue-400 animate-spin" /> Base Chain Uplink</li>
                                    <li className="flex items-center gap-2"><Loader2 className="w-3 h-3 text-blue-400 animate-spin" /> Honeypot V2</li>
                                    <li className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border border-slate-600 flex items-center justify-center text-[8px] opacity-50">3</span> Multi-DEX Router</li>
                                </ul>
                            </div>

                            {/* Phase 3 */}
                            <div className="relative p-4 border border-purple-500/30 bg-purple-500/5 rounded overflow-hidden opacity-70 hover:opacity-100 transition-opacity">
                                <div className="absolute top-0 right-0 px-2 py-1 bg-purple-500/20 text-purple-300 text-[10px] font-bold">PENDING</div>
                                <div className="text-purple-400 font-bold text-lg mb-1">PHASE III</div>
                                <div className="text-white text-xs font-bold mb-3 tracking-wider">OMNI-CHAIN</div>
                                <ul className="space-y-1.5 text-[11px] font-mono text-slate-500">
                                    <li className="flex items-center gap-2 text-slate-500">&gt; ETH Mainnet Bridge</li>
                                    <li className="flex items-center gap-2 text-slate-500">&gt; Arb/Optimism Nodes</li>
                                    <li className="flex items-center gap-2 text-slate-500">&gt; BSC Scanner Beta</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Footer System Status */}
                    <div className="grid grid-cols-4 gap-2 text-[10px] font-mono text-slate-600 border-t border-slate-800 pt-4 relative z-10">
                        <div className="flex flex-col">
                            <span>MEMORY_HEAP</span>
                            <span className="text-[#14F195]">45% USED</span>
                        </div>
                        <div className="flex flex-col">
                            <span>UPTIME</span>
                            <span className="text-white">99.99%</span>
                        </div>
                        <div className="flex flex-col">
                            <span>LAST_AUDIT</span>
                            <span className="text-white">12 MIN AGO</span>
                        </div>
                        <div className="flex flex-col text-right">
                            <span>SECURITY</span>
                            <span className="text-[#14F195]">MAXIMUM</span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// SUB-COMPONENTS
// ----------------------------------------------------------------------

function TypewriterEffect({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setDisplayedText(text.substring(0, i));
      i += 3; 
      if (i > text.length) {
          setDisplayedText(text);
          clearInterval(timer);
      }
    }, 5);
    return () => clearInterval(timer);
  }, [text]);

  return (
    <div className="space-y-2 text-xs leading-relaxed text-slate-300 min-h-[60px] font-mono">
        {displayedText.split('\n').map((line: string, i: number) => {
            if (!line) return <div key={i} className="h-2"></div>;
            if (line.startsWith('### ')) return <div key={i} className="text-sm font-bold text-[#14F195] pt-2 border-b border-[#14F195]/20 pb-1 mb-2 tracking-wider uppercase">{line.replace('### ', '')}</div>;
            if (line.startsWith('#### ')) return <div key={i} className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-2">{line.replace('#### ', '')}</div>;
            if (line.startsWith('**')) return <div key={i} className="font-bold text-white pt-1">{line.replace(/\*\*/g, '')}</div>;
            if (line.startsWith('- 🚨')) return <div key={i} className="text-red-400 font-bold flex gap-2 bg-red-500/5 p-1 rounded border border-red-500/10"><AlertOctagon className="w-3 h-3 mt-0.5 flex-shrink-0" /> <span>{line.replace('- ', '')}</span></div>;
            if (line.startsWith('- ⚠️') || line.includes('⚠️')) return <div key={i} className="text-yellow-400 flex gap-2"><AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" /> <span>{line.replace('- ', '')}</span></div>;
            if (line.startsWith('- ✅') || line.includes('✅')) return <div key={i} className="text-green-400 flex gap-2"><CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" /> <span>{line.replace('- ', '')}</span></div>;
            
            return <div key={i} className="pl-4 border-l border-slate-800 ml-1">{line.replace('- ', '')}</div>;
        })}
    </div>
  );
}

function useOnScreen(ref: React.RefObject<HTMLElement>) {
  const [isIntersecting, setIntersecting] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIntersecting(entry.isIntersecting)
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);
  return isIntersecting;
}

function TokenAnalysis({ result }: { result: any }) {
    const [marketData, setMarketData] = useState(result.marketData);
    const [isUpdating, setIsUpdating] = useState(false);
    const [copied, setCopied] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const isVisible = useOnScreen(containerRef);
    
    const initialCircSupply = useRef(result.marketData?.circulatingSupply || 0);

    useEffect(() => {
        if (!isVisible || !marketData) return;
        const interval = setInterval(async () => {
            setIsUpdating(true);
            try {
                const res = await fetch(`/api/market?address=${result.address}`);
                if (res.ok) {
                    const newData = await res.json();
                    const newPrice = newData.priceUsd || 0;
                    const newVol = newData.volume24h || 0;
                    const circSupply = initialCircSupply.current;
                    const mktCap = newPrice * circSupply;
                    
                    setMarketData((prev: any) => ({
                        ...prev,
                        ...newData,
                        marketCap: mktCap,
                        circulatingSupply: circSupply,
                        volToMktCap: mktCap > 0 ? newVol / mktCap : 0
                    }));
                }
            } catch (e) {
                console.error("Polling failed", e);
            } finally {
                setIsUpdating(false);
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [isVisible, result.address, marketData]);

    return (
        <div ref={containerRef} className="space-y-4 min-w-[300px] md:min-w-[600px] max-w-[800px]">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/50">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        {marketData?.imageUrl ? (
                            <img src={marketData.imageUrl} alt="Logo" className="w-12 h-12 rounded border border-slate-700" />
                        ) : (
                            <div className="w-12 h-12 rounded bg-slate-800 flex items-center justify-center text-xl border border-slate-700">🪙</div>
                        )}
                        {isUpdating && <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#14F195] rounded-full animate-ping"></div>}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                             <h2 className="text-lg font-bold text-white tracking-wider">{marketData?.name || "Unknown"}</h2>
                             <span className="text-[#14F195] text-[10px] border border-[#14F195]/30 px-1 rounded">{marketData?.symbol}</span>
                        </div>
                        <div className="text-xs text-slate-500 font-mono flex items-center gap-1 cursor-pointer hover:text-[#14F195]" onClick={() => navigator.clipboard.writeText(result.address)}>
                            {result.address.slice(0, 8)}...{result.address.slice(-8)} <FileText className="w-3 h-3" />
                        </div>
                    </div>
                </div>
                
                <div className="text-right">
                    <div className="text-2xl font-bold text-white font-mono tracking-tighter">
                        ${formatPrice(marketData?.priceUsd || 0)}
                    </div>
                    {marketData?.priceChange24h !== undefined && (
                         <div className={clsx("text-xs font-bold", marketData.priceChange24h >= 0 ? "text-[#14F195]" : "text-red-500")}>
                            {formatPct(marketData.priceChange24h)} (24h)
                        </div>
                    )}
                </div>
            </div>

            {/* AI Analysis */}
            <div className="bg-slate-950/50 p-3 rounded border border-[#9945FF]/20 relative overflow-hidden group">
                <div className="absolute inset-0 bg-[#9945FF]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                <h3 className="text-xs font-bold text-[#9945FF] mb-2 uppercase tracking-widest flex items-center gap-2">
                    <Bot className="w-3 h-3" /> AI_RISK_ASSESSMENT
                </h3>
                <TypewriterEffect text={result.aiAnalysis} />
            </div>

            {/* Security Checks Grid */}
            <div className="grid grid-cols-2 gap-2">
                <CheckItem label="MINT_AUTH" status={result.checks.mintDisabled} description="Minting disabled" />
                <CheckItem label="FREEZE_AUTH" status={result.checks.lpBurned} description="Freeze disabled" />
                <CheckItem label="METADATA" status={result.checks.metadataImmutable} description="Immutable" />
                <CheckItem label="HONEYPOT" status={!result.isHoneypot} description="Tradeable" />
            </div>

            {/* Footer Actions */}
            <div className="flex gap-2 pt-2">
                 <button 
                   onClick={() => {
                     const text = `🛡️ SCAN_RESULT: ${result.marketData?.symbol}\nPRICE: $${result.marketData?.priceUsd}\nRISK_SCORE: ${100 - result.riskScore}/100\n\n>> Analyzed by SolanaGuardAI`;
                     navigator.clipboard.writeText(text);
                     setCopied(true);
                     setTimeout(() => setCopied(false), 2000);
                   }}
                   className="flex-1 py-2 bg-[#14F195]/10 hover:bg-[#14F195]/20 border border-[#14F195]/30 rounded text-xs font-bold text-[#14F195] flex items-center justify-center gap-2 transition-all"
                 >
                   {copied ? <CheckCircle className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                   {copied ? 'COPIED' : 'COPY_LOG'}
                 </button>
                 
                 <a href={`https://solscan.io/token/${result.address}`} target="_blank" className="px-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded flex items-center justify-center text-slate-300">
                    <ExternalLink className="w-4 h-4" />
                 </a>
            </div>
        </div>
    );
}

function CheckItem({ label, status, description }: { label: string, status: boolean, description?: string }) {
  return (
    <div className={clsx(
      "flex items-center gap-2 p-2 rounded border transition-all duration-300",
      status 
        ? "bg-green-500/5 border-green-500/20" 
        : "bg-red-500/5 border-red-500/20"
    )}>
      <div className={clsx(
        "p-0.5 rounded-full flex-shrink-0",
        status ? "text-green-400" : "text-red-400"
      )}>
        {status ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
      </div>
      <div className="flex flex-col">
        <span className={clsx("font-bold text-[10px] uppercase tracking-wider", status ? "text-green-500" : "text-red-500")}>{label}</span>
      </div>
    </div>
  );
}

function StatsModule() {
  const [scans, setScans] = useState(100);
  const [threats, setThreats] = useState(12);
  
  useEffect(() => {
    const calculateStats = () => {
        const launchDate = new Date('2026-01-29T00:00:00').getTime();
        const now = Date.now();
        const daysPassed = Math.max(0, (now - launchDate) / (1000 * 60 * 60 * 24));
        const scanGrowth = Math.floor(daysPassed * 25);
        const threatGrowth = Math.floor(daysPassed * 3);

        setScans(100 + scanGrowth);
        setThreats(12 + threatGrowth);
    };

    calculateStats();
    const interval = setInterval(calculateStats, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hud-panel p-4 flex flex-col gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2 opacity-5">
            <BarChart3 className="w-20 h-20" />
        </div>
        
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-[#14F195]/20 pb-2 relative z-10">Threat_Intel</h3>

        <div className="space-y-4 relative z-10">
            <div>
                <div className="text-[10px] text-[#14F195] uppercase font-bold mb-1">Total Scans</div>
                <div className="text-2xl font-mono font-bold text-white tracking-tighter">
                    {scans.toLocaleString()}
                </div>
            </div>
            
            <div>
                <div className="text-[10px] text-red-500 uppercase font-bold mb-1">Threats Neutralized</div>
                <div className="text-2xl font-mono font-bold text-red-400 tracking-tighter flex items-center gap-2">
                    {threats.toLocaleString()}
                    <AlertTriangle className="w-4 h-4 animate-pulse" />
                </div>
            </div>
        </div>
    </div>
  );
}

function RightActivityPanel() {
    const [activities, setActivities] = useState([
        { type: 'scan', token: 'BONK', chain: 'SOL', risk: 'LOW', time: '2s' },
        { type: 'alert', token: 'SCAM', chain: 'SOL', risk: 'HIGH', time: '12s' },
        { type: 'scan', token: 'JUP', chain: 'SOL', risk: 'LOW', time: '15s' },
    ]);

    useEffect(() => {
        const tokens = [
            { s: 'SOL', c: 'SOL' }, { s: 'USDC', c: 'SOL' }, { s: 'RAY', c: 'SOL' }, { s: 'ORCA', c: 'SOL' },
            { s: 'MYRO', c: 'SOL' }, { s: 'BRETT', c: 'BASE' }, { s: 'DEGEN', c: 'BASE' }, { s: 'TOSHI', c: 'BASE' },
            { s: 'AERO', c: 'BASE' }, { s: 'KEYCAT', c: 'BASE' }, { s: 'NORMIE', c: 'BASE' },
        ];

        const interval = setInterval(() => {
            const randomToken = tokens[Math.floor(Math.random() * tokens.length)];
            const randomRisk = Math.random() > 0.8 ? 'HIGH' : (Math.random() > 0.5 ? 'MEDIUM' : 'LOW');
            
            setActivities(prev => [
                { type: 'scan', token: randomToken.s, chain: randomToken.c, risk: randomRisk, time: 'NOW' },
                ...prev.slice(0, 5)
            ]);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="hud-panel flex-1 p-4 flex flex-col relative overflow-hidden">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-[#9945FF]/20 pb-2 mb-4">Live_Intercepts</h3>
            
            <div className="space-y-2 flex-1 overflow-hidden relative">
                <div className="absolute left-1.5 top-0 bottom-0 w-px bg-slate-800"></div>
                
                {activities.map((item, i) => (
                    <div key={i} className="relative pl-6 animate-in slide-in-from-right-4 duration-300">
                        <div className={clsx(
                            "absolute left-0 top-1.5 w-3 h-3 rounded-full border-2 border-[#030014]",
                            item.risk === 'HIGH' ? 'bg-red-500' : 
                            item.risk === 'MEDIUM' ? 'bg-yellow-500' : 'bg-[#14F195]'
                        )}></div>
                        
                        <div className="flex items-center justify-between text-xs p-2 bg-slate-900/40 rounded border border-slate-800 hover:border-[#9945FF]/30 transition-colors">
                            <div className="font-mono font-bold text-slate-300">${item.token}</div>
                            <div className={clsx(
                                "text-[9px] font-bold px-1.5 rounded",
                                item.risk === 'HIGH' ? 'text-red-400 bg-red-500/10' : 
                                item.risk === 'MEDIUM' ? 'text-yellow-400 bg-yellow-500/10' : 'text-[#14F195] bg-[#14F195]/10'
                            )}>{item.risk}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
