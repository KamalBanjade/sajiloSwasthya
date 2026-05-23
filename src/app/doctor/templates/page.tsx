'use client';

import React, { useState, useMemo } from 'react';
import { 
  FileText, Plus, Search, Filter, MoreVertical, 
  Edit, Copy, Trash2, BarChart2, Users, Shield, 
  Clock, CheckCircle, ChevronRight, Share2, Star
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import Link from 'next/link';
import { templatesApi } from '@/lib/api/templatesApi';
import { TemplateDTO } from '@/lib/api/templates';
import toast from 'react-hot-toast';
import { PageLayout } from '@/components/layout/PageLayout';

export default function TemplatesPage() {
  const [activeTab, setActiveTab] = useState<'my' | 'dept' | 'hosp'>('my');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('used');
  const [templates, setTemplates] = useState<TemplateDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    loadTemplates();
  }, [activeTab]);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      // Backend handles 'my' vs 'shared' via query params or separate logic
      // In our current controller, it's 'my-templates?includeShared=true'
      const res = await templatesApi.getMyTemplates(activeTab !== 'my');
      if (res.success) {
        setTemplates(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTemplates = useMemo(() => {
    let list = templates.filter(t => {
      if (activeTab === 'my') return t.visibility === 'Private';
      if (activeTab === 'dept') return t.visibility === 'Department';
      if (activeTab === 'hosp') return t.visibility === 'Hospital';
      return true;
    });
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t => 
        t.templateName.toLowerCase().includes(q) || 
        t.recentUpdates?.some(u => u.toLowerCase().includes(q))
      );
    }

    return [...list].sort((a, b) => {
      if (sortBy === 'used') return b.usageCount - a.usageCount;
      if (sortBy === 'name') return a.templateName.localeCompare(b.templateName);
      return 0;
    });
  }, [templates, activeTab, searchQuery, sortBy]);

  const renderTemplateCard = (t: TemplateDTO) => (
    <div key={t.id} className="group bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 relative overflow-hidden">
      {/* Decorative Gradient Background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors duration-700" />
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 ${
                t.visibility === 'Private' ? 'bg-slate-50 dark:bg-slate-800 text-slate-400' :
                t.visibility === 'Department' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-primary dark:text-indigo-400' :
                'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
            }`}>
              <FileText size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{t.templateName}</h3>
              </div>
              <div className="flex items-center gap-2 mt-1">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.schema.sections.reduce((acc, s) => acc + s.fields.length, 0)} fields • Used {t.usageCount} times</span>
                 <span className="w-1 h-1 bg-slate-300 rounded-full" />
                 <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{t.visibility}</span>
              </div>
            </div>
          </div>
          <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
            <MoreVertical size={20} />
          </button>
        </div>

        <div className="flex-grow space-y-4 mb-8">
           <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <Clock size={14} className="text-slate-300" />
              {t.lastUsedAt ? `Last used ${new Date(t.lastUsedAt).toLocaleDateString()}` : 'Never used'}
           </div>

           {t.recentUpdates.length > 0 && (
             <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Recent Updates</p>
                <ul className="space-y-1.5">
                   {t.recentUpdates.map((update, idx) => (
                      <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                         <span className="w-1 h-1 bg-indigo-400 rounded-full mt-1.5 flex-shrink-0" />
                         {update}
                      </li>
                   ))}
                </ul>
             </div>
           )}
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="flex-grow h-11 rounded-xl font-bold uppercase tracking-widest text-[10px] gap-2">
            <Edit size={14} /> Edit
          </Button>
          <Button variant="outline" size="sm" className="h-11 w-11 p-0 rounded-xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center">
            <Copy size={16} />
          </Button>
          <Button variant="outline" size="sm" className="h-11 w-11 p-0 rounded-xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/10">
            <Trash2 size={16} />
          </Button>
          <Button className="h-11 px-4 bg-primary hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none transition-transform active:scale-95">
             <ChevronRight size={18} />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <PageLayout className="space-y-10 pb-20">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-primary dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest">Clinical Protocol Engine</span>
           </div>
           <h1 className="text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">
             My Templates
           </h1>
           <p className="text-slate-500 font-medium mt-3 text-lg">Manage, refine, and share your clinical documentation workflows.</p>
        </div>
        
        <div className="flex items-center gap-4">
           <Link href="/doctor/records/new">
             <Button className="h-14 px-8 bg-slate-900 dark:bg-primary hover:bg-slate-800 dark:hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-200 dark:shadow-none flex items-center gap-3 transition-all active:scale-95">
               <Plus size={20} /> Create New Template
             </Button>
           </Link>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl w-full md:w-auto">
           {(['my', 'dept', 'hosp'] as const).map((tab) => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                 activeTab === tab 
                 ? 'bg-white dark:bg-slate-700 text-primary dark:text-white shadow-md' 
                 : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
               }`}
             >
               {tab === 'my' ? 'My Templates' : tab === 'dept' ? 'Department' : 'Hospital'}
             </button>
           ))}
        </div>

        <div className="relative flex-grow w-full">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
           <Input 
             placeholder="Search by name, tags, or fields..." 
             className="pl-12 h-14 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl"
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
           />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
           <Select 
             options={[
               { value: 'used', label: 'Most Used' },
               { value: 'recent', label: 'Recently Used' },
               { value: 'name', label: 'Name A-Z' }
             ]}
             value={sortBy}
             onChange={(e) => setSortBy(e.target.value)}
             className="h-14 w-48 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold text-xs"
           />
           <Button variant="outline" className="h-14 w-14 rounded-2xl p-0 flex items-center justify-center">
              <Filter size={20} />
           </Button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="space-y-12">
        <section>
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">{activeTab === 'my' ? 'MY TEMPLATES' : activeTab === 'dept' ? 'DEPARTMENT TEMPLATES' : 'HOSPITAL-WIDE POOL'} ({templates.length})</h2>
            <div className="h-px bg-slate-100 dark:bg-slate-800 flex-grow" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {isLoading ? (
               <div className="col-span-full py-20 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">
                  Loading Clinical Protocols...
               </div>
            ) : filteredTemplates.map(renderTemplateCard)}
            
            {activeTab === 'my' && !searchQuery && !isLoading && (
               <Link href="/doctor/records/new" className="group flex flex-col items-center justify-center p-8 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-primary transition-all duration-300 bg-slate-50/50 dark:bg-slate-900/30 min-h-[400px]">
                  <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-indigo-500 shadow-sm group-hover:shadow-indigo-100 dark:group-hover:shadow-none transition-all duration-300 group-hover:scale-110 mb-4">
                    <Plus size={32} />
                  </div>
                  <p className="text-xs font-black text-slate-400 group-hover:text-primary uppercase tracking-widest transition-colors">Create New Template</p>
                  <p className="text-[10px] text-slate-400 text-center mt-2 max-w-[200px]">Start with a blank canvas or fork from existing protocols.</p>
               </Link>
            )}
          </div>
        </section>

        {/* Info Box */}
        <div className="bg-indigo-900 dark:bg-slate-950 rounded-[2.5rem] p-10 text-white flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-2xl shadow-indigo-200 dark:shadow-none">
           <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 blur-[100px] rounded-full -mr-32 -mt-32" />
           <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="w-20 h-20 bg-indigo-500/30 rounded-3xl flex items-center justify-center text-indigo-200 border border-indigo-500/30">
                 <Shield size={40} />
              </div>
              <div className="text-center md:text-left">
                 <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Organic Growth System</h3>
                 <p className="text-indigo-200 text-sm max-w-md">Templates grow automatically as you add custom fields to records. Share your optimized workflows with your department to improve hospital-wide care standards.</p>
              </div>
           </div>
           <div className="relative z-10 flex gap-4">
              <Button className="h-14 px-8 bg-white text-indigo-900 hover:bg-slate-100 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3">
                 <Share2 size={16} /> Explore Shared
              </Button>
           </div>
        </div>
      </div>
    </PageLayout>
  );
}
