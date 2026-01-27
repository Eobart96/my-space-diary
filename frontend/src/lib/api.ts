import axios from 'axios';
import { DiaryEntry, CreateDiaryRequest, NutritionEntry, CreateNutritionRequest, DailyNutritionSummary, NutritionProduct, CreateNutritionProductRequest, UpdateNutritionProductRequest } from '../types';

const API_BASE_URL = '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const diaryAPI = {
    getEntries: async (date?: string): Promise<DiaryEntry[]> => {
        const params = date ? { date } : {};
        const response = await api.get('/diary', { params });
        return response.data;
    },
    createEntry: async (entry: CreateDiaryRequest): Promise<DiaryEntry> => {
        const response = await api.post('/diary', entry);
        return response.data;
    },
    updateEntry: async (id: number, entry: Partial<CreateDiaryRequest>): Promise<DiaryEntry> => {
        const response = await api.put(`/diary/${id}`, entry);
        return response.data;
    },
    deleteEntry: async (id: number): Promise<void> => {
        await api.delete(`/diary/${id}`);
    },
};

export const nutritionAPI = {
    getEntries: async (date?: string): Promise<NutritionEntry[]> => {
        const params = date ? { date } : {};
        const response = await api.get('/nutrition', { params });
        return response.data;
    },
    getDailySummary: async (date: string): Promise<DailyNutritionSummary> => {
        const response = await api.get('/nutrition/summary', { params: { date } });
        return response.data;
    },
    createEntry: async (entry: CreateNutritionRequest): Promise<NutritionEntry> => {
        const response = await api.post('/nutrition', entry);
        return response.data;
    },
    updateEntry: async (id: number, entry: Partial<CreateNutritionRequest>): Promise<NutritionEntry> => {
        const response = await api.put(`/nutrition/${id}`, entry);
        return response.data;
    },
    deleteEntry: async (id: number): Promise<void> => {
        await api.delete(`/nutrition/${id}`);
    },

    getProducts: async (): Promise<NutritionProduct[]> => {
        const response = await api.get('/nutrition/products');
        return response.data;
    },
    createProduct: async (product: CreateNutritionProductRequest): Promise<NutritionProduct> => {
        const response = await api.post('/nutrition/products', product);
        return response.data;
    },
    updateProduct: async (id: number, product: UpdateNutritionProductRequest): Promise<NutritionProduct> => {
        const response = await api.put(`/nutrition/products/${id}`, product);
        return response.data;
    },
    deleteProduct: async (id: number): Promise<void> => {
        await api.delete(`/nutrition/products/${id}`);
    },
};
