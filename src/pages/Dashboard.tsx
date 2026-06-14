import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lightbulb,
  ClipboardCheck,
  FolderKanban,
  Coins,
  Bell,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Plus,
  FileText,
  TrendingUp,
  Activity,
  ArrowRight,
  Sparkles,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAuthStore } from '@/store/useAuthStore';
import { useProposalStore } from '@/store/useProposalStore';
import { useApprovalStore } from '@/store/useApprovalStore';
import { useProjectStore } from '@/store/useProjectStore';
import { usePointsStore } from '@/store/usePointsStore';
import { useNotificationStore } from '@/store/useNotificationStore';

const encouragementList = [
  '创新无处不在，今天也要加油！',
  '每一个好点子都是改变的开始',
  '让我们一起创造更多价值',
  '你的提案可能就是下一个突破',
  '持续创新，持续进步',
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return '凌晨好';
  if (hour < 9) return '早上好';
  if (hour < 12) return '上午好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

function formatDate(date: Date): string {
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const weekday = weekdays[date.getDay()];
  return `${year}年${month}月${day}日 ${weekday}`;
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return formatDate(date);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { proposals, getProposalsBySubmitter } = useProposalStore();
  const { getPendingApprovalsByApprover, getApprovalThreshold } = useApprovalStore();
  const { projects, getProjectsByOwner } = useProjectStore();
  const { getUserTotalPoints } = usePointsStore();
  const { getUnreadNotifications } = useNotificationStore();
  const approvalThreshold = getApprovalThreshold();

  const isManagerOrCommittee = useMemo(() => {
    return currentUser?.role === 'manager' || currentUser?.role === 'committee' || currentUser?.role === 'admin';
  }, [currentUser]);

  const stats = useMemo(() => {
    const myProposals = currentUser ? getProposalsBySubmitter(currentUser.id) : [];
    const pendingApprovals = currentUser ? getPendingApprovalsByApprover(currentUser.id) : [];
    const myProjects = currentUser ? getProjectsByOwner(currentUser.id).filter(p => p.status === 'in_progress' || p.status === 'planning') : [];
    const myPoints = currentUser ? getUserTotalPoints(currentUser.id) : 0;
    return {
      proposalCount: myProposals.length,
      pendingApprovalCount: pendingApprovals.length,
      activeProjectCount: myProjects.length,
      points: myPoints,
    };
  }, [currentUser, getProposalsBySubmitter, getPendingApprovalsByApprover, getProjectsByOwner, getUserTotalPoints]);

  const todos = useMemo(() => {
    const list: Array<{
      id: string;
      type: 'approval' | 'milestone' | 'notification';
      title: string;
      description: string;
      urgency: 'high' | 'medium' | 'low';
      createdAt: Date;
    }> = [];

    if (currentUser) {
      const pendingApprovals = getPendingApprovalsByApprover(currentUser.id);
      pendingApprovals.forEach((a) => {
        const proposal = proposals.find(p => p.id === a.proposalId);
        if (proposal) {
          const isHighCost = proposal.estimatedCost > approvalThreshold;
          list.push({
            id: `approval-${a.id}`,
            type: 'approval',
            title: `待审批：${proposal.title}`,
            description: `预估成本 ¥${proposal.estimatedCost.toLocaleString()} · ${proposal.department}`,
            urgency: isHighCost ? 'high' : 'medium',
            createdAt: a.createdAt,
          });
        }
      });

      const myProjects = getProjectsByOwner(currentUser.id);
      myProjects.forEach((project) => {
        project.milestones.forEach((ms) => {
          if (ms.status === 'in_progress' || ms.status === 'pending') {
            const dueDate = new Date(ms.dueDate);
            const now = new Date();
            const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / 86400000);
            if (diffDays <= 3) {
              list.push({
                id: `milestone-${ms.id}`,
                type: 'milestone',
                title: `里程碑报告待提交：${ms.name}`,
                description: `项目「${project.name}」· ${diffDays < 0 ? `已逾期${Math.abs(diffDays)}天` : `还剩${diffDays}天`}`,
                urgency: diffDays <= 0 ? 'high' : diffDays <= 1 ? 'high' : 'medium',
                createdAt: dueDate,
              });
            }
          }
        });
      });

      const unread = getUnreadNotifications(currentUser.id).slice(0, 5);
      unread.forEach((n) => {
        list.push({
          id: `notification-${n.id}`,
          type: 'notification',
          title: n.title,
          description: n.content,
          urgency: n.type === 'error' ? 'high' : n.type === 'warning' ? 'medium' : 'low',
          createdAt: n.createdAt,
        });
      });
    }

    return list.sort((a, b) => {
      const urgencyRank = { high: 0, medium: 1, low: 2 };
      if (urgencyRank[a.urgency] !== urgencyRank[b.urgency]) {
        return urgencyRank[a.urgency] - urgencyRank[b.urgency];
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }).slice(0, 8);
  }, [currentUser, getPendingApprovalsByApprover, proposals, getProjectsByOwner, getUnreadNotifications]);

  const recentActivities = useMemo(() => {
    const activities: Array<{
      id: string;
      type: 'proposal' | 'approval' | 'project';
      icon: typeof Lightbulb;
      title: string;
      description: string;
      time: string;
      color: string;
    }> = [];

    if (currentUser) {
      getProposalsBySubmitter(currentUser.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3)
        .forEach((p) => {
          const statusText = {
            draft: '已保存为草稿',
            pending: '已提交待审批',
            approved: '已通过审批',
            rejected: '未通过审批',
            project_created: '已立项',
          }[p.status];
          activities.push({
            id: `act-p-${p.id}`,
            type: 'proposal',
            icon: Lightbulb,
            title: p.title,
            description: statusText,
            time: getRelativeTime(p.createdAt),
            color: p.status === 'approved' || p.status === 'project_created' ? 'text-accent-600' : p.status === 'rejected' ? 'text-warning-600' : 'text-primary-600',
          });
        });

      if (isManagerOrCommittee) {
        getPendingApprovalsByApprover(currentUser.id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 2)
          .forEach((a) => {
            const proposal = proposals.find(p => p.id === a.proposalId);
            if (proposal) {
              activities.push({
                id: `act-a-${a.id}`,
                type: 'approval',
                icon: ClipboardCheck,
                title: proposal.title,
                description: '待您审批',
                time: getRelativeTime(a.createdAt),
                color: 'text-warning-600',
              });
            }
          });
      }

      getProjectsByOwner(currentUser.id)
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
        .slice(0, 2)
        .forEach((p) => {
          const statusText = {
            planning: '筹备中',
            in_progress: '进行中',
            completed: '已完成',
            delayed: '已延期',
          }[p.status];
          activities.push({
            id: `act-prj-${p.id}`,
            type: 'project',
            icon: FolderKanban,
            title: p.name,
            description: `${statusText} · 进度 ${p.progress}%`,
            time: getRelativeTime(p.startDate),
            color: p.status === 'delayed' ? 'text-warning-600' : p.status === 'completed' ? 'text-accent-600' : 'text-primary-600',
          });
        });
    }

    return activities
      .sort((a, b) => {
        const timeA = new Date(a.time).getTime();
        const timeB = new Date(b.time).getTime();
        if (isNaN(timeA) || isNaN(timeB)) return 0;
        return timeB - timeA;
      })
      .slice(0, 6);
  }, [currentUser, getProposalsBySubmitter, isManagerOrCommittee, getPendingApprovalsByApprover, proposals, getProjectsByOwner]);

  const trendData = useMemo(() => {
    if (!currentUser) return [];
    const myProposals = getProposalsBySubmitter(currentUser.id);
    const monthMap = new Map<string, number>();
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap.set(key, 0);
    }
    myProposals.forEach((p) => {
      const d = new Date(p.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthMap.has(key)) {
        monthMap.set(key, (monthMap.get(key) || 0) + 1);
      }
    });
    return Array.from(monthMap.entries()).map(([month, count]) => ({
      month: month.slice(5) + '月',
      count,
    }));
  }, [currentUser, getProposalsBySubmitter]);

  const departmentData = useMemo(() => {
    const deptMap = new Map<string, { total: number; approved: number }>();
    proposals.forEach((p) => {
      if (!deptMap.has(p.department)) {
        deptMap.set(p.department, { total: 0, approved: 0 });
      }
      const dept = deptMap.get(p.department)!;
      dept.total += 1;
      if (p.status === 'approved' || p.status === 'project_created') {
        dept.approved += 1;
      }
    });
    const colors = ['#2f6eff', '#00c9a7', '#f85a1c', '#8b5cf6', '#f59e0b', '#ec4899'];
    return Array.from(deptMap.entries()).map(([name, data], index) => ({
      name,
      value: data.total > 0 ? Math.round((data.approved / data.total) * 100) : 0,
      fill: colors[index % colors.length],
    }));
  }, [proposals]);

  const today = new Date();
  const greeting = getGreeting();
  const encouragement = encouragementList[today.getDate() % encouragementList.length];

  const urgencyStyles = {
    high: 'border-l-warning-500 bg-warning-50/50',
    medium: 'border-l-primary-500 bg-primary-50/50',
    low: 'border-l-neutral-400 bg-neutral-50/50',
  };

  const urgencyBadge = {
    high: 'bg-warning-100 text-warning-700',
    medium: 'bg-primary-100 text-primary-700',
    low: 'bg-neutral-200 text-neutral-600',
  };

  const urgencyText = {
    high: '紧急',
    medium: '待办',
    low: '通知',
  };

  const statCards = [
    {
      label: '我的提案数',
      value: stats.proposalCount,
      icon: Lightbulb,
      gradient: 'from-primary-500 via-primary-600 to-primary-700',
      iconBg: 'bg-white/20',
      suffix: '件',
    },
    {
      label: '待我审批',
      value: stats.pendingApprovalCount,
      icon: ClipboardCheck,
      gradient: 'from-warning-500 via-warning-600 to-warning-700',
      iconBg: 'bg-white/20',
      suffix: '件',
      show: isManagerOrCommittee,
    },
    {
      label: '进行中项目',
      value: stats.activeProjectCount,
      icon: FolderKanban,
      gradient: 'from-accent-500 via-accent-600 to-accent-700',
      iconBg: 'bg-white/20',
      suffix: '个',
    },
    {
      label: '我的积分',
      value: stats.points,
      icon: Coins,
      gradient: 'from-amber-500 via-orange-500 to-warning-500',
      iconBg: 'bg-white/20',
      suffix: '分',
    },
  ].filter((c) => c.show !== false);

  const quickActions = [
    { label: '提交提案', icon: Plus, color: 'from-primary-500 to-primary-600', path: '/proposals/new' },
    { label: '我的提案', icon: FileText, color: 'from-accent-500 to-accent-600', path: '/proposals' },
    { label: '热门创新', icon: TrendingUp, color: 'from-warning-500 to-warning-600', path: '/proposals/hot' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="mb-8 animate-fade-in-up">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 via-primary-700 to-primary-900 p-8 shadow-lg">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-accent-400/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-gradient-to-tr from-white/5 to-transparent rounded-full translate-y-1/2" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles className="w-6 h-6 text-accent-300" />
                  <span className="text-primary-100 text-sm font-medium">{formatDate(today)}</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {greeting}，{currentUser?.name}！
                </h1>
                <p className="text-primary-100 text-lg">{encouragement}</p>
                <div className="flex items-center gap-4 mt-4 text-primary-200 text-sm">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {currentUser?.department}
                  </span>
                  <span className="capitalize bg-white/15 px-3 py-1 rounded-full text-xs font-medium">
                    {currentUser?.role}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-accent-400/20 rounded-xl">
                      <Coins className="w-7 h-7 text-accent-300" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-white">{stats.points}</div>
                      <div className="text-primary-200 text-xs">可用积分</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {statCards.map((card, index) => (
            <div
              key={card.label}
              className="relative overflow-hidden rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient}`} />
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${card.iconBg} backdrop-blur-sm`}>
                    <card.icon className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div className="text-4xl font-bold mb-1 tracking-tight">
                  {card.value}
                  <span className="text-lg font-normal ml-1 text-white/80">{card.suffix}</span>
                </div>
                <div className="text-white/80 text-sm font-medium">{card.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-card border border-neutral-100 overflow-hidden animate-fade-in-up" style={{ animationDelay: '150ms' }}>
              <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-warning-50 rounded-lg">
                    <Bell className="w-5 h-5 text-warning-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-900">待办事项</h2>
                    <p className="text-sm text-neutral-500">按紧急程度排序</p>
                  </div>
                </div>
                <span className="text-sm text-neutral-500">{todos.length} 条待办</span>
              </div>
              <div className="divide-y divide-neutral-50">
                {todos.length === 0 ? (
                  <div className="py-16 text-center">
                    <CheckCircle2 className="w-12 h-12 text-accent-400 mx-auto mb-3" />
                    <p className="text-neutral-500">暂无待办事项，做得真棒！</p>
                  </div>
                ) : (
                  todos.map((todo) => (
                    <div
                      key={todo.id}
                      className={`px-6 py-4 border-l-4 ${urgencyStyles[todo.urgency]} hover:bg-neutral-50 transition-colors cursor-pointer group`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-0.5">
                          {todo.urgency === 'high' ? (
                            <AlertTriangle className="w-5 h-5 text-warning-600" />
                          ) : todo.urgency === 'medium' ? (
                            <Clock className="w-5 h-5 text-primary-600" />
                          ) : (
                            <Bell className="w-5 h-5 text-neutral-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${urgencyBadge[todo.urgency]}`}>
                              {urgencyText[todo.urgency]}
                            </span>
                            <h3 className="font-medium text-neutral-900 truncate group-hover:text-primary-600 transition-colors">
                              {todo.title}
                            </h3>
                          </div>
                          <p className="text-sm text-neutral-500 truncate">{todo.description}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-primary-500 transition-colors flex-shrink-0" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-card border border-neutral-100 overflow-hidden animate-fade-in-up" style={{ animationDelay: '250ms' }}>
              <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-50 rounded-lg">
                    <Activity className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-900">最近动态</h2>
                    <p className="text-sm text-neutral-500">提案、审批与项目进展</p>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4">
                {recentActivities.length === 0 ? (
                  <div className="py-12 text-center">
                    <Activity className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                    <p className="text-neutral-500">暂无动态记录</p>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-neutral-100" />
                    <div className="space-y-1">
                      {recentActivities.map((activity) => (
                        <div key={activity.id} className="relative flex items-start gap-4 py-3 pl-2">
                          <div className={`relative z-10 p-2 rounded-lg bg-white shadow-sm border border-neutral-100 ${activity.color}`}>
                            <activity.icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-4">
                              <h4 className="font-medium text-neutral-900 truncate">{activity.title}</h4>
                              <span className="text-xs text-neutral-400 whitespace-nowrap">{activity.time}</span>
                            </div>
                            <p className="text-sm text-neutral-500 mt-0.5">{activity.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-card border border-neutral-100 overflow-hidden animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <div className="px-6 py-5 border-b border-neutral-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent-50 rounded-lg">
                    <Plus className="w-5 h-5 text-accent-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-900">快捷操作</h2>
                    <p className="text-sm text-neutral-500">一键直达常用功能</p>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => navigate(action.path)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-neutral-50 border border-transparent hover:border-neutral-200 transition-all group"
                  >
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${action.color} text-white shadow-md group-hover:shadow-lg transition-shadow`}>
                      <action.icon className="w-5 h-5" />
                    </div>
                    <span className="flex-1 text-left font-medium text-neutral-800">{action.label}</span>
                    <ArrowRight className="w-5 h-5 text-neutral-300 group-hover:text-neutral-600 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-card border border-neutral-100 overflow-hidden animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              <div className="px-6 py-5 border-b border-neutral-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-900">提案趋势</h2>
                    <p className="text-sm text-neutral-500">近6个月提案数量</p>
                  </div>
                </div>
              </div>
              <div className="px-4 py-4">
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2f6eff" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#2f6eff" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#768da4', fontSize: 11 }}
                        dy={8}
                      />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1a252f',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px',
                          padding: '6px 10px',
                        }}
                        labelStyle={{ color: '#a6b6c6', marginBottom: '2px' }}
                        itemStyle={{ color: '#fff', padding: 0 }}
                        cursor={{ stroke: '#2f6eff', strokeWidth: 1, strokeDasharray: '4 4' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#2f6eff"
                        strokeWidth={2.5}
                        fill="url(#trendGradient)"
                        dot={{ fill: '#2f6eff', strokeWidth: 0, r: 3 }}
                        activeDot={{ fill: '#2f6eff', stroke: '#fff', strokeWidth: 2, r: 5 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-card border border-neutral-100 overflow-hidden animate-fade-in-up" style={{ animationDelay: '350ms' }}>
              <div className="px-6 py-5 border-b border-neutral-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent-50 rounded-lg">
                    <Lightbulb className="w-5 h-5 text-accent-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-900">部门采纳率</h2>
                    <p className="text-sm text-neutral-500">各部门提案通过情况</p>
                  </div>
                </div>
              </div>
              <div className="px-4 py-4">
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={departmentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={68}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {departmentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1a252f',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px',
                          padding: '6px 10px',
                        }}
                        formatter={(value: number) => [`${value}%`, '采纳率']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {departmentData.slice(0, 4).map((dept) => (
                    <div key={dept.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: dept.fill }} />
                      <span className="text-xs text-neutral-600 truncate">{dept.name}</span>
                      <span className="text-xs font-medium text-neutral-900 ml-auto">{dept.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
