import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/",
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimized build for Hostinger - fewer files, less inodes
    outDir: "dist",
    sourcemap: false, // Disable sourcemaps in production
    rollupOptions: {
      output: {
        // Generate fewer chunks to reduce inode usage
        manualChunks: {
          // Bundle all vendor libraries together
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // Bundle UI components together
          ui: ['@radix-ui/react-tooltip', '@radix-ui/react-tabs', '@radix-ui/react-toast'],
          // Bundle chart library separately (it's large)
          charts: ['recharts']
        },
        // Optimize file naming for better caching
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || 'asset';
          const info = name.split('.');
          const ext = info[info.length - 1];
          if (/\.(css)$/.test(name)) {
            return `css/[name]-[hash].${ext}`;
          }
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(name)) {
            return `img/[name]-[hash].${ext}`;
          }
          return `assets/[name]-[hash].${ext}`;
        }
      }
    },
    // Inline small assets to reduce file count
    assetsInlineLimit: 4096,
    // Optimize CSS
    cssCodeSplit: false, // Bundle all CSS into one file
  }
}));
