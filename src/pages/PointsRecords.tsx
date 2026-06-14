import { useState, useMemo } from 'react';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Search,
  Filter,
  Calendar as CalendarIcon,
  Gift,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { usePointsStore } from '@/store/usePointsStore';
import type { PointsType } from '@/types';
import { formatDate, getRelativeTime } from '@/utils/date';

type TabType = 'earn' | 'redeem';

export default function PointsRecords() {
  const { currentUser } = useAuthStore();
  const { getRecordsByUser, getRewardById } = usePointsStore();

  const [activeTab, setActiveTab] = useState<TabType>('earn');
  const [searchKeyword, setSearchKeyword] = useState('');

  const userId = currentUser?.id || '';
  const allRecords = useMemo(
    () =>
      getRecordsByUser(userId).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [getRecordsByUser, userId]
  );

  const earnRecords = useMemo(
    () => allRecords.filter((r) => r.type === 'earn'),
    [allRecords]
  );
  const redeemRecords = useMemo(
    () => allRecords.filter((r) => r.type === 'redeem'),
    [allRecords]
  );

  const filteredRecords = useMemo(() => {
    const records = activeTab === 'earn' ? earnRecords : redeemRecords;
    if (!searchKeyword.trim()) return records;
    const keyword = searchKeyword.toLowerCase();
    return records.filter((r) => r.source.toLowerCase().includes(keyword));
  }, [activeTab, earnRecords, redeemRecords, searchKeyword]);

  const earnSummary = useMemo(
    () => ({
      total: earnRecords.reduce((sum, r) => sum + r.amount, 0),
      count: earnRecords.length,
    }),
    [earnRecords]
  );

  const redeemSummary = useMemo(
    () => ({
      total: redeemRecords.reduce((sum, r) => sum + r.amount, 0),
      count: redeemRecords.length,
    }),
    [redeemRecords]
  );

  const getStatusBadge = (type: PointsType) => {
    if (type === 'earn') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-accent-50 px-2.5 py-1 text-xs font-medium text-accent-700">
          <CheckCircle2 className="h-3 w-3" />
          已到账
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
        <CheckCircle2 className="h-3 w-3" />
        兑换成功
      </span>
    );
  };

  const getTypeIcon = (type: PointsType) => {
    if (type === 'earn') {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50">
          <ArrowUpCircle className="h-5 w-5 text-accent-600" />
        </div>
      );
    }
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-50">
        <ArrowDownCircle className="h-5 w-5 text-warning-600" />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">积分记录</h1>
          <p className="mt-1 text-sm text-neutral-500">查看您的积分获取和兑换历史</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div
          onClick={() => setActiveTab('earn')}
          className={`cursor-pointer rounded-2xl border p-6 transition-all ${
            activeTab === 'earn'
              ? 'border-accent-200 bg-accent-50/50 shadow-card'
              : 'border-neutral-200 bg-white shadow-card hover:border-neutral-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-500">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-600">积分获取</p>
                <p className="text-xs text-neutral-400">{earnSummary.count} 笔记录</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-accent-600">
                +{earnSummary.total.toLocaleString()}
              </p>
              <p className="text-xs text-neutral-400">累计获取</p>
            </div>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('redeem')}
          className={`cursor-pointer rounded-2xl border p-6 transition-all ${
            activeTab === 'redeem'
              ? 'border-warning-200 bg-warning-50/50 shadow-card'
              : 'border-neutral-200 bg-white shadow-card hover:border-neutral-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning-500">
                <Gift className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-600">兑换记录</p>
                <p className="text-xs text-neutral-400">{redeemSummary.count} 笔记录</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-warning-600">
                -{redeemSummary.total.toLocaleString()}
              </p>
              <p className="text-xs text-neutral-400">累计消耗</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white shadow-card">
        <div className="flex flex-col gap-4 border-b border-neutral-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex border-b border-neutral-100 sm:border-b-0">
            <button
              onClick={() => setActiveTab('earn')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === 'earn'
                  ? 'border-b-2 border-accent-500 text-accent-600 sm:border-b-0 sm:rounded-lg sm:bg-accent-50'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <ArrowUpCircle className="h-4 w-4" />
              积分获取
            </button>
            <button
              onClick={() => setActiveTab('redeem')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === 'redeem'
                  ? 'border-b-2 border-warning-500 text-warning-600 sm:border-b-0 sm:rounded-lg sm:bg-warning-50'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <ArrowDownCircle className="h-4 w-4" />
              兑换记录
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="搜索来源/商品..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-64 rounded-lg border border-neutral-200 bg-neutral-50 py-2 pl-9 pr-4 text-sm text-neutral-700 placeholder:text-neutral-400 focus:border-primary-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <button className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50">
              <Filter className="h-4 w-4" />
              筛选
            </button>
          </div>
        </div>

        <div className="p-4">
          {filteredRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <FileText className="h-16 w-16 text-neutral-300" />
              <p className="mt-4 text-sm font-medium text-neutral-500">
                {searchKeyword ? '未找到匹配的记录' : activeTab === 'earn' ? '暂无积分获取记录' : '暂无兑换记录'}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-neutral-200">
              <table className="w-full">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      时间
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      {activeTab === 'earn' ? '来源' : '商品'}
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      积分变动
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      状态
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredRecords.map((record) => {
                    const reward = record.rewardId ? getRewardById(record.rewardId) : null;
                    return (
                      <tr key={record.id} className="transition-colors hover:bg-neutral-50">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {getTypeIcon(record.type)}
                            <div>
                              <p className="text-sm font-medium text-neutral-900">
                                {formatDate(record.createdAt, 'YYYY-MM-DD')}
                              </p>
                              <p className="text-xs text-neutral-400">
                                {getRelativeTime(record.createdAt)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div>
                            <p className="text-sm font-medium text-neutral-900">
                              {activeTab === 'earn'
                                ? record.source
                                : reward?.name || record.source.replace('兑换：', '')}
                            </p>
                            {activeTab === 'redeem' && record.redeemCode && (
                              <p className="mt-0.5 text-xs text-neutral-400">
                                兑换码：
                                <span className="font-mono">{record.redeemCode}</span>
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span
                            className={`text-lg font-bold ${
                              record.type === 'earn' ? 'text-accent-600' : 'text-warning-600'
                            }`}
                          >
                            {record.type === 'earn' ? '+' : '-'}
                            {record.amount.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-5 py-4">{getStatusBadge(record.type)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {filteredRecords.length > 0 && (
          <div className="flex items-center justify-between border-t border-neutral-100 px-6 py-4">
            <p className="text-sm text-neutral-500">
              共 <span className="font-medium text-neutral-700">{filteredRecords.length}</span> 条记录
            </p>
            <div className="flex items-center gap-2">
              <button className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-500 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50">
                上一页
              </button>
              <button className="rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white">
                1
              </button>
              <button className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-500 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50">
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-gradient-to-br from-primary-50 to-accent-50 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
            <Clock className="h-6 w-6 text-primary-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-neutral-900">积分规则说明</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-neutral-600">
              <li>• 提案被采纳可获得基础积分，项目完成后额外获得奖励积分</li>
              <li>• 积分可用于兑换商品、培训课程等福利</li>
              <li>• 积分长期有效，不清零</li>
              <li>• 积分明细如有疑问，请联系人力资源部</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
