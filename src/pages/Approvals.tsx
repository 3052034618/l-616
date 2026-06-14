import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  ChevronDown,
  ChevronUp,
  SortAsc,
  SortDesc,
  ArrowRight,
  User,
  Calendar,
  DollarSign,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/date';
import { useApprovalStore } from '@/store/useApprovalStore';
import { useProposalStore } from '@/store/useProposalStore';
import { useAuthStore } from '@/store/useAuthStore';
import type { Approval, Proposal } from '@/types';

type TabType = 'pending' | 'approved' | 'flow';
type SortField = 'cost' | 'time' | null;
type SortOrder = 'asc' | 'desc';

function getUrgencyLevel(cost: number, threshold: number): { label: string; className: string; icon: typeof AlertCircle } {
  if (cost >= threshold * 5) {
    return { label: '紧急', className: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle };
  }
  if (cost >= threshold) {
    return { label: '较高', className: 'bg-orange-100 text-orange-700 border-orange-200', icon: AlertTriangle };
  }
  return { label: '普通', className: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 };
}

interface ApprovalItemProps {
  approval: Approval;
  proposal: Proposal;
  onClick: () => void;
  threshold: number;
}

function ApprovalItem({ approval, proposal, onClick, threshold }: ApprovalItemProps) {
  const getUserById = useAuthStore((s) => s.getUserById);
  const submitter = getUserById(proposal.submitterId);
  const urgency = getUrgencyLevel(proposal.estimatedCost, threshold);
  const UrgencyIcon = urgency.icon;

  const statusMap = {
    pending: { label: '待审批', className: 'bg-amber-100 text-amber-700' },
    approved: { label: '已通过', className: 'bg-green-100 text-green-700' },
    rejected: { label: '已驳回', className: 'bg-red-100 text-red-700' },
  };
  const status = statusMap[approval.status];

  return (
    <div
      onClick={onClick}
      className="group flex cursor-pointer items-center gap-4 rounded-xl border border-neutral-200 bg-white p-5 transition-all hover:border-indigo-300 hover:shadow-md"
    >
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-indigo-600">
              {proposal.title}
            </h3>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                urgency.className
              )}
            >
              <UrgencyIcon className="h-3 w-3" />
              {urgency.label}
            </span>
          </div>
          <span className={cn('rounded-full px-3 py-1 text-xs font-medium', status.className)}>
            {status.label}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-5 text-sm text-neutral-500">
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-4 w-4" />
            <span>预估成本：</span>
            <span className="font-medium text-neutral-700">¥{proposal.estimatedCost.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <User className="h-4 w-4" />
            <span>提交人：</span>
            <span className="font-medium text-neutral-700">{submitter?.name || '-'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>提交时间：</span>
            <span className="font-medium text-neutral-700">{formatDate(proposal.createdAt, 'YYYY-MM-DD HH:mm')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>审批级别：</span>
            <span className="font-medium text-neutral-700">
              {approval.level === 'manager' ? '部门经理初审' : '创新委员会终审'}
            </span>
          </div>
        </div>
      </div>

      <ArrowRight className="h-5 w-5 text-neutral-300 transition-all group-hover:translate-x-1 group-hover:text-indigo-500" />
    </div>
  );
}

interface FlowRecordItemProps {
  proposal: Proposal;
  onClick: () => void;
  threshold: number;
}

function FlowRecordItem({ proposal, onClick, threshold }: FlowRecordItemProps) {
  const navigate = useNavigate();
  const getUserById = useAuthStore((s) => s.getUserById);
  const getApprovalsByProposal = useApprovalStore((s) => s.getApprovalsByProposal);
  const getCurrentPendingApproval = useApprovalStore((s) => s.getCurrentPendingApproval);

  const submitter = getUserById(proposal.submitterId);
  const approvals = getApprovalsByProposal(proposal.id);
  const managerApproval = approvals.find((a) => a.level === 'manager');
  const committeeApproval = approvals.find((a) => a.level === 'committee');
  const currentPending = getCurrentPendingApproval(proposal.id);
  const currentApprover = currentPending ? getUserById(currentPending.approverId) : undefined;

  const requiredLevel = proposal.estimatedCost > threshold ? 'committee' : 'manager';

  const getStatusIcon = (approval?: Approval, isRequired: boolean = true) => {
    if (!approval) {
      if (!isRequired) return null;
      return { icon: Clock, className: 'text-neutral-300 bg-neutral-100' };
    }
    if (approval.status === 'approved') {
      return { icon: CheckCircle2, className: 'text-white bg-green-500' };
    }
    if (approval.status === 'rejected') {
      return { icon: XCircle, className: 'text-white bg-red-500' };
    }
    return { icon: Loader2, className: 'text-white bg-indigo-500 animate-spin' };
  };

  const statusMap = {
    draft: { label: '草稿', className: 'bg-neutral-100 text-neutral-600' },
    pending: { label: '审批中', className: 'bg-amber-100 text-amber-700' },
    approved: { label: '已通过', className: 'bg-green-100 text-green-700' },
    rejected: { label: '已驳回', className: 'bg-red-100 text-red-700' },
    project_created: { label: '已立项', className: 'bg-blue-100 text-blue-700' },
  };
  const status = statusMap[proposal.status];

  const managerStatus = getStatusIcon(managerApproval, true);
  const committeeStatus = getStatusIcon(committeeApproval, requiredLevel === 'committee');

  return (
    <div
      className="rounded-xl border border-neutral-200 bg-white p-5 transition-all hover:border-indigo-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-neutral-900">
              {proposal.title}
            </h3>
            <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', status.className)}>
              {status.label}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500">
            <div className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              <span>{submitter?.name || '-'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-4 w-4" />
              <span>¥{proposal.estimatedCost.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(proposal.createdAt, 'YYYY-MM-DD HH:mm')}</span>
            </div>
          </div>
        </div>
        <button
          onClick={onClick}
          className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          查看详情
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1">
          <div className={cn('flex h-8 w-8 items-center justify-center rounded-full', managerStatus?.className)}>
            {managerStatus && <managerStatus.icon className="h-4 w-4" />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-neutral-800">部门经理初审</p>
            <p className="text-xs text-neutral-500">
              {managerApproval
                ? managerApproval.status === 'approved'
                  ? `已通过 · ${getUserById(managerApproval.approverId)?.name || '未知'}`
                  : managerApproval.status === 'rejected'
                  ? `已驳回 · ${getUserById(managerApproval.approverId)?.name || '未知'}`
                  : `待处理 · ${getUserById(managerApproval.approverId)?.name || '待分配'}`
                : '等待中'}
            </p>
            {managerApproval?.comment && (
              <p className="text-xs text-neutral-400 mt-1 line-clamp-1">
                意见：{managerApproval.comment}
              </p>
            )}
          </div>
        </div>

        <div className="w-8 h-px bg-neutral-200 mx-2" />

        {requiredLevel === 'committee' && committeeStatus && (
          <div className="flex items-center gap-2 flex-1">
            <div className={cn('flex h-8 w-8 items-center justify-center rounded-full', committeeStatus.className)}>
              <committeeStatus.icon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-neutral-800">创新委员会终审</p>
              <p className="text-xs text-neutral-500">
                {committeeApproval
                  ? committeeApproval.status === 'approved'
                    ? `已通过 · ${getUserById(committeeApproval.approverId)?.name || '未知'}`
                    : committeeApproval.status === 'rejected'
                    ? `已驳回 · ${getUserById(committeeApproval.approverId)?.name || '未知'}`
                    : `待处理 · ${getUserById(committeeApproval.approverId)?.name || '待分配'}`
                  : '等待初审通过'}
              </p>
              {committeeApproval?.comment && (
                <p className="text-xs text-neutral-400 mt-1 line-clamp-1">
                  意见：{committeeApproval.comment}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {currentPending && proposal.status === 'pending' && (
        <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center gap-2">
          <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
          <span className="text-sm text-neutral-600">
            当前节点：
            <span className="font-medium text-indigo-600">
              {currentPending.level === 'manager' ? '部门经理初审' : '创新委员会终审'}
            </span>
            <span className="text-neutral-500 mx-1">·</span>
            等待 <span className="font-medium text-neutral-800">{currentApprover?.name || '待分配'}</span> 处理
          </span>
        </div>
      )}
    </div>
  );
}

export default function Approvals() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const currentUser = useAuthStore((s) => s.currentUser);
  const getApprovalsByApprover = useApprovalStore((s) => s.getApprovalsByApprover);
  const getApprovalThreshold = useApprovalStore((s) => s.getApprovalThreshold);
  const getProposalById = useProposalStore((s) => s.getProposalById);
  const proposals = useProposalStore((s) => s.proposals);
  const threshold = getApprovalThreshold();

  const myApprovals = useMemo(() => {
    if (!currentUser) return [];
    return getApprovalsByApprover(currentUser.id);
  }, [currentUser, getApprovalsByApprover]);

  const flowProposals = useMemo(() => {
    return proposals.filter((p) => p.status !== 'draft');
  }, [proposals]);

  const filteredApprovals = useMemo(() => {
    let list = myApprovals;

    if (activeTab === 'pending') {
      list = list.filter((a) => a.status === 'pending');
    } else if (activeTab === 'approved') {
      list = list.filter((a) => a.status === 'approved' || a.status === 'rejected');
    }

    if (sortField) {
      list = [...list].sort((a, b) => {
        const proposalA = getProposalById(a.proposalId);
        const proposalB = getProposalById(b.proposalId);
        if (!proposalA || !proposalB) return 0;

        let compareValue = 0;
        if (sortField === 'cost') {
          compareValue = proposalA.estimatedCost - proposalB.estimatedCost;
        } else if (sortField === 'time') {
          compareValue = new Date(proposalA.createdAt).getTime() - new Date(proposalB.createdAt).getTime();
        }

        return sortOrder === 'asc' ? compareValue : -compareValue;
      });
    }

    return list;
  }, [myApprovals, activeTab, sortField, sortOrder, getProposalById]);

  const sortedFlowProposals = useMemo(() => {
    let list = [...flowProposals];

    if (sortField) {
      list = list.sort((a, b) => {
        let compareValue = 0;
        if (sortField === 'cost') {
          compareValue = a.estimatedCost - b.estimatedCost;
        } else if (sortField === 'time') {
          compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        return sortOrder === 'asc' ? compareValue : -compareValue;
      });
    } else {
      list = list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return list;
  }, [flowProposals, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const pendingCount = myApprovals.filter((a) => a.status === 'pending').length;
  const approvedCount = myApprovals.filter((a) => a.status === 'approved' || a.status === 'rejected').length;

  const tabs = [
    { key: 'pending' as TabType, label: '待我审批', count: pendingCount },
    { key: 'approved' as TabType, label: '我已审批', count: approvedCount },
    { key: 'flow' as TabType, label: '全部流转', count: flowProposals.length },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">审批中心</h1>
          <p className="mt-1 text-sm text-neutral-500">管理需要您审批的创新提案</p>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'relative px-6 py-4 text-sm font-medium transition-colors',
                  activeTab === tab.key
                    ? 'text-indigo-600'
                    : 'text-neutral-500 hover:text-neutral-700'
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    'ml-2 rounded-full px-2 py-0.5 text-xs',
                    activeTab === tab.key ? 'bg-indigo-100 text-indigo-700' : 'bg-neutral-100 text-neutral-600'
                  )}
                >
                  {tab.count}
                </span>
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500">排序：</span>
            <button
              onClick={() => handleSort('cost')}
              className={cn(
                'inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm transition-all',
                sortField === 'cost'
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                  : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
              )}
            >
              成本
              {sortField === 'cost' ? (
                sortOrder === 'asc' ? (
                  <SortAsc className="h-4 w-4" />
                ) : (
                  <SortDesc className="h-4 w-4" />
                )
              ) : (
                <ChevronDown className="h-4 w-4 opacity-50" />
              )}
            </button>
            <button
              onClick={() => handleSort('time')}
              className={cn(
                'inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm transition-all',
                sortField === 'time'
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                  : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
              )}
            >
              时间
              {sortField === 'time' ? (
                sortOrder === 'asc' ? (
                  <SortAsc className="h-4 w-4" />
                ) : (
                  <SortDesc className="h-4 w-4" />
                )
              ) : (
                <ChevronUp className="h-4 w-4 opacity-50" />
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-6">
          {activeTab === 'flow' ? (
            sortedFlowProposals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
                <FileText className="mb-3 h-12 w-12" />
                <p className="text-sm">暂无审批流转记录</p>
              </div>
            ) : (
              sortedFlowProposals.map((proposal) => (
                <FlowRecordItem
                  key={proposal.id}
                  proposal={proposal}
                  onClick={() => navigate(`/proposals/${proposal.id}`)}
                  threshold={threshold}
                />
              ))
            )
          ) : (
            filteredApprovals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
                <CheckCircle2 className="mb-3 h-12 w-12" />
                <p className="text-sm">暂无{activeTab === 'pending' ? '待审批' : '已审批'}记录</p>
              </div>
            ) : (
              filteredApprovals.map((approval) => {
                const proposal = getProposalById(approval.proposalId);
                if (!proposal) return null;
                return (
                  <ApprovalItem
                    key={approval.id}
                    approval={approval}
                    proposal={proposal}
                    onClick={() => navigate(`/approvals/${approval.id}`)}
                    threshold={threshold}
                  />
                );
              })
            )
          )}
        </div>
      </div>
    </div>
  );
}
