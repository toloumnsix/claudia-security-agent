import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createElizaApiPlugin } from './server/index.mjs';

export default defineConfig({
    plugins: [react(), createElizaApiPlugin()],
    server: {
        port: 5173
    }
});
