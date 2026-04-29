import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      {
        name: 'midtrans-local-api',
        configureServer(server) {
          server.middlewares.use('/api/midtrans', (req, res) => {
            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk.toString(); });
              req.on('end', async () => {
                try {
                  const payload = JSON.parse(body);
                  const serverKey = env.MIDTRANS_SERVER_KEY || 'Mid-server-umbvOIGiXz0anZS1FkQBIbKQ';
                  const encodedKey = Buffer.from(serverKey + ':').toString('base64');
                  const apiUrl = 'https://app.sandbox.midtrans.com/snap/v1/transactions';

                  const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Accept': 'application/json',
                      'Authorization': `Basic ${encodedKey}`
                    },
                    body: JSON.stringify({
                      transaction_details: {
                        order_id: payload.order_id,
                        gross_amount: payload.gross_amount
                      },
                      customer_details: {
                        first_name: payload.first_name,
                        phone: payload.phone
                      }
                    })
                  });

                  const data = await response.json();
                  res.setHeader('Content-Type', 'application/json');
                  res.statusCode = response.status;
                  res.end(JSON.stringify(data));
                } catch (e) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: 'Internal server error' }));
                }
              });
            }
          });
        }
      }
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-router')) return 'vendor';
              if (id.includes('firebase')) return 'firebase';
              if (id.includes('framer-motion') || id.includes('gsap')) return 'animation';
              if (id.includes('three') || id.includes('lucide-react')) return 'ui';
              return 'deps';
            }
          }
        }
      },
      chunkSizeWarningLimit: 1000
    }
  }
})
