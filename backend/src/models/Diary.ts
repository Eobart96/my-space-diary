export interface DiaryEntry {
    id: number;
    user_id: number;
    date: string;
    time: string;
    text: string;
    mood?: number;
    created_at: Date;
    updated_at: Date;
}

export interface CreateDiaryRequest {
    date: string;
    time: string;
    text: string;
    mood?: number;
}

export interface UpdateDiaryRequest {
    text?: string;
    time?: string;
    mood?: number;
}
