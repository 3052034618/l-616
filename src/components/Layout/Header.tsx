import { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Search,
  Bell,
  ChevronDown,
  ChevronRight,
  LogOut,
  Settings,
  User as UserIcon,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { users } from '@/data/users';
import { notifications } from '@/data/notifications';

const breadcrumbMap: Record<string, string> = {
  '/': '工作台',
  '/proposals': '创意提案',
  '/approvals': '审批中心',
  '/projects': '项目管理',
  '/points': '积分中心',
  '/admin': '管理员看板',
};

const roleLabels: Record<string, string> = {
  employee: '员工',
  manager: '部门经理',
  committee: '创新委员会',
  admin: '系统管理员',
};

export default function Header() {
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(users[0]);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => n.userId === currentUser.id && !n.isRead).length;
  const userNotifications = notifications.filter((n) => n.userId === currentUser.id).slice(0, 5);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentBreadcrumb = breadcrumbMap[location.pathname] || '页面';

  const handleSwitchRole = (user: typeof users[0]) => {
    setCurrentUser(user);
    setUserMenuOpen(false);
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white/95 px-6 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <Link to="/" className="text-sm text-neutral-500 hover:text-primary-600 transition-colors">
          首页
        </Link>
        <ChevronRight className="h-4 w-4 text-neutral-400" />
        <span className="text-sm font-medium text-neutral-800">{currentBreadcrumb}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="搜索提案、项目、人员..."
            className="w-72 rounded-lg border border-neutral-200 bg-neutral-50 py-2 pl-10 pr-4 text-sm text-neutral-700 placeholder:text-neutral-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/10 transition-all"
          />
        </div>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className={cn(
              'relative flex h-9 w-9 items-center justify-center rounded-lg transition-all',
              notifOpen
                ? 'bg-primary-50 text-primary-600'
                : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700'
            )}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-warning-400 to-warning-500 px-1 text-xs font-bold text-white shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-card-hover animate-fade-in-up">
              <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
                <h3 className="font-semibold text-neutral-800">通知中心</h3>
                <span className="badge badge-info">{unreadCount} 条未读</span>
              </div>
              <div className="max-h-80 overflow-y-auto scrollbar-thin">
                {userNotifications.length > 0 ? (
                  userNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={cn(
                        'border-b border-neutral-50 px-4 py-3 transition-colors hover:bg-neutral-50',
                        !notif.isRead && 'bg-primary-50/30'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className={cn(
                            'mt-1.5 h-2 w-2 flex-shrink-0 rounded-full',
                            notif.type === 'success' && 'bg-accent-500',
                            notif.type === 'warning' && 'bg-warning-500',
                            notif.type === 'error' && 'bg-red-500',
                            notif.type === 'info' && 'bg-primary-500'
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-neutral-800">{notif.title}</p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500">
                            {notif.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-sm text-neutral-400">
                    暂无通知
                  </div>
                )}
              </div>
              <div className="border-t border-neutral-100 px-4 py-2">
                <Link
                  to="/notifications"
                  className="block text-center text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  查看全部通知
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className={cn(
              'flex items-center gap-2 rounded-lg px-2 py-1.5 transition-all',
              userMenuOpen ? 'bg-neutral-100' : 'hover:bg-neutral-50'
            )}
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="h-8 w-8 rounded-full border-2 border-accent-500/30"
            />
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium text-neutral-800">{currentUser.name}</p>
              <p className="text-xs text-neutral-500">{roleLabels[currentUser.role]}</p>
            </div>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-neutral-400 transition-transform',
                userMenuOpen && 'rotate-180'
              )}
            />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-card-hover animate-fade-in-up">
              <div className="border-b border-neutral-100 bg-gradient-to-r from-primary-50 to-accent-50 px-4 py-3">
                <p className="text-sm font-semibold text-neutral-800">{currentUser.name}</p>
                <p className="text-xs text-neutral-500">{currentUser.email}</p>
                <p className="mt-1 text-xs text-neutral-500">
                  {currentUser.department} · 积分 {currentUser.points}
                </p>
              </div>

              <div className="py-1">
                <div className="px-4 py-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-neutral-400 mb-1">
                    切换角色
                  </p>
                  <div className="space-y-0.5">
                    {users.slice(0, 4).map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleSwitchRole(user)}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors',
                          currentUser.id === user.id
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-neutral-600 hover:bg-neutral-50'
                        )}
                      >
                        <img src={user.avatar} alt={user.name} className="h-6 w-6 rounded-full" />
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium">{user.name}</p>
                          <p className="truncate text-xs text-neutral-400">
                            {roleLabels[user.role]}
                          </p>
                        </div>
                        <RefreshCw
                          className={cn(
                            'h-3.5 w-3.5 flex-shrink-0',
                            currentUser.id === user.id ? 'text-primary-500' : 'text-neutral-300'
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-neutral-100 py-1">
                <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50 transition-colors">
                  <UserIcon className="h-4 w-4" />
                  <span>个人中心</span>
                </button>
                <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50 transition-colors">
                  <Settings className="h-4 w-4" />
                  <span>系统设置</span>
                </button>
              </div>

              <div className="border-t border-neutral-100 py-1">
                <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                  <LogOut className="h-4 w-4" />
                  <span>退出登录</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
