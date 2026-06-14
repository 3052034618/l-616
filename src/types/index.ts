export type UserRole = 'employee' | 'manager' | 'committee' | 'admin';

export type ProposalStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'project_created';

export type ApprovalLevel = 'manager' | 'committee';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type ProjectStatus = 'planning' | 'in_progress' | 'completed' | 'delayed';

export type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';

export type PointsType = 'earn' | 'redeem';

export type RewardType = 'gift' | 'training';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  avatar?: string;
  points: number;
}

export interface SimilarCase {
  id: string;
  title: string;
  department: string;
  matchRate: number;
  result: 'success' | 'failed';
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  expectedBenefit: string;
  resources: string;
  estimatedCost: number;
  status: ProposalStatus;
  department: string;
  submitterId: string;
  createdAt: Date;
  keywords: string[];
  recommendedDepartments?: string[];
  similarCases?: SimilarCase[];
}

export interface Approval {
  id: string;
  proposalId: string;
  approverId: string;
  level: ApprovalLevel;
  status: ApprovalStatus;
  comment: string;
  createdAt: Date;
}

export interface ProgressReport {
  id: string;
  milestoneId: string;
  reporterId: string;
  content: string;
  submittedAt: Date;
  isOverdue: boolean;
}

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  dueDate: Date;
  status: MilestoneStatus;
  description: string;
  reports: ProgressReport[];
}

export interface Project {
  id: string;
  projectNo: string;
  proposalId: string;
  name: string;
  ownerId: string;
  status: ProjectStatus;
  progress: number;
  startDate: Date;
  endDate: Date;
  actualBenefit: number;
  milestones: Milestone[];
  expectedBenefit?: string;
  resources?: string;
  recommendedDepartments?: string[];
}

export interface PointsRecord {
  id: string;
  userId: string;
  type: PointsType;
  amount: number;
  source: string;
  createdAt: Date;
  redeemCode?: string;
  rewardId?: string;
}

export interface Reward {
  id: string;
  name: string;
  type: RewardType;
  pointsCost: number;
  stock: number;
  description: string;
  imageUrl: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
  relatedId?: string;
  relatedType?: string;
}

export interface DepartmentStats {
  department: string;
  proposalCount: number;
  approvalRate: number;
  projectCount: number;
  completionRate: number;
  totalPoints: number;
  redeemRate: number;
}
