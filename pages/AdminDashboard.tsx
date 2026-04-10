import React, { useState, useEffect, useMemo } from 'react';
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
  AlertTriangle,
  History,
  Download,
  Receipt
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { AdminAuth } from './AdminAuth';
import { useNotification } from '../contexts/NotificationContext';

// Types
interface Stats {
  activeUsers: number;
  totalUsers: number;
  paidUsers: number;
  unpaidUsers: number;
  plans: { free: number; starter: number; pro: number };
  revenue: { last1Month: number[]; last3Months: number[]; last6Months: number[]; last12Months: number[] };
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
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-100 dark:border-white/10 p-4 min-w-[320px] flex items-start gap-4 ring-1 ring-black/5">
        <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">{icon}</div>
        <div className="flex-grow">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{message}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
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
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [revenuePeriod, setRevenuePeriod] = useState<'1M' | '3M' | '6M' | '12M'>('6M');
  const [selectedUserInvoices, setSelectedUserInvoices] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const { toast } = useNotification();

  const showNotify = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    toast(title, message, type);
  };
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

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'x-admin-password': adminPassword }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserInvoices = async (userId: string) => {
    try {
      setLoadingInvoices(true);
      const res = await fetch(`/api/admin/users/${userId}/invoices`, {
        headers: { 'x-admin-password': adminPassword }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedUserInvoices(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInvoices(false);
    }
  };

  useEffect(() => {
    if (selectedUser) {
      fetchUserInvoices(selectedUser.id);
    } else {
      setSelectedUserInvoices([]);
    }
  }, [selectedUser]);

  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        if (activeTab === 'home') fetchStats(adminPassword);
        if (activeTab === 'logs') fetchLogs();
        if (activeTab === 'users') fetchUsers();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, activeTab, adminPassword]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  if (!isAuthenticated) {
    return <AdminAuth onAuthenticated={(pw) => fetchStats(pw)} />;
  }

  // --- RENDERING HELPERS ---

  const MetricCard = ({ title, value, subValue, icon: Icon, trend }: any) => (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 bg-primary-50 dark:bg-primary-900/20 rounded-xl text-primary-600 dark:text-primary-400">
          <Icon size={22} />
        </div>
        {trend && (
          <span className={`flex items-center gap-1 text-xs font-bold ${trend > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</h3>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
        {subValue && <span className="text-xs text-gray-400 dark:text-gray-500">{subValue}</span>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-[#0a0a0a] flex transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-white/10 flex flex-col fixed inset-y-0 z-50">
        <div className="p-6">
          <div className="flex items-center gap-3 text-primary-600 mb-8">
            <div className="bg-primary-600 p-1.5 rounded-lg">
               <Server className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">Admin Control</span>
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
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 shadow-sm' 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <item.icon size={18} className={activeTab === item.id ? 'text-primary-600 dark:text-primary-400' : ''} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
 
        <div className="mt-auto p-6 border-t border-gray-100 dark:border-white/10">
           <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4">
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wider mb-2">System Health</p>
              <div className="flex items-center justify-between mb-1">
                 <span className="text-xs text-gray-600 dark:text-gray-400">Memory</span>
                 <span className="text-xs font-bold text-gray-900 dark:text-white">{stats?.health.memoryUsage}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                 <div className="bg-primary-500 dark:bg-primary-400 h-full transition-all duration-1000" style={{ width: `${stats?.health.memoryUsage}%` }}></div>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow ml-64 p-8 transition-all">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">{activeTab} Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Welcome back, system administrator.</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
                onClick={() => { fetchStats(adminPassword); showNotify('Refreshed', 'Dashboard data updated successfully', 'success'); }}
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all border border-transparent hover:border-gray-100 dark:hover:border-white/10 shadow-none hover:shadow-sm"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            <div className="h-10 w-px bg-gray-200 dark:bg-gray-800"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900 dark:text-white">Meet G.</p>
                <p className="text-[10px] text-primary-600 dark:text-primary-400 font-bold uppercase tracking-wider">Super Admin</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
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
              <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Revenue Analytics</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Monthly revenue growth from subscriptions</p>
                  </div>
                  <div className="flex bg-gray-50 dark:bg-gray-800 p-1 rounded-xl">
                    {(['1M', '3M', '6M', '12M'] as const).map((p) => (
                      <button 
                        key={p} 
                        onClick={() => setRevenuePeriod(p)}
                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${revenuePeriod === p ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={(revenuePeriod === '1M' ? stats.revenue.last1Month : 
                             revenuePeriod === '3M' ? stats.revenue.last3Months : 
                             revenuePeriod === '12M' ? stats.revenue.last12Months : 
                             stats.revenue.last6Months).map((val, i) => ({
                        name: revenuePeriod === '1M' ? `Day ${i+1}` : `Month ${i+1}`,
                        revenue: val
                      }))}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={useTheme().theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 10 }} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                        tickFormatter={(value) => `₹${value / 1000}k`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          border: 'none', 
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                        itemStyle={{ color: '#fff' }}
                        cursor={{ stroke: '#8b5cf6', strokeWidth: 2 }}
                       />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#8b5cf6" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorRevenue)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">User Distribution</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Breakdown of subscription plans</p>
                <div className="flex flex-col gap-6">
                  {[
                    { label: 'Free Plan', count: stats.plans.free, color: 'bg-gray-100', text: 'text-gray-600' },
                    { label: 'Starter Plan', count: stats.plans.starter, color: 'bg-primary-200', text: 'text-primary-600' },
                    { label: 'Pro Plan', count: stats.plans.pro, color: 'bg-primary-600', text: 'text-white' },
                  ].map((p) => (
                    <div key={p.label}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{p.label}</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{Math.round((p.count / stats.totalUsers) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-50 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
                        <div className={`${p.color} dark:bg-opacity-80 h-full transition-all duration-1000`} style={{ width: `${(p.count / stats.totalUsers) * 100}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-12 pt-8 border-t border-gray-100 dark:border-white/10">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">Platform Health</span>
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-[10px] font-black uppercase tracking-widest">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                            Stable
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">System is handling <strong>{stats.health.concurrentUsers}</strong> simultaneous active sessions with <strong>{stats.health.cpuUsage}%</strong> load.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-gray-100 dark:border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="relative w-full sm:max-w-xs">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
                 <input 
                   type="text" 
                   placeholder="Search users by name or email..." 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm dark:text-white" 
                 />
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                 <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                    <Filter size={16} /> Filters
                 </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">User</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Plan</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Storage</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-gray-400 dark:text-gray-500 italic text-sm">
                        No users match your search...
                      </td>
                    </tr>
                  ) : filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{u.name}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{u.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black tracking-tighter uppercase ${u.plan === 'PRO' ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : u.plan === 'STARTER' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                          {u.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-24">
                          <div className="flex justify-between items-center mb-1 text-[10px] font-bold text-gray-400 dark:text-gray-500">
                              <span>{u.used}</span>
                              <span>{u.quota}</span>
                          </div>
                          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1">
                              <div className="bg-primary-500 dark:bg-primary-400 h-full rounded-full" style={{ width: `${Math.min(100, (parseFloat(u.used) / parseFloat(u.quota)) * 100)}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                           <div className={`w-1.5 h-1.5 rounded-full ${u.status === 'Active' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                           <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{u.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                            className="p-2 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                            onClick={() => setSelectedUser(u)}
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
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden flex flex-col max-h-[70vh] animate-fade-in-up">
            <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center">
               <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Terminal size={18} className="text-primary-600 dark:text-primary-400" /> System Terminal
               </h3>
               <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest flex items-center gap-1.5">
                     <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> Listening
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
           <div className="flex flex-col items-center justify-center p-20 bg-white dark:bg-gray-900 rounded-3xl border-2 border-dashed border-gray-100 dark:border-white/10 animate-fade-in-up">
              <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-6">
                 <CreditCard size={40} className="text-gray-300 dark:text-gray-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Transaction Management</h3>
              <p className="text-gray-500 dark:text-gray-400 text-center max-w-xs mb-8">Implementing high-secure transaction gateway tracking and invoice management system.</p>
              <button 
                  onClick={() => showNotify('Feature Coming Soon', 'Transaction filtering is being optimized.', 'info')}
                  className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-black transition-all shadow-xl shadow-gray-200"
              >
                  Update Records
              </button>
           </div>
        )}
      </main>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-10 max-w-lg w-full shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:shadow-black/50 animate-in zoom-in-95 duration-300 relative overflow-hidden border border-transparent dark:border-white/10">
             <div className="absolute top-0 right-0 p-6">
                <button onClick={() => setSelectedUser(null)} className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                   <X size={24} />
                </button>
             </div>
             
             <div className="flex flex-col items-center mb-8">
                <div className="w-24 h-24 bg-primary-50 dark:bg-primary-900/30 rounded-3xl flex items-center justify-center mb-4 border-2 border-primary-100 dark:border-primary-800">
                   <Users size={40} className="text-primary-600 dark:text-primary-400" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">{selectedUser.name}</h2>
                <p className="text-gray-500 dark:text-gray-400 font-medium">{selectedUser.email}</p>
             </div>

             <div className="grid grid-cols-2 gap-4 mb-10">
                <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/10">
                   <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mb-1">Current Plan</p>
                   <p className="text-sm font-black text-gray-900 dark:text-white">{selectedUser.plan}</p>
                </div>
                <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/10">
                   <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mb-1">Status</p>
                   <p className={`text-sm font-black ${selectedUser.status === 'Active' ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>{selectedUser.status}</p>
                </div>
                <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/10">
                   <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mb-1">QR Code Quota</p>
                   <p className="text-sm font-black text-gray-900 dark:text-white">{selectedUser.used} / {selectedUser.quota}</p>
                </div>
                <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/10">
                   <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mb-1">Joined Date</p>
                   <p className="text-sm font-black text-gray-900 dark:text-white">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                </div>
             </div>

             <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-[2rem] border border-gray-100 dark:border-white/10">
                <div className="flex items-center gap-2 mb-4">
                   <Receipt size={18} className="text-primary-600 dark:text-primary-400" />
                   <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Billing History</h3>
                </div>
                
                <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-800">
                   {loadingInvoices ? (
                      <div className="py-8 flex flex-col items-center justify-center gap-2 opacity-50">
                         <RefreshCw className="animate-spin text-primary-600 dark:text-primary-400" size={24} />
                         <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Loading Invoices...</p>
                      </div>
                   ) : selectedUserInvoices.length === 0 ? (
                      <p className="text-xs text-gray-400 dark:text-gray-500 italic text-center py-4">No billing records found for this user.</p>
                   ) : selectedUserInvoices.map((inv, i) => (
                      <div key={i} className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-white/10 flex items-center justify-between group hover:border-primary-200 dark:hover:border-primary-900 transition-all">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center justify-center group-hover:bg-primary-50 dark:group-hover:bg-primary-900/30 transition-colors">
                               <History size={14} className="text-gray-400 dark:text-gray-500 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
                            </div>
                            <div>
                               <p className="text-xs font-black text-gray-900 dark:text-white">₹{inv.amount}</p>
                               <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{new Date(inv.timestamp).toLocaleDateString()}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-2">
                            <span className="text-[8px] font-black uppercase tracking-widest text-green-500 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded">Paid</span>
                            <Download size={14} className="text-gray-300 dark:text-gray-600 hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer" />
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             <div className="mt-8 flex gap-3">
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="flex-grow bg-primary-600 hover:bg-black text-white py-4 rounded-2xl font-black transition-all shadow-xl shadow-primary-200 flex items-center justify-center gap-2"
                >
                  Close Profile
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
