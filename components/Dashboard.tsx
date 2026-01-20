
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Account, AccountCategory, NetWorthHistory } from '../types';
import { CATEGORY_COLORS, NET_WORTH_HISTORY } from '../constants';

interface DashboardProps {
  accounts: Account[];
}

const Dashboard: React.FC<DashboardProps> = ({ accounts }) => {
  const totalNetWorth = useMemo(() => accounts.reduce((acc, curr) => acc + curr.balance, 0), [accounts]);
  
  const categoryData = useMemo(() => {
    const data: Record<string, number> = {};
    accounts.forEach(acc => {
      data[acc.category] = (data[acc.category] || 0) + acc.balance;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [accounts]);

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Financial Overview</h2>
          <p className="text-slate-500">Track and manage your global estate in real-time.</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500 uppercase font-bold">Consolidated Net Worth</p>
          <p className="text-4xl font-extrabold text-indigo-600">{formatter.format(totalNetWorth)}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-slate-800">Growth History</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={NET_WORTH_HISTORY}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => formatter.format(value)}
                />
                <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <h3 className="text-lg font-semibold mb-4 text-slate-800">Asset Distribution</h3>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name as AccountCategory] || '#ccc'} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatter.format(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {categoryData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[entry.name as AccountCategory] }} />
                <span className="text-xs text-slate-600 truncate">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.values(AccountCategory).map(cat => {
          const catTotal = accounts.filter(a => a.category === cat).reduce((sum, a) => sum + a.balance, 0);
          if (catTotal === 0) return null;
          return (
            <div key={cat} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">{cat}</p>
              <p className="text-xl font-bold text-slate-800 mt-1">{formatter.format(catTotal)}</p>
              <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full" 
                  style={{ 
                    width: `${(catTotal / totalNetWorth) * 100}%`,
                    backgroundColor: CATEGORY_COLORS[cat]
                  }} 
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
