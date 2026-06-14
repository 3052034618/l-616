import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Lightbulb,
  ClipboardCheck,
  FolderKanban,
  Coins,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { users } from '@/data/users';

const menuItems = [
  {
    to: '/',
    icon: LayoutDashboard,
    label: '工作台',
  },
  {
    to: '/proposals',
    icon: Lightbulb,
    label: '创意提案',
  },
  {
    to: '/approvals',
    icon: ClipboardCheck,
    label: '审批中心',
  },
  {
    to: '/projects',
    icon: FolderKanban,
    label: '项目管理',
  },
  {
    to: '/points',
    icon: Coins,
    label: '积分中心',
  },
  {
    to: '/admin',
    icon: BarChart3,
    label: '管理员看板',
  },
];

const roleLabels: Record<string, string> = {
  employee: '员工',
  manager: '部门经理',
  committee: '创新委员会',
  admin: '系统管理员',
};

export default function Sidebar() {
  const currentUser = users[0];

  return (
    <aside className="flex h-screen w-64 flex-col bg-primary-900 text-white shadow-xl">
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-accent-400 to-accent-600 shadow-glow">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold tracking-wide">InnoHub</span>
          <span className="text-xs text-neutral-300">创意创新平台</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-neutral-400">
          导航菜单
        </p>
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-md shadow-accent-500/20'
                  : 'text-neutral-300 hover:bg-white/5 hover:text-white'
              )
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3 transition-colors hover:bg-white/10">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="h-10 w-10 rounded-full border-2 border-accent-500/50"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{currentUser.name}</p>
            <p className="truncate text-xs text-neutral-400">
              {roleLabels[currentUser.role]} · {currentUser.department}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
