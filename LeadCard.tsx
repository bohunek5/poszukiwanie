
import React from 'react';
import { Lead } from '../types';
import { Mail, Phone, Globe, MapPin, Tag, ExternalLink, ArrowRight, MessageSquareText, Hash } from 'lucide-react';

interface LeadCardProps {
  lead: Lead;
  index: number;
}

export const LeadCard: React.FC<LeadCardProps> = ({ lead, index }) => {
  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 mb-6 hover:shadow-xl hover:border-orange-100 transition-all group overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:bg-orange-50 transition-colors"></div>
      
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8 relative">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-full uppercase tracking-widest">Lead ID: PL-{index + 1001}</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lead.industry}</span>
          </div>
          <h3 className="text-3xl font-black text-[#1D242E] tracking-tight group-hover:text-orange-600 transition-colors">{lead.name}</h3>
          <div className="flex flex-wrap items-center gap-4 mt-2">
            <p className="text-sm text-slate-500 flex items-center gap-1.5 font-medium">
              <MapPin size={16} className="text-orange-500" /> {lead.location}
            </p>
            <p className="text-sm text-slate-500 flex items-center gap-1.5 font-bold">
              <Hash size={16} className="text-slate-400" /> NIP: {lead.nip}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 relative">
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-4">
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div> Analiza Potencjału
              </h4>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 group-hover:bg-white group-hover:shadow-inner transition-all">
                <p className="text-[#1D242E] text-sm font-medium italic leading-relaxed">"{lead.justification}"</p>
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <MessageSquareText size={14} /> Strategia Rozmowy (Jak zagadać?)
              </h4>
              <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                <p className="text-slate-700 text-sm font-semibold leading-relaxed">
                  {lead.salesTip}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {lead.recommendedProducts.map((prod, i) => (
              <span key={i} className="flex items-center gap-1.5 text-[10px] font-black bg-white text-slate-600 px-3 py-1.5 rounded-xl border border-slate-200 group-hover:border-orange-200 uppercase tracking-tight">
                <Tag size={12} className="text-orange-500" /> {prod}
              </span>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl">
            <h4 className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-4">Centrum Kontaktu</h4>
            <div className="space-y-4">
              <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm hover:text-orange-400 transition-colors group/link font-bold">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center group-hover/link:bg-orange-500 transition-colors">
                  <Globe size={16} />
                </div>
                {lead.website}
              </a>
              <div className="flex items-center gap-3 text-sm font-bold">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Phone size={16} />
                </div>
                {lead.phone}
              </div>
              <div className="flex items-center gap-3 text-sm font-bold">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Mail size={16} />
                </div>
                {lead.email}
              </div>
            </div>
          </div>

          {lead.sources && lead.sources.length > 0 && (
            <div className="pt-2">
              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                Źródła weryfikacji
              </h4>
              <div className="flex flex-col gap-2">
                {lead.sources.map((source, i) => (
                  <a key={i} href={source.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[10px] text-slate-400 hover:text-orange-500 transition-colors truncate">
                    <ExternalLink size={10} /> {source.title || source.uri}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 pt-6 border-t border-slate-50 flex justify-end">
        <button className="flex items-center gap-2 text-[10px] font-black text-orange-600 uppercase tracking-widest hover:gap-4 transition-all">
          Pełny Profil Firmy <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};
