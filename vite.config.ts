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
          // Snap API Middleware
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

          // Core API Middleware
          server.middlewares.use('/api/charge', (req, res) => {
            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk.toString(); });
              req.on('end', async () => {
                try {
                  const payload = JSON.parse(body);
                  const serverKey = env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-umbvOIGiXz0anZS1FkQBIbKQ';
                  const encodedKey = Buffer.from(serverKey + ':').toString('base64');
                  const apiUrl = 'https://api.sandbox.midtrans.com/v2/charge';

                  const chargePayload: any = {
                    payment_type: payload.payment_type,
                    transaction_details: {
                      order_id: payload.order_id,
                      gross_amount: payload.gross_amount
                    },
                    customer_details: {
                      first_name: payload.first_name,
                      phone: payload.phone
                    }
                  };

                  if (payload.payment_type === 'bank_transfer') {
                    chargePayload.bank_transfer = {
                      bank: payload.bank || 'bca'
                    };
                  } else if (payload.payment_type === 'echannel') {
                    chargePayload.echannel = {
                      bill_info1: 'Payment For',
                      bill_info2: 'FusionNeural'
                    };
                  }

                  const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Accept': 'application/json',
                      'Authorization': `Basic ${encodedKey}`
                    },
                    body: JSON.stringify(chargePayload)
                  });

                  const data = await response.json();
                  res.setHeader('Content-Type', 'application/json');

                  if (!response.ok || data.status_code !== '201') {
                    res.statusCode = 400;
                    res.end(JSON.stringify({ error: data }));
                    return;
                  }

                  let result: any = {
                    order_id: data.order_id,
                    gross_amount: data.gross_amount,
                    payment_type: data.payment_type,
                    transaction_status: data.transaction_status
                  };

                  if (payload.payment_type === 'bank_transfer') {
                    result.va_number = data.va_numbers[0].va_number;
                    result.bank = data.va_numbers[0].bank;
                  } else if (payload.payment_type === 'echannel') {
                    result.biller_code = data.biller_code;
                    result.bill_key = data.bill_key;
                    result.bank = 'mandiri';
                  } else if (payload.payment_type === 'qris' || payload.payment_type === 'gopay') {
                    const qrAction = data.actions?.find((action: any) => action.name === 'generate-qr-code');
                    result.qr_url = qrAction ? qrAction.url : '';
                    result.actions = data.actions;
                  }

                  res.statusCode = 200;
                  res.end(JSON.stringify(result));
                } catch (e) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: 'Internal server error' }));
                }
              });
            }
          });
          // Neural API Middleware
          server.middlewares.use('/api/neural', (req, res) => {
            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk.toString(); });
              req.on('end', async () => {
                try {
                  const payload = JSON.parse(body);
                  const apiKey = env.GROQ_API_KEY || env.VITE_GROQ_API_KEY;
                  
                  if (!apiKey) {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ error: 'Internal Server Error: API Key missing' }));
                    return;
                  }

                  const groqPayload: any = {
                    model: payload.model || 'llama-3.3-70b-versatile',
                    messages: payload.messages,
                    temperature: payload.temperature ?? 0.7,
                  };

                  if (payload.max_tokens) groqPayload.max_tokens = payload.max_tokens;

                  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${apiKey}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(groqPayload),
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

          // Agents API Middleware (Local Proxy for Python Backend)
          server.middlewares.use('/api/agents', (req, res) => {
            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk.toString(); });
              req.on('end', async () => {
                try {
                  const payload = JSON.parse(body);
                  const agentId = payload.agent || 'frontliner';
                  const pythonBackend = env.PYTHON_BACKEND_URL || 'https://confined-simple-handiwork.ngrok-free.dev';
                  
                  const n8nPayload = { ...payload, action: 'chat', agent: agentId };
                  
                  const response = await fetch(`${pythonBackend}/trigger-agent`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(n8nPayload)
                  });
                  
                  const data = await response.json();
                  res.setHeader('Content-Type', 'application/json');
                  
                  if (!response.ok) {
                    res.statusCode = response.status;
                    res.end(JSON.stringify({ error: 'Python error', status: response.status, detail: data }));
                    return;
                  }
                  
                  res.statusCode = 200;
                  res.end(JSON.stringify(data));
                } catch (e: any) {
                  res.statusCode = 503;
                  res.end(JSON.stringify({ error: 'Python Backend tidak dapat dihubungi', detail: e.message }));
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
