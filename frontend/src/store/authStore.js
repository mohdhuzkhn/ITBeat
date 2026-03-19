import { create } from 'zustand';
import { authService } from '../services/api';

export const useAuthStore = create((set) => ({
  user:  JSON.parse(localStorage.getItem('itbeat_user') || 'null'),
  token: localStorage.getItem('itbeat_token') || null,

  login: async (credentials) => {
    const { data } = await authService.login(credentials);
    localStorage.setItem('itbeat_token', data.token);
    localStorage.setItem('itbeat_user', JSON.stringify(data.user));
    set({ user: data.user, token: data.token });
  },

  register: async (credentials) => {
    const { data } = await authService.register(credentials);
    localStorage.setItem('itbeat_token', data.token);
    localStorage.setItem('itbeat_user', JSON.stringify(data.user));
    set({ user: data.user, token: data.token });
  },

  logout: () => {
    localStorage.removeItem('itbeat_token');
    localStorage.removeItem('itbeat_user');
    set({ user: null, token: null });
  },
}));