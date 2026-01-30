import React, { useState, useEffect } from 'react';
import { Account, Heir, Document } from '../types';
import { MOCK_ACCOUNTS, MOCK_HEIRS, MOCK_DOCUMENTS } from '../constants';
import { getEstateInsights, chatWithAssistant } from '../geminiService';
import { logout, getAuthState } from '../services/authService';

type TabItem = 'overview' | 'tasks' | 'heirs' | 'distributions';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
}

const MOCK_TASKS: Task[] = [
  { id: '1', title: 'Gather Death Certificates', description: 'Obtain certified copies of death certificate', status: 'completed', priority: 'high', dueDate: '2024-01-15' },
  { id: '2', title: 'Notify Financial Institutions', description: 'Contact banks and investment firms', status: 'in_progress', priority: 'high', dueDate: '2024-01-20' },
  { id: '3', title: 'File Probate Documents', description: 'Submit initial probate filing to court', status: 'pending', priority: 'high', dueDate: '2024-02-01' },
  { id: '4', title: 'Inventory Real Estate', description: 'Document all real property holdings', status: 'pending', priority: 'medium', dueDate: '2024-02-15' },
  { id: '5', title: 'Review Insurance Policies', description: 'Collect and review all life insurance', status: 'in_progress', priority: 'medium', dueDate: '2024-01-25' },
  { id: '6', title: 'Tax Return Preparation', description: 'Prepare final tax returns', status: 'pending', priority: 'low', dueDate: '2024-04-15' },
];

const DashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabItem>('overview');
  const [accounts, setAccounts] = useState<Account[]>(MOCK_ACCOUNTS);
  const [heirs, setHeirs] = useState<Heir[]>(MOCK_HEIRS);
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [docs, setDocs] = useState<Document[]>(MOCK_DOCUMENTS);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'assistant', text: string}[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
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

  const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  const totalEstate = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const tabs: { id: TabItem; label: string; icon: JSX.Element }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
    },
    {
      id: 'heirs',
      label: 'Heirs',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
    },
    {
      id: 'distributions',
      label: 'Distributions',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    },
  ];

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">L</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">LegacyVault</h1>
                <p className="text-xs text-slate-500">Estate of Kim Chulsu</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">Total Estate Value:</span>
              <span className="text-lg font-bold text-blue-600">{formatter.format(totalEstate)}</span>
              <button
                onClick={logout}
                className="ml-4 px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
                <div className="text-sm text-slate-500 mb-1">Total Assets</div>
                <div className="text-2xl font-bold text-slate-900">{formatter.format(totalEstate)}</div>
                <div className="text-xs text-slate-400 mt-1">{accounts.length} accounts</div>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
                <div className="text-sm text-slate-500 mb-1">Tasks Progress</div>
                <div className="text-2xl font-bold text-slate-900">{completedTasks}/{tasks.length}</div>
                <div className="h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(completedTasks / tasks.length) * 100}%` }} />
                </div>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
                <div className="text-sm text-slate-500 mb-1">Beneficiaries</div>
                <div className="text-2xl font-bold text-slate-900">{heirs.length}</div>
                <div className="text-xs text-slate-400 mt-1">{heirs.filter(h => h.status === 'active').length} active</div>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
                <div className="text-sm text-slate-500 mb-1">Documents</div>
                <div className="text-2xl font-bold text-slate-900">{docs.length}</div>
                <div className="text-xs text-slate-400 mt-1">in vault</div>
              </div>
            </div>

            {/* AI Insights & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AI Insights */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    AI Analysis
                  </h3>
                  <button
                    onClick={handleGetInsights}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Refresh
                  </button>
                </div>
                <div className="p-5">
                  {loadingInsights ? (
                    <div className="flex items-center gap-3 text-slate-500">
                      <div className="w-5 h-5 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                      <span>Analyzing your estate...</span>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{aiInsights}</p>
                  )}
                </div>
              </div>

              {/* Upcoming Tasks */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-900">Upcoming Tasks</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {tasks.filter(t => t.status !== 'completed').slice(0, 4).map(task => (
                    <div key={task.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-slate-400'
                        }`} />
                        <div>
                          <p className="text-sm font-medium text-slate-900">{task.title}</p>
                          <p className="text-xs text-slate-500">Due: {task.dueDate}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {task.status === 'in_progress' ? 'In Progress' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Assets Table */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">Asset Summary</h3>
              </div>
              <table className="w-full">
                <thead className="bg-slate-50 text-left">
                  <tr>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Institution</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Account</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Type</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {accounts.map(account => (
                    <tr key={account.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 text-sm font-medium text-slate-900">{account.institution}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">{account.name}</td>
                      <td className="px-5 py-4">
                        <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600">{account.category}</span>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-900 text-right">{formatter.format(account.balance)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50">
                  <tr>
                    <td colSpan={3} className="px-5 py-3 text-sm font-semibold text-slate-900">Total</td>
                    <td className="px-5 py-3 text-sm font-bold text-blue-600 text-right">{formatter.format(totalEstate)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            {/* Task Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-500">Pending</div>
                    <div className="text-3xl font-bold text-slate-900">{pendingTasks}</div>
                  </div>
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-500">In Progress</div>
                    <div className="text-3xl font-bold text-blue-600">{inProgressTasks}</div>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-500">Completed</div>
                    <div className="text-3xl font-bold text-emerald-600">{completedTasks}</div>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Task List */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">All Tasks</h3>
                <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                  + Add Task
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {tasks.map(task => (
                  <div key={task.id} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={task.status === 'completed'}
                      onChange={() => {}}
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-slate-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                        {task.title}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{task.description}</p>
                    </div>
                    <div className="text-xs text-slate-500">{task.dueDate}</div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${
                      task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {task.status === 'completed' ? 'Done' : task.status === 'in_progress' ? 'In Progress' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Heirs Tab */}
        {activeTab === 'heirs' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Beneficiaries</h2>
              <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                + Add Beneficiary
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {heirs.map(heir => (
                <div key={heir.id} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-xl font-bold text-blue-600">
                        {heir.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{heir.name}</h3>
                        <p className="text-sm text-slate-500">{heir.relationship}</p>
                        <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                          heir.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {heir.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="px-5 py-4 bg-slate-50 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-600">Allocation</span>
                      <span className="text-sm font-semibold text-slate-900">{heir.allocation}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${heir.allocation}%` }} />
                    </div>
                    <div className="mt-3 text-sm text-slate-600">
                      Est. Value: <span className="font-semibold text-slate-900">{formatter.format(totalEstate * (heir.allocation / 100))}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Distributions Tab */}
        {activeTab === 'distributions' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Distribution Plan</h2>
              <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                Generate Report
              </button>
            </div>

            {/* Distribution Summary */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">Distribution Overview</h3>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-8 mb-6">
                  <div>
                    <div className="text-sm text-slate-500">Total Estate</div>
                    <div className="text-2xl font-bold text-slate-900">{formatter.format(totalEstate)}</div>
                  </div>
                  <div className="h-12 w-px bg-slate-200" />
                  <div>
                    <div className="text-sm text-slate-500">Beneficiaries</div>
                    <div className="text-2xl font-bold text-slate-900">{heirs.length}</div>
                  </div>
                  <div className="h-12 w-px bg-slate-200" />
                  <div>
                    <div className="text-sm text-slate-500">Distributed</div>
                    <div className="text-2xl font-bold text-emerald-600">{formatter.format(0)}</div>
                  </div>
                </div>

                {/* Distribution Chart (simple bar) */}
                <div className="space-y-4">
                  {heirs.map(heir => (
                    <div key={heir.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-700">{heir.name}</span>
                        <span className="text-sm text-slate-500">{heir.allocation}% • {formatter.format(totalEstate * (heir.allocation / 100))}</span>
                      </div>
                      <div className="h-6 bg-slate-100 rounded overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded flex items-center justify-end pr-2"
                          style={{ width: `${heir.allocation}%` }}
                        >
                          {heir.allocation >= 20 && (
                            <span className="text-xs text-white font-medium">{heir.allocation}%</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Distribution Table */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">Asset Distribution by Beneficiary</h3>
              </div>
              <table className="w-full">
                <thead className="bg-slate-50 text-left">
                  <tr>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Beneficiary</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Relationship</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase text-center">Allocation</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Estimated Value</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {heirs.map(heir => (
                    <tr key={heir.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                            {heir.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-slate-900">{heir.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">{heir.relationship}</td>
                      <td className="px-5 py-4 text-sm text-slate-900 text-center font-semibold">{heir.allocation}%</td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-900 text-right">
                        {formatter.format(totalEstate * (heir.allocation / 100))}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
                          Pending
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50">
                  <tr>
                    <td colSpan={2} className="px-5 py-3 text-sm font-semibold text-slate-900">Total</td>
                    <td className="px-5 py-3 text-sm font-bold text-slate-900 text-center">100%</td>
                    <td className="px-5 py-3 text-sm font-bold text-blue-600 text-right">{formatter.format(totalEstate)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* Floating AI Chat Button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center z-50"
      >
        {isChatOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* AI Chat Popup */}
      {isChatOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden z-50">
          <div className="p-4 bg-blue-600 text-white">
            <h3 className="font-bold">Legacy AI Assistant</h3>
            <p className="text-xs opacity-80">Ask about estate planning, taxes, or distributions.</p>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {chatHistory.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-3">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-sm">How can I help with your estate?</p>
              </div>
            )}
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-xl text-sm ${
                  msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your question..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSendMessage}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
