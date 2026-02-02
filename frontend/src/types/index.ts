export interface DiaryEntry {
    id: number;
    user_id: number;
    date: string;
    time: string;
    text: string;
    mood?: number;
    photo_url?: string;
    photo_urls?: string[];
    created_at: string;
    updated_at: string;
}

export interface CreateDiaryRequest {
    date: string;
    time: string;
    text: string;
    mood?: number;
    photo_url?: string;
    photo_urls?: string[];
}

export interface NutritionEntry {
    id: number;
    user_id: number;
    date: string;
    time: string;
    title: string;
    calories?: number;
    proteins?: number;
    fats?: number;
    carbs?: number;
    created_at: string;
    updated_at: string;
}

export interface CreateNutritionRequest {
    date: string;
    time: string;
    title: string;
    calories?: number;
    proteins?: number;
    fats?: number;
    carbs?: number;
}

export interface DailyNutritionSummary {
    date: string;
    totalCalories: number;
    totalProteins: number;
    totalFats: number;
    totalCarbs: number;
    entries: NutritionEntry[];
}

export type NutritionProductAssessment = 'positive' | 'negative' | 'neutral';

export interface NutritionProduct {
    id: number;
    user_id: number;
    name: string;
    assessment: NutritionProductAssessment;
    notes: string;
    pros: string;
    cons: string;
    photo_url?: string;
    photo_urls?: string[];
    created_at: string;
    updated_at: string;
}

export interface CreateNutritionProductRequest {
    name: string;
    assessment: NutritionProductAssessment;
    notes?: string;
    pros?: string;
    cons?: string;
    photo_url?: string;
    photo_urls?: string[];
}

export interface UpdateNutritionProductRequest {
    name?: string;
    assessment?: NutritionProductAssessment;
    notes?: string;
    pros?: string;
    cons?: string;
    photo_url?: string;
    photo_urls?: string[];
}
