export interface ApiResponse<T> {
    data: T;
    status: number;
    statusText: string;
}

export type ApiError = {
    message: string;
    status: number;
    statusText: string;
}; 