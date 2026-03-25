import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import DailyTrackerScreen from './components/DailyTrackerScreen';
import InsightsScreen from './components/InsightsScreen';
import { Sidebar } from './components/Sidebar';
import { 
  Bell, 
  ChevronRight, 
  Search, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  RefreshCw, 
  MessageSquare, 
  X, 
  Send,
  Star,
  Download,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  MoreVertical,
  User,
  FileText,
  Target
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for Tailwind class merging
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---

type Screen = 'dashboard' | 'tracker' | 'insights';

interface LogEntry {
  id: string;
  time: string;
  task: string;
  goal: string;
  status: 'Completed' | 'Pending';
}

interface Task {
  id: string;
  goalId: string;
  text: string;
  completed: boolean;
}

interface Goal {
  id: string;
  title: string;
  progress: number;
  color: string;
}

interface Attribute {
  id: string;
  name: string;
  rating: number;
  notes: string;
}

// --- Components ---

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title?: string;
  className?: string;
  onClick?: () => void;
  key?: React.Key;
}

const Card = ({ children, className, title, ...props }: CardProps) => (
  <div className={cn("bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-visible", className)} {...props}>
    {title && <h3 className="text-lg font-semibold mb-4 text-gray-800">{title}</h3>}
    {children}
  </div>
);
const KPICard = ({ title, value, change, trend, icon: Icon }: { title: string, value: string | number, change: string, trend: 'up' | 'down', icon: any }) => (
  <Card className="flex flex-col gap-2">
    <div className="flex justify-between items-start">
      <div className="p-2 bg-emerald-50 rounded-lg">
        <Icon className="w-5 h-5 text-emerald-600" />
      </div>
      <div className={cn(
        "flex items-center text-xs font-medium px-2 py-1 rounded-full",
        trend === 'up' ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"
      )}>
        {trend === 'up' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
        {change}
      </div>
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <h4 className="text-2xl font-bold text-gray-900 mt-1">{value}</h4>
    </div>
  </Card>
);

const Badge = ({ children, variant }: { children: React.ReactNode, variant: 'success' | 'warning' }) => (
  <span className={cn(
    "px-2.5 py-0.5 rounded-full text-xs font-medium",
    variant === 'success' ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
  )}>
    {children}
  </span>
);

// --- Main App ---

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, user } = useAuth();
  const [activeScreen, setActiveScreen] = useState<Screen>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'ai' | 'user', text: string }[]>([
    { role: 'ai', text: 'Hello! I am your RBE Copilot. How can I help you with your daily logging today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);

  // Handle navigation state for screen changes from other pages
  useEffect(() => {
    const state = location.state as { screen?: string };
    if (state?.screen) {
      setActiveScreen(state.screen as Screen);
      // Clear the state to prevent re-triggering
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    
    // Simulate AI response
    setTimeout(() => {
      setChatMessages(prev => [...prev, { role: 'ai', text: 'I am processing your request... (Simulated Response)' }]);
    }, 1000);
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'tracker':
        return <DailyTrackerScreen isAIAnalyzing={isAIAnalyzing} setIsAIAnalyzing={setIsAIAnalyzing} tasks={tasks} setTasks={setTasks} />;
      case 'insights':
        return <InsightsScreen />;
      default:
        return <div className="p-8 text-center text-gray-500">Screen under development</div>;
    }
  };

  return (
    <div className="flex h-screen bg-white font-sans text-gray-900 overflow-hidden">
      {/* Shared Sidebar */}
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        activeScreen={activeScreen}
        onScreenChange={(screen) => setActiveScreen(screen as Screen)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2 rounded-lg hover:bg-gray-50 text-gray-500 transition-colors"
              aria-label="Toggle Sidebar"
            >
              <MoreVertical className="w-5 h-5 rotate-90" />
            </button>
            <div className="flex items-center text-sm text-gray-400">
              <span>Home</span>
              <ChevronRight className="w-4 h-4 mx-1" />
              <span className="text-gray-900 font-medium capitalize">{activeScreen}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative">
              <Bell className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">3</span>
            </div>
            <div className="flex items-center gap-3 pl-6 border-l border-gray-100">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-900">{profile?.full_name || user?.email || 'User'}</p>
                <p className="text-xs text-gray-500">{profile?.department || 'Employee'}</p>
              </div>
              <button
                onClick={() => navigate('/profile')}
                className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 hover:bg-emerald-200 transition-colors cursor-pointer"
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Screen Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-gray-50/30 min-w-0">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6 md:mb-8">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 capitalize">{activeScreen.replace('-', ' ')}</h1>
                <p className="text-gray-500 mt-1 text-sm md:text-base">Manage your daily progress and goal alignment.</p>
              </div>
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={activeScreen}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderScreen()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Footer */}
        <footer className="h-12 bg-white border-t border-gray-100 flex items-center justify-between px-8 text-xs text-gray-400">
          <p>© 2026 DevPulse AI. v1.0 Prototype</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-gray-600">Docs</a>
            <a href="#" className="hover:text-gray-600">Privacy</a>
            <a href="#" className="hover:text-gray-600">Terms</a>
          </div>
        </footer>

        {/* Floating Chatbot */}
        <div className="fixed bottom-8 right-8 z-30">
          <AnimatePresence>
            {isChatOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="absolute bottom-20 right-0 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
              >
                <div className="p-4 bg-emerald-500 text-white flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">AI Copilot</p>
                      <p className="text-[10px] opacity-80">Always active</p>
                    </div>
                  </div>
                  <button onClick={() => setIsChatOpen(false)} className="p-1 hover:bg-white/10 rounded">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[80%] p-3 rounded-2xl text-sm",
                        msg.role === 'user' 
                          ? "bg-emerald-500 text-white rounded-tr-none" 
                          : "bg-gray-100 text-gray-800 rounded-tl-none"
                      )}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t border-gray-100 flex gap-2">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..." 
                    className="flex-1 bg-gray-50 border-none rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <button 
                    onClick={handleSendMessage}
                    className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button 
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="w-14 h-14 bg-emerald-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-emerald-600 transition-all hover:scale-110 active:scale-95"
          >
            <MessageSquare className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Dashboard Screen ---

function DashboardScreen() {
  const { user } = useAuth();
  const [dailyLogs, setDailyLogs] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [loggingTrend, setLoggingTrend] = useState<any[]>([]);
  const [goalDistribution, setGoalDistribution] = useState<any[]>([]);
  const [stats, setStats] = useState({
    logsToday: 0,
    goalAlignment: 0,
    tasksCompleted: 0,
    avgLoggingTime: '0s',
    loggingRate: 0
  });

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    
    try {
      // Fetch daily logs
      const { data: logsData, error: logsError } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (logsError) throw logsError;
      setDailyLogs(logsData || []);

      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id);

      if (tasksError) throw tasksError;
      setTasks(tasksData || []);

      // Fetch goals
      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id);

      if (goalsError) throw goalsError;
      setGoals(goalsData || []);

      // Calculate stats
      const today = new Date().toDateString();
      const logsToday = (logsData || []).filter((log: any) => 
        new Date(log.created_at).toDateString() === today
      ).length;

      const completedTasks = (tasksData || []).filter((task: any) => 
        task.status === 'completed'
      ).length;

      const totalTasks = (tasksData || []).length;
      const goalAlignment = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Calculate logging rate (logs today vs expected daily logs)
      const expectedDailyLogs = 5; // Target: 5 logs per day
      const loggingRate = Math.min(Math.round((logsToday / expectedDailyLogs) * 100), 100);

      // Calculate average logging time (estimate based on log count and complexity)
      // For now, estimate: more logs = faster logging (user is in flow)
      const avgTimeSeconds = logsToday > 0 
        ? Math.max(15, Math.min(45, 30 - (logsToday * 2))) 
        : 0;
      const avgLoggingTime = logsToday > 0 ? `${avgTimeSeconds}s` : '0s';

      setStats({
        logsToday,
        goalAlignment,
        tasksCompleted: completedTasks,
        avgLoggingTime,
        loggingRate
      });

      // Calculate 7-day logging trend
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date;
      });

      const trendData = last7Days.map(date => {
        const dateStr = date.toDateString();
        const count = (logsData || []).filter((log: any) => 
          new Date(log.created_at).toDateString() === dateStr
        ).length;
        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          count
        };
      });
      setLoggingTrend(trendData);

      // Calculate goal distribution
      const distribution = (goalsData || []).map((goal: any) => {
        const taskCount = (tasksData || []).filter((task: any) => 
          task.goal_id === goal.goal_code
        ).length;
        return {
          name: goal.goal_code,
          value: taskCount
        };
      }).filter((item: any) => item.value > 0);
      setGoalDistribution(distribution.length > 0 ? distribution : [{ name: 'No Data', value: 1 }]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  return (
    <div className="space-y-6 min-w-0">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-w-0">
        <KPICard title="Logs Today" value={stats.logsToday} change="+12%" trend="up" icon={FileText} />
        <KPICard title="Goal Alignment" value={`${stats.goalAlignment}%`} change="+5%" trend="up" icon={Target} />
        <KPICard title="Tasks Completed" value={stats.tasksCompleted} change="-3%" trend="down" icon={CheckCircle2} />
        <KPICard title="Avg Logging Time" value={stats.avgLoggingTime} change="improvement" trend="up" icon={Clock} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0">
        <Card title="Logging Trend (7 Days)" className="lg:col-span-2">
          <div className="h-[300px] w-full">
            {loggingTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={loggingTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No logging data yet</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card title="Goal Distribution">
          <div className="h-[300px] w-full">
            {goalDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={goalDistribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No goals or tasks yet</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0">
        <Card title="Recent Logs" className="lg:col-span-2 overflow-visible">
          <div className="overflow-x-auto -mx-6 min-w-0">
            {dailyLogs.length > 0 ? (
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Time</th>
                    <th className="px-6 py-3 font-semibold">Task</th>
                    <th className="px-6 py-3 font-semibold">Goal</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dailyLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-500">{log.time || new Date(log.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{log.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">{log.goal_id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={log.status === 'completed' ? 'success' : 'warning'}>
                          {log.status === 'completed' ? 'Completed' : 'Pending'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No logs yet. Start tracking your activities!</p>
              </div>
            )}
          </div>
        </Card>

        <Card title="Impact Metrics">
          <div className="space-y-6">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-emerald-800">Logging Rate</span>
                <span className="text-xs font-bold text-emerald-600">{stats.loggingRate}%</span>
              </div>
              <div className="w-full h-2 bg-emerald-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${stats.loggingRate}%` }}></div>
              </div>
              <p className="text-[10px] text-emerald-600 mt-2">Target: 80% (4+ logs/day)</p>
            </div>

            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-blue-800">Time per Entry</span>
                <span className="text-xs font-bold text-blue-600">{stats.avgLoggingTime}</span>
              </div>
              <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500" 
                  style={{ 
                    width: stats.avgLoggingTime !== '0s' 
                      ? `${Math.max(0, Math.min(100, 100 - (parseInt(stats.avgLoggingTime) - 15) * 2))}%` 
                      : '0%' 
                  }}
                ></div>
              </div>
              <p className="text-[10px] text-blue-600 mt-2">Target: &lt;30s</p>
            </div>

            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-purple-800">Goal Alignment</span>
                <span className="text-xs font-bold text-purple-600">{stats.goalAlignment}%</span>
              </div>
              <div className="w-full h-2 bg-purple-200 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500" style={{ width: `${stats.goalAlignment}%` }}></div>
              </div>
              <p className="text-[10px] text-purple-600 mt-2">Target: 90%</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// --- Screen Components (Moved to separate files) ---
// DailyTrackerScreen: Combines Daily Log, Goals, and Tasks
// InsightsScreen: Combines Weekly Summary and Attributes
