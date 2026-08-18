// Save2Own API — /api/v1/save2own/*
// Full implementation in Phase 6
import apiClient, { normalizeApiError } from './client';
import type { PaginatedResponse, Save2OwnGoal, Save2OwnGoalSummary, PaymentInitResponse } from '@/types';

export const save2ownApi = {
  listGoals: async (): Promise<PaginatedResponse<Save2OwnGoalSummary>> => {
    try {
      const { data } = await apiClient.get('/api/v1/save2own/goals/');
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  createGoal: async (payload: {
    product_id: string;
    variant_id?: string;
    quantity: number;
    contribution_plan?: string;
  }): Promise<Save2OwnGoal> => {
    try {
      const { data } = await apiClient.post('/api/v1/save2own/goals/', payload);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  getGoal: async (id: string): Promise<Save2OwnGoal> => {
    try {
      const { data } = await apiClient.get(`/api/v1/save2own/goals/${id}/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  updateGoal: async (id: string, payload: { product_id?: string; variant_id?: string; quantity?: number }): Promise<Save2OwnGoal> => {
    try {
      const { data } = await apiClient.patch(`/api/v1/save2own/goals/${id}/`, payload);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  pause: async (id: string): Promise<Save2OwnGoal> => {
    try {
      const { data } = await apiClient.post(`/api/v1/save2own/goals/${id}/pause/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  resume: async (id: string): Promise<Save2OwnGoal> => {
    try {
      const { data } = await apiClient.post(`/api/v1/save2own/goals/${id}/resume/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  cancel: async (id: string): Promise<Save2OwnGoal> => {
    try {
      const { data } = await apiClient.post(`/api/v1/save2own/goals/${id}/cancel/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  contribute: async (id: string, payload: { amount: string; provider: string; redirect_url: string }): Promise<PaymentInitResponse> => {
    try {
      const { data } = await apiClient.post(`/api/v1/save2own/goals/${id}/contribute/`, payload);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  getContributions: async (id: string) => {
    try {
      const { data } = await apiClient.get(`/api/v1/save2own/goals/${id}/contributions/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  checkout: async (id: string) => {
    try {
      const { data } = await apiClient.post(`/api/v1/save2own/goals/${id}/checkout/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  getRefundStatus: async (id: string) => {
    try {
      const { data } = await apiClient.get(`/api/v1/save2own/goals/${id}/refund/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },
};
