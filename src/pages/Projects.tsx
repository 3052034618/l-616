import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  ChevronDown,
  User,
  Calendar,
  Building2,
  ArrowRight,
  FolderKanban,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/date';
import { useProjectStore } from '@/store/useProjectStore';
import { useAuthStore } from '@/store/useAuthStore';
import type { Project, ProjectStatus } from '@/types';
import { departments } from '@/data/users';

const statusOptions: { value: ProjectStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'planning', label: '规划中' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'delayed', label: '已延期' },
];

function getStatusStyle(status: ProjectStatus): { label: string; className: string; barColor: string } {
  switch (status) {
    case 'planning':
      return {
        label: '规划中',
        className: 'bg-blue-100 text-blue-700',
        barColor: 'bg-blue-500',
      };
    case 'in_progress':
      return {
        label: '进行中',
        className: 'bg-indigo-100 text-indigo-700',
        barColor: 'bg-indigo-500',
      };
    case 'completed':
      return {
        label: '已完成',
        className: 'bg-green-100 text-green-700',
        barColor: 'bg-green-500',
      };
    case 'delayed':
      return {
        label: '已延期',
        className: 'bg-red-100 text-red-700',
        barColor: 'bg-red-500',
      };
  }
}

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

function ProjectCard({ project, onClick }: ProjectCardProps) {
  const getUserById = useAuthStore((s) => s.getUserById);
  const owner = getUserById(project.ownerId);
  const statusStyle = getStatusStyle(project.status);

  return (
    <div
      onClick={onClick}
      className="group flex cursor-pointer flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-5 transition-all hover:border-indigo-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-1.5 flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-neutral-400" />
            <span className="text-xs font-medium text-neutral-500">{project.projectNo}</span>
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-indigo-600">
            {project.name}
          </h3>
        </div>
        <span className={cn('rounded-full px-3 py-1 text-xs font-medium', statusStyle.className)}>
          {statusStyle.label}
        </span>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="text-neutral-500">项目进度</span>
          <span className="font-medium text-neutral-700">{project.progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
          <div
            className={cn('h-full rounded-full transition-all', statusStyle.barColor)}
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500">
        <div className="flex items-center gap-1.5">
          <User className="h-4 w-4 text-neutral-400" />
          <span>负责人：</span>
          <span className="font-medium text-neutral-700">{owner?.name || '-'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Building2 className="h-4 w-4 text-neutral-400" />
          <span>部门：</span>
          <span className="font-medium text-neutral-700">{owner?.department || '-'}</span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
        <div className="flex items-center gap-1.5 text-sm text-neutral-500">
          <Calendar className="h-4 w-4 text-neutral-400" />
          <span>
            {formatDate(project.startDate, 'YYYY-MM-DD')} ~ {formatDate(project.endDate, 'YYYY-MM-DD')}
          </span>
        </div>
        <ArrowRight className="h-5 w-5 text-neutral-300 transition-all group-hover:translate-x-1 group-hover:text-indigo-500" />
      </div>
    </div>
  );
}

export default function Projects() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showFilters, setShowFilters] = useState(true);

  const allUsers = useAuthStore((s) => s.allUsers);
  const projects = useProjectStore((s) => s.projects);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;

      const owner = allUsers.find((u) => u.id === p.ownerId);
      if (departmentFilter !== 'all' && owner?.department !== departmentFilter) return false;
      if (ownerFilter !== 'all' && p.ownerId !== ownerFilter) return false;

      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase();
        const matchName = p.name.toLowerCase().includes(keyword);
        const matchNo = p.projectNo.toLowerCase().includes(keyword);
        if (!matchName && !matchNo) return false;
      }

      return true;
    });
  }, [projects, statusFilter, departmentFilter, ownerFilter, searchKeyword, allUsers]);

  const filteredOwners = useMemo(() => {
    if (departmentFilter === 'all') return allUsers;
    return allUsers.filter((u) => u.department === departmentFilter);
  }, [departmentFilter, allUsers]);

  const handleClearFilters = () => {
    setStatusFilter('all');
    setDepartmentFilter('all');
    setOwnerFilter('all');
    setSearchKeyword('');
  };

  const activeFilterCount = [statusFilter !== 'all', departmentFilter !== 'all', ownerFilter !== 'all'].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">项目列表</h1>
          <p className="mt-1 text-sm text-neutral-500">查看和管理所有创新项目</p>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white">
        <div className="flex flex-wrap items-center gap-3 border-b border-neutral-200 p-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索项目名称或编号..."
              className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-4 text-sm text-neutral-700 placeholder:text-neutral-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-all',
              activeFilterCount > 0
                ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
            )}
          >
            <Filter className="h-4 w-4" />
            筛选
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-indigo-600 px-1.5 py-0.5 text-xs text-white">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown
              className={cn('h-4 w-4 transition-transform', showFilters && 'rotate-180')}
            />
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={handleClearFilters}
              className="text-sm text-neutral-500 hover:text-neutral-700"
            >
              清除筛选
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-3 gap-4 border-b border-neutral-200 p-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">项目状态</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'all')}
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">所属部门</label>
              <select
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(e.target.value);
                  setOwnerFilter('all');
                }}
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                <option value="all">全部部门</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">项目负责人</label>
              <select
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                <option value="all">全部负责人</option>
                {filteredOwners.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="p-6">
          {filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
              <FolderKanban className="mb-3 h-12 w-12" />
              <p className="text-sm">暂无符合条件的项目</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => navigate(`/projects/${project.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
