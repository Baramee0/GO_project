// Token management utilities

export const setTokens = (accessToken: string, refreshToken: string): void => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
    }
};

export const getAccessToken = (): string | null => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('access_token');
    }
    return null;
};

export const getRefreshToken = (): string | null => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('refresh_token');
    }
    return null;
};

export const clearTokens = (): void => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
    }
};

export const setUser = (user: any): void => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(user));
    }
};

export const getUser = (): any | null => {
    if (typeof window !== 'undefined') {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }
    return null;
};

export const isAuthenticated = (): boolean => {
    return !!getAccessToken();
};
