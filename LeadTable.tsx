
import React from 'react';
import { Lead } from '../types';

interface LeadTableProps {
  leads: Lead[];
}

export const LeadTable: React.FC<LeadTableProps> = ({ leads }) => {
  return (
    <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Nazwa / NIP</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Branża</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Lokalizacja</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Dlaczego LED?</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Kontakt</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {leads.map((lead) => (
            <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-bold text-slate-900">{lead.name}</div>
                <div className="text-xs text-slate-400 font-mono">NIP: {lead.nip}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-xs text-slate-500">{lead.industry}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-slate-600">{lead.location}</div>
              </td>
              <td className="px-6 py-4">
                <div className="text-xs text-slate-600 max-w-xs line-clamp-2" title={lead.justification}>
                  {lead.justification}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-xs space-y-1">
                <div className="text-slate-600 font-medium">{lead.phone}</div>
                <div className="text-blue-600 hover:underline cursor-pointer">{lead.email}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
