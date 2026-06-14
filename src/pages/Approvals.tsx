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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/date';
import { useApprovalStore } from '@/store/useApprovalStore';
import { useProposalStore } from '@/store/useProposalStore';
import { useAuthStore } from '@/store/useAuthStore';
import type { Approval, Proposal } from '@/types';

type TabType = 'pending' | 'approved';
type SortField = 'cost' | 'time' | null;
type SortOrder = 'asc' | 'desc';

function getUrgencyLevel(cost: number): { label: string; className: string; icon: typeof AlertCircle } {
  if (cost >= 100000) {
    return { label: '紧急', className: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle };
  }
  if (cost >= 50000) {
    return { label: '较高', className: 'bg-orange-100 text-orange-700 border-orange-200', icon: AlertTriangle };
  }
  return { label: '普通', className: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 };
}

interface ApprovalItemProps {
  approval: Approval;
  proposal: Proposal;
  onClick: () => void;
}

function ApprovalItem({ approval, proposal, onClick }: ApprovalItemProps) {
  const getUserById = useAuthStore((s) => s.getUserById);
  const submitter = getUserById(proposal.submitterId);
  const urgency = getUrgencyLevel(proposal.estimatedCost);
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
              {approval.level === 'manager' ? '部门主管' : '评审委员会'}
            </span>
          </div>
        </div>
      </div>

      <ArrowRight className="h-5 w-5 text-neutral-300 transition-all group-hover:translate-x-1 group-hover:text-indigo-500" />
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
  const getProposalById = useProposalStore((s) => s.getProposalById);

  const myApprovals = useMemo(() => {
    if (!currentUser) return [];
    return getApprovalsByApprover(currentUser.id);
  }, [currentUser, getApprovalsByApprover]);

  const filteredApprovals = useMemo(() => {
    let list = myApprovals;

    if (activeTab === 'pending') {
      list = list.filter((a) => a.status === 'pending');
    } else {
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
          {filteredApprovals.length === 0 ? (
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
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
