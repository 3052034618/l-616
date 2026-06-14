import { create } from 'zustand';
import type { Approval, ApprovalLevel, ApprovalStatus, Proposal } from '../types';
import { useProposalStore } from './useProposalStore';

const MANAGER_APPROVAL_THRESHOLD = 50000;

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

export const useApprovalStore = create<ApprovalState>((set, get) => ({
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

    if (updated && updated.level === 'manager') {
      const proposalApproval = get().getApprovalsByProposal(approval.proposalId);
      const managerApproved = proposalApproval.some(
        (a) => a.level === 'manager' && a.status === 'approved'
      );
      if (managerApproved) {
        const { determineApprovalLevel } = get();
        const proposal = useProposalStore.getState().getProposalById(approval.proposalId);
        if (proposal && determineApprovalLevel(proposal.estimatedCost) === 'committee') {
        }
      }
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
}));
