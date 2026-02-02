const getBackendBaseUrl = () => {
    return process.env.TELEGRAM_BACKEND_URL || 'http://localhost:5000/api';
};

const withTimeout = async <T>(promise: Promise<T>, ms: number): Promise<T> => {
    let timeoutId: NodeJS.Timeout | null = null;
    const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Backend request timed out')), ms);
    });
    const result = await Promise.race([promise, timeoutPromise]);
    if (timeoutId) clearTimeout(timeoutId);
    return result as T;
};

const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
    const baseUrl = getBackendBaseUrl().replace(/\/$/, '');
    const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const response = await withTimeout(fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            ...(options?.headers || {})
        },
        ...options
    }), 10000);

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Backend error ${response.status}: ${text}`);
    }

    return response.json() as Promise<T>;
};

export const diaryApi = {
    getEntries: (date?: string) => request<any[]>(`/diary${date ? `?date=${encodeURIComponent(date)}` : ''}`),
    createEntry: (payload: any) => request<any>('/diary', { method: 'POST', body: JSON.stringify(payload) }),
    updateEntry: (id: number, payload: any) => request<any>(`/diary/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
};

export const nutritionApi = {
    getEntries: (date?: string) => request<any[]>(`/nutrition${date ? `?date=${encodeURIComponent(date)}` : ''}`),
    getProducts: () => request<any[]>('/nutrition/products'),
    createProduct: (payload: any) => request<any>('/nutrition/products', { method: 'POST', body: JSON.stringify(payload) }),
    updateProduct: (id: number, payload: any) => request<any>(`/nutrition/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
};
