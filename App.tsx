
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import { Account, Heir, Document, AccountCategory } from './types';
import { MOCK_ACCOUNTS, MOCK_HEIRS, MOCK_DOCUMENTS } from './constants';
import { getEstateInsights, chatWithAssistant } from './geminiService';

type NavItem = 'dashboard' | 'accounts' | 'heirs' | 'vault' | 'ai';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavItem>('dashboard');
  const [accounts, setAccounts] = useState<Account[]>(MOCK_ACCOUNTS);
  const [heirs, setHeirs] = useState<Heir[]>(MOCK_HEIRS);
  const [docs, setDocs] = useState<Document[]>(MOCK_DOCUMENTS);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'assistant', text: string}[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Generate initial insights
    handleGetInsights();
  }, []);

  const handleGetInsights = async () => {
    setLoadingInsights(true);
    const result = await getEstateInsights(accounts, heirs);
    setAiInsights(result || '');
    setLoadingInsights(false);
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;
    const userMsg = chatMessage;
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    
    const response = await chatWithAssistant(userMsg, { accounts, heirs });
    setChatHistory(prev => [...prev, { role: 'assistant', text: response || 'Error' }]);
  };

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      // Simulate account updates here if desired
    }, 2000);
  };

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <Dashboard accounts={accounts} />
              
              <div className="bg-neutral-300 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-white/20 p-1 rounded">AI</span>
                    <h3 className="text-xl font-bold">AI Legacy Analysis</h3>
                  </div>
                  {loadingInsights ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <p className="text-indigo-100">Our AI is analyzing your estate strategy...</p>
                    </div>
                  ) : (
                    <div className="prose prose-invert max-w-none">
                      <p className="whitespace-pre-wrap text-indigo-100 text-sm leading-relaxed">
                        {aiInsights}
                      </p>
                    </div>
                  )}
                  <button 
                    onClick={handleGetInsights}
                    className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
                  >
                    Refresh Insights
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Accounts Tab */}
          {activeTab === 'accounts' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-slate-900">Financial Institutions</h2>
                <div className="flex gap-3">
                  <button 
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSyncing ? 'Syncing...' : 'Sync All'}
                  </button>
                  <button className="px-4 py-2 bg-slate-600 text-white rounded-xl font-semibold hover:bg-neutral-300 transition-colors">
                    + Connect Account
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Institution</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Account Name</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Category</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {accounts.map(account => (
                      <tr key={account.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{account.institution}</div>
                          <div className="text-xs text-slate-400">Synced {new Date(account.lastSynced).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-neutral-300">{account.name}</div>
                          <div className="text-xs text-slate-500 font-mono tracking-tighter">•••• {account.mask}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                            {account.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="font-bold text-slate-900">{formatter.format(account.balance)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Heirs Tab */}
          {activeTab === 'heirs' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-slate-900">Heir Designations</h2>
                <button className="px-4 py-2 bg-slate-600 text-white rounded-xl font-semibold hover:bg-neutral-300 transition-colors">
                  + Add Heir
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {heirs.map(heir => (
                  <div key={heir.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-xl font-bold text-slate-600">
                        {heir.name.charAt(0).toUpperCase()}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        heir.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {heir.status}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{heir.name}</h3>
                    <p className="text-slate-500 text-sm mb-4">{heir.relationship}</p>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-slate-500">Allocation</span>
                          <span className="text-slate-600">{heir.allocation}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-slate-500" style={{ width: `${heir.allocation}%` }} />
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">
                        Est. Transfer Value: {formatter.format(accounts.reduce((s, a) => s + a.balance, 0) * (heir.allocation / 100))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vault Tab */}
          {activeTab === 'vault' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-slate-900">Digital Document Vault</h2>
                <button className="px-4 py-2 bg-slate-600 text-white rounded-xl font-semibold hover:bg-neutral-300 transition-colors">
                  Upload New
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {docs.map(doc => (
                  <div key={doc.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4 hover:border-slate-200 transition-all cursor-pointer">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-sm font-bold text-slate-600">
                      DOC
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{doc.name}</p>
                      <p className="text-xs text-slate-400">{doc.category} • {doc.uploadedAt}</p>
                    </div>
                  </div>
                ))}
                <div className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-8 gap-2 text-slate-400 hover:text-slate-500 hover:border-slate-300 transition-all cursor-pointer">
                  <span className="text-3xl">+</span>
                  <span className="text-xs font-bold uppercase">Add Document</span>
                </div>
              </div>
            </div>
          )}

          {/* Legacy AI Assistant Tab */}
          {activeTab === 'ai' && (
            <div className="h-[calc(100vh-8rem)] flex flex-col gap-4 animate-in zoom-in-95 duration-300">
              <div className="bg-white flex-1 rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                <div className="p-4 bg-slate-600 text-white">
                  <h3 className="font-bold">Legacy AI Assistant</h3>
                  <p className="text-xs opacity-80">Ask about tax laws, beneficiary rules, or your own portfolio.</p>
                </div>
                
                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                  {chatHistory.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-2">
                      <p>How can I help with your estate planning today?</p>
                      <div className="flex gap-2 text-xs">
                        <button onClick={() => setChatMessage("What documents do I still need?")} className="bg-slate-100 px-3 py-2 rounded-full hover:bg-slate-200">"What documents do I still need?"</button>
                        <button onClick={() => setChatMessage("Explain tax on 401k transfer")} className="bg-slate-100 px-3 py-2 rounded-full hover:bg-slate-200">"Explain tax on 401k transfer"</button>
                      </div>
                    </div>
                  )}
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                        msg.role === 'user' 
                          ? 'bg-slate-600 text-white rounded-tr-none' 
                          : 'bg-slate-100 text-slate-800 rounded-tl-none'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t border-slate-100 flex gap-3">
                  <input 
                    type="text" 
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your question..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                  <button 
                    onClick={handleSendMessage}
                    className="bg-slate-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-neutral-300 transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default App;
