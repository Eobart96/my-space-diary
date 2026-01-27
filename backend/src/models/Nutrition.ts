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
    created_at: Date;
    updated_at: Date;
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

export interface UpdateNutritionRequest {
    time?: string;
    title?: string;
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
    created_at: Date;
    updated_at: Date;
}

export interface CreateNutritionProductRequest {
    name: string;
    assessment: NutritionProductAssessment;
    notes?: string;
}

export interface UpdateNutritionProductRequest {
    name?: string;
    assessment?: NutritionProductAssessment;
    notes?: string;
}
