import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Building2,
  User,
  Coins,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  FolderKanban,
} from 'lucide-react';
import { useProposalStore } from '@/store/useProposalStore';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/date';
import type { ProposalStatus } from '@/types';

const PAGE_SIZE = 6;

const statusOptions: { value: ProposalStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'draft', label: '草稿' },
  { value: 'pending', label: '待审批' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已驳回' },
  { value: 'project_created', label: '已立项' },
];

const statusConfig: Record<ProposalStatus, { label: string; className: string; icon: typeof FileText }> = {
  draft: { label: '草稿', className: 'badge-neutral', icon: FileText },
  pending: { label: '待审批', className: 'badge-warning', icon: Loader2 },
  approved: { label: '已通过', className: 'badge-success', icon: CheckCircle2 },
  rejected: { label: '已驳回', className: 'badge-error', icon: XCircle },
  project_created: { label: '已立项', className: 'badge-info', icon: FolderKanban },
};

const departments = ['全部部门', '研发部', '市场部', '运营部', '人力资源部', '财务部'];

const timeRanges = [
  { value: 'all', label: '全部时间' },
  { value: 'week', label: '近一周' },
  { value: 'month', label: '近一月' },
  { value: 'quarter', label: '近三月' },
  { value: 'year', label: '近一年' },
];

function formatCost(cost: number): string {
  if (cost >= 10000) {
    return `¥${(cost / 10000).toFixed(1)}万`;
  }
  return `¥${cost.toLocaleString()}`;
}

export default function Proposals() {
  const navigate = useNavigate();
  const { getFilteredProposals, setFilters, filters, clearFilters } = useProposalStore();
  const { getUserById } = useAuthStore();

  const [searchText, setSearchText] = useState('');
  const [status, setStatus] = useState<ProposalStatus | 'all'>('all');
  const [department, setDepartment] = useState('全部部门');
  const [timeRange, setTimeRange] = useState('all');
  const [page, setPage] = useState(1);

  const filteredProposals = useMemo(() => {
    const now = new Date();
    let minDate: Date | undefined;

    switch (timeRange) {
      case 'week':
        minDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        minDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        minDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        minDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    setFilters({
      status: status === 'all' ? undefined : status,
      department: department === '全部部门' ? undefined : department,
      keyword: searchText || undefined,
    });

    const proposals = getFilteredProposals();

    if (minDate) {
      return proposals.filter((p) => new Date(p.createdAt) >= minDate);
    }
    return proposals;
  }, [searchText, status, department, timeRange, getFilteredProposals, setFilters]);

  const totalPages = Math.max(1, Math.ceil(filteredProposals.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedProposals = filteredProposals.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleReset = () => {
    setSearchText('');
    setStatus('all');
    setDepartment('全部部门');
    setTimeRange('all');
    setPage(1);
    clearFilters();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">创意提案</h1>
          <p className="text-neutral-500 mt-1">浏览和管理所有创意提案</p>
        </div>
        <button
          onClick={() => navigate('/proposals/new')}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" />
          新建提案
        </button>
      </div>

      <div className="card p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-neutral-500" />
          <span className="text-sm font-medium text-neutral-700">筛选条件</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="搜索提案标题、描述或关键词..."
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setPage(1);
                }}
                className="input pl-10"
              />
            </div>
          </div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as ProposalStatus | 'all');
              setPage(1);
            }}
            className="input"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setPage(1);
            }}
            className="input"
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            value={timeRange}
            onChange={(e) => {
              setTimeRange(e.target.value);
              setPage(1);
            }}
            className="input"
          >
            {timeRanges.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        {(searchText || status !== 'all' || department !== '全部部门' || timeRange !== 'all') && (
          <div className="mt-4 flex justify-end">
            <button onClick={handleReset} className="btn btn-ghost text-sm">
              重置筛选
            </button>
          </div>
        )}
      </div>

      {paginatedProposals.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500">暂无符合条件的提案</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
            {paginatedProposals.map((proposal) => {
              const submitter = getUserById(proposal.submitterId);
              const StatusIcon = statusConfig[proposal.status].icon;
              return (
                <div
                  key={proposal.id}
                  onClick={() => navigate(`/proposals/${proposal.id}`)}
                  className="card card-hover p-5 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-neutral-800 line-clamp-1 flex-1 mr-3">
                      {proposal.title}
                    </h3>
                    <span
                      className={cn('badge shrink-0', statusConfig[proposal.status].className)}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig[proposal.status].label}
                    </span>
                  </div>

                  <p className="text-sm text-neutral-500 line-clamp-2 mb-4 min-h-[40px]">
                    {proposal.description}
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <Coins className="w-4 h-4 text-primary-500" />
                      <span className="text-neutral-500">预估成本：</span>
                      <span className="font-medium text-neutral-800">
                        {formatCost(proposal.estimatedCost)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <Building2 className="w-4 h-4 text-accent-500" />
                      <span className="text-neutral-500">所属部门：</span>
                      <span className="font-medium text-neutral-800">{proposal.department}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <Clock className="w-4 h-4 text-warning-500" />
                      <span className="text-neutral-500">提交时间：</span>
                      <span className="font-medium text-neutral-800">
                        {formatDate(proposal.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <User className="w-4 h-4 text-neutral-400" />
                      <span className="text-neutral-500">提交人：</span>
                      <span className="font-medium text-neutral-800">
                        {submitter?.name || '未知'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn btn-secondary"
              >
                <ChevronLeft className="w-4 h-4" />
                上一页
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn(
                      'w-9 h-9 rounded-lg text-sm font-medium transition-all',
                      p === currentPage
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'text-neutral-600 hover:bg-neutral-100'
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn btn-secondary"
              >
                下一页
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="ml-4 text-sm text-neutral-500">
                共 {filteredProposals.length} 条
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
