import { useState } from 'react';
import {
  Coins,
  TrendingUp,
  Gift,
  ShoppingBag,
  History,
  Copy,
  Check,
  X,
  QrCode,
  Calendar,
  Package,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { usePointsStore } from '@/store/usePointsStore';
import type { Reward } from '@/types';
import { formatDate, addDays } from '@/utils/date';

type TabType = 'shop' | 'myRedeem';

interface RedeemSuccessData {
  reward: Reward;
  redeemCode: string;
}

export default function Points() {
  const { currentUser } = useAuthStore();
  const {
    rewards,
    getRecordsByUser,
    getRewardById,
    redeemReward,
    getUserEarnedPoints,
    getUserRedeemedPoints,
  } = usePointsStore();

  const [activeTab, setActiveTab] = useState<TabType>('shop');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [redeemData, setRedeemData] = useState<RedeemSuccessData | null>(null);
  const [copied, setCopied] = useState(false);

  const userId = currentUser?.id || '';
  const currentPoints = currentUser?.points || 0;
  const earnedPoints = getUserEarnedPoints(userId);
  const redeemedPoints = getUserRedeemedPoints(userId);

  const myRedeemRecords = getRecordsByUser(userId)
    .filter((r) => r.type === 'redeem')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleRedeem = (reward: Reward) => {
    if (!currentUser) return;
    const result = redeemReward(currentUser.id, reward.id);
    if (result.success && result.redeemCode) {
      setRedeemData({ reward, redeemCode: result.redeemCode });
      setShowSuccessModal(true);
    } else {
      alert(result.message);
    }
  };

  const handleCopyCode = async () => {
    if (!redeemData?.redeemCode) return;
    try {
      await navigator.clipboard.writeText(redeemData.redeemCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('复制失败');
    }
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    setRedeemData(null);
    setCopied(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">积分中心</h1>
          <p className="mt-1 text-sm text-neutral-500">管理您的积分，兑换精选好礼</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 p-6 text-white shadow-card">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -right-4 -bottom-4 h-20 w-20 rounded-full bg-white/10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-primary-100">
              <Coins className="h-5 w-5" />
              <span className="text-sm font-medium">当前积分</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-bold tracking-tight">{currentPoints.toLocaleString()}</span>
              <span className="text-primary-100">积分</span>
            </div>
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              继续提案赚取更多积分
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-card">
          <div className="flex items-center gap-2 text-neutral-500">
            <TrendingUp className="h-5 w-5 text-accent-500" />
            <span className="text-sm font-medium">累计获得</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-neutral-900">{earnedPoints.toLocaleString()}</span>
            <span className="text-sm text-neutral-400">积分</span>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent-400 to-accent-500"
              style={{ width: `${Math.min(100, (earnedPoints / 5000) * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-neutral-400">目标 5000 积分</p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-card">
          <div className="flex items-center gap-2 text-neutral-500">
            <Gift className="h-5 w-5 text-warning-500" />
            <span className="text-sm font-medium">已兑换</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-neutral-900">{redeemedPoints.toLocaleString()}</span>
            <span className="text-sm text-neutral-400">积分</span>
          </div>
          <div className="mt-4 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Package className="h-4 w-4 text-neutral-400" />
              <span className="text-neutral-500">{myRedeemRecords.length} 件商品</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white shadow-card">
        <div className="flex border-b border-neutral-100">
          <button
            onClick={() => setActiveTab('shop')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'shop'
                ? 'border-b-2 border-primary-500 text-primary-600'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            兑换商城
          </button>
          <button
            onClick={() => setActiveTab('myRedeem')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'myRedeem'
                ? 'border-b-2 border-primary-500 text-primary-600'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <History className="h-4 w-4" />
            我的兑换
            {myRedeemRecords.length > 0 && (
              <span className="ml-1 rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-600">
                {myRedeemRecords.length}
              </span>
            )}
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'shop' ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {rewards.map((reward) => {
                const canAfford = currentPoints >= reward.pointsCost;
                const inStock = reward.stock > 0;
                const canRedeem = canAfford && inStock;

                return (
                  <div
                    key={reward.id}
                    className="group overflow-hidden rounded-xl border border-neutral-200 bg-white transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
                      <img
                        src={reward.imageUrl}
                        alt={reward.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {reward.type === 'training' && (
                        <span className="absolute left-3 top-3 rounded-full bg-primary-500 px-2.5 py-1 text-xs font-medium text-white">
                          培训课程
                        </span>
                      )}
                      {!inStock && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <span className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-neutral-600">
                            已兑完
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="line-clamp-1 text-base font-semibold text-neutral-900">
                        {reward.name}
                      </h3>
                      <p className="mt-1 line-clamp-2 h-10 text-sm text-neutral-500">
                        {reward.description}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-baseline gap-1">
                          <Coins className="h-4 w-4 text-warning-500" />
                          <span className="text-lg font-bold text-warning-500">
                            {reward.pointsCost.toLocaleString()}
                          </span>
                          <span className="text-xs text-neutral-400">积分</span>
                        </div>
                        <span className="text-xs text-neutral-400">
                          库存 {reward.stock}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRedeem(reward)}
                        disabled={!canRedeem}
                        className={`mt-4 w-full rounded-lg py-2.5 text-sm font-medium transition-all ${
                          canRedeem
                            ? 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700'
                            : 'cursor-not-allowed bg-neutral-100 text-neutral-400'
                        }`}
                      >
                        {!inStock
                          ? '已兑完'
                          : !canAfford
                          ? '积分不足'
                          : '立即兑换'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div>
              {myRedeemRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Gift className="h-16 w-16 text-neutral-300" />
                  <p className="mt-4 text-sm font-medium text-neutral-500">暂无兑换记录</p>
                  <button
                    onClick={() => setActiveTab('shop')}
                    className="mt-4 rounded-lg bg-primary-50 px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-100"
                  >
                    去商城看看
                  </button>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-neutral-200">
                  <table className="w-full">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                          兑换时间
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                          商品名称
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                          消耗积分
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                          兑换码
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                          状态
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {myRedeemRecords.map((record) => {
                        const reward = record.rewardId ? getRewardById(record.rewardId) : null;
                        return (
                          <tr key={record.id} className="hover:bg-neutral-50">
                            <td className="px-4 py-4 text-sm text-neutral-600">
                              {formatDate(record.createdAt, 'YYYY-MM-DD HH:mm')}
                            </td>
                            <td className="px-4 py-4 text-sm font-medium text-neutral-900">
                              {reward?.name || record.source.replace('兑换：', '')}
                            </td>
                            <td className="px-4 py-4 text-sm font-medium text-warning-600">
                              -{record.amount.toLocaleString()}
                            </td>
                            <td className="px-4 py-4">
                              <span className="rounded-md bg-neutral-100 px-2.5 py-1 font-mono text-sm text-neutral-700">
                                {record.redeemCode || '-'}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="inline-flex items-center gap-1 rounded-full bg-accent-50 px-2.5 py-1 text-xs font-medium text-accent-700">
                                <Check className="h-3 w-3" />
                                兑换成功
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showSuccessModal && redeemData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md animate-fade-in-up rounded-2xl bg-white shadow-xl">
            <div className="relative flex items-center justify-between border-b border-neutral-100 px-6 py-4">
              <h3 className="text-lg font-semibold text-neutral-900">兑换成功</h3>
              <button
                onClick={handleCloseModal}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-6">
              <div className="flex flex-col items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-50">
                  <Check className="h-8 w-8 text-accent-500" />
                </div>
                <h4 className="mt-4 text-xl font-bold text-neutral-900">{redeemData.reward.name}</h4>
                <p className="mt-1 text-sm text-neutral-500">
                  消耗 {redeemData.reward.pointsCost.toLocaleString()} 积分
                </p>
              </div>

              <div className="mt-6 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-white">
                    <QrCode className="h-16 w-16 text-neutral-300" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-neutral-500">电子兑换码</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="flex-1 rounded-lg bg-white px-3 py-2 font-mono text-lg font-bold tracking-wider text-primary-600">
                        {redeemData.redeemCode}
                      </span>
                      <button
                        onClick={handleCopyCode}
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors ${
                          copied
                            ? 'bg-accent-500 text-white'
                            : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                        }`}
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                    {copied && (
                      <p className="mt-2 text-xs font-medium text-accent-600">已复制到剪贴板</p>
                    )}
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-neutral-500">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>有效期至 {formatDate(addDays(new Date(), 30), 'YYYY年MM月DD日')}</span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-xs text-neutral-400">
                * 请妥善保管兑换码，遗失不补。如有疑问请联系HR部门。
              </p>
            </div>

            <div className="flex gap-3 border-t border-neutral-100 px-6 py-4">
              <button
                onClick={handleCloseModal}
                className="flex-1 rounded-lg border border-neutral-200 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                关闭
              </button>
              <button
                onClick={() => {
                  handleCloseModal();
                  setActiveTab('myRedeem');
                }}
                className="flex-1 rounded-lg bg-primary-500 py-2.5 text-sm font-medium text-white hover:bg-primary-600"
              >
                查看记录
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
