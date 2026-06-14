import { create } from 'zustand';
import type { Notification } from '../types';
import { notifications as mockNotifications } from '../data/notifications';

type NotificationType = Notification['type'];

interface NotificationFilters {
  userId?: string;
  type?: NotificationType;
  isRead?: boolean;
}

interface NotificationState {
  notifications: Notification[];
  filters: NotificationFilters;
  setFilters: (filters: Partial<NotificationFilters>) => void;
  clearFilters: () => void;
  getFilteredNotifications: () => Notification[];
  getNotificationsByUser: (userId: string) => Notification[];
  getUnreadNotifications: (userId: string) => Notification[];
  getUnreadCount: (userId: string) => number;
  getNotificationById: (id: string) => Notification | undefined;
  getNotificationsByType: (userId: string, type: NotificationType) => Notification[];
  createNotification: (
    notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'> & { isRead?: boolean }
  ) => Notification;
  markAsRead: (id: string) => Notification | undefined;
  markAsUnread: (id: string) => Notification | undefined;
  markAllAsRead: (userId: string) => number;
  updateNotification: (id: string, updates: Partial<Notification>) => Notification | undefined;
  deleteNotification: (id: string) => boolean;
  deleteAllByUser: (userId: string) => number;
  sendProposalApprovedNotification: (userId: string, proposalTitle: string, projectNo: string) => Notification;
  sendProposalRejectedNotification: (userId: string, proposalTitle: string, comment: string) => Notification;
  sendApprovalPendingNotification: (approverId: string, proposalTitle: string, estimatedCost: number) => Notification;
  sendMilestoneDueNotification: (userId: string, projectName: string, milestoneName: string, daysLeft: number) => Notification;
  sendMilestoneOverdueNotification: (userId: string, projectName: string, milestoneName: string) => Notification;
  sendPointsAwardedNotification: (userId: string, amount: number, source: string) => Notification;
  sendRedeemSuccessNotification: (userId: string, rewardName: string, pointsCost: number, redeemCode: string) => Notification;
  sendProjectAssignedNotification: (userId: string, projectName: string, projectNo: string) => Notification;
  sendReportSubmittedNotification: (userId: string, milestoneName: string) => Notification;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: mockNotifications,
  filters: {},

  setFilters: (filters: Partial<NotificationFilters>) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }));
  },

  clearFilters: () => {
    set({ filters: {} });
  },

  getFilteredNotifications: () => {
    const { notifications, filters } = get();
    return notifications.filter((n) => {
      if (filters.userId && n.userId !== filters.userId) return false;
      if (filters.type && n.type !== filters.type) return false;
      if (filters.isRead !== undefined && n.isRead !== filters.isRead) return false;
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getNotificationsByUser: (userId: string) => {
    return get()
      .notifications.filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getUnreadNotifications: (userId: string) => {
    return get()
      .getNotificationsByUser(userId)
      .filter((n) => !n.isRead);
  },

  getUnreadCount: (userId: string) => {
    return get().getUnreadNotifications(userId).length;
  },

  getNotificationById: (id: string) => {
    return get().notifications.find((n) => n.id === id);
  },

  getNotificationsByType: (userId: string, type: NotificationType) => {
    return get()
      .getNotificationsByUser(userId)
      .filter((n) => n.type === type);
  },

  createNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: `n${String(Date.now()).slice(-6)}`,
      createdAt: new Date(),
      isRead: notification.isRead ?? false,
    };

    set((state) => ({ notifications: [...state.notifications, newNotification] }));
    return newNotification;
  },

  markAsRead: (id: string) => {
    let updated: Notification | undefined;
    set((state) => ({
      notifications: state.notifications.map((n) => {
        if (n.id === id) {
          updated = { ...n, isRead: true };
          return updated;
        }
        return n;
      }),
    }));
    return updated;
  },

  markAsUnread: (id: string) => {
    let updated: Notification | undefined;
    set((state) => ({
      notifications: state.notifications.map((n) => {
        if (n.id === id) {
          updated = { ...n, isRead: false };
          return updated;
        }
        return n;
      }),
    }));
    return updated;
  },

  markAllAsRead: (userId: string) => {
    let count = 0;
    set((state) => ({
      notifications: state.notifications.map((n) => {
        if (n.userId === userId && !n.isRead) {
          count++;
          return { ...n, isRead: true };
        }
        return n;
      }),
    }));
    return count;
  },

  updateNotification: (id: string, updates: Partial<Notification>) => {
    let updated: Notification | undefined;
    set((state) => ({
      notifications: state.notifications.map((n) => {
        if (n.id === id) {
          updated = { ...n, ...updates };
          return updated;
        }
        return n;
      }),
    }));
    return updated;
  },

  deleteNotification: (id: string) => {
    const exists = get().notifications.some((n) => n.id === id);
    if (!exists) return false;
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
    return true;
  },

  deleteAllByUser: (userId: string) => {
    const count = get().notifications.filter((n) => n.userId === userId).length;
    set((state) => ({
      notifications: state.notifications.filter((n) => n.userId !== userId),
    }));
    return count;
  },

  sendProposalApprovedNotification: (userId, proposalTitle, projectNo) => {
    return get().createNotification({
      userId,
      type: 'success',
      title: '提案已通过审批',
      content: `您提交的「${proposalTitle}」已通过审批，项目编号 ${projectNo} 已自动生成。`,
      relatedType: 'proposal',
    });
  },

  sendProposalRejectedNotification: (userId, proposalTitle, comment) => {
    return get().createNotification({
      userId,
      type: 'error',
      title: '提案已被驳回',
      content: `很遗憾，您提交的「${proposalTitle}」未通过审批。审批意见：${comment}`,
      relatedType: 'proposal',
    });
  },

  sendApprovalPendingNotification: (approverId, proposalTitle, estimatedCost) => {
    const formattedCost = estimatedCost >= 10000
      ? `${(estimatedCost / 10000).toFixed(1)}万元`
      : `${estimatedCost}元`;
    return get().createNotification({
      userId: approverId,
      type: 'warning',
      title: '待您审批的提案',
      content: `您有1个待审批的提案「${proposalTitle}」，预估成本${formattedCost}，请及时处理。`,
      relatedType: 'approval',
    });
  },

  sendMilestoneDueNotification: (userId, projectName, milestoneName, daysLeft) => {
    return get().createNotification({
      userId,
      type: 'warning',
      title: '里程碑即将到期',
      content: `项目「${projectName}」中里程碑「${milestoneName}」将在${daysLeft}天后到期，请督促团队按时完成。`,
      relatedType: 'milestone',
    });
  },

  sendMilestoneOverdueNotification: (userId, projectName, milestoneName) => {
    return get().createNotification({
      userId,
      type: 'warning',
      title: '里程碑已逾期',
      content: `项目「${projectName}」中里程碑「${milestoneName}」已逾期，请尽快提交进展报告。`,
      relatedType: 'milestone',
    });
  },

  sendPointsAwardedNotification: (userId, amount, source) => {
    return get().createNotification({
      userId,
      type: 'success',
      title: '积分已到账',
      content: `恭喜！${source}，您获得积分 ${amount} 分。`,
      relatedType: 'points',
    });
  },

  sendRedeemSuccessNotification: (userId, rewardName, pointsCost, redeemCode) => {
    return get().createNotification({
      userId,
      type: 'success',
      title: '兑换成功',
      content: `您已成功兑换「${rewardName}」，消耗积分${pointsCost}分。电子兑换码：${redeemCode}，请在30天内使用。`,
      relatedType: 'reward',
    });
  },

  sendProjectAssignedNotification: (userId, projectName, projectNo) => {
    return get().createNotification({
      userId,
      type: 'info',
      title: '新项目已分配给您',
      content: `项目「${projectName}」(${projectNo}) 已分配给您作为项目负责人，请及时查看项目详情。`,
      relatedType: 'project',
    });
  },

  sendReportSubmittedNotification: (userId, milestoneName) => {
    return get().createNotification({
      userId,
      type: 'success',
      title: '里程碑进展报告已提交',
      content: `里程碑「${milestoneName}」的进展报告已成功提交。`,
      relatedType: 'milestone',
    });
  },
}));
