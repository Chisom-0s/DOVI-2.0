// Homepage API — /api/v1/homepage/*
// Full implementation in Phase 2
import apiClient, { normalizeApiError } from './client';
import type { HomepageData, HomepageBanner, HomepageSection } from '@/types';

export const homepageApi = {
  getData: async (): Promise<HomepageData> => {
    try {
      const { data } = await apiClient.get('/api/v1/homepage/');
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  getBanners: async (): Promise<HomepageBanner[]> => {
    try {
      const { data } = await apiClient.get('/api/v1/homepage/banners/');
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  getSections: async (): Promise<HomepageSection[]> => {
    try {
      const { data } = await apiClient.get('/api/v1/homepage/sections/');
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },
};
