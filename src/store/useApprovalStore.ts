import { create } from 'zustand';
import type { Approval, ApprovalLevel, ApprovalStatus, Proposal } from '../types';
import { useProposalStore } from './useProposalStore';
import { useProjectStore } from './useProjectStore';
import { useNotificationStore } from './useNotificationStore';
import { useAuthStore } from './useAuthStore';
import { addDays } from '../utils/date';
import { persist } from './persist';

const MANAGER_APPROVAL_THRESHOLD = 10000;

interface ApprovalState {
  approvals: Approval[];
  getApprovalThreshold: () => number;
  determineApprovalLevel: (estimatedCost: number) => ApprovalLevel;
  createApproval: (proposal: Proposal, approverId: string, level?: ApprovalLevel) => Approval;
  getApprovalById: (id: string) => Approval | undefined;
  getApprovalsByProposal: (proposalId: string) => Approval[];
  getApprovalsByApprover: (approverId: string) => Approval[];
  getApprovalsByLevel: (level: ApprovalLevel) => Approval[];
  getApprovalsByStatus: (status: ApprovalStatus) => Approval[];
  getPendingApprovalsByApprover: (approverId: string) => Approval[];
  approve: (approvalId: string, comment?: string) => Approval | undefined;
  reject: (approvalId: string, comment?: string) => Approval | undefined;
  isProposalApproved: (proposalId: string) => boolean;
  isProposalRejected: (proposalId: string) => boolean;
  getCurrentApprovalLevel: (proposalId: string) => ApprovalLevel | null;
  canApproverHandle: (approverId: string, role: string, proposal: Proposal) => boolean;
  updateApproval: (id: string, updates: Partial<Approval>) => Approval | undefined;
  deleteApproval: (id: string) => boolean;
}

export const useApprovalStore = create<ApprovalState>(
  persist(
    (set, get) => ({
  approvals: [],

  getApprovalThreshold: () => MANAGER_APPROVAL_THRESHOLD,

  determineApprovalLevel: (estimatedCost: number) => {
    return estimatedCost <= MANAGER_APPROVAL_THRESHOLD ? 'manager' : 'committee';
  },

  createApproval: (proposal: Proposal, approverId: string, level?: ApprovalLevel) => {
    const approvalLevel = level ?? get().determineApprovalLevel(proposal.estimatedCost);

    const existingApprovals = get().getApprovalsByProposal(proposal.id);
    const exists = existingApprovals.some(
      (a) => a.level === approvalLevel && a.status === 'pending'
    );
    if (exists) {
      return existingApprovals.find(
        (a) => a.level === approvalLevel && a.status === 'pending'
      )!;
    }

    const newApproval: Approval = {
      id: `a${String(Date.now()).slice(-6)}`,
      proposalId: proposal.id,
      approverId,
      level: approvalLevel,
      status: 'pending',
      comment: '',
      createdAt: new Date(),
    };

    set((state) => ({ approvals: [...state.approvals, newApproval] }));
    return newApproval;
  },

  getApprovalById: (id: string) => {
    return get().approvals.find((a) => a.id === id);
  },

  getApprovalsByProposal: (proposalId: string) => {
    return get().approvals.filter((a) => a.proposalId === proposalId);
  },

  getApprovalsByApprover: (approverId: string) => {
    return get().approvals.filter((a) => a.approverId === approverId);
  },

  getApprovalsByLevel: (level: ApprovalLevel) => {
    return get().approvals.filter((a) => a.level === level);
  },

  getApprovalsByStatus: (status: ApprovalStatus) => {
    return get().approvals.filter((a) => a.status === status);
  },

  getPendingApprovalsByApprover: (approverId: string) => {
    return get()
      .getApprovalsByApprover(approverId)
      .filter((a) => a.status === 'pending');
  },

  approve: (approvalId: string, comment: string = '') => {
    const approval = get().getApprovalById(approvalId);
    if (!approval || approval.status !== 'pending') return undefined;

    let updated: Approval | undefined;
    set((state) => ({
      approvals: state.approvals.map((a) => {
        if (a.id === approvalId) {
          updated = { ...a, status: 'approved', comment, createdAt: new Date() };
          return updated;
        }
        return a;
      }),
    }));

    if (!updated) return undefined;

    const proposal = useProposalStore.getState().getProposalById(approval.proposalId);
    if (!proposal) return updated;

    const notificationStore = useNotificationStore.getState();
    const authStore = useAuthStore.getState();

    notificationStore.sendProposalApprovedNotification(
      proposal.submitterId,
      proposal.id,
      proposal.title,
      approval.level
    );

    const requiredLevel = get().determineApprovalLevel(proposal.estimatedCost);

    if (updated.level === 'manager' && requiredLevel === 'committee') {
      const committeeMembers = authStore.getUsersByRole('committee');
      if (committeeMembers.length > 0) {
        const nextApprover = committeeMembers[0];
        const nextApproval = get().createApproval(proposal, nextApprover.id, 'committee');
        notificationStore.sendApprovalPendingNotification(
          nextApprover.id,
          proposal.id,
          proposal.title,
          'committee'
        );
        useProposalStore.getState().updateProposalStatus(proposal.id, 'pending');
      }
    }

    const allApprovals = get().getApprovalsByProposal(proposal.id);
    const isFullyApproved = get().isProposalApproved(proposal.id);

    if (isFullyApproved) {
      useProposalStore.getState().updateProposalStatus(proposal.id, 'approved');

      const projectStore = useProjectStore.getState();
      const startDate = new Date();
      const endDate = addDays(startDate, 90);

      const milestones = [
        {
          name: '项目启动与需求确认',
          dueDate: addDays(startDate, 15),
          description: '完成项目启动会议，确认详细需求文档',
        },
        {
          name: '方案设计与评审',
          dueDate: addDays(startDate, 30),
          description: '完成技术方案设计，通过内部评审',
        },
        {
          name: '开发与测试',
          dueDate: addDays(startDate, 75),
          description: '完成功能开发和测试工作',
        },
        {
          name: '上线与成果交付',
          dueDate: endDate,
          description: '系统正式上线，提交项目成果报告',
        },
      ];

      const newProject = projectStore.createProject({
        proposalId: proposal.id,
        name: proposal.title,
        ownerId: proposal.submitterId,
        startDate,
        endDate,
        milestones,
      });

      useProposalStore.getState().updateProposalStatus(proposal.id, 'project_created');

      notificationStore.sendProjectAssignedNotification(
        proposal.submitterId,
        newProject.id,
        newProject.projectNo,
        newProject.name
      );

      const managers = authStore.getUsersByRole('manager');
      managers.forEach((manager) => {
        if (manager.department === proposal.department) {
          notificationStore.sendProjectAssignedNotification(
            manager.id,
            newProject.id,
            newProject.projectNo,
            newProject.name
          );
        }
      });
    }

    return updated;
  },

  reject: (approvalId: string, comment: string = '') => {
    const approval = get().getApprovalById(approvalId);
    if (!approval || approval.status !== 'pending') return undefined;

    let updated: Approval | undefined;
    set((state) => ({
      approvals: state.approvals.map((a) => {
        if (a.id === approvalId) {
          updated = { ...a, status: 'rejected', comment, createdAt: new Date() };
          return updated;
        }
        return a;
      }),
    }));

    if (updated) {
      const proposal = useProposalStore.getState().getProposalById(approval.proposalId);
      if (proposal) {
        useProposalStore.getState().updateProposalStatus(proposal.id, 'rejected');
        useNotificationStore.getState().sendProposalRejectedNotification(
          proposal.submitterId,
          proposal.id,
          proposal.title,
          comment
        );
      }
    }

    return updated;
  },

  isProposalApproved: (proposalId: string) => {
    const approvals = get().getApprovalsByProposal(proposalId);
    if (approvals.length === 0) return false;

    const committeeApproved = approvals.some(
      (a) => a.level === 'committee' && a.status === 'approved'
    );
    if (committeeApproved) return true;

    const managerApproved = approvals.some(
      (a) => a.level === 'manager' && a.status === 'approved'
    );
    const hasCommittee = approvals.some((a) => a.level === 'committee');

    if (hasCommittee) {
      return false;
    }
    return managerApproved;
  },

  isProposalRejected: (proposalId: string) => {
    const approvals = get().getApprovalsByProposal(proposalId);
    return approvals.some((a) => a.status === 'rejected');
  },

  getCurrentApprovalLevel: (proposalId: string) => {
    const approvals = get().getApprovalsByProposal(proposalId);
    if (approvals.length === 0) return null;

    const pendingCommittee = approvals.find(
      (a) => a.level === 'committee' && a.status === 'pending'
    );
    if (pendingCommittee) return 'committee';

    const pendingManager = approvals.find(
      (a) => a.level === 'manager' && a.status === 'pending'
    );
    if (pendingManager) return 'manager';

    return null;
  },

  canApproverHandle: (approverId: string, role: string, proposal: Proposal) => {
    const requiredLevel = get().determineApprovalLevel(proposal.estimatedCost);

    if (requiredLevel === 'manager' && (role === 'manager' || role === 'admin')) {
      return true;
    }
    if (requiredLevel === 'committee' && (role === 'committee' || role === 'admin')) {
      return true;
    }

    const approvals = get().getApprovalsByProposal(proposal.id);
    const pendingApproval = approvals.find(
      (a) => a.status === 'pending' && a.approverId === approverId
    );
    if (pendingApproval) {
      if (pendingApproval.level === 'manager' && (role === 'manager' || role === 'admin')) {
        return true;
      }
      if (pendingApproval.level === 'committee' && (role === 'committee' || role === 'admin')) {
        return true;
      }
    }

    return false;
  },

  updateApproval: (id: string, updates: Partial<Approval>) => {
    let updated: Approval | undefined;
    set((state) => ({
      approvals: state.approvals.map((a) => {
        if (a.id === id) {
          updated = { ...a, ...updates };
          return updated;
        }
        return a;
      }),
    }));
    return updated;
  },

  deleteApproval: (id: string) => {
    const exists = get().approvals.some((a) => a.id === id);
    if (!exists) return false;
    set((state) => ({
      approvals: state.approvals.filter((a) => a.id !== id),
    }));
    return true;
  },
}),
    {
      name: 'approval-store',
      partialize: (state) => ({
        approvals: state.approvals,
      }),
    }
  )
);
