import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CreditCard, 
  Activity, 
  AlertCircle, 
  Search, 
  Filter, 
  Eye, 
  ArrowUpRight, 
  ArrowDownRight,
  RefreshCw,
  LayoutDashboard,
  Bell,
  Terminal,
  Server,
  X,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { AdminAuth } from './AdminAuth';

// Types
interface Stats {
  activeUsers: number;
  totalUsers: number;
  paidUsers: number;
  unpaidUsers: number;
  plans: { free: number; starter: number; pro: number };
  revenue: { last3Months: number[]; last6Months: number[]; last12Months: number[] };
  health: { cpuUsage: number; memoryUsage: number; uptime: number; loadSpeed: string; concurrentUsers: number };
}

interface Log {
  timestamp: string;
  type: string;
  message: string;
  details?: any;
}

// Custom Toast Component
const Toast = ({ title, message, type, onClose }: { title: string; message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) => {
  const icon = type === 'success' ? <CheckCircle2 className="text-green-500" /> : type === 'error' ? <AlertCircle className="text-red-500" /> : <Bell className="text-blue-500" />;
  
  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-fade-in-up">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-100 p-4 min-w-[320px] flex items-start gap-4 ring-1 ring-black/5">
        <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
        <div className="flex-grow">
          <h4 className="text-sm font-bold text-gray-900">{title}</h4>
          <p className="text-xs text-gray-500 mt-1">{message}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export const AdminDashboard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'home' | 'users' | 'transactions' | 'logs'>('home');
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ title: string; message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const fetchStats = async (password: string) => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/overview', {
        headers: { 'x-admin-password': password }
      });
      if (!res.ok) throw new Error('Unauthorized');
      const data = await res.json();
      setStats(data);
      setIsAuthenticated(true);
      setAdminPassword(password);
    } catch (err) {
      console.error(err);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/admin/logs', {
        headers: { 'x-admin-password': adminPassword }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        if (activeTab === 'home') fetchStats(adminPassword);
        if (activeTab === 'logs') fetchLogs();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, activeTab, adminPassword]);

  const showNotify = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ title, message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  if (!isAuthenticated) {
    return <AdminAuth onAuthenticated={(pw) => fetchStats(pw)} />;
  }

  // --- RENDERING HELPERS ---

  const MetricCard = ({ title, value, subValue, icon: Icon, trend }: any) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 bg-primary-50 rounded-xl text-primary-600">
          <Icon size={22} />
        </div>
        {trend && (
          <span className={`flex items-center gap-1 text-xs font-bold ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {subValue && <span className="text-xs text-gray-400">{subValue}</span>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col fixed inset-y-0 z-50">
        <div className="p-6">
          <div className="flex items-center gap-3 text-primary-600 mb-8">
            <div className="bg-primary-600 p-1.5 rounded-lg">
               <Server className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">Admin Control</span>
          </div>

          <nav className="space-y-1">
            {[
              { id: 'home', label: 'Overview', icon: LayoutDashboard },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'transactions', label: 'Transactions', icon: CreditCard },
              { id: 'logs', label: 'Error & Logs', icon: Terminal },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === item.id 
                    ? 'bg-primary-50 text-primary-700 shadow-sm' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon size={18} className={activeTab === item.id ? 'text-primary-600' : ''} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-gray-100">
           <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-2">System Health</p>
              <div className="flex items-center justify-between mb-1">
                 <span className="text-xs text-gray-600">Memory</span>
                 <span className="text-xs font-bold text-gray-900">{stats?.health.memoryUsage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                 <div className="bg-primary-500 h-full transition-all duration-1000" style={{ width: `${stats?.health.memoryUsage}%` }}></div>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow ml-64 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 capitalize">{activeTab} Dashboard</h1>
            <p className="text-gray-500 text-sm">Welcome back, system administrator.</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
                onClick={() => { fetchStats(adminPassword); showNotify('Refreshed', 'Dashboard data updated successfully', 'success'); }}
                className="p-2 text-gray-400 hover:text-primary-600 hover:bg-white rounded-xl transition-all border border-transparent hover:border-gray-100 shadow-none hover:shadow-sm"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            <div className="h-10 w-px bg-gray-200"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900">Meet G.</p>
                <p className="text-[10px] text-primary-600 font-bold uppercase tracking-wider">Super Admin</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 border border-primary-200">
                <Search size={18} />
              </div>
            </div>
          </div>
        </header>

        {/* Tab Content */}
        {activeTab === 'home' && stats && (
          <div className="space-y-8 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard title="Active Users" value={stats.activeUsers} icon={Activity} trend={12.5} />
              <MetricCard title="Paid Customers" value={stats.paidUsers} subValue={`of ${stats.totalUsers}`} icon={CheckCircle2} trend={8.2} />
              <MetricCard title="System Performance" value={stats.health.loadSpeed} subValue="Avg. Load" icon={Activity} trend={-5.1} />
              <MetricCard title="Server Uptime" value={`${Math.floor(stats.health.uptime / 3600)}h ${Math.floor((stats.health.uptime % 3600) / 60)}m`} icon={Server} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Revenue Analytics</h3>
                    <p className="text-sm text-gray-500">Monthly revenue growth from subscriptions</p>
                  </div>
                  <div className="flex bg-gray-50 p-1 rounded-xl">
                    {['3M', '6M', '12M'].map((p) => (
                      <button key={p} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${p === '6M' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-[300px] w-full">
                  {/* Mock implementation of Recharts using charts-base or custom div */}
                  <div className="flex items-end justify-between h-full pt-10 px-4">
                    {stats.revenue.last6Months.map((val, i) => (
                       <div key={i} className="flex flex-col items-center gap-3 w-full group">
                          <div className="relative w-12 flex items-end justify-center rounded-t-lg bg-primary-100 group-hover:bg-primary-200 transition-all duration-500" style={{ height: `${(val / 25000) * 100}%` }}>
                             <div className="absolute -top-10 opacity-0 group-hover:opacity-100 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded transition-all">₹{val.toLocaleString()}</div>
                             <div className="w-full bg-primary-600 rounded-t-lg transition-all" style={{ height: '30%' }}></div>
                          </div>
                          <span className="text-[10px] font-bold text-gray-400">Month {i+1}</span>
                       </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-2">User Distribution</h3>
                <p className="text-sm text-gray-500 mb-8">Breakdown of subscription plans</p>
                <div className="flex flex-col gap-6">
                  {[
                    { label: 'Free Plan', count: stats.plans.free, color: 'bg-gray-100', text: 'text-gray-600' },
                    { label: 'Starter Plan', count: stats.plans.starter, color: 'bg-primary-200', text: 'text-primary-600' },
                    { label: 'Pro Plan', count: stats.plans.pro, color: 'bg-primary-600', text: 'text-white' },
                  ].map((p) => (
                    <div key={p.label}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">{p.label}</span>
                        <span className="text-sm font-bold text-gray-900">{Math.round((p.count / stats.totalUsers) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-50 rounded-full h-3 overflow-hidden">
                        <div className={`${p.color} h-full transition-all duration-1000`} style={{ width: `${(p.count / stats.totalUsers) * 100}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-12 pt-8 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-bold text-gray-900">Platform Health</span>
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-700 rounded-lg text-[10px] font-black uppercase tracking-widest">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                            Stable
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">System is handling <strong>{stats.health.concurrentUsers}</strong> simultaneous active sessions with <strong>{stats.health.cpuUsage}%</strong> load.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="relative w-full sm:max-w-xs">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                 <input type="text" placeholder="Search users by name or email..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm" />
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                 <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
                    <Filter size={16} /> Filters
                 </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">User</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Plan</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Storage</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { id: 1, name: 'Ankita Sharma', email: 'ankita@example.com', plan: 'PRO', used: '12.4 GB', quota: '20 GB', status: 'Active' },
                    { id: 2, name: 'Rahul V.', email: 'rahul@qrvault.in', plan: 'STARTER', used: '4.2 GB', quota: '10 GB', status: 'Trial' },
                    { id: 3, name: 'Meet Gadhavi', email: 'admin@meet.dev', plan: 'PRO', used: '8.1 GB', quota: '50 GB', status: 'Active' },
                  ].map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black tracking-tighter uppercase ${u.plan === 'PRO' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'}`}>
                          {u.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-24">
                          <div className="flex justify-between items-center mb-1 text-[10px] font-bold text-gray-400">
                              <span>{u.used}</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1">
                              <div className="bg-primary-500 h-full rounded-full" style={{ width: '60%' }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                           <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                           <span className="text-xs font-medium text-gray-600">{u.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                            className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                            onClick={() => showNotify('User Detail', `Opening details for ${u.name}`, 'info')}
                        >
                           <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col max-h-[70vh] animate-fade-in-up">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
               <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Terminal size={18} className="text-primary-600" /> System Terminal
               </h3>
               <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest flex items-center gap-1.5">
                     <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> Listning
                  </span>
               </div>
            </div>
            <div className="bg-gray-900 p-6 overflow-y-auto flex-grow font-mono text-sm space-y-3 scrollbar-thin scrollbar-thumb-gray-800">
               {logs.length === 0 ? (
                 <p className="text-gray-500 italic">No logs captured yet...</p>
               ) : logs.map((log, i) => (
                 <div key={i} className="flex gap-4 group">
                    <span className="text-gray-600 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span className={`shrink-0 font-bold ${log.type === 'ERROR' ? 'text-red-400' : 'text-primary-400'}`}>{log.type}</span>
                    <span className="text-gray-300 group-hover:text-white transition-colors">{log.message}</span>
                 </div>
               ))}
               <div className="pt-4 text-primary-500/50 text-[10px] animate-pulse cursor-default select-none">_</div>
            </div>
          </div>
        )}

        {/* Placeholder for Transactions */}
        {activeTab === 'transactions' && (
           <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border-2 border-dashed border-gray-100 animate-fade-in-up">
              <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mb-6">
                 <CreditCard size={40} className="text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Transaction Management</h3>
              <p className="text-gray-500 text-center max-w-xs mb-8">Implementing high-secure transaction gateway tracking and invoice management system.</p>
              <button 
                  onClick={() => showNotify('Feature Coming Soon', 'Transaction filtering is being optimized.', 'info')}
                  className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-black transition-all shadow-xl shadow-gray-200"
              >
                  Update Records
              </button>
           </div>
        )}
      </main>

      {/* Notifications */}
      {notification && (
        <Toast 
           title={notification.title} 
           message={notification.message} 
           type={notification.type} 
           onClose={() => setNotification(null)} 
        />
      )}
    </div>
  );
};
