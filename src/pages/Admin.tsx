import { useState, useMemo, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  CheckCircle,
  Coins,
  Download,
  Building2,
  Calendar,
  Sparkles,
  Lightbulb,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Brain,
  Flame,
} from 'lucide-react';
import { useProposalStore } from '@/store/useProposalStore';
import { useProjectStore } from '@/store/useProjectStore';
import { usePointsStore } from '@/store/usePointsStore';
import { useAuthStore } from '@/store/useAuthStore';
import { exportToCSV, generateFilename } from '@/utils/export';
import { formatDate } from '@/utils/date';
import { departments } from '@/data/users';

type TimeRange = 'monthly' | 'quarterly' | 'yearly';

const COLORS = ['#2f6eff', '#00c9a7', '#f85a1c', '#8b5cf6', '#f59e0b'];

function getDateRange(timeRange: TimeRange): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  let start: Date;

  switch (timeRange) {
    case 'monthly':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'quarterly':
      const quarter = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), quarter * 3, 1);
      break;
    case 'yearly':
      start = new Date(now.getFullYear(), 0, 1);
      break;
  }
  return { start, end };
}

function isInDateRange(date: Date, start: Date, end: Date): boolean {
  const d = new Date(date);
  return d >= start && d <= end;
}

export default function Admin() {
  const { proposals } = useProposalStore();
  const { projects } = useProjectStore();
  const { rewards, records } = usePointsStore();
  const { allUsers } = useAuthStore();

  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('monthly');

  const dateRange = useMemo(() => getDateRange(timeRange), [timeRange]);

  const filterByDeptAndDate = useCallback(<T extends { department?: string; createdAt?: Date }>(
    items: T[],
    deptField: keyof T = 'department' as keyof T,
    dateField: keyof T = 'createdAt' as keyof T
  ): T[] => {
    return items.filter((item) => {
      if (selectedDepartment !== 'all' && item[deptField] !== selectedDepartment) {
        return false;
      }
      if (item[dateField]) {
        const itemDate = new Date(item[dateField] as unknown as Date);
        return isInDateRange(itemDate, dateRange.start, dateRange.end);
      }
      return true;
    });
  }, [selectedDepartment, dateRange]);

  const filteredProposals = useMemo(() => {
    return filterByDeptAndDate(proposals);
  }, [proposals, filterByDeptAndDate]);

  const filteredProjects = useMemo(() => {
    if (selectedDepartment === 'all') {
      return projects.filter(p => isInDateRange(p.startDate, dateRange.start, dateRange.end));
    }
    return projects.filter(p => {
      const proposal = proposals.find(prop => prop.id === p.proposalId);
      const deptMatch = proposal?.department === selectedDepartment;
      const dateMatch = isInDateRange(p.startDate, dateRange.start, dateRange.end);
      return deptMatch && dateMatch;
    });
  }, [projects, proposals, selectedDepartment, dateRange, filterByDeptAndDate]);

  const filteredRecords = useMemo(() => {
    return records.filter(r => isInDateRange(r.createdAt, dateRange.start, dateRange.end));
  }, [records, dateRange]);

  const stats = useMemo(() => {
    const totalProposals = filteredProposals.length;
    const approvedProposals = filteredProposals.filter(
      (p) => p.status === 'approved' || p.status === 'project_created'
    ).length;
    const approvalRate = totalProposals > 0 ? Math.round((approvedProposals / totalProposals) * 100) : 0;

    const totalProjects = filteredProjects.length;
    const completedProjects = filteredProjects.filter((p) => p.status === 'completed').length;
    const projectCompletionRate =
      totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;

    const totalEarnedPoints = filteredRecords.filter((r) => r.type === 'earn').reduce((sum, r) => sum + r.amount, 0);
    const totalRedeemedPoints = filteredRecords.filter((r) => r.type === 'redeem').reduce((sum, r) => sum + r.amount, 0);
    const pointsRedeemRate = totalEarnedPoints > 0 ? Math.round((totalRedeemedPoints / totalEarnedPoints) * 100) : 0;

    return {
      totalProposals,
      approvalRate,
      projectCompletionRate,
      pointsRedeemRate,
      totalEarnedPoints,
      totalRedeemedPoints,
    };
  }, [filteredProposals, filteredProjects, filteredRecords]);

  const departmentChartData = useMemo(() => {
    const deptsToShow = selectedDepartment === 'all' ? departments : [selectedDepartment];
    return deptsToShow.map((dept) => {
      const deptProposals = filteredProposals.filter((p) => p.department === dept);
      const approved = deptProposals.filter(
        (p) => p.status === 'approved' || p.status === 'project_created'
      ).length;
      return {
        department: dept,
        提案数: deptProposals.length,
        采纳数: approved,
      };
    });
  }, [filteredProposals, selectedDepartment]);

  const monthlyTrendData = useMemo(() => {
    const months = [];
    let monthCount = 6;
    if (timeRange === 'quarterly') monthCount = 4;
    if (timeRange === 'yearly') monthCount = 12;

    for (let i = monthCount - 1; i >= 0; i--) {
      const date = new Date(dateRange.end.getFullYear(), dateRange.end.getMonth() - i, 1);
      const monthLabel = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      const monthProposals = filteredProposals.filter((p) => {
        const pDate = new Date(p.createdAt);
        return pDate >= monthStart && pDate <= monthEnd;
      });
      const approved = monthProposals.filter(
        (p) => p.status === 'approved' || p.status === 'project_created'
      ).length;

      months.push({
        month: monthLabel,
        提案数: monthProposals.length,
        采纳数: approved,
      });
    }
    return months;
  }, [filteredProposals, dateRange, timeRange]);

  const pointsDistributionData = useMemo(() => {
    const giftPoints = filteredRecords
      .filter((r) => r.type === 'redeem')
      .filter((r) => {
        const reward = r.rewardId ? rewards.find((rw) => rw.id === r.rewardId) : null;
        return reward?.type === 'gift';
      })
      .reduce((sum, r) => sum + r.amount, 0);

    const trainingPoints = filteredRecords
      .filter((r) => r.type === 'redeem')
      .filter((r) => {
        const reward = r.rewardId ? rewards.find((rw) => rw.id === r.rewardId) : null;
        return reward?.type === 'training';
      })
      .reduce((sum, r) => sum + r.amount, 0);

    const unredeemedPoints = allUsers.reduce((sum, u) => sum + u.points, 0);

    const data = [];
    if (giftPoints > 0) data.push({ name: '礼品兑换', value: giftPoints });
    if (trainingPoints > 0) data.push({ name: '培训兑换', value: trainingPoints });
    if (unredeemedPoints > 0) data.push({ name: '未兑换', value: unredeemedPoints });

    return data.length > 0 ? data : [{ name: '暂无数据', value: 1 }];
  }, [filteredRecords, rewards, allUsers]);

  const heatmapData = useMemo(() => {
    const keywordCount: Record<string, number> = {};
    filteredProposals.forEach((p) => {
      p.keywords.forEach((kw) => {
        keywordCount[kw] = (keywordCount[kw] || 0) + 1;
      });
    });
    const sorted = Object.entries(keywordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);
    const maxCount = Math.max(...sorted.map(([, c]) => c), 1);
    return sorted.map(([keyword, count]) => ({
      keyword,
      count,
      intensity: count / maxCount,
    }));
  }, [filteredProposals]);

  const aiSuggestions = useMemo(() => {
    const topDept = departmentChartData
      .slice()
      .sort((a, b) => b.提案数 - a.提案数)[0];
    const lowDept = departmentChartData
      .slice()
      .sort((a, b) => a.提案数 - b.提案数)[0];
    const hotKeywords = heatmapData.slice(0, 3).map((d) => d.keyword);

    return [
      {
        id: 1,
        title: '重点激励部门',
        content: `${lowDept?.department || '部分部门'}提案活跃度较低，建议组织专项创新培训活动，提升员工参与热情。`,
        type: 'warning' as const,
      },
      {
        id: 2,
        title: '热门创新方向',
        content: `当前热点集中在"${hotKeywords.join('"、"')}"领域，建议设立专项创新基金，鼓励相关方向的深度探索。`,
        type: 'success' as const,
      },
      {
        id: 3,
        title: '积分策略优化',
        content: `当前积分兑换率为${stats.pointsRedeemRate}%，建议增加热门礼品库存，提升积分消耗速度和员工获得感。`,
        type: 'info' as const,
      },
      {
        id: 4,
        title: '项目跟踪建议',
        content: `项目完成率${stats.projectCompletionRate}%，建议加强对在途项目的里程碑管理，确保按时交付。`,
        type: 'info' as const,
      },
    ];
  }, [departmentChartData, heatmapData, stats]);

  const handleExport = () => {
    const deptsToShow = selectedDepartment === 'all' ? departments : [selectedDepartment];

    const summaryData = deptsToShow.map((dept) => {
      const deptProposals = filteredProposals.filter(p => p.department === dept);
      const deptApproved = deptProposals.filter(
        p => p.status === 'approved' || p.status === 'project_created'
      ).length;
      const deptProjects = filteredProjects.filter(p => {
        const proposal = proposals.find(prop => prop.id === p.proposalId);
        return proposal?.department === dept;
      });
      const deptCompleted = deptProjects.filter(p => p.status === 'completed').length;

      const deptRecords = records.filter(r => {
        const user = allUsers.find(u => u.id === r.userId);
        return user?.department === dept && isInDateRange(r.createdAt, dateRange.start, dateRange.end);
      });
      const pointsEarned = deptRecords.filter(r => r.type === 'earn').reduce((sum, r) => sum + r.amount, 0);
      const pointsRedeemed = deptRecords.filter(r => r.type === 'redeem').reduce((sum, r) => sum + r.amount, 0);

      return {
        部门: dept,
        提案总数: deptProposals.length,
        采纳数: deptApproved,
        采纳率: deptProposals.length > 0 ? `${Math.round((deptApproved / deptProposals.length) * 100)}%` : '0%',
        项目总数: deptProjects.length,
        完成项目数: deptCompleted,
        项目完成率: deptProjects.length > 0 ? `${Math.round((deptCompleted / deptProjects.length) * 100)}%` : '0%',
        发放积分: pointsEarned,
        兑换积分: pointsRedeemed,
        净剩余积分: pointsEarned - pointsRedeemed,
        积分兑换率: pointsEarned > 0 ? `${Math.round((pointsRedeemed / pointsEarned) * 100)}%` : '0%',
        统计周期: `${formatDate(dateRange.start, 'YYYY-MM-DD')} 至 ${formatDate(dateRange.end, 'YYYY-MM-DD')}`,
      };
    });

    const columns = [
      { key: '部门', title: '部门' },
      { key: '提案总数', title: '提案总数' },
      { key: '采纳数', title: '采纳数' },
      { key: '采纳率', title: '采纳率' },
      { key: '项目总数', title: '项目总数' },
      { key: '完成项目数', title: '完成项目数' },
      { key: '项目完成率', title: '项目完成率' },
      { key: '发放积分', title: '发放积分' },
      { key: '兑换积分', title: '兑换积分' },
      { key: '净剩余积分', title: '净剩余积分' },
      { key: '积分兑换率', title: '积分兑换率' },
      { key: '统计周期', title: '统计周期' },
    ];

    exportToCSV(summaryData, columns, {
      filename: generateFilename(`月度创新报表_${selectedDepartment === 'all' ? '全部门' : selectedDepartment}`),
    });
  };

  const getHeatmapColor = (intensity: number) => {
    if (intensity > 0.8) return 'bg-primary-500 text-white';
    if (intensity > 0.6) return 'bg-primary-400 text-white';
    if (intensity > 0.4) return 'bg-primary-300 text-primary-900';
    if (intensity > 0.2) return 'bg-primary-200 text-primary-800';
    return 'bg-primary-100 text-primary-700';
  };

  const getSuggestionStyle = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-accent-200 bg-accent-50';
      case 'warning':
        return 'border-warning-200 bg-warning-50';
      default:
        return 'border-primary-200 bg-primary-50';
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <TrendingUp className="h-5 w-5 text-accent-600" />;
      case 'warning':
        return <Target className="h-5 w-5 text-warning-600" />;
      default:
        return <Lightbulb className="h-5 w-5 text-primary-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">管理员看板</h1>
          <p className="mt-1 text-sm text-neutral-500">全局数据概览与创新趋势分析</p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-600 active:bg-primary-700"
        >
          <Download className="h-4 w-4" />
          导出月度报表
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-card sm:flex-row sm:items-center sm:gap-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-neutral-400" />
          <span className="text-sm font-medium text-neutral-600">部门筛选：</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedDepartment('all')}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                selectedDepartment === 'all'
                  ? 'bg-primary-500 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              全部
            </button>
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDepartment(dept)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  selectedDepartment === dept
                    ? 'bg-primary-500 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Calendar className="h-5 w-5 text-neutral-400" />
          <span className="text-sm font-medium text-neutral-600">时间范围：</span>
          <div className="flex rounded-lg bg-neutral-100 p-0.5">
            {(['monthly', 'quarterly', 'yearly'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                {range === 'monthly' ? '月度' : range === 'quarterly' ? '季度' : '年度'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-card animate-fade-in-up" style={{ animationDelay: '0ms' }}>
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
              <BarChart3 className="h-6 w-6 text-primary-600" />
            </div>
            <div className="inline-flex items-center gap-1 rounded-full bg-accent-50 px-2 py-1 text-xs font-medium text-accent-700">
              <ArrowUpRight className="h-3 w-3" />
              12%
            </div>
          </div>
          <p className="mt-4 text-sm font-medium text-neutral-500">总提案数</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-neutral-900">
            {stats.totalProposals}
          </p>
          <p className="mt-2 text-xs text-neutral-400">较上月同期增长</p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-card animate-fade-in-up" style={{ animationDelay: '50ms' }}>
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-50">
              <CheckCircle className="h-6 w-6 text-accent-600" />
            </div>
            <div className="inline-flex items-center gap-1 rounded-full bg-accent-50 px-2 py-1 text-xs font-medium text-accent-700">
              <ArrowUpRight className="h-3 w-3" />
              5%
            </div>
          </div>
          <p className="mt-4 text-sm font-medium text-neutral-500">采纳率</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-neutral-900">
            {stats.approvalRate}%
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent-400 to-accent-500 transition-all duration-500"
              style={{ width: `${stats.approvalRate}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-card animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning-50">
              <Target className="h-6 w-6 text-warning-600" />
            </div>
            <div className="inline-flex items-center gap-1 rounded-full bg-warning-50 px-2 py-1 text-xs font-medium text-warning-700">
              <ArrowDownRight className="h-3 w-3" />
              2%
            </div>
          </div>
          <p className="mt-4 text-sm font-medium text-neutral-500">项目完成率</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-neutral-900">
            {stats.projectCompletionRate}%
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-warning-400 to-warning-500 transition-all duration-500"
              style={{ width: `${stats.projectCompletionRate}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-card animate-fade-in-up" style={{ animationDelay: '150ms' }}>
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
              <Coins className="h-6 w-6 text-primary-600" />
            </div>
            <div className="inline-flex items-center gap-1 rounded-full bg-accent-50 px-2 py-1 text-xs font-medium text-accent-700">
              <ArrowUpRight className="h-3 w-3" />
              8%
            </div>
          </div>
          <p className="mt-4 text-sm font-medium text-neutral-500">积分兑换率</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-neutral-900">
            {stats.pointsRedeemRate}%
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-500 transition-all duration-500"
              style={{ width: `${stats.pointsRedeemRate}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-card lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-neutral-900">各部门提案与采纳对比</h3>
              <p className="mt-1 text-xs text-neutral-500">部门创新活跃度分析</p>
            </div>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentChartData} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeef3" />
                <XAxis dataKey="department" tick={{ fontSize: 12, fill: '#567088' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#567088' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #eaeef3',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08)',
                  }}
                />
                <Legend />
                <Bar dataKey="提案数" fill="#2f6eff" radius={[6, 6, 0, 0]} />
                <Bar dataKey="采纳数" fill="#00c9a7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-neutral-900">积分兑换分布</h3>
              <p className="mt-1 text-xs text-neutral-500">积分使用结构分析</p>
            </div>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pointsDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pointsDistributionData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `${value.toLocaleString()} 积分`}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #eaeef3',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08)',
                  }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-neutral-900">近{timeRange === 'monthly' ? '6个月' : timeRange === 'quarterly' ? '4个季度' : '12个月'}提案趋势</h3>
            <p className="mt-1 text-xs text-neutral-500">提案提交与采纳数量变化</p>
          </div>
        </div>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyTrendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeef3" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#567088' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#567088' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #eaeef3',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08)',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="提案数"
                stroke="#2f6eff"
                strokeWidth={3}
                dot={{ fill: '#2f6eff', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="采纳数"
                stroke="#00c9a7"
                strokeWidth={3}
                dot={{ fill: '#00c9a7', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-card">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-50">
              <Flame className="h-5 w-5 text-warning-500" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-900">热门创新领域</h3>
              <p className="text-xs text-neutral-500">基于关键词频次热力图</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {heatmapData.length > 0 ? (
              heatmapData.map((item) => (
                <div
                  key={item.keyword}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-transform hover:scale-105 ${getHeatmapColor(
                    item.intensity
                  )}`}
                >
                  #{item.keyword}
                  <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
                    {item.count}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-neutral-400">暂无数据</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-card">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-900">AI 智能建议</h3>
              <p className="text-xs text-neutral-500">基于数据分析的管理建议</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {aiSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className={`flex items-start gap-3 rounded-xl border p-4 ${getSuggestionStyle(
                  suggestion.type
                )}`}
              >
                <div className="mt-0.5">{getSuggestionIcon(suggestion.type)}</div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-neutral-900">
                    {suggestion.title}
                  </h4>
                  <p className="mt-1 text-sm text-neutral-600">{suggestion.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
