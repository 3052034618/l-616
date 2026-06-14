import { create } from 'zustand';
import type { PointsRecord, PointsType, Reward } from '../types';
import { rewards as mockRewards } from '../data/rewards';
import { calcTotalPoints } from '../utils/points';
import { useAuthStore } from './useAuthStore';
import { persist } from './persist';

function generateRedeemCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) {
      code += '-';
    }
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

interface PointsFilters {
  userId?: string;
  type?: PointsType;
  startDate?: Date;
  endDate?: Date;
}

interface PointsState {
  records: PointsRecord[];
  rewards: Reward[];
  filters: PointsFilters;
  setFilters: (filters: Partial<PointsFilters>) => void;
  clearFilters: () => void;
  getFilteredRecords: () => PointsRecord[];
  getRecordsByUser: (userId: string) => PointsRecord[];
  getRecordsByType: (type: PointsType) => PointsRecord[];
  getUserTotalPoints: (userId: string) => number;
  getUserEarnedPoints: (userId: string) => number;
  getUserRedeemedPoints: (userId: string) => number;
  addPoints: (userId: string, amount: number, source: string) => PointsRecord;
  redeemReward: (userId: string, rewardId: string) => { success: boolean; message: string; record?: PointsRecord; redeemCode?: string };
  generateRedeemCode: () => string;
  getRecordById: (id: string) => PointsRecord | undefined;
  getRewardById: (id: string) => Reward | undefined;
  getRewardsByType: (type: 'gift' | 'training') => Reward[];
  getAvailableRewards: () => Reward[];
  updateReward: (id: string, updates: Partial<Reward>) => Reward | undefined;
  deleteReward: (id: string) => boolean;
  addReward: (reward: Omit<Reward, 'id'>) => Reward;
  calculateProjectPoints: (costSaving?: number, revenueIncrease?: number, isCompleted?: boolean) => {
    costSavingPoints: number;
    revenueIncreasePoints: number;
    completionBonus: number;
    total: number;
  };
  awardProjectPoints: (userIds: string[], costSaving?: number, revenueIncrease?: number, isCompleted?: boolean, source?: string) => PointsRecord[];
}

export const usePointsStore = create<PointsState>(
  persist(
    (set, get) => ({
  records: [],
  rewards: mockRewards,
  filters: {},

  setFilters: (filters: Partial<PointsFilters>) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }));
  },

  clearFilters: () => {
    set({ filters: {} });
  },

  getFilteredRecords: () => {
    const { records, filters } = get();
    return records.filter((r) => {
      if (filters.userId && r.userId !== filters.userId) return false;
      if (filters.type && r.type !== filters.type) return false;
      if (filters.startDate && new Date(r.createdAt) < filters.startDate) return false;
      if (filters.endDate && new Date(r.createdAt) > filters.endDate) return false;
      return true;
    });
  },

  getRecordsByUser: (userId: string) => {
    return get().records.filter((r) => r.userId === userId);
  },

  getRecordsByType: (type: PointsType) => {
    return get().records.filter((r) => r.type === type);
  },

  getUserTotalPoints: (userId: string) => {
    const user = useAuthStore.getState().getUserById(userId);
    return user?.points ?? 0;
  },

  getUserEarnedPoints: (userId: string) => {
    return get()
      .getRecordsByUser(userId)
      .filter((r) => r.type === 'earn')
      .reduce((sum, r) => sum + r.amount, 0);
  },

  getUserRedeemedPoints: (userId: string) => {
    return get()
      .getRecordsByUser(userId)
      .filter((r) => r.type === 'redeem')
      .reduce((sum, r) => sum + r.amount, 0);
  },

  addPoints: (userId: string, amount: number, source: string) => {
    useAuthStore.getState().addUserPoints(userId, amount);

    const record: PointsRecord = {
      id: `pt${String(Date.now()).slice(-6)}`,
      userId,
      type: 'earn',
      amount,
      source,
      createdAt: new Date(),
    };

    set((state) => ({ records: [...state.records, record] }));
    return record;
  },

  redeemReward: (userId: string, rewardId: string) => {
    const reward = get().getRewardById(rewardId);
    if (!reward) {
      return { success: false, message: '奖励不存在' };
    }

    if (reward.stock <= 0) {
      return { success: false, message: '奖励库存不足' };
    }

    const user = useAuthStore.getState().getUserById(userId);
    if (!user) {
      return { success: false, message: '用户不存在' };
    }

    if (user.points < reward.pointsCost) {
      return { success: false, message: `积分不足，需要 ${reward.pointsCost} 积分，当前 ${user.points} 积分` };
    }

    const deducted = useAuthStore.getState().deductUserPoints(userId, reward.pointsCost);
    if (!deducted) {
      return { success: false, message: '积分扣减失败' };
    }

    const redeemCode = generateRedeemCode();

    const record: PointsRecord = {
      id: `pt${String(Date.now()).slice(-6)}`,
      userId,
      type: 'redeem',
      amount: reward.pointsCost,
      source: `兑换：${reward.name}`,
      createdAt: new Date(),
      redeemCode,
      rewardId,
    };

    set((state) => ({
      records: [...state.records, record],
      rewards: state.rewards.map((r) =>
        r.id === rewardId ? { ...r, stock: r.stock - 1 } : r
      ),
    }));

    return {
      success: true,
      message: '兑换成功',
      record,
      redeemCode,
    };
  },

  generateRedeemCode,

  getRecordById: (id: string) => {
    return get().records.find((r) => r.id === id);
  },

  getRewardById: (id: string) => {
    return get().rewards.find((r) => r.id === id);
  },

  getRewardsByType: (type: 'gift' | 'training') => {
    return get().rewards.filter((r) => r.type === type);
  },

  getAvailableRewards: () => {
    return get().rewards.filter((r) => r.stock > 0);
  },

  updateReward: (id: string, updates: Partial<Reward>) => {
    let updated: Reward | undefined;
    set((state) => ({
      rewards: state.rewards.map((r) => {
        if (r.id === id) {
          updated = { ...r, ...updates };
          return updated;
        }
        return r;
      }),
    }));
    return updated;
  },

  deleteReward: (id: string) => {
    const exists = get().rewards.some((r) => r.id === id);
    if (!exists) return false;
    set((state) => ({
      rewards: state.rewards.filter((r) => r.id !== id),
    }));
    return true;
  },

  addReward: (reward) => {
    const newReward: Reward = {
      ...reward,
      id: `r${String(Date.now()).slice(-6)}`,
    };
    set((state) => ({ rewards: [...state.rewards, newReward] }));
    return newReward;
  },

  calculateProjectPoints: (costSaving = 0, revenueIncrease = 0, isCompleted = false) => {
    return calcTotalPoints(costSaving, revenueIncrease, isCompleted);
  },

  awardProjectPoints: (userIds, costSaving = 0, revenueIncrease = 0, isCompleted = false, source = '项目奖励') => {
    const breakdown = calcTotalPoints(costSaving, revenueIncrease, isCompleted);
    const pointsPerUser = Math.floor(breakdown.total / Math.max(1, userIds.length));

    const records: PointsRecord[] = [];
    userIds.forEach((userId) => {
      const record = get().addPoints(userId, pointsPerUser, source);
      records.push(record);
    });

    return records;
  },
}),
    {
      name: 'points-store',
      partialize: (state) => ({
        records: state.records,
        rewards: state.rewards,
      }),
    }
  )
);
