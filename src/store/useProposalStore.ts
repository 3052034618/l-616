import { create } from 'zustand';
import type { Proposal, ProposalStatus } from '../types';
import { proposals as mockProposals } from '../data/proposals';
import { recommend, extractKeywords } from '../utils/recommend';

interface ProposalFilters {
  status?: ProposalStatus;
  department?: string;
  submitterId?: string;
  keyword?: string;
  minCost?: number;
  maxCost?: number;
}

interface ProposalState {
  proposals: Proposal[];
  filters: ProposalFilters;
  setFilters: (filters: Partial<ProposalFilters>) => void;
  clearFilters: () => void;
  getFilteredProposals: () => Proposal[];
  getProposalById: (id: string) => Proposal | undefined;
  createProposal: (proposal: Omit<Proposal, 'id' | 'createdAt' | 'keywords' | 'status'> & { keywords?: string[] }) => Proposal;
  updateProposal: (id: string, updates: Partial<Proposal>) => Proposal | undefined;
  deleteProposal: (id: string) => boolean;
  updateProposalStatus: (id: string, status: ProposalStatus) => Proposal | undefined;
  getProposalsByStatus: (status: ProposalStatus) => Proposal[];
  getProposalsBySubmitter: (submitterId: string) => Proposal[];
  getProposalsByDepartment: (department: string) => Proposal[];
  recommendProposals: (query: string | string[], topN?: number) => { proposal: Proposal; score: number; matchedKeywords: string[] }[];
  recommendDepartments: (title: string, description: string) => string[];
  findSimilarCases: (title: string, description: string, currentId?: string) => { id: string; title: string; department: string; matchRate: number; result: 'success' | 'failed' }[];
}

export const useProposalStore = create<ProposalState>((set, get) => ({
  proposals: mockProposals,
  filters: {},

  setFilters: (filters: Partial<ProposalFilters>) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }));
  },

  clearFilters: () => {
    set({ filters: {} });
  },

  getFilteredProposals: () => {
    const { proposals, filters } = get();
    return proposals.filter((p) => {
      if (filters.status && p.status !== filters.status) return false;
      if (filters.department && p.department !== filters.department) return false;
      if (filters.submitterId && p.submitterId !== filters.submitterId) return false;
      if (filters.minCost !== undefined && p.estimatedCost < filters.minCost) return false;
      if (filters.maxCost !== undefined && p.estimatedCost > filters.maxCost) return false;
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        const matchInTitle = p.title.toLowerCase().includes(keyword);
        const matchInDesc = p.description.toLowerCase().includes(keyword);
        const matchInKeywords = p.keywords.some((k) => k.toLowerCase().includes(keyword));
        if (!matchInTitle && !matchInDesc && !matchInKeywords) return false;
      }
      return true;
    });
  },

  getProposalById: (id: string) => {
    return get().proposals.find((p) => p.id === id);
  },

  createProposal: (proposal) => {
    const keywords = proposal.keywords && proposal.keywords.length > 0
      ? proposal.keywords
      : extractKeywords(`${proposal.title} ${proposal.description}`, 8);

    const newProposal: Proposal = {
      ...proposal,
      id: `p${String(Date.now()).slice(-6)}`,
      createdAt: new Date(),
      status: 'draft',
      keywords,
    };

    set((state) => ({ proposals: [...state.proposals, newProposal] }));
    return newProposal;
  },

  updateProposal: (id: string, updates: Partial<Proposal>) => {
    let updated: Proposal | undefined;
    set((state) => ({
      proposals: state.proposals.map((p) => {
        if (p.id === id) {
          updated = { ...p, ...updates };
          return updated;
        }
        return p;
      }),
    }));
    return updated;
  },

  deleteProposal: (id: string) => {
    const exists = get().proposals.some((p) => p.id === id);
    if (!exists) return false;
    set((state) => ({
      proposals: state.proposals.filter((p) => p.id !== id),
    }));
    return true;
  },

  updateProposalStatus: (id: string, status: ProposalStatus) => {
    return get().updateProposal(id, { status });
  },

  getProposalsByStatus: (status: ProposalStatus) => {
    return get().proposals.filter((p) => p.status === status);
  },

  getProposalsBySubmitter: (submitterId: string) => {
    return get().proposals.filter((p) => p.submitterId === submitterId);
  },

  getProposalsByDepartment: (department: string) => {
    return get().proposals.filter((p) => p.department === department);
  },

  recommendProposals: (query: string | string[], topN: number = 5) => {
    const results = recommend(get().proposals as unknown as Array<{ id: string | number; keywords: string[]; [key: string]: unknown }>, query, topN);
    return results.map((r) => ({
      proposal: r.item as unknown as Proposal,
      score: r.score,
      matchedKeywords: r.matchedKeywords,
    }));
  },

  recommendDepartments: (title: string, description: string) => {
    const keywords = extractKeywords(`${title} ${description}`, 10);
    const departmentKeywordMap: Record<string, string[]> = {
      研发部: ['开发', '研发', '技术', '系统', '平台', 'AI', '算法', '数据', 'App', '性能', 'DevOps'],
      市场部: ['营销', '市场', '品牌', '推广', '用户增长', '裂变', '活动', 'VI', '数据看板', 'BI'],
      运营部: ['运营', '用户', '客户', '供应链', '采购', '物流', '库存', '客户生命周期', 'CRM'],
      人力资源部: ['培训', 'HR', '人力', '招聘', '福利', '员工', '年会', '人才', '学习'],
      财务部: ['财务', '预算', '报销', '成本', '会计', '税务', '审计', '采购'],
    };

    const scores: Record<string, number> = {};
    for (const dept of Object.keys(departmentKeywordMap)) {
      let score = 0;
      for (const kw of keywords) {
        if (departmentKeywordMap[dept].some((dkw) => dkw.includes(kw) || kw.includes(dkw))) {
          score += 1;
        }
      }
      scores[dept] = score;
    }

    return Object.entries(scores)
      .filter(([, s]) => s > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([dept]) => dept);
  },

  findSimilarCases: (title: string, description: string, currentId?: string) => {
    const allProposals = get().proposals.filter((p) => p.id !== currentId && p.status !== 'draft');
    const query = extractKeywords(`${title} ${description}`, 10);
    const results = recommend(allProposals as unknown as Array<{ id: string | number; keywords: string[]; [key: string]: unknown }>, query, 5, 0.05);

    return results.map((r) => ({
      id: String(r.item.id),
      title: (r.item as unknown as Proposal).title,
      department: (r.item as unknown as Proposal).department,
      matchRate: Math.round(r.score * 100),
      result: ((r.item as unknown as Proposal).status === 'approved' || (r.item as unknown as Proposal).status === 'project_created') ? 'success' : 'failed',
    }));
  },
}));
