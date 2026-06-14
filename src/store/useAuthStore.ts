import { create } from 'zustand';
import type { User, UserRole } from '../types';
import { users } from '../data/users';
import { persist } from './persist';

interface AuthState {
  currentUser: User | null;
  allUsers: User[];
  login: (userId: string) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  updateCurrentUser: (updates: Partial<User>) => void;
  getUserById: (userId: string) => User | undefined;
  getUsersByRole: (role: UserRole) => User[];
  getUsersByDepartment: (department: string) => User[];
  addUserPoints: (userId: string, points: number) => void;
  deductUserPoints: (userId: string, points: number) => boolean;
}

export const useAuthStore = create<AuthState>(
  persist(
    (set, get) => ({
  currentUser: users[0] || null,
  allUsers: users,

  login: (userId: string) => {
    const user = get().allUsers.find((u) => u.id === userId);
    if (user) {
      set({ currentUser: user });
    }
  },

  logout: () => {
    set({ currentUser: null });
  },

  switchRole: (role: UserRole) => {
    const { currentUser } = get();
    if (currentUser) {
      set({
        currentUser: { ...currentUser, role },
        allUsers: get().allUsers.map((u) =>
          u.id === currentUser.id ? { ...u, role } : u
        ),
      });
    }
  },

  updateCurrentUser: (updates: Partial<User>) => {
    const { currentUser } = get();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      set({
        currentUser: updatedUser,
        allUsers: get().allUsers.map((u) =>
          u.id === currentUser.id ? updatedUser : u
        ),
      });
    }
  },

  getUserById: (userId: string) => {
    return get().allUsers.find((u) => u.id === userId);
  },

  getUsersByRole: (role: UserRole) => {
    return get().allUsers.filter((u) => u.role === role);
  },

  getUsersByDepartment: (department: string) => {
    return get().allUsers.filter((u) => u.department === department);
  },

  addUserPoints: (userId: string, points: number) => {
    set((state) => ({
      allUsers: state.allUsers.map((u) =>
        u.id === userId ? { ...u, points: u.points + points } : u
      ),
      currentUser:
        state.currentUser?.id === userId
          ? { ...state.currentUser, points: state.currentUser.points + points }
          : state.currentUser,
    }));
  },

  deductUserPoints: (userId: string, points: number) => {
    const user = get().allUsers.find((u) => u.id === userId);
    if (!user || user.points < points) {
      return false;
    }

    set((state) => ({
      allUsers: state.allUsers.map((u) =>
        u.id === userId ? { ...u, points: u.points - points } : u
      ),
      currentUser:
        state.currentUser?.id === userId
          ? { ...state.currentUser, points: state.currentUser.points - points }
          : state.currentUser,
    }));
    return true;
  },
}),
    {
      name: 'auth-store',
      partialize: (state) => ({
        allUsers: state.allUsers,
        currentUser: state.currentUser,
      }),
    }
  )
);
