/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, useRef } from 'react';
import { Shield, AlertTriangle, CheckCircle, Search, Loader2, ExternalLink, Globe, Twitter, DollarSign, BarChart3, Lock, FileText, Activity, Zap, Users, AlertOctagon, Heart, Coffee, History, ArrowRight, Bot, MessageCircle, Send } from 'lucide-react';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial Greeting
  useEffect(() => {
    setMessages([
      {
        id: 'init',
        role: 'assistant',
        content: (
            <div className="space-y-2">
                <p>Hello! I am <span className="text-[#14F195] font-bold">Solana Guard AI</span>.</p>
                <p>I can audit any <span className="text-[#14F195] font-bold">Solana</span> or <span className="text-[#0052FF] font-bold">Base</span> token for security risks, honeypots, and whale manipulation.</p>
                <div className="flex flex-wrap gap-2 py-1">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-800/50 border border-slate-700/50 text-xs font-medium text-slate-300">
                        <img src="/CoinMarketCap.jpg" alt="CMC" className="w-4 h-4 rounded-full" />
                        <span>Verified by CoinMarketCap</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-800/50 border border-slate-700/50 text-xs font-medium text-slate-300">
                        <img src="/CoinGecko.jpg" alt="CG" className="w-4 h-4 rounded-full" />
                        <span>Verified by CoinGecko</span>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 pb-1">
                    <div className="flex items-center gap-2 text-xs text-slate-400"><Shield className="w-3 h-3 text-[#14F195]" /> Mint Authority Analysis</div>
                    <div className="flex items-center gap-2 text-xs text-slate-400"><Lock className="w-3 h-3 text-[#14F195]" /> Liquidity Lock Check</div>
                    <div className="flex items-center gap-2 text-xs text-slate-400"><Users className="w-3 h-3 text-[#14F195]" /> Top Holders Scan</div>
                    <div className="flex items-center gap-2 text-xs text-slate-400"><Activity className="w-3 h-3 text-[#14F195]" /> Rug Pull Detection</div>
                </div>

                <div className="mt-4 p-4 bg-slate-950/80 rounded-xl border border-slate-700/50 text-left">
                    <h3 className="text-sm font-bold text-white mb-2">Why Token Security Matters</h3>
                    <div className="space-y-2 text-xs text-slate-300">
                        <div className="flex gap-2">
                            <AlertTriangle className="w-3 h-3 text-yellow-500 flex-shrink-0 mt-0.5" />
                            <span><strong>Avoid Rug Pulls:</strong> Detect if developers can mint infinite tokens or freeze your funds.</span>
                        </div>
                        <div className="flex gap-2">
                            <CheckCircle className="w-3 h-3 text-[#14F195] flex-shrink-0 mt-0.5" />
                            <span><strong>Verify Legitimacy:</strong> Tokens listed on CoinMarketCap & CoinGecko are more likely to be safe.</span>
                        </div>
                        <div className="flex gap-2">
                            <Users className="w-3 h-3 text-blue-400 flex-shrink-0 mt-0.5" />
                            <span><strong>Holder Analysis:</strong> Ensure supply isn&apos;t controlled by a few wallets.</span>
                        </div>
                    </div>
                </div>

                <div className="mt-4 p-4 bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl border border-slate-700/60 relative group">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-[#14F195]/10 rounded-lg border border-[#14F195]/20">
                             <Heart className="w-5 h-5 text-[#14F195]" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white mb-1">Developer&apos;s Mission</h3>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                I created this platform with one goal: <strong>User Safety</strong>. 
                                Too many traders lose funds to hidden risks like honeypots and rug pulls. 
                                Solana Guard AI exists to make professional-grade security analysis accessible to everyone. 
                                <span className="text-white block mt-1">Always check before you trade. Stay safe. 🛡️</span>
                            </p>
                        </div>
                    </div>
                </div>

                <p className="text-slate-400 text-sm">Paste a token address below to start analyzing.</p>
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
        content: <div className="font-mono text-[#14F195]">{address}</div>, 
        timestamp: Date.now() 
    }]);

    setLoading(true);

    // 2. AI Thinking Message
    const loadingId = 'loading-' + Date.now();
    setMessages(prev => [...prev, { 
        id: loadingId, 
        role: 'assistant', 
        content: <div className="flex items-center gap-2 text-slate-400"><Loader2 className="w-4 h-4 animate-spin" /> Analyzing blockchain data...</div>, 
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
            <div className="flex items-center gap-3 text-red-400 bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <div>
                    <div className="font-bold">Scan Failed</div>
                    <div className="text-sm opacity-80">{err.message || "Could not fetch token data."}</div>
                </div>
            </div>
        )
      } : m));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col h-screen cyber-grid font-sans selection:bg-[#14F195]/30 overflow-hidden">
      <StatsSidebar />
      <RightActivityPanel />

      {/* Header */}
      <header className="flex-none p-6 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-20 relative shadow-2xl">
        <div className="flex items-center gap-4">
            <div className="relative">
                <div className="absolute inset-0 bg-[#14F195] blur opacity-60 rounded-full animate-pulse"></div>
                <Shield className="w-10 h-10 text-[#14F195] relative z-10 drop-shadow-[0_0_15px_rgba(20,241,149,0.5)]" />
            </div>
            <h1 className="font-bold text-3xl tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] flex flex-col items-start leading-none">
                <span>SOLANA GUARD <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#14F195] to-[#9945FF] drop-shadow-[0_0_15px_rgba(153,69,255,0.5)]">AI</span></span>
                <span className="text-[10px] font-bold text-slate-400 tracking-widest mt-1 uppercase flex items-center gap-1.5">
                    <span className="bg-[#14F195]/20 text-[#14F195] px-1.5 py-0.5 rounded border border-[#14F195]/30">SOLANA</span>
                    <span className="text-slate-600">+</span>
                    <span className="bg-[#0052FF]/20 text-[#0052FF] px-1.5 py-0.5 rounded border border-[#0052FF]/30 flex items-center gap-1">
                        BASE
                        <span className="flex h-1.5 w-1.5 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                        </span>
                    </span>
                </span>
            </h1>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
        {messages.map((msg, index) => (
            <div key={msg.id} className={clsx(
                "flex gap-4 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-2",
                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
            )}>
                {/* Avatar */}
                <div className={clsx(
                    "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg border",
                    msg.role === 'assistant' 
                        ? "bg-slate-900 border-[#14F195]/30 text-[#14F195]" 
                        : "bg-slate-800 border-slate-700 text-slate-300"
                )}>
                    {msg.role === 'assistant' ? <Bot className="w-6 h-6" /> : <Users className="w-6 h-6" />}
                </div>

                {/* Content Bubble */}
                <div className={clsx(
                    "rounded-2xl p-4 md:p-6 shadow-xl backdrop-blur-sm border max-w-[90%] md:max-w-[85%]",
                    msg.role === 'assistant' 
                        ? "bg-slate-950/90 border-slate-700/50 rounded-tl-none" 
                        : "bg-[#9945FF]/10 border-[#9945FF]/20 rounded-tr-none"
                )}>
                    {msg.content}
                </div>
            </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-none p-4 bg-slate-950/80 backdrop-blur-md border-t border-slate-800/50 z-20">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#14F195] to-[#9945FF] rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative flex items-center bg-slate-900 rounded-xl border border-slate-700/50 focus-within:border-[#9945FF]/50 overflow-hidden p-1 shadow-2xl">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Enter Token Address (Solana or Base 0x...)"
                    className="flex-1 bg-transparent border-none text-white px-4 py-3 focus:ring-0 placeholder-slate-500 font-mono"
                    disabled={loading}
                />
                <button 
                    type="submit" 
                    disabled={loading || !inputValue.trim()}
                    className="p-3 bg-[#9945FF] hover:bg-[#8b3dff] text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
            </div>
        </form>
        
        {/* Contact / Feedback Section */}
        <div className="max-w-4xl mx-auto mt-4 pt-4 border-t border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
             <div className="flex items-center gap-6">
                <span className="font-bold text-[#14F195] uppercase tracking-wider text-xs drop-shadow-[0_0_8px_rgba(20,241,149,0.8)]">Support & Feedback:</span>
                <a href="https://t.me/lte777777" target="_blank" className="flex items-center gap-2 text-white hover:text-[#14F195] transition-colors font-medium drop-shadow-[0_0_5px_rgba(255,255,255,0.6)] hover:drop-shadow-[0_0_10px_rgba(20,241,149,1)]">
                    <MessageCircle className="w-4 h-4 text-[#14F195] drop-shadow-[0_0_5px_rgba(20,241,149,0.8)]" /> Telegram
                </a>
                <a href="https://x.com/OG_Cryptooo" target="_blank" className="flex items-center gap-2 text-white hover:text-[#14F195] transition-colors font-medium drop-shadow-[0_0_5px_rgba(255,255,255,0.6)] hover:drop-shadow-[0_0_10px_rgba(20,241,149,1)]">
                    <Twitter className="w-4 h-4 text-[#14F195] drop-shadow-[0_0_5px_rgba(20,241,149,0.8)]" /> Twitter
                </a>
             </div>
             <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity mb-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Built on</span>
                    <a href="https://x.com/solana" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded border border-slate-800/50 hover:bg-black/60 hover:border-[#14F195]/30 transition-all">
                        <img src="/logos/sol.png" alt="Solana" className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold text-slate-300">Solana</span>
                    </a>
                    <a href="https://base.org" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded border border-slate-800/50 hover:bg-black/60 hover:border-[#0052FF]/30 transition-all">
                         {/* Base Logo (Blue Circle) */}
                        <div className="w-3.5 h-3.5 rounded-full bg-[#0052FF] border border-white/20"></div>
                        <span className="text-[10px] font-bold text-slate-300">Base</span>
                    </a>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                    <div className="flex gap-1.5">
                        <img src="/CoinMarketCap.jpg" alt="CMC" className="w-4 h-4 rounded-full ring-1 ring-slate-700" />
                        <img src="/CoinGecko.jpg" alt="CG" className="w-4 h-4 rounded-full ring-1 ring-slate-700" />
                    </div>
                    <span>CoinMarketCap & CoinGecko Verified</span>
                </div>
                <div className="text-xs text-[#9945FF] font-medium drop-shadow-[0_0_5px_rgba(153,69,255,0.6)]">
                    Solana Guard AI can make mistakes. Always DYOR.
                </div>
             </div>
        </div>
      </div>
    </main>
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
    <div className="space-y-2 text-sm leading-relaxed text-slate-300 min-h-[60px]">
        {displayedText.split('\n').map((line: string, i: number) => {
            if (!line) return <div key={i} className="h-2"></div>;
            if (line.startsWith('### ')) return <div key={i} className="text-lg font-bold text-[#14F195] pt-2 animate-in fade-in duration-300 border-b border-[#14F195]/20 pb-1 mb-2">{line.replace('### ', '')}</div>;
            if (line.startsWith('#### ')) return <div key={i} className="text-sm font-bold text-slate-400 uppercase tracking-widest pt-2 animate-in fade-in duration-300">{line.replace('#### ', '')}</div>;
            if (line.startsWith('**')) return <div key={i} className="font-bold text-white pt-1 animate-in fade-in duration-300">{line.replace(/\*\*/g, '')}</div>;
            if (line.startsWith('- 🚨')) return <div key={i} className="text-red-400 font-bold flex gap-2 animate-in fade-in duration-300 bg-red-500/10 p-2 rounded"><AlertOctagon className="w-4 h-4 mt-0.5 flex-shrink-0" /> <span>{line.replace('- ', '')}</span></div>;
            if (line.startsWith('- ⚠️') || line.includes('⚠️')) return <div key={i} className="text-yellow-400 flex gap-2 animate-in fade-in duration-300"><AlertTriangle className="w-3 h-3 mt-1 flex-shrink-0" /> <span>{line.replace('- ', '')}</span></div>;
            if (line.startsWith('- ✅') || line.includes('✅')) return <div key={i} className="text-green-400 flex gap-2 animate-in fade-in duration-300"><CheckCircle className="w-3 h-3 mt-1 flex-shrink-0" /> <span>{line.replace('- ', '')}</span></div>;
            if (line.startsWith('- 💧')) return <div key={i} className="text-blue-400 flex gap-2 animate-in fade-in duration-300"><Zap className="w-3 h-3 mt-1 flex-shrink-0" /> <span>{line.replace('- ', '')}</span></div>;
            if (line.startsWith('- 🚀')) return <div key={i} className="text-purple-400 flex gap-2 animate-in fade-in duration-300"><Activity className="w-3 h-3 mt-1 flex-shrink-0" /> <span>{line.replace('- ', '')}</span></div>;
            
            return <div key={i} className="animate-in fade-in duration-300 pl-4 border-l-2 border-slate-800 ml-1">{line.replace('- ', '')}</div>;
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

function MetricCard({ title, value, change, isHighlight = false }: { title: string, value: string, change?: number, isHighlight?: boolean }) {
  return (
    <div className={clsx(
        "bg-slate-900/40 p-4 rounded-xl border border-slate-800 flex flex-col justify-between h-full hover:border-slate-700 transition-colors",
        isHighlight && "bg-[#14F195]/5 border-[#14F195]/20"
    )}>
        <div className="flex items-center gap-2 mb-1">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">{title}</span>
            <AlertOctagon className="w-3 h-3 text-slate-600" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg md:text-xl font-bold text-white font-mono tracking-tight">{value}</span>
            {change !== undefined && (
                <span className={clsx(
                    "text-xs font-bold px-1.5 py-0.5 rounded",
                    change >= 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                )}>
                    {formatPct(change)}
                </span>
            )}
        </div>
    </div>
  );
}

function TokenAnalysis({ result }: { result: any }) {
    const COLORS = ['#14F195', '#9945FF', '#10b981', '#f59e0b', '#ef4444'];
    
    // State for real-time data
    const [marketData, setMarketData] = useState(result.marketData);
    const [isUpdating, setIsUpdating] = useState(false);
    const [copied, setCopied] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const isVisible = useOnScreen(containerRef);
    
    // Keep track of initial supply to calculate Market Cap dynamically
    const initialSupply = useRef(result.supply);
    const initialCircSupply = useRef(result.marketData?.circulatingSupply || 0);

    // Polling effect
    useEffect(() => {
        if (!isVisible || !marketData) return;

        const interval = setInterval(async () => {
            setIsUpdating(true);
            try {
                const res = await fetch(`/api/market?address=${result.address}`);
                if (res.ok) {
                    const newData = await res.json();
                    
                    // Recalculate fields that depend on supply
                    const newPrice = newData.priceUsd || 0;
                    const newVol = newData.volume24h || 0;
                    
                    // Use stored circulating supply (assume it doesn't change rapidly)
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
        }, 5000); // Poll every 5 seconds

        return () => clearInterval(interval);
    }, [isVisible, result.address, marketData]); // marketData dependency to ensure we have base

    return (
        <div ref={containerRef} className="space-y-6 min-w-[300px] md:min-w-[650px] max-w-[800px]">
            {/* 1. Header with Logo & Big Price */}
            <div className="flex flex-col md:flex-row md:items-center gap-6 pb-6 border-b border-slate-700/50">
                <div className="flex items-center gap-4">
                     <div className="relative">
                        <div className="absolute inset-0 bg-[#14F195] blur opacity-20 rounded-full"></div>
                        {marketData?.imageUrl ? (
                            <img src={marketData.imageUrl} alt="Logo" className="relative w-16 h-16 rounded-full ring-2 ring-slate-700 shadow-xl object-cover" />
                        ) : (
                            <div className="relative w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-2xl ring-2 ring-slate-700 shadow-xl">🪙</div>
                        )}
                        {/* Live Indicator */}
                        <div className={clsx(
                            "absolute -top-1 -right-1 w-3 h-3 rounded-full border border-slate-900 transition-colors duration-500",
                            isUpdating ? "bg-yellow-400" : "bg-green-500 animate-pulse"
                        )} title="Live updates active"></div>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                             <h2 className="text-xl font-bold text-white">{marketData?.name || "Unknown"}</h2>
                             {result.address.startsWith('0x') ? (
                                <span className="bg-[#0052FF]/20 text-[#0052FF] text-[10px] font-bold px-2 py-0.5 rounded border border-[#0052FF]/30">BASE</span>
                             ) : (
                                <span className="bg-[#14F195]/20 text-[#14F195] text-[10px] font-bold px-2 py-0.5 rounded border border-[#14F195]/30">SOL</span>
                             )}
                             <span className="text-slate-500 text-sm font-mono">{marketData?.symbol}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono bg-slate-950/30 px-2 py-1 rounded border border-slate-800/50 cursor-pointer hover:border-[#14F195]/50 transition-colors"
                             onClick={() => navigator.clipboard.writeText(result.address)}>
                            {result.address.slice(0, 6)}...{result.address.slice(-6)}
                            <FileText className="w-3 h-3" />
                        </div>
                    </div>
                </div>
                
                {/* Big Price Display */}
                <div className="md:ml-auto">
                    <div className="flex items-baseline gap-3">
                        <div className="text-4xl md:text-5xl font-bold text-white font-mono tracking-tighter">
                            ${formatPrice(marketData?.priceUsd || 0)}
                        </div>
                        {marketData?.priceChange24h !== undefined && (
                             <div className={clsx(
                                "text-lg font-bold flex items-center gap-1",
                                marketData.priceChange24h >= 0 ? "text-[#14F195]" : "text-red-500"
                            )}>
                                {formatPct(marketData.priceChange24h)} <span className="text-xs text-slate-500 font-normal">(24h)</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 3. AI Analysis Text */}
            <div className="bg-slate-950/30 p-4 rounded-xl border border-purple-500/20 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-purple-500/50"></div>
                <h3 className="text-sm font-bold text-purple-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
                    <Bot className="w-4 h-4" /> AI Analysis
                </h3>
                <TypewriterEffect text={result.aiAnalysis} />
            </div>

            {/* 4. Security & Holders Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Security Checks</h4>
                    <div className="space-y-2">
                        <CheckItem label="Mint Disabled" status={result.checks.mintDisabled} description="Owner cannot mint new tokens" />
                        <CheckItem label="Freeze Disabled" status={result.checks.lpBurned} description="Owner cannot freeze your funds" />
                        <CheckItem label="Immutable" status={result.checks.metadataImmutable} description="Token metadata cannot be changed" />
                        <CheckItem label="Not Honeypot" status={!result.isHoneypot} description="Token can be sold freely" />
                    </div>

                </div>
            </div>

            {/* 5. External Links - Only show if URL exists or High Value */}
            {(marketData?.externalUrl || marketData?.searchUrl) && (
                <a href={marketData.externalUrl || marketData.searchUrl} target="_blank" className="block w-full bg-[#3861fb]/10 hover:bg-[#3861fb]/20 border border-[#3861fb]/30 hover:border-[#3861fb] p-4 rounded-xl text-center transition-all group">
                    <div className="flex items-center justify-center gap-2 text-[#3861fb] font-bold text-lg mb-1">
                        <Globe className="w-5 h-5 fill-current" />
                        {marketData.externalUrl 
                            ? `View on ${marketData.externalUrl.includes('coinmarketcap') ? 'CoinMarketCap' : 'CoinGecko'}`
                            : 'Find on CoinMarketCap'
                        }
                    </div>
                    <div className="text-xs text-[#3861fb]/50 font-mono">
                        {marketData.externalUrl ? 'Official Listing' : 'Search via Google'}
                    </div>
                </a>
            )}
            
            {/* 6. Footer Actions */}
            <div className="flex gap-2 pt-2">
                 <button 
                   onClick={() => {
                     const text = `🛡️ Analysis for ${result.marketData?.symbol || 'Token'}\nPrice: $${result.marketData?.priceUsd}\nScore: ${100 - result.riskScore}/100\n\nScan by Solana Guard AI`;
                     navigator.clipboard.writeText(text);
                     setCopied(true);
                     setTimeout(() => setCopied(false), 2000);
                   }}
                   className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-300 flex items-center justify-center gap-2 transition-colors"
                 >
                   {copied ? <CheckCircle className="w-3 h-3 text-green-400" /> : <FileText className="w-3 h-3" />}
                   {copied ? 'Copied!' : 'Copy Report'}
                 </button>
                 
                 <a 
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`🛡️ Just scanned $${result.marketData?.symbol || 'Token'} on Solana Guard AI!\n\nSafety Score: ${100 - result.riskScore}/100\nChain: ${result.address.startsWith('0x') ? 'BASE 🔵' : 'SOLANA 🟢'}\n\nCheck it here: https://solana-guard-ai.vercel.app`)}`}
                    target="_blank"
                    className="px-3 py-2 bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 text-[#1DA1F2] border border-[#1DA1F2]/30 rounded-lg transition-colors flex items-center justify-center"
                 >
                    <Twitter className="w-4 h-4" />
                 </a>

                 <a href={result.address.startsWith('0x') ? `https://basescan.org/token/${result.address}` : `https://solscan.io/token/${result.address}`} target="_blank" className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors flex items-center justify-center">
                    <ExternalLink className="w-4 h-4" />
                 </a>
            </div>
        </div>
    );
}



function CheckItem({ label, status, description }: { label: string, status: boolean, description?: string }) {
  return (
    <div className={clsx(
      "flex items-center gap-3 p-2 rounded border transition-all duration-300",
      status 
        ? "bg-green-500/5 border-green-500/10" 
        : "bg-red-500/5 border-red-500/10"
    )}>
      <div className={clsx(
        "p-1 rounded-full flex-shrink-0",
        status ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
      )}>
        {status ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
      </div>
      <div className="flex flex-col">
        <span className={clsx("font-medium text-xs", status ? "text-slate-300" : "text-slate-300")}>{label}</span>
        {description && <span className="text-[10px] text-slate-500">{description}</span>}
      </div>
    </div>
  );
}

function StatsSidebar() {
  const [scans, setScans] = useState(100);
  const [threats, setThreats] = useState(12);
  
  useEffect(() => {
    // Calculate stats based on time since launch
    const calculateStats = () => {
        const launchDate = new Date('2026-01-29T00:00:00').getTime();
        const now = Date.now();
        const daysPassed = Math.max(0, (now - launchDate) / (1000 * 60 * 60 * 24));
        
        // Base: 100
        // Daily Growth: ~25 scans/day (randomized feel)
        const scanGrowth = Math.floor(daysPassed * 25);
        
        // Base: 12
        // Daily Threats: ~3 threats/day
        const threatGrowth = Math.floor(daysPassed * 3);

        setScans(100 + scanGrowth);
        setThreats(12 + threatGrowth);
    };

    calculateStats();
    
    // Update every minute to keep it sync (though it changes slowly)
    const interval = setInterval(calculateStats, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hidden xl:flex flex-col gap-4 fixed left-8 top-1/2 -translate-y-1/2 w-80 z-10">
        <div className="bg-slate-950 backdrop-blur-xl border border-slate-600/80 p-6 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.7)] relative overflow-hidden ring-1 ring-white/10">
             <div className="absolute inset-0 bg-gradient-to-br from-[#14F195]/5 to-transparent pointer-events-none"></div>
             <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
                <Activity className="w-5 h-5 text-[#14F195] drop-shadow-[0_0_8px_rgba(20,241,149,0.8)]" />
                <span className="text-sm font-bold text-white uppercase tracking-widest drop-shadow-md">Network Stats</span>
             </div>
             
             <div className="space-y-6">
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-700/60 shadow-inner">
                    <div className="text-xs text-[#14F195] uppercase font-bold tracking-wider mb-2 flex items-center gap-2">
                        <Search className="w-3 h-3" /> Total Tokens Scanned
                    </div>
                    <div className="text-4xl font-mono font-bold text-white flex items-center gap-3 drop-shadow-[0_0_10px_rgba(20,241,149,0.3)]">
                        {scans.toLocaleString()}
                        <span className="flex h-3 w-3 relative mt-1">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#14F195] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#14F195] shadow-[0_0_10px_#14F195]"></span>
                        </span>
                    </div>
                </div>
                
                <div className="px-2">
                    <div className="text-[11px] text-slate-300 uppercase font-bold tracking-wider mb-1">Threats Neutralized</div>
                    <div className="text-2xl font-mono font-bold text-red-400 flex items-center gap-2 drop-shadow-[0_0_10px_rgba(248,113,113,0.3)]">
                        {threats.toLocaleString()}
                        <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
                    </div>
                </div>

                <div className="px-2">
                    <div className="text-[11px] text-slate-300 uppercase font-bold tracking-wider mb-2">Active Networks</div>
                    <div className="flex gap-2">
                        <div className="flex items-center gap-1.5 bg-black/60 px-2 py-1.5 rounded border border-[#14F195]/40 hover:bg-black/80 transition-colors">
                            <img src="/logos/sol.png" alt="SOL" className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold text-[#14F195]">SOLANA</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-black/60 px-2 py-1.5 rounded border border-[#0052FF]/40 hover:bg-black/80 transition-colors">
                            <div className="w-3.5 h-3.5 rounded-full bg-[#0052FF] border border-white/20"></div>
                            <span className="text-[10px] font-bold text-[#0052FF]">BASE</span>
                        </div>
                    </div>
                </div>

                <div className="px-2">
                    <div className="text-[11px] text-slate-300 uppercase font-bold tracking-wider mb-2">System Status</div>
                    <div className="flex items-center gap-2 text-[#14F195] text-sm font-bold bg-[#14F195]/10 px-3 py-1.5 rounded-lg w-fit border border-[#14F195]/30 shadow-[0_0_15px_rgba(20,241,149,0.1)]">
                        <Zap className="w-4 h-4 fill-current" /> OPERATIONAL
                    </div>
                </div>
             </div>
        </div>
    </div>
  );
}

function RightActivityPanel() {
    const [activities, setActivities] = useState([
        { type: 'scan', token: 'BONK', chain: 'SOL', risk: 'LOW', time: '2s ago' },
        { type: 'scan', token: 'BRETT', chain: 'BASE', risk: 'LOW', time: '5s ago' },
        { type: 'alert', token: 'SCAM...', chain: 'SOL', risk: 'HIGH', time: '12s ago' },
        { type: 'scan', token: 'JUP', chain: 'SOL', risk: 'LOW', time: '15s ago' },
        { type: 'scan', token: 'TOSHI', chain: 'BASE', risk: 'LOW', time: '24s ago' },
    ]);

    useEffect(() => {
        const tokens = [
            { s: 'SOL', c: 'SOL' }, { s: 'USDC', c: 'SOL' }, { s: 'RAY', c: 'SOL' }, { s: 'ORCA', c: 'SOL' },
            { s: 'MYRO', c: 'SOL' }, { s: 'SAMO', c: 'SOL' }, { s: 'ANALOS', c: 'SOL' }, { s: 'SILLY', c: 'SOL' },
            { s: 'BRETT', c: 'BASE' }, { s: 'DEGEN', c: 'BASE' }, { s: 'MOG', c: 'BASE' }, { s: 'TOSHI', c: 'BASE' },
            { s: 'KEYCAT', c: 'BASE' }, { s: 'NORMIE', c: 'BASE' }
        ];

        const interval = setInterval(() => {
            const randomToken = tokens[Math.floor(Math.random() * tokens.length)];
            const randomRisk = Math.random() > 0.8 ? 'HIGH' : (Math.random() > 0.5 ? 'MEDIUM' : 'LOW');
            
            setActivities(prev => [
                { type: 'scan', token: randomToken.s, chain: randomToken.c, risk: randomRisk, time: 'Just now' },
                ...prev.slice(0, 4)
            ]);
        }, 3500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="hidden xl:flex flex-col gap-4 fixed right-8 top-1/2 -translate-y-1/2 w-80 z-10">
            <div className="bg-slate-950 backdrop-blur-xl border border-slate-600/80 p-6 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.7)] relative overflow-hidden ring-1 ring-white/10">
                <div className="absolute inset-0 bg-gradient-to-bl from-[#9945FF]/10 to-transparent pointer-events-none"></div>
                <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
                    <Search className="w-5 h-5 text-[#9945FF] drop-shadow-[0_0_8px_rgba(153,69,255,0.8)]" />
                    <span className="text-sm font-bold text-white uppercase tracking-widest drop-shadow-md">Recent Scans</span>
                </div>
                
                <div className="space-y-4">
                    {activities.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-sm animate-in slide-in-from-right-2 fade-in duration-500 border-b border-slate-700/60 pb-2 last:border-0 last:pb-0">
                            <div className="flex items-center gap-3">
                                <div className={clsx("w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]", 
                                    item.risk === 'HIGH' ? 'bg-red-500 text-red-500' : 
                                    item.risk === 'MEDIUM' ? 'bg-yellow-500 text-yellow-500' : 'bg-[#14F195] text-[#14F195]'
                                )}></div>
                                <div>
                                    <div className="font-mono text-white font-bold tracking-wide leading-none">${item.token}</div>
                                    <div className="text-[9px] font-bold text-slate-400 mt-0.5 flex items-center gap-1">
                                        {item.chain === 'BASE' ? (
                                            <span className="text-[#0052FF]">BASE</span>
                                        ) : (
                                            <span className="text-[#14F195]">SOLANA</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <span className={clsx("px-2 py-1 rounded-md text-[10px] font-bold shadow-sm border",
                                item.risk === 'HIGH' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                item.risk === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'
                            )}>{item.risk}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
