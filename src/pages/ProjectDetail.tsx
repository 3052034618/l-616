import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  Circle,
  AlertTriangle,
  AlertCircle,
  FileText,
  Send,
  Award,
  Gift,
  ChevronDown,
  ChevronUp,
  Loader2,
  XCircle,
  Target,
  Package,
  Building2,
  Lightbulb,
  ListTodo,
  Plus,
  Wand2,
  Check,
  X,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate, getDaysRemaining, isOverdue, getRelativeTime } from '@/utils/date';
import { useProjectStore } from '@/store/useProjectStore';
import { useAuthStore } from '@/store/useAuthStore';
import { usePointsStore } from '@/store/usePointsStore';
import { useProposalStore } from '@/store/useProposalStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import type { Milestone, MilestoneStatus, ProgressReport, ProjectTask, TaskStatus } from '@/types';

function getMilestoneStatusStyle(status: MilestoneStatus): {
  label: string;
  className: string;
  icon: typeof CheckCircle2;
} {
  switch (status) {
    case 'completed':
      return {
        label: '已完成',
        className: 'bg-green-100 text-green-700',
        icon: CheckCircle2,
      };
    case 'in_progress':
      return {
        label: '进行中',
        className: 'bg-indigo-100 text-indigo-700',
        icon: Clock,
      };
    case 'overdue':
      return {
        label: '已逾期',
        className: 'bg-red-100 text-red-700',
        icon: XCircle,
      };
    default:
      return {
        label: '待开始',
        className: 'bg-neutral-100 text-neutral-600',
        icon: Circle,
      };
  }
}

interface MilestoneTimelineProps {
  milestone: Milestone;
  isLast: boolean;
  onSubmitReport: (milestoneId: string) => void;
  expandedReportId: string | null;
  onToggleReport: (milestoneId: string) => void;
}

function MilestoneTimeline({
  milestone,
  isLast,
  onSubmitReport,
  expandedReportId,
  onToggleReport,
}: MilestoneTimelineProps) {
  const statusStyle = getMilestoneStatusStyle(milestone.status);
  const StatusIcon = statusStyle.icon;
  const daysRemaining = getDaysRemaining(milestone.dueDate);
  const overdue = isOverdue(milestone.dueDate);

  const lineColor = milestone.status === 'completed'
    ? 'bg-green-200'
    : milestone.status === 'overdue'
    ? 'bg-red-200'
    : 'bg-neutral-200';

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-full',
            milestone.status === 'completed' && 'bg-green-500 text-white',
            milestone.status === 'in_progress' && 'bg-indigo-500 text-white',
            milestone.status === 'overdue' && 'bg-red-500 text-white',
            milestone.status === 'pending' && 'bg-neutral-200 text-neutral-500'
          )}
        >
          <StatusIcon className="h-5 w-5" />
        </div>
        {!isLast && <div className={cn('mt-2 w-0.5 flex-1', lineColor)} />}
      </div>

      <div className={cn('flex-1 pb-6', isLast && '')}>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-neutral-900">{milestone.name}</h4>
                <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', statusStyle.className)}>
                  {statusStyle.label}
                </span>
                {overdue && milestone.status !== 'completed' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    已逾期 {Math.abs(daysRemaining)} 天
                  </span>
                )}
                {!overdue && daysRemaining <= 3 && daysRemaining >= 0 && milestone.status !== 'completed' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">
                    <AlertTriangle className="h-3 w-3" />
                    {daysRemaining === 0 ? '今日截止' : `还剩 ${daysRemaining} 天`}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-neutral-500">{milestone.description}</p>
              <div className="mt-2 flex items-center gap-4 text-xs text-neutral-400">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  截止日期：{formatDate(milestone.dueDate, 'YYYY-MM-DD')}
                </div>
              </div>
            </div>

            {milestone.status !== 'completed' && (
              <button
                onClick={() => onSubmitReport(milestone.id)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-indigo-700"
              >
                <Send className="h-3.5 w-3.5" />
                提交进度报告
              </button>
            )}
          </div>

          {milestone.reports.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => onToggleReport(milestone.id)}
                className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700"
              >
                <FileText className="h-4 w-4" />
                进度报告 ({milestone.reports.length})
                {expandedReportId === milestone.id ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {expandedReportId === milestone.id && (
                <div className="mt-3 space-y-3">
                  {milestone.reports.map((report) => (
                    <ProgressReportItem key={report.id} report={report} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ProgressReportItemProps {
  report: ProgressReport;
}

function ProgressReportItem({ report }: ProgressReportItemProps) {
  const getUserById = useAuthStore((s) => s.getUserById);
  const reporter = getUserById(report.reporterId);

  return (
    <div className="rounded-lg bg-neutral-50 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-neutral-700">{reporter?.name || '未知'}</span>
          {report.isOverdue && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
              <AlertCircle className="h-3 w-3" />
              逾期提交
            </span>
          )}
        </div>
        <span className="text-xs text-neutral-400">{getRelativeTime(report.submittedAt)}</span>
      </div>
      <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{report.content}</p>
    </div>
  );
}

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (content: string) => void;
  milestoneName: string;
}

function ReportModal({ isOpen, onClose, onSubmit, milestoneName }: ReportModalProps) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!content.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      onSubmit(content);
      setContent('');
      setSubmitting(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 p-5">
          <h3 className="text-lg font-semibold text-neutral-900">提交进度报告</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 transition-all hover:bg-neutral-100 hover:text-neutral-600"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">
          <div className="mb-4 rounded-lg bg-indigo-50 p-3">
            <p className="text-sm text-indigo-700">
              <span className="font-medium">里程碑：</span>
              {milestoneName}
            </p>
          </div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">报告内容</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="请详细描述当前里程碑的进展情况、遇到的问题以及下一步计划..."
            rows={6}
            className="w-full resize-none rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 placeholder:text-neutral-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div className="flex gap-3 border-t border-neutral-200 p-5">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-all hover:bg-neutral-50"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || submitting}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            提交报告
          </button>
        </div>
      </div>
    </div>
  );
}

interface AwardPointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  pointsBreakdown: {
    costSavingPoints: number;
    revenueIncreasePoints: number;
    completionBonus: number;
    total: number;
  };
  projectName: string;
}

function AwardPointsModal({ isOpen, onClose, onConfirm, pointsBreakdown, projectName }: AwardPointsModalProps) {
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    setSubmitting(true);
    setTimeout(() => {
      onConfirm();
      setSubmitting(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 p-5">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-neutral-900">发放项目积分</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 transition-all hover:bg-neutral-100 hover:text-neutral-600"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">
          <p className="mb-4 text-sm text-neutral-600">
            项目 <span className="font-medium text-neutral-900">{projectName}</span> 已完成，即将为项目成员发放以下积分奖励：
          </p>

          <div className="space-y-3 rounded-lg bg-neutral-50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500">成本节约奖励</span>
              <span className="font-medium text-neutral-700">+{pointsBreakdown.costSavingPoints} 积分</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500">收益增长奖励</span>
              <span className="font-medium text-neutral-700">+{pointsBreakdown.revenueIncreasePoints} 积分</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500">完成奖金</span>
              <span className="font-medium text-neutral-700">+{pointsBreakdown.completionBonus} 积分</span>
            </div>
            <div className="border-t border-neutral-200 pt-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-neutral-900">总计</span>
                <span className="text-lg font-bold text-indigo-600">{pointsBreakdown.total} 积分/人</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 border-t border-neutral-200 p-5">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-all hover:bg-neutral-50"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Award className="h-4 w-4" />
            )}
            确认发放
          </button>
        </div>
      </div>
    </div>
  );
}

function getTaskStatusStyle(status: TaskStatus): { label: string; className: string; icon: typeof Circle } {
  switch (status) {
    case 'completed':
      return { label: '已完成', className: 'bg-green-100 text-green-700', icon: CheckCircle2 };
    case 'in_progress':
      return { label: '进行中', className: 'bg-blue-100 text-blue-700', icon: Clock };
    case 'overdue':
      return { label: '已逾期', className: 'bg-red-100 text-red-700', icon: XCircle };
    default:
      return { label: '待办', className: 'bg-neutral-100 text-neutral-600', icon: Circle };
  }
}

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; description: string; assigneeId: string; dueDate: Date }) => void;
  users: Array<{ id: string; name: string; department: string }>;
  defaultTitle?: string;
}

function AddTaskModal({ isOpen, onClose, onSubmit, users, defaultTitle = '' }: AddTaskModalProps) {
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState(users[0]?.id || '');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!title.trim() || !assigneeId || !dueDate) return;
    setSubmitting(true);
    setTimeout(() => {
      onSubmit({
        title: title.trim(),
        description: description.trim(),
        assigneeId,
        dueDate: new Date(dueDate),
      });
      setSubmitting(false);
      setTitle('');
      setDescription('');
      setAssigneeId(users[0]?.id || '');
      const d = new Date();
      d.setDate(d.getDate() + 7);
      setDueDate(d.toISOString().slice(0, 10));
      onClose();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 p-5">
          <div className="flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-neutral-900">新建任务</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-neutral-400 transition-all hover:bg-neutral-100 hover:text-neutral-600">
            <XCircle className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">任务标题 <span className="text-red-500">*</span></label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入任务标题"
              className="input"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">任务描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请输入任务描述（可选）"
              rows={3}
              className="w-full resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 placeholder:text-neutral-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">负责人 <span className="text-red-500">*</span></label>
              <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className="input">
                <option value="">请选择</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} · {u.department}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">截止日期 <span className="text-red-500">*</span></label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 border-t border-neutral-200 p-5">
          <button onClick={onClose} className="flex-1 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-all hover:bg-neutral-50">
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || !assigneeId || !dueDate || submitting}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            创建
          </button>
        </div>
      </div>
    </div>
  );
}

function getStatusStyle(status: string): { label: string; className: string; barColor: string } {
  switch (status) {
    case 'planning':
      return {
        label: '规划中',
        className: 'bg-blue-100 text-blue-700',
        barColor: 'bg-blue-500',
      };
    case 'in_progress':
      return {
        label: '进行中',
        className: 'bg-indigo-100 text-indigo-700',
        barColor: 'bg-indigo-500',
      };
    case 'completed':
      return {
        label: '已完成',
        className: 'bg-green-100 text-green-700',
        barColor: 'bg-green-500',
      };
    case 'delayed':
      return {
        label: '已延期',
        className: 'bg-red-100 text-red-700',
        barColor: 'bg-red-500',
      };
    default:
      return {
        label: status,
        className: 'bg-neutral-100 text-neutral-700',
        barColor: 'bg-neutral-500',
      };
  }
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [activeMilestoneId, setActiveMilestoneId] = useState<string | null>(null);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [awardModalOpen, setAwardModalOpen] = useState(false);
  const [pointsAwarded, setPointsAwarded] = useState(false);
  const [addTaskModalOpen, setAddTaskModalOpen] = useState(false);
  const [pendingDefaultTaskTitle, setPendingDefaultTaskTitle] = useState('');

  const getProjectById = useProjectStore((s) => s.getProjectById);
  const addProgressReport = useProjectStore((s) => s.addProgressReport);
  const addTask = useProjectStore((s) => s.addTask);
  const updateTaskStatus = useProjectStore((s) => s.updateTaskStatus);
  const deleteTask = useProjectStore((s) => s.deleteTask);
  const refreshTaskOverdueStatus = useProjectStore((s) => s.refreshTaskOverdueStatus);
  const getUserById = useAuthStore((s) => s.getUserById);
  const allUsers = useAuthStore((s) => s.allUsers);
  const currentUser = useAuthStore((s) => s.currentUser);
  const calculateProjectPoints = usePointsStore((s) => s.calculateProjectPoints);
  const awardProjectPoints = usePointsStore((s) => s.awardProjectPoints);
  const getProposalById = useProposalStore((s) => s.getProposalById);
  const sendTaskAssignedNotification = useNotificationStore((s) => s.sendTaskAssignedNotification);

  const project = id ? getProjectById(id) : undefined;
  const owner = project ? getUserById(project.ownerId) : undefined;
  const proposal = project ? getProposalById(project.proposalId) : undefined;
  const isOwner = currentUser?.id === project?.ownerId;

  const tasks = project?.tasks || [];
  const completedTasksCount = tasks.filter((t) => t.status === 'completed').length;

  const activeMilestone = project?.milestones.find((m) => m.id === activeMilestoneId);

  const overdueMilestones = project?.milestones.filter(
    (m) => m.status !== 'completed' && isOverdue(m.dueDate)
  ) || [];
  const upcomingMilestones = project?.milestones.filter((m) => {
    const days = getDaysRemaining(m.dueDate);
    return m.status !== 'completed' && days >= 0 && days <= 3;
  }) || [];

  const pointsBreakdown = project
    ? calculateProjectPoints(project.actualBenefit, project.actualBenefit, project.status === 'completed')
    : { costSavingPoints: 0, revenueIncreasePoints: 0, completionBonus: 0, total: 0 };

  const handleSubmitReport = (milestoneId: string) => {
    setActiveMilestoneId(milestoneId);
    setReportModalOpen(true);
  };

  const handleConfirmReport = (content: string) => {
    if (!project || !activeMilestoneId || !currentUser) return;
    addProgressReport(project.id, activeMilestoneId, {
      reporterId: currentUser.id,
      content,
    });
  };

  const handleAwardPoints = () => {
    if (!project || !owner) return;
    const userIds = [project.ownerId];
    awardProjectPoints(
      userIds,
      project.actualBenefit,
      project.actualBenefit,
      true,
      `项目奖励：${project.name}`
    );
    setPointsAwarded(true);
  };

  const toggleReport = (milestoneId: string) => {
    setExpandedReportId(expandedReportId === milestoneId ? null : milestoneId);
  };

  const handleAddTask = (data: { title: string; description: string; assigneeId: string; dueDate: Date }) => {
    if (!project) return;
    const newTask = addTask(project.id, {
      title: data.title,
      description: data.description,
      assigneeId: data.assigneeId,
      dueDate: data.dueDate,
    });
    if (newTask && newTask.assigneeId !== currentUser?.id) {
      sendTaskAssignedNotification(newTask.assigneeId, project.id, project.name, newTask.title, newTask.dueDate);
    }
  };

  const handleUpdateTaskStatus = (taskId: string, status: TaskStatus) => {
    if (!project) return;
    updateTaskStatus(project.id, taskId, status);
  };

  const handleDeleteTask = (taskId: string) => {
    if (!project) return;
    deleteTask(project.id, taskId);
  };

  const handleBreakdownTasksFromProposal = () => {
    if (!project) return;
    const titles: string[] = [];
    if (proposal?.expectedBenefit) titles.push(`落地预期收益：${proposal.expectedBenefit.slice(0, 20)}${proposal.expectedBenefit.length > 20 ? '...' : ''}`);
    if (proposal?.resources) titles.push(`协调落实资源：${proposal.resources.slice(0, 20)}${proposal.resources.length > 20 ? '...' : ''}`);
    if (proposal?.recommendedDepartments && proposal.recommendedDepartments.length > 0) {
      proposal.recommendedDepartments.forEach((dept) => {
        titles.push(`与${dept}对接协作事宜`);
      });
    }
    titles.push(`制定项目详细里程碑计划`);
    titles.push(`组织项目启动会`);
    setPendingDefaultTaskTitle(titles[0] || '');
    setAddTaskModalOpen(true);
  };

  const handleOpenAddTask = () => {
    setPendingDefaultTaskTitle('');
    setAddTaskModalOpen(true);
  };

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
        <XCircle className="mb-3 h-12 w-12" />
        <p className="text-sm">项目不存在</p>
        <button
          onClick={() => navigate('/projects')}
          className="mt-4 text-sm text-indigo-600 hover:text-indigo-700"
        >
          返回项目列表
        </button>
      </div>
    );
  }

  const statusStyle = getStatusStyle(project.status);
  const canAwardPoints = project.status === 'completed' && !pointsAwarded;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/projects')}
          className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-600 transition-all hover:border-neutral-300 hover:bg-neutral-50"
        >
          <ArrowLeft className="h-4 w-4" />
          返回
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-neutral-900">{project.name}</h1>
          <p className="mt-1 text-sm text-neutral-500">项目编号：{project.projectNo}</p>
        </div>
        {canAwardPoints && (
          <button
            onClick={() => setAwardModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg"
          >
            <Gift className="h-4 w-4" />
            发放积分
          </button>
        )}
        {pointsAwarded && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-sm font-medium text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            积分已发放
          </span>
        )}
      </div>

      {(overdueMilestones.length > 0 || upcomingMilestones.length > 0) && (
        <div className="grid grid-cols-2 gap-4">
          {overdueMilestones.length > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 text-red-500" />
              <div>
                <h4 className="font-medium text-red-800">逾期里程碑警告</h4>
                <p className="mt-1 text-sm text-red-600">
                  有 {overdueMilestones.length} 个里程碑已逾期，请及时关注：
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {overdueMilestones.map((m) => (
                    <span key={m.id} className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-red-700">
                      {m.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
          {upcomingMilestones.length > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-500" />
              <div>
                <h4 className="font-medium text-amber-800">即将到期提醒</h4>
                <p className="mt-1 text-sm text-amber-600">
                  有 {upcomingMilestones.length} 个里程碑将在3天内到期：
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {upcomingMilestones.map((m) => (
                    <span key={m.id} className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-amber-700">
                      {m.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 space-y-6">
          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-neutral-900">项目基本信息</h2>

            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-neutral-500">项目状态</span>
                <span className={cn('rounded-full px-3 py-1 text-xs font-medium', statusStyle.className)}>
                  {statusStyle.label}
                </span>
              </div>
            </div>

            <div className="mb-5">
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="text-neutral-500">项目进度</span>
                <span className="font-medium text-neutral-700">{project.progress}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className={cn('h-full rounded-full transition-all', statusStyle.barColor)}
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-neutral-400" />
                <span className="text-neutral-500">负责人：</span>
                <span className="font-medium text-neutral-700">{owner?.name || '-'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-neutral-400" />
                <span className="text-neutral-500">开始日期：</span>
                <span className="font-medium text-neutral-700">{formatDate(project.startDate, 'YYYY-MM-DD')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-neutral-400" />
                <span className="text-neutral-500">结束日期：</span>
                <span className="font-medium text-neutral-700">{formatDate(project.endDate, 'YYYY-MM-DD')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-neutral-400" />
                <span className="text-neutral-500">实际收益：</span>
                <span className="font-medium text-green-600">¥{project.actualBenefit.toLocaleString()}</span>
              </div>
              {project.actualBenefit > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-neutral-400" />
                  <span className="text-neutral-500">预计积分：</span>
                  <span className="font-medium text-indigo-600">{pointsBreakdown.total} 积分/人</span>
                </div>
              )}
            </div>
          </div>

          {(project.expectedBenefit || project.resources || (project.recommendedDepartments && project.recommendedDepartments.length > 0)) && (
            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-neutral-900 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                提案启动信息
              </h2>
              <p className="text-xs text-neutral-400 mb-4 -mt-2">
                以下信息来自原创意提案，供项目启动参考
              </p>

              <div className="space-y-4">
                {project.expectedBenefit && (
                  <div>
                    <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-neutral-600">
                      <Target className="h-3.5 w-3.5 text-green-500" />
                      预期收益
                    </div>
                    <p className="text-sm text-neutral-700 leading-relaxed bg-neutral-50 rounded-lg p-3">
                      {project.expectedBenefit}
                    </p>
                  </div>
                )}

                {project.resources && (
                  <div>
                    <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-neutral-600">
                      <Package className="h-3.5 w-3.5 text-blue-500" />
                      所需资源
                    </div>
                    <p className="text-sm text-neutral-700 leading-relaxed bg-neutral-50 rounded-lg p-3">
                      {project.resources}
                    </p>
                  </div>
                )}

                {project.recommendedDepartments && project.recommendedDepartments.length > 0 && (
                  <div>
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-neutral-600">
                      <Building2 className="h-3.5 w-3.5 text-purple-500" />
                      推荐关联部门
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {project.recommendedDepartments.map((dept) => (
                        <span
                          key={dept}
                          className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700"
                        >
                          {dept}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="col-span-2 rounded-xl border border-neutral-200 bg-white p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-900">里程碑时间轴</h2>
            <span className="text-sm text-neutral-500">
              共 {project.milestones.length} 个里程碑
            </span>
          </div>

          <div className="flex flex-col">
            {project.milestones.map((milestone, index) => (
              <MilestoneTimeline
                key={milestone.id}
                milestone={milestone}
                isLast={index === project.milestones.length - 1}
                onSubmitReport={handleSubmitReport}
                expandedReportId={expandedReportId}
                onToggleReport={toggleReport}
              />
            ))}
          </div>
        </div>

        <div className="col-span-2 rounded-xl border border-neutral-200 bg-white p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-neutral-900">任务清单</h2>
              <span className="text-sm text-neutral-500">
                {completedTasksCount}/{tasks.length} 已完成
              </span>
              {tasks.length > 0 && (
                <div className="ml-2 w-24 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-500"
                    style={{ width: `${tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0}%` }}
                  />
                </div>
              )}
            </div>
            {isOwner && (
              <div className="flex gap-2">
                {proposal && tasks.length === 0 && (
                  <button
                    onClick={handleBreakdownTasksFromProposal}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 transition-all hover:bg-amber-100"
                  >
                    <Wand2 className="w-4 h-4" />
                    从提案一键拆任务
                  </button>
                )}
                <button
                  onClick={handleOpenAddTask}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-all hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4" />
                  新建任务
                </button>
              </div>
            )}
          </div>

          {tasks.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-neutral-200 rounded-xl">
              <ListTodo className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
              <p className="text-sm text-neutral-400 mb-3">暂无任务</p>
              {isOwner && proposal && (
                <button
                  onClick={handleBreakdownTasksFromProposal}
                  className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  <Wand2 className="w-4 h-4" />
                  从提案启动信息一键拆分任务
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => {
                const assignee = getUserById(task.assigneeId);
                const statusStyle = getTaskStatusStyle(task.status);
                const StatusIcon = statusStyle.icon;
                const overdue = task.status === 'overdue' || (task.status !== 'completed' && isOverdue(task.dueDate));
                const canEdit = isOwner || currentUser?.id === task.assigneeId;

                return (
                  <div
                    key={task.id}
                    className={cn(
                      'flex items-start gap-3 p-4 rounded-xl border transition-all',
                      overdue ? 'border-red-200 bg-red-50/30' : 'border-neutral-100 bg-neutral-50/40 hover:bg-neutral-50'
                    )}
                  >
                    <div className="mt-0.5">
                      {canEdit && task.status !== 'completed' ? (
                        <button
                          onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                          className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-neutral-300 hover:border-green-500 hover:bg-green-50 transition-all"
                          title="标记完成"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-transparent group-hover:text-green-600" />
                        </button>
                      ) : (
                        <div className={cn('flex h-6 w-6 items-center justify-center rounded-full', task.status === 'completed' ? 'bg-green-500' : 'bg-neutral-200')}>
                          <StatusIcon className={cn('h-3.5 w-3.5', task.status === 'completed' ? 'text-white' : 'text-neutral-500')} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className={cn(
                          'font-medium text-sm',
                          task.status === 'completed' ? 'text-neutral-400 line-through' : 'text-neutral-800'
                        )}>
                          {task.title}
                        </h4>
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', statusStyle.className)}>
                          {statusStyle.label}
                        </span>
                        {overdue && task.status !== 'completed' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-medium">
                            <AlertCircle className="w-3 h-3" />
                            已逾期
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <p className={cn('text-xs mt-1 line-clamp-2', task.status === 'completed' ? 'text-neutral-400' : 'text-neutral-500')}>
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-neutral-500">
                        {assignee && (
                          <span className="inline-flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {assignee.name}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(task.dueDate, 'YYYY-MM-DD')}
                        </span>
                      </div>
                    </div>

                    {canEdit && (
                      <div className="flex items-center gap-1">
                        {task.status !== 'completed' && (
                          <select
                            value={task.status}
                            onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value as TaskStatus)}
                            className="text-xs rounded-md border border-neutral-200 bg-white px-2 py-1 text-neutral-600 focus:outline-none focus:border-indigo-300"
                          >
                            <option value="todo">待办</option>
                            <option value="in_progress">进行中</option>
                          </select>
                        )}
                        {isOwner && (
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1.5 rounded-md text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-all"
                            title="删除任务"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onSubmit={handleConfirmReport}
        milestoneName={activeMilestone?.name || ''}
      />

      <AwardPointsModal
        isOpen={awardModalOpen}
        onClose={() => setAwardModalOpen(false)}
        onConfirm={handleAwardPoints}
        pointsBreakdown={pointsBreakdown}
        projectName={project.name}
      />

      <AddTaskModal
        isOpen={addTaskModalOpen}
        onClose={() => setAddTaskModalOpen(false)}
        onSubmit={handleAddTask}
        users={allUsers.map((u) => ({ id: u.id, name: u.name, department: u.department }))}
        defaultTitle={pendingDefaultTaskTitle}
      />
    </div>
  );
}
