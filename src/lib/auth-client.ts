import { createAuthClient } from 'better-auth/react';
import { jwtClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
    baseURL: 'http://localhost:3001',
    basePath: '/api/auth',
    plugins: [
        jwtClient(),
    ],
});

export const {
    signIn,
    signUp,
    signOut,
    useSession,
} = authClient;
