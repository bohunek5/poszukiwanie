
import React, { useState } from 'react';
import { Search, Loader2, Download, Table, FileText, Check, ShieldCheck, MapPin, Globe, Phone, Mail, Tag, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { Lead, SearchFilters, IndustryType, REGIONS } from './types';
import { findLeads } from './services/geminiService';
import { LeadCard } from './components/LeadCard';
import { LeadTable } from './components/LeadTable';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const PrescotLogo = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center select-none ${className}`}>
    <span className="text-[#1D242E] font-[900] tracking-tighter text-2xl">PRESCOT</span>
    <span className="text-[#E84E26] font-[900] tracking-tighter text-2xl ml-1">LED</span>
  </div>
);

const App: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'table' | 'report'>('report');
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<SearchFilters>({
    region: 'Cała Polska',
    industryTypes: [IndustryType.Wholesalers, IndustryType.LED, IndustryType.POS],
    limit: 10
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    try {
      const results = await findLeads(filters);
      setLeads(results);
    } catch (error: any) {
      console.error(error);
      if (error.message?.includes('429') || error.status === 429 || error.message?.toLowerCase().includes('quota')) {
        setErrorMessage("Limit zapytań API został chwilowo wyczerpany. Spróbuj ponownie za chwilę lub zmniejsz liczbę wyszukiwanych firm (Limit).");
      } else {
        setErrorMessage(error.message || "Wystąpił nieoczekiwany błąd podczas wyszukiwania. Spróbuj ponownie.");
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleIndustry = (type: IndustryType) => {
    setFilters(prev => ({
      ...prev,
      industryTypes: prev.industryTypes.includes(type)
        ? prev.industryTypes.filter(t => t !== type)
        : [...prev.industryTypes, type]
    }));
  };

  const exportToExcel = () => {
    if (leads.length === 0) return;
    
    // Zdefiniowany układ kolumn optymalny dla handlowca
    const headers = [
      "Nazwa firmy", 
      "NIP", 
      "Branża", 
      "Lokalizacja", 
      "Strona WWW", 
      "E-mail", 
      "Telefon", 
      "Dlaczego Prescot LED?", 
      "Strategia rozmowy (Sales Tip)",
      "Rekomendowane Produkty"
    ];

    const rows = leads.map(l => [
      l.name,
      l.nip,
      l.industry,
      l.location,
      l.website,
      l.email,
      l.phone,
      l.justification,
      l.salesTip,
      l.recommendedProducts.join(", ")
    ]);

    // Używamy średnika jako separatora (standard w PL Excel) i cudzysłowów dla bezpieczeństwa tekstu
    const csvContent = [
      headers.join(";"),
      ...rows.map(r => r.map(field => `"${String(field || '').replace(/"/g, '""')}"`).join(";"))
    ].join("\n");

    // \uFEFF to Byte Order Mark (BOM), który wymusza na Excelu otwarcie pliku w UTF-8 (polskie znaki)
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Baza_Leadow_PrescotLED_${filters.region.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = async () => {
    if (leads.length === 0) return;
    setIsExporting(true);
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 12;
    let currentY = margin;

    const renderZone = document.getElementById('pdf-render-zone');
    if (!renderZone) return;

    try {
      const headerDiv = document.createElement('div');
      headerDiv.className = 'pdf-page-header';
      headerDiv.style.display = 'flex';
      headerDiv.style.justifyContent = 'space-between';
      headerDiv.style.alignItems = 'flex-end';
      headerDiv.innerHTML = `
        <div>
          <div style="display:flex; align-items:center;">
            <span style="color:#1D242E; font-weight:900; font-size:32px; letter-spacing:-1.5px">PRESCOT</span>
            <span style="color:#E84E26; font-weight:900; font-size:32px; letter-spacing:-1.5px; margin-left:4px">LED</span>
          </div>
          <div style="font-size:12px; color:#1D242E; font-weight:800; margin-top:4px; text-transform:uppercase; letter-spacing:1px">RAPORT KWALIFIKACJI B2B • ${filters.region}</div>
        </div>
        <div style="text-align:right; font-size:10px; color:#64748b; font-weight:bold">
          WYGENEROWANO: ${new Date().toLocaleDateString('pl-PL')} ${new Date().toLocaleTimeString('pl-PL')}<br/>
          LICZBA IDENTYFIKACJI: ${leads.length}
        </div>
      `;
      renderZone.appendChild(headerDiv);
      
      const headerCanvas = await html2canvas(headerDiv, { scale: 2, useCORS: true });
      const headerImg = headerCanvas.toDataURL('image/jpeg', 1.0);
      const headerH = (headerCanvas.height * (pdfWidth - 2 * margin)) / headerCanvas.width;
      
      pdf.addImage(headerImg, 'JPEG', margin, currentY, pdfWidth - 2 * margin, headerH);
      currentY += headerH + 10;
      renderZone.removeChild(headerDiv);

      for (let i = 0; i < leads.length; i++) {
        const lead = leads[i];
        const cardDiv = document.createElement('div');
        cardDiv.className = 'pdf-lead-card';
        
        cardDiv.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
            <div style="flex: 1; padding-right: 15px;">
              <div style="font-size:18px; font-weight:900; color:#1D242E; margin-bottom: 2px; line-height: 1.1;">${i + 1}. ${lead.name}</div>
              <div style="font-size:9px; color:#94a3b8; font-weight:700;">NIP: ${lead.nip} | LEAD ID: PL-${i + 1001}</div>
            </div>
            <div style="flex-shrink: 0;">
              <div class="pdf-industry-badge">${lead.industry}</div>
            </div>
          </div>
          <div style="display: flex; gap: 20px; border-top: 1px solid #f1f5f9; padding-top: 15px;">
            <div style="flex: 3;">
              <div style="margin-bottom: 12px;">
                <div style="font-size:8px; color:#E84E26; font-weight:900; margin-bottom:4px; letter-spacing:1px">ANALIZA POTENCJAŁU B2B</div>
                <div style="font-size:10px; color:#334155; line-height:1.4; font-style:italic; background:#f8fafc; padding:8px; border-radius:6px; border-left:4px solid #E84E26">
                  "${lead.justification}"
                </div>
              </div>
              <div style="margin-bottom: 12px;">
                <div style="font-size:8px; color:#2563eb; font-weight:900; margin-bottom:4px; letter-spacing:1px">STRATEGIA ROZMOWY</div>
                <div style="font-size:10px; color:#1e3a8a; font-weight:700; line-height:1.3; background:#eff6ff; padding:8px; border-radius:6px; border-left:4px solid #2563eb">
                  ${lead.salesTip}
                </div>
              </div>
              <div>
                <div style="font-size:7px; color:#94a3b8; font-weight:900; margin-bottom:6px">REKOMENDOWANE ROZWIĄZANIA</div>
                <div style="display: flex; flex-wrap: wrap;">
                  ${lead.recommendedProducts.map(p => `<span class="pdf-pill">${p}</span>`).join('')}
                </div>
              </div>
            </div>
            <div style="flex: 2; border-left: 1px solid #f1f5f9; padding-left: 15px;">
              <div style="font-size:8px; color:#1D242E; font-weight:900; margin-bottom:10px; letter-spacing:1px">KONTAKT</div>
              <div style="margin-bottom: 8px;">
                <b style="color:#64748b; font-size:7px; display:block; text-transform: uppercase;">WWW</b>
                <span style="font-size:10px; font-weight:700; color:#1D242E; word-break: break-all;">${lead.website}</span>
              </div>
              <div style="margin-bottom: 8px;">
                <b style="color:#64748b; font-size:7px; display:block; text-transform: uppercase;">Telefon</b>
                <span style="font-size:10px; font-weight:700; color:#1D242E;">${lead.phone}</span>
              </div>
              <div style="margin-bottom: 8px;">
                <b style="color:#64748b; font-size:7px; display:block; text-transform: uppercase;">E-mail</b>
                <span style="font-size:10px; font-weight:700; color:#1D242E; word-break: break-all;">${lead.email}</span>
              </div>
              <div>
                <b style="color:#64748b; font-size:7px; display:block; text-transform: uppercase;">Lokalizacja</b>
                <span style="font-size:10px; font-weight:500; color:#475569;">${lead.location}</span>
              </div>
            </div>
          </div>
        `;
        renderZone.appendChild(cardDiv);
        
        const cardCanvas = await html2canvas(cardDiv, { 
          scale: 2, 
          useCORS: true,
          backgroundColor: '#ffffff'
        });
        const cardImg = cardCanvas.toDataURL('image/jpeg', 0.95);
        const cardH = (cardCanvas.height * (pdfWidth - 2 * margin)) / cardCanvas.width;

        if (currentY + cardH > pdfHeight - margin - 5) {
          pdf.addPage();
          currentY = margin;
        }

        pdf.addImage(cardImg, 'JPEG', margin, currentY, pdfWidth - 2 * margin, cardH);
        currentY += cardH + 6;
        renderZone.removeChild(cardDiv);
      }

      pdf.save(`Raport_PrescotLED_${filters.region.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Błąd podczas generowania pliku PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-slate-50">
      <header className="bg-[#1D242E] text-white py-6 px-4 shadow-2xl border-b border-[#E84E26]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-white p-2.5 rounded-xl shadow-inner">
               <PrescotLogo />
            </div>
            <div className="hidden md:block h-8 w-px bg-slate-700"></div>
            <p className="text-slate-400 font-bold text-sm tracking-tight">System Inteligentnej Akwizycji B2B</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/5 border border-white/10 p-3 rounded-2xl flex items-center gap-3 backdrop-blur-md">
              <div className="bg-[#E84E26] p-2 rounded-xl shadow-lg shadow-[#E84E26]/40 animate-pulse">
                <Search size={18} className="text-white" />
              </div>
              <div>
                <div className="text-[10px] uppercase text-[#E84E26] font-black tracking-widest leading-none mb-1">Status AI</div>
                <div className="text-xs font-bold flex items-center gap-1.5">Model Gemini 3 Pro</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto mt-8 px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-8 sticky top-8">
            <h2 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
              <div className="w-1.5 h-6 bg-[#E84E26] rounded-full"></div>
              Konfiguracja Skanera
            </h2>
            
            <form onSubmit={handleSearch} className="space-y-8">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Wybierz Region</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-orange-100 outline-none transition-all cursor-pointer"
                  value={filters.region}
                  onChange={(e) => setFilters({...filters, region: e.target.value})}
                >
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Branże Docelowe</label>
                <div className="max-h-[300px] overflow-y-auto pr-2 space-y-1.5 custom-scrollbar">
                  {Object.values(IndustryType).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleIndustry(type)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[11px] transition-all border-2 ${
                        filters.industryTypes.includes(type)
                          ? 'bg-[#1D242E] text-white border-[#1D242E] font-black shadow-lg translate-x-1'
                          : 'bg-white text-slate-500 border-slate-100 hover:border-orange-200'
                      }`}
                    >
                      <span className="truncate pr-2">{type}</span>
                      {filters.industryTypes.includes(type) && <Check size={14} className="shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Wolumen</label>
                  <span className="text-[#E84E26] text-xs font-black">{filters.limit} leadów</span>
                </div>
                <input 
                  type="range" min="5" max="50" step="5"
                  className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-[#E84E26]"
                  value={filters.limit}
                  onChange={(e) => setFilters({...filters, limit: parseInt(e.target.value)})}
                />
              </div>

              <button 
                disabled={loading || filters.industryTypes.length === 0}
                className="w-full bg-[#E84E26] hover:bg-[#d14321] disabled:bg-slate-300 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-orange-600/20 text-xs uppercase tracking-widest flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                {loading ? 'AGENT SKANUJE RYNEK...' : 'URUCHOM AGENTA'}
              </button>
            </form>
          </div>
        </aside>

        <section className="lg:col-span-8">
          {errorMessage && (
            <div className="mb-6 p-6 bg-red-50 border border-red-100 rounded-[2rem] flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="bg-red-500 p-2 rounded-xl text-white shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 className="text-red-900 font-black text-sm uppercase tracking-tight mb-1">Błąd systemu AI</h4>
                <p className="text-red-700 text-sm font-medium">{errorMessage}</p>
              </div>
            </div>
          )}

          {leads.length > 0 ? (
            <div className="space-y-6">
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4 sticky top-4 z-10">
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                  <button onClick={() => setView('report')} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === 'report' ? 'bg-white shadow-md text-[#1D242E]' : 'text-slate-400'}`}>
                    <FileText size={16} /> Raport
                  </button>
                  <button onClick={() => setView('table')} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === 'table' ? 'bg-white shadow-md text-[#1D242E]' : 'text-slate-400'}`}>
                    <Table size={16} /> Tabela
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={exportToExcel}
                    className="flex items-center gap-3 bg-green-700 hover:bg-green-800 text-white px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 group"
                    title="Pobierz plik CSV z polskimi znakami zgodny z Excel"
                  >
                    <FileSpreadsheet size={16} className="group-hover:scale-110 transition-transform" /> 
                    <span>EKSPORT DO EXCEL</span>
                  </button>
                  <button 
                    onClick={exportToPDF}
                    disabled={isExporting}
                    className="flex items-center gap-3 bg-[#1D242E] hover:bg-black text-white px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:bg-slate-500 group"
                  >
                    {isExporting ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} className="group-hover:scale-110 transition-transform" />}
                    <span>POBIERZ PDF</span>
                  </button>
                </div>
              </div>

              {view === 'report' ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-[#1D242E] flex items-center gap-3">
                      <div className="w-2.5 h-8 bg-[#E84E26] rounded-full"></div>
                      Wyniki Kwalifikacji ({leads.length})
                    </h2>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kwalifikacja AI: Zakończona</span>
                  </div>
                  {leads.map((lead, idx) => (
                    <LeadCard key={lead.id} lead={lead} index={idx} />
                  ))}
                </div>
              ) : (
                <LeadTable leads={leads} />
              )}
            </div>
          ) : (
            <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-200 py-40 px-10 text-center shadow-inner relative overflow-hidden group">
              {loading ? (
                <div className="flex flex-col items-center">
                  <div className="relative w-32 h-32 mb-10">
                    <div className="absolute inset-0 border-[8px] border-slate-50 rounded-full"></div>
                    <div className="absolute inset-0 border-[8px] border-[#E84E26] rounded-full border-t-transparent animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Search className="text-[#E84E26]" size={40} />
                    </div>
                  </div>
                  <h3 className="text-3xl font-black text-[#1D242E] mb-4 tracking-tighter uppercase">Wyszukiwanie Aktywne</h3>
                  <p className="text-slate-500 max-w-sm mx-auto font-medium text-sm leading-relaxed">Agent analizuje dane z Map Google oraz stron firmowych. Proszę czekać, mechanizm retry jest aktywny w przypadku dużych list.</p>
                </div>
              ) : (
                <div className="max-w-md mx-auto">
                  <div className="bg-slate-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 transform group-hover:rotate-12 transition-transform duration-500 border border-slate-100">
                    <ShieldCheck className="text-slate-200" size={56} />
                  </div>
                  <h3 className="text-3xl font-black text-[#1D242E] mb-4 uppercase tracking-tighter">Gotowy do pracy</h3>
                  <p className="text-slate-500 mb-10 text-sm font-medium leading-relaxed">Skonfiguruj filtry po lewej stronie. Nasz system AI dostarczy Ci gotową listę kontaktów wraz z uzasadnieniem handlowym i numerami NIP.</p>
                  
                  <div className="flex justify-center gap-3">
                    <div className="px-4 py-2 bg-[#E84E26]/5 text-[#E84E26] text-[10px] font-black rounded-full border border-[#E84E26]/20 uppercase tracking-tight">NIP FIRMY</div>
                    <div className="px-4 py-2 bg-[#E84E26]/5 text-[#E84E26] text-[10px] font-black rounded-full border border-[#E84E26]/20 uppercase tracking-tight">DANE LIVE</div>
                    <div className="px-4 py-2 bg-slate-100 text-slate-500 text-[10px] font-black rounded-full uppercase tracking-tight">RAPORT PDF / EXCEL</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-[#1D242E]/95 backdrop-blur-xl border-t border-[#E84E26]/30 py-4 px-8 z-40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-6">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Prescot LED Intelligence System</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_#22c55e]"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grounding: Aktywne</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full shadow-[0_0_10px_#f97316]"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kwalifikacja B2B: ON</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
