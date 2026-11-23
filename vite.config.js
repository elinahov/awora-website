import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Serves /api/*.js (the Vercel functions) during `npm run dev`, so no `vercel dev` is needed locally.
function devApi() {
  return {
    name: 'awora-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const m = req.url?.match(/^\/api\/([a-z0-9-]+)(?:\?.*)?$/i);
        if (!m) return next();
        try {
          const mod = await server.ssrLoadModule(`/api/${m[1]}.js`);
          let raw = '';
          for await (const chunk of req) raw += chunk;
          try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = raw; }
          res.status = code => { res.statusCode = code; return res; };
          res.json = obj => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(obj)); return res; };
          await mod.default(req, res);
        } catch (e) {
          console.error(e);
          res.statusCode = e?.code === 'ERR_LOAD_URL' ? 404 : 500;
          res.end(JSON.stringify({ error: String(e?.message || e) }));
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  // expose server-only vars from .env (SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, …) to the dev API
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''), process.env);
  return {
    plugins: [react(), devApi()],
    server: { port: 5173 }
  };
});
