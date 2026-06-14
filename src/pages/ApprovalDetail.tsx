import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  X,
  Clock,
  User,
  Calendar,
  DollarSign,
  Building2,
  Target,
  Package,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/date';
import { useApprovalStore } from '@/store/useApprovalStore';
import { useProposalStore } from '@/store/useProposalStore';
import { useAuthStore } from '@/store/useAuthStore';


interface TimelineItemProps {
  title: string;
  subtitle: string;
  status: 'completed' | 'current' | 'pending' | 'rejected';
  time?: string;
  comment?: string;
}

function TimelineItem({ title, subtitle, status, time, comment }: TimelineItemProps) {
  const iconMap = {
    completed: { icon: CheckCircle2, className: 'bg-green-500 text-white' },
    current: { icon: Loader2, className: 'bg-indigo-500 text-white animate-spin' },
    pending: { icon: Clock, className: 'bg-neutral-200 text-neutral-500' },
    rejected: { icon: XCircle, className: 'bg-red-500 text-white' },
  };
  const { icon: Icon, className } = iconMap[status];

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-full', className)}>
          <Icon className="h-5 w-5" />
        </div>
        <div
          className={cn(
            'mt-2 w-0.5 flex-1',
            status === 'completed' ? 'bg-green-200' : 'bg-neutral-200'
          )}
        />
      </div>
      <div className="flex-1 pb-6">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-neutral-900">{title}</h4>
          {time && <span className="text-xs text-neutral-400">{time}</span>}
        </div>
        <p className="mt-0.5 text-sm text-neutral-500">{subtitle}</p>
        {comment && (
          <div className="mt-2 rounded-lg bg-neutral-50 p-3">
            <p className="text-sm text-neutral-600">
              <span className="font-medium">审批意见：</span>
              {comment}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ApprovalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getApprovalById = useApprovalStore((s) => s.getApprovalById);
  const getApprovalsByProposal = useApprovalStore((s) => s.getApprovalsByProposal);
  const getProposalById = useProposalStore((s) => s.getProposalById);
  const approve = useApprovalStore((s) => s.approve);
  const reject = useApprovalStore((s) => s.reject);
  const canApproverHandle = useApprovalStore((s) => s.canApproverHandle);
  const getUserById = useAuthStore((s) => s.getUserById);
  const currentUser = useAuthStore((s) => s.currentUser);

  const approval = id ? getApprovalById(id) : undefined;
  const proposal = approval ? getProposalById(approval.proposalId) : undefined;
  const allApprovals = approval ? getApprovalsByProposal(approval.proposalId) : [];
  const submitter = proposal ? getUserById(proposal.submitterId) : undefined;

  const canHandle = approval && proposal && currentUser
    ? canApproverHandle(currentUser.id, currentUser.role, proposal) && approval.status === 'pending'
    : false;

  const handleApprove = () => {
    if (!approval || !canHandle) return;
    setSubmitting(true);
    setTimeout(() => {
      approve(approval.id, comment);
      setSubmitting(false);
      navigate('/approvals');
    }, 500);
  };

  const handleReject = () => {
    if (!approval || !canHandle) return;
    setSubmitting(true);
    setTimeout(() => {
      reject(approval.id, comment);
      setSubmitting(false);
      navigate('/approvals');
    }, 500);
  };

  const buildTimeline = (): TimelineItemProps[] => {
    if (!proposal || !approval) return [];

    const items: TimelineItemProps[] = [];

    items.push({
      title: '提交提案',
      subtitle: submitter?.name || '未知提交人',
      status: 'completed',
      time: formatDate(proposal.createdAt, 'YYYY-MM-DD HH:mm'),
    });

    const managerApproval = allApprovals.find((a) => a.level === 'manager');
    const committeeApproval = allApprovals.find((a) => a.level === 'committee');

    const requiredLevel = approval.level === 'committee' || proposal.estimatedCost > 50000;

    if (managerApproval) {
      const approver = getUserById(managerApproval.approverId);
      let status: TimelineItemProps['status'] = 'pending';
      if (managerApproval.status === 'approved') status = 'completed';
      else if (managerApproval.status === 'rejected') status = 'rejected';
      else if (managerApproval.id === approval.id) status = 'current';

      items.push({
        title: '部门主管审批',
        subtitle: approver?.name || '待分配',
        status,
        time: managerApproval.status !== 'pending'
          ? formatDate(managerApproval.createdAt, 'YYYY-MM-DD HH:mm')
          : undefined,
        comment: managerApproval.comment || undefined,
      });
    } else if (requiredLevel) {
      items.push({
        title: '部门主管审批',
        subtitle: '待审批',
        status: 'pending',
      });
    }

    if (committeeApproval || requiredLevel) {
      if (committeeApproval) {
        const approver = getUserById(committeeApproval.approverId);
        let status: TimelineItemProps['status'] = 'pending';
        if (committeeApproval.status === 'approved') status = 'completed';
        else if (committeeApproval.status === 'rejected') status = 'rejected';
        else if (committeeApproval.id === approval.id) status = 'current';

        items.push({
          title: '评审委员会审批',
          subtitle: approver?.name || '待分配',
          status,
          time: committeeApproval.status !== 'pending'
            ? formatDate(committeeApproval.createdAt, 'YYYY-MM-DD HH:mm')
            : undefined,
          comment: committeeApproval.comment || undefined,
        });
      } else {
        items.push({
          title: '评审委员会审批',
          subtitle: '待审批',
          status: 'pending',
        });
      }
    }

    const finalStatus = allApprovals.some((a) => a.status === 'rejected')
      ? 'rejected'
      : allApprovals.every((a) => a.status === 'approved')
      ? 'completed'
      : 'pending';

    items.push({
      title: '审批完成',
      subtitle: finalStatus === 'completed' ? '提案已通过' : finalStatus === 'rejected' ? '提案已驳回' : '等待审批',
      status: finalStatus as TimelineItemProps['status'],
    });

    return items;
  };

  if (!approval || !proposal) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
        <XCircle className="mb-3 h-12 w-12" />
        <p className="text-sm">审批记录不存在</p>
        <button
          onClick={() => navigate('/approvals')}
          className="mt-4 text-sm text-indigo-600 hover:text-indigo-700"
        >
          返回审批列表
        </button>
      </div>
    );
  }

  const timeline = buildTimeline();
  const isManagerLevel = approval.level === 'manager';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/approvals')}
          className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-600 transition-all hover:border-neutral-300 hover:bg-neutral-50"
        >
          <ArrowLeft className="h-4 w-4" />
          返回
        </button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">审批详情</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {isManagerLevel ? '部门主管级审批' : '评审委员会级审批'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 flex flex-col gap-6">
          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900">提案信息</h2>
              <span
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium',
                  proposal.status === 'pending' && 'bg-amber-100 text-amber-700',
                  proposal.status === 'approved' && 'bg-green-100 text-green-700',
                  proposal.status === 'rejected' && 'bg-red-100 text-red-700',
                  proposal.status === 'project_created' && 'bg-blue-100 text-blue-700',
                  proposal.status === 'draft' && 'bg-neutral-100 text-neutral-700'
                )}
              >
                {proposal.status === 'pending' && '审批中'}
                {proposal.status === 'approved' && '已通过'}
                {proposal.status === 'rejected' && '已驳回'}
                {proposal.status === 'project_created' && '已立项'}
                {proposal.status === 'draft' && '草稿'}
              </span>
            </div>

            <h3 className="mb-4 text-xl font-semibold text-neutral-900">{proposal.title}</h3>

            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-neutral-400" />
                <span className="text-neutral-500">提交人：</span>
                <span className="font-medium text-neutral-700">{submitter?.name || '-'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-neutral-400" />
                <span className="text-neutral-500">所属部门：</span>
                <span className="font-medium text-neutral-700">{proposal.department}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-neutral-400" />
                <span className="text-neutral-500">预估成本：</span>
                <span className="font-medium text-neutral-700">¥{proposal.estimatedCost.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-neutral-400" />
                <span className="text-neutral-500">提交时间：</span>
                <span className="font-medium text-neutral-700">
                  {formatDate(proposal.createdAt, 'YYYY-MM-DD HH:mm')}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-neutral-700">
                  <Package className="h-4 w-4 text-neutral-400" />
                  方案描述
                </div>
                <p className="rounded-lg bg-neutral-50 p-3 text-sm text-neutral-600 leading-relaxed">
                  {proposal.description}
                </p>
              </div>

              <div>
                <div className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-neutral-700">
                  <Target className="h-4 w-4 text-neutral-400" />
                  预期收益
                </div>
                <p className="rounded-lg bg-neutral-50 p-3 text-sm text-neutral-600 leading-relaxed">
                  {proposal.expectedBenefit}
                </p>
              </div>

              <div>
                <div className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-neutral-700">
                  <Package className="h-4 w-4 text-neutral-400" />
                  所需资源
                </div>
                <p className="rounded-lg bg-neutral-50 p-3 text-sm text-neutral-600 leading-relaxed">
                  {proposal.resources}
                </p>
              </div>

              {proposal.keywords.length > 0 && (
                <div>
                  <div className="mb-1.5 text-sm font-medium text-neutral-700">关键词</div>
                  <div className="flex flex-wrap gap-2">
                    {proposal.keywords.map((kw) => (
                      <span
                        key={kw}
                        className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {canHandle && (
            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-neutral-900">审批操作</h2>

              <div className="mb-4">
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-neutral-700">
                  <MessageSquare className="h-4 w-4 text-neutral-400" />
                  审批意见
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="请输入您的审批意见（可选）"
                  rows={4}
                  className="w-full resize-none rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 placeholder:text-neutral-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleApprove}
                  disabled={submitting}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  通过
                </button>
                <button
                  onClick={handleReject}
                  disabled={submitting}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  驳回
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-6 text-lg font-semibold text-neutral-900">审批流程</h2>
          <div className="flex flex-col">
            {timeline.map((item, index) => (
              <div key={index} className={index === timeline.length - 1 ? '[&>div>div:last-child]:hidden' : ''}>
                <TimelineItem {...item} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
