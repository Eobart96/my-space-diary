export interface DiaryEntry {
    id: number;
    user_id: number;
    date: string;
    time: string;
    text: string;
    mood?: number;
    created_at: string;
    updated_at: string;
}

export interface CreateDiaryRequest {
    date: string;
    time: string;
    text: string;
    mood?: number;
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
