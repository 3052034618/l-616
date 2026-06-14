import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Building2,
  User,
  Coins,
  Target,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  FolderKanban,
  RotateCcw,
  Edit3,
  ExternalLink,
  MessageSquare,
  Circle,
  ChevronRight,
  Lightbulb,
  AlertTriangle,
} from 'lucide-react';
import { useProposalStore } from '@/store/useProposalStore';
import { useApprovalStore } from '@/store/useApprovalStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useProjectStore } from '@/store/useProjectStore';
import { cn } from '@/lib/utils';
import { formatDate, getRelativeTime } from '@/utils/date';
import type { ProposalStatus, Approval, ApprovalLevel } from '@/types';

const statusConfig: Record<ProposalStatus, { label: string; className: string; icon: typeof FileText }> = {
  draft: { label: '草稿', className: 'badge-neutral', icon: FileText },
  pending: { label: '待审批', className: 'badge-warning', icon: Loader2 },
  approved: { label: '已通过', className: 'badge-success', icon: CheckCircle2 },
  rejected: { label: '已驳回', className: 'badge-error', icon: XCircle },
  project_created: { label: '已立项', className: 'badge-info', icon: FolderKanban },
};

interface TimelineNode {
  key: string;
  title: string;
  description: string;
  status: 'done' | 'current' | 'pending';
  date?: Date;
  approval?: Approval;
}

function formatCost(cost: number): string {
  if (cost >= 10000) {
    return `¥${(cost / 10000).toFixed(1)}万`;
  }
  return `¥${cost.toLocaleString()}`;
}

export default function ProposalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProposalById, updateProposal, updateProposalStatus } = useProposalStore();
  const { getApprovalsByProposal, getCurrentApprovalLevel, determineApprovalLevel, getApprovalThreshold } = useApprovalStore();
  const { currentUser, getUserById } = useAuthStore();
  const { getProjectByProposal } = useProjectStore();

  const proposal = useMemo(() => (id ? getProposalById(id) : undefined), [id, getProposalById]);
  const approvals = useMemo(() => (id ? getApprovalsByProposal(id) : []), [id, getApprovalsByProposal]);
  const submitter = useMemo(() => (proposal ? getUserById(proposal.submitterId) : undefined), [proposal, getUserById]);
  const relatedProject = useMemo(() => (id ? getProjectByProposal(id) : undefined), [id, getProjectByProposal]);
  const currentLevel = useMemo(() => (id ? getCurrentApprovalLevel(id) : null), [id, getCurrentApprovalLevel]);

  const requiredLevel = useMemo(() => {
    if (!proposal) return null;
    return determineApprovalLevel(proposal.estimatedCost);
  }, [proposal, determineApprovalLevel]);

  const approvalThreshold = getApprovalThreshold();

  const isOwner = currentUser && proposal && currentUser.id === proposal.submitterId;

  const timeline: TimelineNode[] = useMemo(() => {
    if (!proposal) return [];

    const nodes: TimelineNode[] = [];

    nodes.push({
      key: 'submit',
      title: '提交提案',
      description: '提案创建并提交',
      status: proposal.status !== 'draft' ? 'done' : proposal.status === 'draft' ? 'current' : 'pending',
      date: proposal.createdAt,
    });

    const managerApproval = approvals.find((a) => a.level === 'manager');
    const committeeApproval = approvals.find((a) => a.level === 'committee');

    if (requiredLevel === 'manager' || requiredLevel === 'committee') {
      nodes.push({
        key: 'manager',
        title: '部门经理审批',
        description: '部门经理对提案进行审核',
        status:
          managerApproval?.status === 'approved'
            ? 'done'
            : managerApproval?.status === 'rejected'
            ? 'current'
            : proposal.status === 'pending' && (currentLevel === 'manager' || (requiredLevel === 'manager' && !managerApproval))
            ? 'current'
            : proposal.status === 'draft' || (proposal.status === 'pending' && requiredLevel === 'manager' && !managerApproval)
            ? 'pending'
            : 'done',
        approval: managerApproval,
        date: managerApproval?.createdAt,
      });
    }

    if (requiredLevel === 'committee') {
      nodes.push({
        key: 'committee',
        title: '评审委员会审批',
        description: '评审委员会对高成本提案进行最终审核',
        status:
          committeeApproval?.status === 'approved'
            ? 'done'
            : committeeApproval?.status === 'rejected'
            ? 'current'
            : proposal.status === 'pending' && currentLevel === 'committee'
            ? 'current'
            : proposal.status === 'pending' && managerApproval?.status === 'approved' && !committeeApproval
            ? 'current'
            : proposal.status === 'approved' || proposal.status === 'project_created'
            ? 'done'
            : 'pending',
        approval: committeeApproval,
        date: committeeApproval?.createdAt,
      });
    }

    if (proposal.status === 'approved' || proposal.status === 'project_created') {
      nodes.push({
        key: 'approved',
        title: '审批通过',
        description: '提案审批通过，可立项执行',
        status: proposal.status === 'project_created' ? 'done' : 'current',
      });
    }

    if (proposal.status === 'project_created') {
      nodes.push({
        key: 'project',
        title: '已立项',
        description: '提案已转化为项目开始执行',
        status: 'done',
      });
    }

    if (proposal.status === 'rejected') {
      const rejectedApproval = approvals.find((a) => a.status === 'rejected');
      nodes.push({
        key: 'rejected',
        title: '审批驳回',
        description: '提案未通过审批',
        status: 'current',
        approval: rejectedApproval,
        date: rejectedApproval?.createdAt,
      });
    }

    return nodes;
  }, [proposal, approvals, requiredLevel, currentLevel]);

  const handleWithdraw = () => {
    if (!proposal || !isOwner) return;
    if (proposal.status === 'pending') {
      updateProposalStatus(proposal.id, 'draft');
    }
  };

  const handleEditDraft = () => {
    if (!proposal || !isOwner) return;
    if (proposal.status === 'draft') {
      navigate(`/proposals/${proposal.id}/edit`);
    }
  };

  const handleViewProject = () => {
    if (relatedProject) {
      navigate(`/projects/${relatedProject.id}`);
    }
  };

  if (!proposal) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="card p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500 mb-4">提案不存在或已被删除</p>
          <button onClick={() => navigate('/proposals')} className="btn btn-primary">
            返回提案列表
          </button>
        </div>
      </div>
    );
  }

  const StatusIcon = statusConfig[proposal.status].icon;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/proposals')} className="btn btn-ghost">
          <ArrowLeft className="w-4 h-4" />
          返回
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-neutral-800">{proposal.title}</h1>
            <span className={cn('badge', statusConfig[proposal.status].className)}>
              <StatusIcon className="w-3 h-3" />
              {statusConfig[proposal.status].label}
            </span>
          </div>
          <p className="text-neutral-500 mt-1">
            提案编号：{proposal.id}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isOwner && proposal.status === 'pending' && (
            <button onClick={handleWithdraw} className="btn btn-secondary">
              <RotateCcw className="w-4 h-4" />
              撤回提案
            </button>
          )}
          {isOwner && proposal.status === 'draft' && (
            <button onClick={handleEditDraft} className="btn btn-secondary">
              <Edit3 className="w-4 h-4" />
              编辑草稿
            </button>
          )}
          {(proposal.status === 'approved' || proposal.status === 'project_created') && relatedProject && (
            <button onClick={handleViewProject} className="btn btn-primary">
              <ExternalLink className="w-4 h-4" />
              查看关联项目
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-neutral-700 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary-500" />
              提案信息
            </h3>
            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2">
                <p className="text-xs text-neutral-500 mb-1">提案描述</p>
                <p className="text-sm text-neutral-700 leading-relaxed">{proposal.description}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 mb-1 flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  预期收益
                </p>
                <p className="text-sm text-neutral-700">{proposal.expectedBenefit}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 mb-1 flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  所需资源
                </p>
                <p className="text-sm text-neutral-700">{proposal.resources}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-semibold text-neutral-700 mb-4 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-accent-500" />
              关键词标签
            </h3>
            <div className="flex flex-wrap gap-2">
              {proposal.keywords.map((kw) => (
                <span
                  key={kw}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-700"
                >
                  {kw}
                </span>
              ))}
            </div>
            {proposal.recommendedDepartments && proposal.recommendedDepartments.length > 0 && (
              <div className="mt-4 pt-4 border-t border-neutral-100">
                <p className="text-xs text-neutral-500 mb-2">推荐关联部门</p>
                <div className="flex flex-wrap gap-2">
                  {proposal.recommendedDepartments.map((dept) => (
                    <span
                      key={dept}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-accent-50 text-accent-700"
                    >
                      {dept}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-semibold text-neutral-700 mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-warning-500" />
              审批意见
            </h3>
            {approvals.filter((a) => a.comment).length === 0 ? (
              <p className="text-sm text-neutral-400">暂无审批意见</p>
            ) : (
              <div className="space-y-4">
                {approvals
                  .filter((a) => a.comment)
                  .map((approval) => {
                    const approver = getUserById(approval.approverId);
                    return (
                      <div
                        key={approval.id}
                        className="p-4 rounded-lg bg-neutral-50 border border-neutral-100"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                              <User className="w-4 h-4 text-primary-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-neutral-800">
                                {approver?.name || '未知审批人'}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {approval.level === 'manager' ? '部门经理' : '评审委员会'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'badge',
                                approval.status === 'approved' ? 'badge-success' : approval.status === 'rejected' ? 'badge-error' : 'badge-warning'
                              )}
                            >
                              {approval.status === 'approved' ? (
                                <CheckCircle2 className="w-3 h-3" />
                              ) : approval.status === 'rejected' ? (
                                <XCircle className="w-3 h-3" />
                              ) : (
                                <Loader2 className="w-3 h-3" />
                              )}
                              {approval.status === 'approved' ? '通过' : approval.status === 'rejected' ? '驳回' : '待审'}
                            </span>
                            <span className="text-xs text-neutral-400">
                              {getRelativeTime(approval.createdAt)}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-neutral-700 pl-10">{approval.comment}</p>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-neutral-700 mb-4">基本信息</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-primary-500" />
                <span className="text-xs text-neutral-500 w-20">预估成本</span>
                <span className="text-sm font-medium text-neutral-800">{formatCost(proposal.estimatedCost)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-accent-500" />
                <span className="text-xs text-neutral-500 w-20">所属部门</span>
                <span className="text-sm font-medium text-neutral-800">{proposal.department}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-neutral-400" />
                <span className="text-xs text-neutral-500 w-20">提交人</span>
                <span className="text-sm font-medium text-neutral-800">{submitter?.name || '未知'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-warning-500" />
                <span className="text-xs text-neutral-500 w-20">提交时间</span>
                <span className="text-sm font-medium text-neutral-800">{formatDate(proposal.createdAt)}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-neutral-100">
              <p className="text-xs text-neutral-500 mb-2">审批级别说明</p>
              <p className="text-xs text-neutral-600">
                金额 ≤ ¥{approvalThreshold.toLocaleString()}：部门经理审批
              </p>
              <p className="text-xs text-neutral-600">
                金额 {'>'} ¥{approvalThreshold.toLocaleString()}：评审委员会审批
              </p>
              <p className="text-xs text-primary-600 font-medium mt-2">
                本提案审批级别：{requiredLevel === 'manager' ? '部门经理审批' : '评审委员会审批'}
              </p>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold text-neutral-700 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary-500" />
              审批流程
            </h3>
            <div className="relative">
              {timeline.map((node, index) => {
                const isLast = index === timeline.length - 1;
                const nodeApprover = node.approval ? getUserById(node.approval.approverId) : null;
                return (
                  <div key={node.key} className="relative pb-6 last:pb-0">
                    {!isLast && (
                      <div
                        className={cn(
                          'absolute left-[15px] top-8 w-0.5 h-full',
                          node.status === 'done' ? 'bg-accent-400' : 'bg-neutral-200'
                        )}
                      />
                    )}
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2',
                          node.status === 'done' && 'bg-accent-500 border-accent-500 text-white',
                          node.status === 'current' && 'bg-white border-primary-500 text-primary-500 ring-4 ring-primary-50',
                          node.status === 'pending' && 'bg-white border-neutral-300 text-neutral-300'
                        )}
                      >
                        {node.status === 'done' ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : node.status === 'current' ? (
                          <Circle className="w-3 h-3 fill-current" />
                        ) : (
                          <Circle className="w-3 h-3" />
                        )}
                      </div>
                      <div className="flex-1 pt-0.5">
                        <div className="flex items-center gap-2">
                          <p
                            className={cn(
                              'text-sm font-medium',
                              node.status === 'pending' ? 'text-neutral-400' : 'text-neutral-800'
                            )}
                          >
                            {node.title}
                          </p>
                          {node.approval?.status === 'rejected' && (
                            <span className="badge badge-error text-xs">
                              <XCircle className="w-3 h-3" />
                              驳回
                            </span>
                          )}
                        </div>
                        <p
                          className={cn(
                            'text-xs mt-0.5',
                            node.status === 'pending' ? 'text-neutral-300' : 'text-neutral-500'
                          )}
                        >
                          {node.description}
                        </p>
                        {nodeApprover && (
                          <p className="text-xs text-neutral-400 mt-1">
                            审批人：{nodeApprover.name}
                          </p>
                        )}
                        {node.date && (
                          <p className="text-xs text-neutral-400 mt-0.5">
                            {formatDate(node.date, 'YYYY-MM-DD HH:mm')}
                          </p>
                        )}
                        {node.status === 'current' && proposal.status === 'pending' && (
                          <div className="mt-2 inline-flex items-center gap-1 text-xs text-primary-600 font-medium">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            审批中...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {proposal.similarCases && proposal.similarCases.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-neutral-700 mb-4 flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-accent-500" />
                相似案例
              </h3>
              <div className="space-y-2.5">
                {proposal.similarCases.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border border-neutral-100 bg-neutral-50"
                  >
                    <p className="text-sm font-medium text-neutral-800 line-clamp-1">{item.title}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-neutral-500">{item.department}</span>
                      <span className="text-xs text-neutral-300">·</span>
                      <span
                        className={cn(
                          'badge text-xs',
                          item.result === 'success' ? 'badge-success' : 'badge-error'
                        )}
                      >
                        {item.result === 'success' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {item.result === 'success' ? '成功' : '失败'}
                      </span>
                      <span className="text-xs text-neutral-400 ml-auto">匹配 {item.matchRate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
