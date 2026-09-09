import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

// LINT.IfChange(aistudio_media_plugin)
function aistudioMediaPlugin(): Plugin {
  return {
    name: 'vite-plugin-aistudio-media',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/assets/aistudio/')) {
          const rawPath = req.url.split('?')[0].split('#')[0];
          try {
            const decodedPath = decodeURIComponent(rawPath);
            const relativePath = decodedPath.replace(/^\//, '');
            const aistudioDir = path.resolve(
              __dirname,
              'public',
              'assets',
              'aistudio',
            );
            const filePath = path.resolve(__dirname, 'public', relativePath);
            if (
              filePath.startsWith(aistudioDir + path.sep) &&
              fs.existsSync(filePath) &&
              fs.statSync(filePath).isFile()
            ) {
              const ext = path.extname(filePath).toLowerCase();
              const mimeMap: Record<string, string> = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
                '.svg': 'image/svg+xml',
                '.bmp': 'image/bmp',
                '.ico': 'image/x-icon',
                '.mp4': 'video/mp4',
                '.webm': 'video/webm',
                '.ogv': 'video/ogg',
                '.mp3': 'audio/mpeg',
                '.wav': 'audio/wav',
                '.ogg': 'audio/ogg',
                '.pdf': 'application/pdf',
              };
              res.setHeader(
                'Content-Type',
                mimeMap[ext] || 'application/octet-stream',
              );
              res.setHeader('Cache-Control', 'no-cache');
              fs.createReadStream(filePath).pipe(res);
              return;
            }
          } catch {
            // Fall through if URI decoding or file access fails
          }
        }
        next();
      });
    },
  };
}
// LINT.ThenChange(//depot/google3/java/com/google/alkali/boq/makersuite/applet_dev_service/templates/initializers/react_theme/vite.config.ts:aistudio_media_plugin)

function ensureMainEntryExists() {
  const root = process.cwd();
  const srcDir = path.join(root, 'src');
  const mainPath = path.join(srcDir, 'main.tsx');

  try {
    console.log('[BUILD-ENV] Current working directory:', root);
    const rootFiles = fs.readdirSync(root);
    console.log('[BUILD-ENV] Root files:', rootFiles.join(', '));

    if (!fs.existsSync(srcDir)) {
      console.log('[BUILD-ENV] "src" directory missing, creating it...');
      fs.mkdirSync(srcDir, { recursive: true });
    }

    const srcFiles = fs.readdirSync(srcDir);
    console.log('[BUILD-ENV] src files:', srcFiles.join(', '));

    // Handle case sensitivity for main.tsx
    const mainMatch = srcFiles.find(
      (f) => f.toLowerCase() === 'main.tsx' || f.toLowerCase() === 'main.ts' || f.toLowerCase() === 'main.jsx'
    );
    if (mainMatch && mainMatch !== 'main.tsx') {
      console.log(`[BUILD-ENV] Detected '${mainMatch}'. Syncing to 'main.tsx'...`);
      fs.copyFileSync(path.join(srcDir, mainMatch), mainPath);
      return;
    }

    // Check if main.tsx is in root
    if (!fs.existsSync(mainPath)) {
      const rootMain = rootFiles.find((f) => f.toLowerCase() === 'main.tsx' || f.toLowerCase() === 'main.ts');
      if (rootMain) {
        console.log(`[BUILD-ENV] Found '${rootMain}' in root. Copying to 'src/main.tsx'...`);
        fs.copyFileSync(path.join(root, rootMain), mainPath);
        return;
      }

      // Check if project files were cloned into a subfolder
      for (const f of rootFiles) {
        const subPath = path.join(root, f);
        if (fs.statSync(subPath).isDirectory() && !['node_modules', 'dist', '.git', '.vercel'].includes(f)) {
          const candidate = path.join(subPath, 'src', 'main.tsx');
          if (fs.existsSync(candidate)) {
            console.log(`[BUILD-ENV] Found entry in subfolder '${f}/src/main.tsx'. Copying...`);
            fs.copyFileSync(candidate, mainPath);
            return;
          }
        }
      }

      // If main.tsx is completely missing, generate it automatically
      console.log('[BUILD-ENV] Generating standard src/main.tsx...');
      const fallbackCode = `import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
`;
      fs.writeFileSync(mainPath, fallbackCode, 'utf-8');
      console.log('[BUILD-ENV] src/main.tsx generated successfully.');
    }
  } catch (err) {
    console.error('[BUILD-ENV] Error ensuring main entry:', err);
  }
}

// Execute immediately during Vite config evaluation
ensureMainEntryExists();

function mainEntryResolverPlugin(): Plugin {
  return {
    name: 'vite-plugin-main-entry-resolver',
    resolveId(id) {
      const cleanId = id.split('?')[0].split('#')[0];
      if (
        cleanId === '/src/main.tsx' ||
        cleanId === './src/main.tsx' ||
        cleanId === 'src/main.tsx' ||
        cleanId.endsWith('/main.tsx') ||
        cleanId.endsWith('/Main.tsx')
      ) {
        const candidates = [
          path.resolve(__dirname, 'src', 'main.tsx'),
          path.resolve(__dirname, 'src', 'Main.tsx'),
          path.resolve(__dirname, 'src', 'main.ts'),
          path.resolve(__dirname, 'src', 'Main.ts'),
          path.resolve(__dirname, 'src', 'main.jsx'),
          path.resolve(__dirname, 'src', 'main.js'),
        ];
        for (const candidate of candidates) {
          if (fs.existsSync(candidate)) {
            return candidate;
          }
        }
      }
      return null;
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), aistudioMediaPlugin(), mainEntryResolverPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        '/src': path.resolve(__dirname, 'src'),
        'src': path.resolve(__dirname, 'src'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
