export interface DiaryEntry {
    id: number;
    user_id: number;
    date: string;
    time: string;
    text: string;
    mood?: number;
    photo_url?: string;
    photo_urls?: string[];
    created_at: Date;
    updated_at: Date;
}

export interface CreateDiaryRequest {
    date: string;
    time: string;
    text: string;
    mood?: number;
    photo_url?: string;
    photo_urls?: string[];
}

export interface UpdateDiaryRequest {
    text?: string;
    time?: string;
    mood?: number;
    photo_url?: string;
    photo_urls?: string[];
}
