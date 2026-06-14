import { create } from 'zustand';
import type { Project, ProjectStatus, Milestone, MilestoneStatus, ProgressReport, ProjectTask, TaskStatus } from '../types';
import { projects as mockProjects } from '../data/projects';
import { getNextProjectNo } from '../utils/projectNo';
import { persist } from './persist';

interface ProjectFilters {
  status?: ProjectStatus;
  ownerId?: string;
  keyword?: string;
}

interface ProjectState {
  projects: Project[];
  filters: ProjectFilters;
  setFilters: (filters: Partial<ProjectFilters>) => void;
  clearFilters: () => void;
  getFilteredProjects: () => Project[];
  generateNextProjectNo: () => string;
  getProjectById: (id: string) => Project | undefined;
  getProjectByNo: (projectNo: string) => Project | undefined;
  getProjectByProposal: (proposalId: string) => Project | undefined;
  createProject: (data: {
    proposalId: string;
    name: string;
    ownerId: string;
    startDate: Date;
    endDate: Date;
    milestones: Omit<Milestone, 'id' | 'projectId' | 'status' | 'reports'>[];
    expectedBenefit?: string;
    resources?: string;
    recommendedDepartments?: string[];
  }) => Project;
  updateProject: (id: string, updates: Partial<Project>) => Project | undefined;
  deleteProject: (id: string) => boolean;
  updateProjectStatus: (id: string, status: ProjectStatus) => Project | undefined;
  updateProjectProgress: (id: string, progress: number) => Project | undefined;
  getProjectsByOwner: (ownerId: string) => Project[];
  getProjectsByStatus: (status: ProjectStatus) => Project[];
  recalculateProjectProgress: (projectId: string) => number;
  addMilestone: (
    projectId: string,
    milestone: Omit<Milestone, 'id' | 'projectId' | 'status' | 'reports'>
  ) => Milestone | undefined;
  updateMilestone: (
    projectId: string,
    milestoneId: string,
    updates: Partial<Milestone>
  ) => Milestone | undefined;
  deleteMilestone: (projectId: string, milestoneId: string) => boolean;
  updateMilestoneStatus: (
    projectId: string,
    milestoneId: string,
    status: MilestoneStatus
  ) => Milestone | undefined;
  getMilestoneById: (projectId: string, milestoneId: string) => Milestone | undefined;
  addProgressReport: (
    projectId: string,
    milestoneId: string,
    report: Omit<ProgressReport, 'id' | 'milestoneId' | 'submittedAt' | 'isOverdue'>
  ) => ProgressReport | undefined;
  updateProgressReport: (
    projectId: string,
    milestoneId: string,
    reportId: string,
    updates: Partial<ProgressReport>
  ) => ProgressReport | undefined;
  deleteProgressReport: (
    projectId: string,
    milestoneId: string,
    reportId: string
  ) => boolean;
  addTask: (
    projectId: string,
    task: Omit<ProjectTask, 'id' | 'projectId' | 'status' | 'createdAt'>
  ) => ProjectTask | undefined;
  updateTask: (
    projectId: string,
    taskId: string,
    updates: Partial<ProjectTask>
  ) => ProjectTask | undefined;
  deleteTask: (projectId: string, taskId: string) => boolean;
  updateTaskStatus: (
    projectId: string,
    taskId: string,
    status: TaskStatus
  ) => ProjectTask | undefined;
  getTasksByAssignee: (assigneeId: string) => ProjectTask[];
  refreshTaskOverdueStatus: (projectId: string) => void;
}

export const useProjectStore = create<ProjectState>(
  persist(
    (set, get) => ({
  projects: mockProjects,
  filters: {},

  setFilters: (filters: Partial<ProjectFilters>) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }));
  },

  clearFilters: () => {
    set({ filters: {} });
  },

  getFilteredProjects: () => {
    const { projects, filters } = get();
    return projects.filter((p) => {
      if (filters.status && p.status !== filters.status) return false;
      if (filters.ownerId && p.ownerId !== filters.ownerId) return false;
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        const matchName = p.name.toLowerCase().includes(keyword);
        const matchNo = p.projectNo.toLowerCase().includes(keyword);
        if (!matchName && !matchNo) return false;
      }
      return true;
    });
  },

  generateNextProjectNo: () => {
    const existingNos = get().projects.map((p) => p.projectNo);
    return getNextProjectNo(existingNos);
  },

  getProjectById: (id: string) => {
    return get().projects.find((p) => p.id === id);
  },

  getProjectByNo: (projectNo: string) => {
    return get().projects.find((p) => p.projectNo === projectNo);
  },

  getProjectByProposal: (proposalId: string) => {
    return get().projects.find((p) => p.proposalId === proposalId);
  },

  createProject: (data) => {
    const projectNo = get().generateNextProjectNo();

    const milestones: Milestone[] = data.milestones.map((m, index) => ({
      ...m,
      id: `ms${String(Date.now() + index).slice(-6)}`,
      projectId: '',
      status: 'pending',
      reports: [],
    }));

    const newProject: Project = {
      id: `prj${String(Date.now()).slice(-6)}`,
      projectNo,
      proposalId: data.proposalId,
      name: data.name,
      ownerId: data.ownerId,
      status: 'planning',
      progress: 0,
      startDate: data.startDate,
      endDate: data.endDate,
      actualBenefit: 0,
      milestones: milestones.map((m) => ({ ...m, projectId: '' })),
      tasks: [],
      expectedBenefit: data.expectedBenefit,
      resources: data.resources,
      recommendedDepartments: data.recommendedDepartments,
    };

    newProject.milestones = milestones.map((m) => ({ ...m, projectId: newProject.id }));

    set((state) => ({ projects: [...state.projects, newProject] }));
    return newProject;
  },

  updateProject: (id: string, updates: Partial<Project>) => {
    let updated: Project | undefined;
    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id === id) {
          updated = { ...p, ...updates };
          return updated;
        }
        return p;
      }),
    }));
    return updated;
  },

  deleteProject: (id: string) => {
    const exists = get().projects.some((p) => p.id === id);
    if (!exists) return false;
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
    }));
    return true;
  },

  updateProjectStatus: (id: string, status: ProjectStatus) => {
    return get().updateProject(id, { status });
  },

  updateProjectProgress: (id: string, progress: number) => {
    const clampedProgress = Math.max(0, Math.min(100, progress));
    return get().updateProject(id, { progress: clampedProgress });
  },

  getProjectsByOwner: (ownerId: string) => {
    return get().projects.filter((p) => p.ownerId === ownerId);
  },

  getProjectsByStatus: (status: ProjectStatus) => {
    return get().projects.filter((p) => p.status === status);
  },

  recalculateProjectProgress: (projectId: string) => {
    const project = get().getProjectById(projectId);
    if (!project || project.milestones.length === 0) {
      get().updateProjectProgress(projectId, 0);
      return 0;
    }

    let totalWeight = 0;
    let completedWeight = 0;

    project.milestones.forEach((m) => {
      const weight = 1;
      totalWeight += weight;
      if (m.status === 'completed') {
        completedWeight += weight;
      } else if (m.status === 'in_progress') {
        completedWeight += weight * 0.5;
      }
    });

    const progress = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
    get().updateProjectProgress(projectId, progress);
    return progress;
  },

  addMilestone: (projectId: string, milestone) => {
    const project = get().getProjectById(projectId);
    if (!project) return undefined;

    const newMilestone: Milestone = {
      ...milestone,
      id: `ms${String(Date.now()).slice(-6)}`,
      projectId,
      status: 'pending',
      reports: [],
    };

    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId ? { ...p, milestones: [...p.milestones, newMilestone] } : p
      ),
    }));

    get().recalculateProjectProgress(projectId);
    return newMilestone;
  },

  updateMilestone: (projectId: string, milestoneId: string, updates: Partial<Milestone>) => {
    let updatedMilestone: Milestone | undefined;
    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          milestones: p.milestones.map((m) => {
            if (m.id === milestoneId) {
              updatedMilestone = { ...m, ...updates };
              return updatedMilestone;
            }
            return m;
          }),
        };
      }),
    }));

    if (updatedMilestone) {
      get().recalculateProjectProgress(projectId);
    }
    return updatedMilestone;
  },

  deleteMilestone: (projectId: string, milestoneId: string) => {
    const project = get().getProjectById(projectId);
    if (!project) return false;

    const exists = project.milestones.some((m) => m.id === milestoneId);
    if (!exists) return false;

    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? { ...p, milestones: p.milestones.filter((m) => m.id !== milestoneId) }
          : p
      ),
    }));

    get().recalculateProjectProgress(projectId);
    return true;
  },

  updateMilestoneStatus: (projectId: string, milestoneId: string, status: MilestoneStatus) => {
    return get().updateMilestone(projectId, milestoneId, { status });
  },

  getMilestoneById: (projectId: string, milestoneId: string) => {
    const project = get().getProjectById(projectId);
    if (!project) return undefined;
    return project.milestones.find((m) => m.id === milestoneId);
  },

  addProgressReport: (projectId: string, milestoneId: string, report) => {
    const milestone = get().getMilestoneById(projectId, milestoneId);
    if (!milestone) return undefined;

    const milestoneDueDate = new Date(milestone.dueDate);
    const now = new Date();
    const isOverdue = now > milestoneDueDate;

    const newReport: ProgressReport = {
      ...report,
      id: `rp${String(Date.now()).slice(-6)}`,
      milestoneId,
      submittedAt: new Date(),
      isOverdue,
    };

    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          milestones: p.milestones.map((m) =>
            m.id === milestoneId ? { ...m, reports: [...m.reports, newReport] } : m
          ),
        };
      }),
    }));
    return newReport;
  },

  updateProgressReport: (projectId: string, milestoneId: string, reportId: string, updates) => {
    let updatedReport: ProgressReport | undefined;
    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          milestones: p.milestones.map((m) => {
            if (m.id !== milestoneId) return m;
            return {
              ...m,
              reports: m.reports.map((r) => {
                if (r.id === reportId) {
                  updatedReport = { ...r, ...updates };
                  return updatedReport;
                }
                return r;
              }),
            };
          }),
        };
      }),
    }));
    return updatedReport;
  },

  deleteProgressReport: (
    projectId: string,
    milestoneId: string,
    reportId: string
  ) => {
    const milestone = get().getMilestoneById(projectId, milestoneId);
    if (!milestone) return false;

    const exists = milestone.reports.some((r) => r.id === reportId);
    if (!exists) return false;

    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          milestones: p.milestones.map((m) =>
            m.id === milestoneId
              ? { ...m, reports: m.reports.filter((r) => r.id !== reportId) }
              : m
          ),
        };
      }),
    }));
    return true;
  },

  addTask: (projectId: string, task) => {
    const project = get().getProjectById(projectId);
    if (!project) return undefined;

    const now = new Date();
    const dueDate = new Date(task.dueDate);
    let status: TaskStatus = 'todo';
    if (now > dueDate) status = 'overdue';

    const newTask: ProjectTask = {
      ...task,
      id: `tk${String(Date.now()).slice(-6)}`,
      projectId,
      status,
      createdAt: now,
    };

    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId ? { ...p, tasks: [...p.tasks, newTask] } : p
      ),
    }));

    return newTask;
  },

  updateTask: (projectId: string, taskId: string, updates) => {
    let updatedTask: ProjectTask | undefined;
    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          tasks: p.tasks.map((t) => {
            if (t.id === taskId) {
              let merged: ProjectTask = { ...t, ...updates };
              if (updates.status === 'completed') {
                merged.completedAt = new Date();
              } else if (updates.status) {
                merged.completedAt = undefined;
              }
              updatedTask = merged;
              return merged;
            }
            return t;
          }),
        };
      }),
    }));
    return updatedTask;
  },

  deleteTask: (projectId: string, taskId: string) => {
    const project = get().getProjectById(projectId);
    if (!project) return false;
    const exists = project.tasks.some((t) => t.id === taskId);
    if (!exists) return false;

    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId ? { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) } : p
      ),
    }));
    return true;
  },

  updateTaskStatus: (projectId: string, taskId: string, status: TaskStatus) => {
    return get().updateTask(projectId, taskId, { status });
  },

  getTasksByAssignee: (assigneeId: string) => {
    const all: ProjectTask[] = [];
    get().projects.forEach((p) => {
      p.tasks.forEach((t) => {
        if (t.assigneeId === assigneeId) all.push(t);
      });
    });
    return all;
  },

  refreshTaskOverdueStatus: (projectId: string) => {
    const project = get().getProjectById(projectId);
    if (!project) return;
    const now = new Date();

    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          tasks: p.tasks.map((t) => {
            if (t.status === 'completed' || t.status === 'overdue') return t;
            const due = new Date(t.dueDate);
            if (now > due) return { ...t, status: 'overdue' as TaskStatus };
            return t;
          }),
        };
      }),
    }));
  },
}),
    {
      name: 'project-store',
      partialize: (state) => ({
        projects: state.projects,
      }),
    }
  )
);
