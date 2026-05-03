// deploy-v2.cjs — FusionNeural Autonomous Core v2 (4 fixes applied)
const http = require('http');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyYmEwYWQzZS1kZjBhLTQ5OWEtODViMy01NGQwMGQwMjM4ZTkiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNzU1NzIxNWEtOWM4MS00ZjJiLThkNjAtYTczMGQ0NTQ3MDRkIiwiaWF0IjoxNzc3ODAwMTA4fQ.2LksvfYBNYVYYmt-TZ3ZNPlCOQAxzMvCbBKmTl3Fkxg';
const WF_ID  = '2vtpjqVeDAKqEdRy';
const CREDS  = {
  groq:       { id: 'pCvStZRZGTKVjlsr', name: 'OpenAI FusionNeural' },
  openrouter: { id: 'aGwlNLJ9Lbs4aaxu', name: 'OpenRouter FusionNeural' },
  deepseek:   { id: 'ZXmI7AKRpsK5nPVd', name: 'DeepSeek FusionNeural' },
  gemini:     { id: '4Zw4tMEb1HFzKe5q', name: 'Gemini FusionNeural' },
  cerebras:   { id: 'jbJT8yvyJUrvME6j', name: 'Cerebras FusionNeural' },
  mistral:    { id: 'mistral_cred_fn',  name: 'Mistral FusionNeural' },
  telegram:   { id: 'YTKp5vHtXaL7sQH0', name: 'Telegram Bot FusionNeural' },
  redis:      { id: 'hOB9I1Ihvq7ZOsR7', name: 'Upstash Redis FusionNeural' },
};
const FB_URL = 'https://fusion-neural-default-rtdb.firebaseio.com';
const FB_AUTH = 'AIzaSyCmI02tN-czvSp16wA4ik8aSwZhOxQxLmg';

// ── helpers ───────────────────────────────────────────────────────
const llm  = (id,name,cred,model,url,temp) => ({ id, name, type:'@n8n/n8n-nodes-langchain.lmChatOpenAi', typeVersion:1.3, position:[0,0], parameters:{ model, options:{baseURL:url,temperature:temp} }, credentials:{openAiApi:CREDS[cred]} });
const mem  = (id,name,key,ttl=86400,win=20) => ({ id, name, type:'@n8n/n8n-nodes-langchain.memoryRedisChat', typeVersion:1.5, position:[0,0], parameters:{ sessionKey:key, sessionTTL:ttl, contextWindowLength:win }, credentials:{redis:CREDS.redis} });
const agent= (id,name,sys,iter=5) => ({ id, name, type:'@n8n/n8n-nodes-langchain.agent', typeVersion:3.1, position:[0,0], parameters:{ agent:'conversationalAgent', promptType:'define', text:"={{ $('Prepare Context').item.json.userMessage }}", systemMessage:sys, options:{maxIterations:iter,returnIntermediateSteps:false} } });
const fb   = (id,name,path) => ({ id, name, type:'n8n-nodes-base.httpRequest', typeVersion:4.2, position:[0,0], parameters:{ method:'PATCH', url:`${FB_URL}/${path}.json?auth=${FB_AUTH}`, sendBody:true, contentType:'json', body:`={{ JSON.stringify({ result:($json.output||'').slice(0,500), timestamp:new Date().toISOString(), status:'ok' }) }}` } });
const sheets=(id,name)=>({ id, name, type:'n8n-nodes-base.httpRequest', typeVersion:4.2, position:[0,0], parameters:{ method:'POST', url:"={{ $env.GOOGLE_SHEETS_WEBHOOK || 'https://hooks.zapier.com/placeholder' }}", sendBody:true, contentType:'json', body:`={{ JSON.stringify({ agent:'${name}', output:($json.output||'').slice(0,1000), timestamp:new Date().toISOString(), sessionId:$('Prepare Context').item.json.sessionId }) }}` } });

// ── Dual-AI: LLM Fallback Router (Primary → Backup otomatis) ──────
// n8n akan mencoba model1 dulu, jika error/timeout → otomatis pakai model2
const llmFallback = (id, name, primaryId, backupId) => ({
  id, name,
  type: '@n8n/n8n-nodes-langchain.lmChatOpenAiFallback',
  typeVersion: 1,
  position: [0,0],
  parameters: { fallbackModels: [] },
  // Node ini menggabungkan 2 LLM: primary (ai_languageModel) + backup (ai_languageModelFallback)
});

// ── FIX 3: Global Context (shared across all agents) ──────────────
const globalCtxKey = "={{ 'fn:global:' + $('Prepare Context').item.json.sessionId }}";


const nodes = [
  // TRIGGERS
  { id:'n-wh', name:'Webhook Trigger', type:'n8n-nodes-base.webhook', typeVersion:2.1, position:[-1300,220], parameters:{ path:'fusionneural-core', httpMethod:'POST', responseMode:'responseNode', options:{onError:'continueRegularOutput'} } },
  { id:'n-tg', name:'Telegram Trigger', type:'n8n-nodes-base.telegramTrigger', typeVersion:1.1, position:[-1300,800], parameters:{ updates:['message','callback_query'], additionalFields:{} }, credentials:{telegramApi:CREDS.telegram} },

  // GATE
  { id:'n-gate', name:'Password Gate', type:'n8n-nodes-base.if', typeVersion:2.3, position:[-1060,220], parameters:{ conditions:{ combinator:'and', conditions:[{ leftValue:"={{ $json.body.password }}", operator:{type:'string',operation:'equals'}, rightValue:'FusionNeural-Olivia' }] } } },
  { id:'n-reject', name:'Reject', type:'n8n-nodes-base.respondToWebhook', typeVersion:1.5, position:[-1060,400], parameters:{ respondWith:'json', responseCode:401, responseBody:'={ "error":"Unauthorized" }' } },
  { id:'n-ok', name:'Respond 200', type:'n8n-nodes-base.respondToWebhook', typeVersion:1.5, position:[-820,100], parameters:{ respondWith:'json', responseCode:200, responseBody:'={ "status":"received" }' } },

  // PREPARE
  { id:'n-ctx', name:'Prepare Context', type:'n8n-nodes-base.set', typeVersion:3.4, position:[-820,220], parameters:{ mode:'manual', fields:{ values:[
    { name:'userMessage', type:'stringValue', value:"={{ $('Webhook Trigger').item.json.body.message }}" },
    { name:'agentRole',   type:'stringValue', value:"={{ $('Webhook Trigger').item.json.body.role || $('Webhook Trigger').item.json.body.agent || 'frontliner' }}" },
    { name:'sessionId',   type:'stringValue', value:"={{ $('Webhook Trigger').item.json.body.sessionId || 'sess_'+Date.now() }}" },
  ] } } },

  // FIX 3: Read Global Context from Redis before routing
  { id:'n-global-read', name:'Read Global Context', type:'n8n-nodes-base.redis', typeVersion:1, position:[-580,220], parameters:{ operation:'get', key:globalCtxKey }, credentials:{redis:CREDS.redis} },

  // ROUTER
  { id:'n-router', name:'Role Router', type:'n8n-nodes-base.switch', typeVersion:3.4, position:[-340,220], parameters:{ mode:'rules', options:{fallbackOutput:'extra'}, rules:{ values:[
    { conditions:{combinator:'and',conditions:[{leftValue:"={{ $json.agentRole }}",operator:{type:'string',operation:'equals'},rightValue:'admin'}]}, outputKey:'admin' },
    { conditions:{combinator:'and',conditions:[{leftValue:"={{ $json.agentRole }}",operator:{type:'string',operation:'equals'},rightValue:'finance'}]}, outputKey:'finance' },
    { conditions:{combinator:'and',conditions:[{leftValue:"={{ $json.agentRole }}",operator:{type:'string',operation:'equals'},rightValue:'marketing'}]}, outputKey:'marketing' },
    { conditions:{combinator:'and',conditions:[{leftValue:"={{ $json.agentRole }}",operator:{type:'string',operation:'equals'},rightValue:'manager'}]}, outputKey:'manager' },
  ] } } },

  // AGENTS (FIX 3: systemMessage includes global context)
  agent('n-a-admin','Admin AI Agent',
    "Kamu Admin Agent FusionNeural. Kelola inventaris, pesanan, stok, logistik.\nKonteks Global Sesi: {{ $('Read Global Context').item.json.value || 'Tidak ada konteks sebelumnya.' }}\nBalas Bahasa Indonesia.",5),
  agent('n-a-finance','Finance AI Agent',
    "Kamu Finance Agent FusionNeural. ATURAN KERAS: HARGA 0 Rp TOLAK, harus hitung ulang.\nKonteks Global: {{ $('Read Global Context').item.json.value || 'Tidak ada.' }}\nFormat Rupiah. Balas Bahasa Indonesia.",5),
  agent('n-a-marketing','Marketing AI Agent',
    "Kamu Marketing Agent FusionNeural. Strategi konten, kampanye, funnel.\nKonteks Global: {{ $('Read Global Context').item.json.value || 'Tidak ada.' }}\nBalas Bahasa Indonesia.",5),
  agent('n-a-manager','Manager AI Agent',
    "Kamu Manager FusionNeural — pemimpin AI. Evaluasi agen, keputusan strategis.\nKonteks Global: {{ $('Read Global Context').item.json.value || 'Tidak ada.' }}\nTag [ESCALATE:agent] jika anomali. Balas Bahasa Indonesia.",8),
  agent('n-a-front','Frontliner AI Agent',
    "Kamu Frontliner FusionNeural. Sambut pengguna, arahkan ke agen yang tepat. Balas singkat Bahasa Indonesia.",3),

  // ── LLM MODELS — PRIMARY ────────────────────────────────────────────────────
  llm('n-m-admin',         'OpenRouter: Admin',       'openrouter','openai/gpt-oss-120b:free',           'https://openrouter.ai/api/v1',0.5),
  llm('n-m-finance',       'DeepSeek: Finance',       'deepseek',  'deepseek-chat',                      'https://api.deepseek.com',0.2),
  llm('n-m-marketing',     'Mistral: Marketing',      'mistral',   'mistral-large-latest',               'https://api.mistral.ai/v1',0.8),
  llm('n-m-manager',       'Gemini: Manager',         'gemini',    'gemini-2.5-flash-preview-05-20',     'https://generativelanguage.googleapis.com/v1beta/openai',0.6),
  llm('n-m-front',         'Cerebras: Frontliner',    'cerebras',  'llama-3.3-70b',                      'https://api.cerebras.ai/v1',0.7),
  llm('n-m-tg',            'Groq: Telegram',          'groq',      'llama-3.3-70b-versatile',            'https://api.groq.com/openai/v1',0.6),
  // Finance retry menggunakan Groq sebagai backup
  llm('n-m-finance-retry', 'Groq: Finance Retry',     'groq',      'llama-3.3-70b-versatile',            'https://api.groq.com/openai/v1',0.2),

  // ── LLM MODELS — BACKUP (Dual-AI: Primary gagal → otomatis pakai ini) ────────
  llm('n-m-admin-bk',      'Cerebras: Admin Backup',  'cerebras',  'llama-3.3-70b',                      'https://api.cerebras.ai/v1',0.5),
  llm('n-m-finance-bk',    'Groq: Finance Backup',    'groq',      'llama-3.3-70b-versatile',            'https://api.groq.com/openai/v1',0.2),
  llm('n-m-marketing-bk',  'OpenRouter: Mktg Backup', 'openrouter','openai/gpt-oss-120b:free',           'https://openrouter.ai/api/v1',0.8),
  llm('n-m-manager-bk',    'Groq: Manager Backup',    'groq',      'llama-3.3-70b-versatile',            'https://api.groq.com/openai/v1',0.6),
  llm('n-m-front-bk',      'Mistral: Front Backup',   'mistral',   'mistral-large-latest',               'https://api.mistral.ai/v1',0.7),

  // REDIS MEMORY (per-agent, FIX 3: tiap agen tetap punya memori sendiri untuk konteks percakapan)
  mem('n-r-admin','Redis Memory: Admin',"={{ 'fn:admin:'+$('Prepare Context').item.json.sessionId }}",86400,20),
  mem('n-r-finance','Redis Memory: Finance',"={{ 'fn:finance:'+$('Prepare Context').item.json.sessionId }}",86400,20),
  mem('n-r-marketing','Redis Memory: Marketing',"={{ 'fn:marketing:'+$('Prepare Context').item.json.sessionId }}",86400,20),
  mem('n-r-manager','Redis Memory: Manager',"={{ 'fn:manager:'+$('Prepare Context').item.json.sessionId }}",259200,30),
  mem('n-r-front','Redis Memory: Frontliner',"={{ 'fn:front:'+$('Prepare Context').item.json.sessionId }}",86400,15),

  // FIX: Finance Price Retry — sekarang pakai agent DENGAN LLM terpasang (bukan floating node)
  { id:'n-price-check', name:'Finance: Cek Harga > 0', type:'n8n-nodes-base.if', typeVersion:2.3, position:[0,0], parameters:{
    conditions:{ combinator:'and', conditions:[{
      leftValue:"={{ ($json.output || '').match(/Rp\\s*0[^,\\.\\d]|0\\s*Rupiah/i) ? 'invalid' : 'valid' }}",
      operator:{type:'string',operation:'equals'}, rightValue:'valid'
    }] }
  }},
  { id:'n-price-retry', name:'Finance: Hitung Ulang', type:'@n8n/n8n-nodes-langchain.agent', typeVersion:3.1, position:[0,0], parameters:{
    agent:'conversationalAgent', promptType:'define',
    text:"Harga mengandung nilai 0 Rp — TIDAK VALID. Hitung ulang, berikan harga realistis minimal Rp 1.000. Pesan asli: {{ $('Prepare Context').item.json.userMessage }}",
    systemMessage:'Kamu Finance Agent FusionNeural. HARGA 0 Rp DILARANG. Berikan estimasi harga yang realistis dalam Rupiah.',
    options:{ maxIterations:3, returnIntermediateSteps:false }
  }},

  // FIX 1: Individual Firebase per agent (anti race-condition)
  fb('n-fb-admin',   'Firebase: Admin Update',    'agents/admin'),
  fb('n-fb-finance', 'Firebase: Finance Update',  'agents/finance'),
  fb('n-fb-marketing','Firebase: Marketing Update','agents/marketing'),
  fb('n-fb-manager', 'Firebase: Manager Update',  'agents/manager'),
  fb('n-fb-front',   'Firebase: Frontliner Update','agents/frontliner'),

  // FIX 3: Write Global Context after each agent
  { id:'n-global-write', name:'Update Global Context', type:'n8n-nodes-base.redis', typeVersion:1, position:[0,0],
    parameters:{ operation:'set', key:globalCtxKey, value:"={{ ($('Read Global Context').item.json.value||'') + '\\n['+$('Prepare Context').item.json.agentRole.toUpperCase()+'] '+($json.output||'').slice(0,200) }}", expire:true, ttl:86400 },
    credentials:{redis:CREDS.redis}
  },

  // FIX 4: Google Sheets Log (via webhook/HTTP — no OAuth needed)
  sheets('n-sheets-admin',    'Sheets: Log Admin'),
  sheets('n-sheets-finance',  'Sheets: Log Finance'),
  sheets('n-sheets-marketing','Sheets: Log Marketing'),
  sheets('n-sheets-manager',  'Sheets: Log Manager'),

  // TELEGRAM FLOW
  { id:'n-tg-ctx', name:'Prepare Telegram Context', type:'n8n-nodes-base.set', typeVersion:3.4, position:[-1060,800], parameters:{ mode:'manual', fields:{ values:[
    { name:'userMessage', type:'stringValue', value:'={{ $json.message.text }}' },
    { name:'sessionId',   type:'stringValue', value:"={{ 'tg_'+$json.message.chat.id }}" },
    { name:'chatId',      type:'stringValue', value:'={{ $json.message.chat.id }}' },
  ] } } },
  { id:'n-tg-agent', name:'Telegram AI Agent', type:'@n8n/n8n-nodes-langchain.agent', typeVersion:3.1, position:[-580,800], parameters:{
    agent:'conversationalAgent', promptType:'define',
    text:"={{ $('Prepare Telegram Context').item.json.userMessage }}",
    systemMessage:"Kamu asisten FusionNeural via Telegram (@FusionNeuralbot). Perintah: 'status'=laporan sistem. Balas singkat Bahasa Indonesia.",
    options:{maxIterations:5,returnIntermediateSteps:false}
  }},
  mem('n-r-tg','Redis Memory: Telegram',"={{ 'fn:tg:'+$('Prepare Telegram Context').item.json.sessionId }}",604800,25),
  { id:'n-tg-reply', name:'Telegram: Kirim Balasan', type:'n8n-nodes-base.telegram', typeVersion:1.2, position:[-340,800], parameters:{
    operation:'sendMessage',
    chatId:"={{ $('Prepare Telegram Context').item.json.chatId }}",
    text:"={{ '🤖 *FusionNeural AI*\\n\\n'+($json.output||'Memproses...') }}",
    additionalFields:{ parse_mode:'Markdown' }
  }, credentials:{telegramApi:CREDS.telegram} },
];

// ── Set positions ─────────────────────────────────────────────────
const agentY  = [-600,-300,0,300,600];
const agentIds   = ['n-a-admin','n-a-finance','n-a-marketing','n-a-manager','n-a-front'];
const modelIds   = ['n-m-admin','n-m-finance','n-m-marketing','n-m-manager','n-m-front'];
const memIds     = ['n-r-admin','n-r-finance','n-r-marketing','n-r-manager','n-r-front'];
const fbIds      = ['n-fb-admin','n-fb-finance','n-fb-marketing','n-fb-manager','n-fb-front'];
const sheetsIds  = ['n-sheets-admin','n-sheets-finance','n-sheets-marketing','n-sheets-manager'];
const gwIds      = ['n-global-write'];

const backupIds = ['n-m-admin-bk','n-m-finance-bk','n-m-marketing-bk','n-m-manager-bk','n-m-front-bk'];
nodes.forEach(n => {
  const ai = agentIds.indexOf(n.id);
  const mi = modelIds.indexOf(n.id);
  const ri = memIds.indexOf(n.id);
  const fi = fbIds.indexOf(n.id);
  const si = sheetsIds.indexOf(n.id);
  const bi = backupIds.indexOf(n.id);
  if (ai>=0) n.position = [  80, agentY[ai]];
  if (mi>=0) n.position = [-160, agentY[mi]+140];
  if (ri>=0) n.position = [ 320, agentY[ri]+140];
  if (fi>=0) n.position = [ 560, agentY[fi]];
  if (si>=0) n.position = [ 800, agentY[si]];
  if (bi>=0) n.position = [-160, agentY[bi]+260]; // backup LLM di bawah primary
});
// Finance special nodes
nodes.find(n=>n.id==='n-price-check').position  = [ 320, -300];
nodes.find(n=>n.id==='n-price-retry').position  = [ 560, -180];
nodes.find(n=>n.id==='n-global-write').position = [1000, 0  ];
nodes.find(n=>n.id==='n-m-tg').position         = [-820, 940];
nodes.find(n=>n.id==='n-r-tg').position         = [-340, 940];

// ── Connections ───────────────────────────────────────────────────
const C = (from, type, to, idx=0) => ({ [from]: { [type]: [[{ node:to, type, index:idx }]] } });
const merge = (...objs) => {
  const r={};
  for(const o of objs){
    for(const [k,v] of Object.entries(o)){
      if(!r[k]) r[k]={};
      for(const [t,arr] of Object.entries(v)){
        if(!r[k][t]) r[k][t]=[];
        r[k][t].push(...arr);
      }
    }
  }
  return r;
};

const connections = merge(
  // Main flow
  C('Webhook Trigger','main','Password Gate'),
  { 'Password Gate': { main:[[{node:'Respond 200',type:'main',index:0}],[{node:'Reject',type:'main',index:0}]] }},
  C('Respond 200','main','Prepare Context'),
  C('Prepare Context','main','Read Global Context'),
  C('Read Global Context','main','Role Router'),
  { 'Role Router': { main:[
    [{node:'Admin AI Agent',type:'main',index:0}],
    [{node:'Finance AI Agent',type:'main',index:0}],
    [{node:'Marketing AI Agent',type:'main',index:0}],
    [{node:'Manager AI Agent',type:'main',index:0}],
    [{node:'Frontliner AI Agent',type:'main',index:0}],
  ]}},
  // Admin → Firebase → Sheets → Global Context
  C('Admin AI Agent','main','Firebase: Admin Update'),
  C('Firebase: Admin Update','main','Sheets: Log Admin'),
  // FIX 2: Finance → Price Check → Firebase or Retry
  C('Finance AI Agent','main','Finance: Cek Harga > 0'),
  { 'Finance: Cek Harga > 0': { main:[ [{node:'Firebase: Finance Update',type:'main',index:0}], [{node:'Finance: Hitung Ulang',type:'main',index:0}] ]}},
  C('Finance: Hitung Ulang','main','Firebase: Finance Update'),
  C('Firebase: Finance Update','main','Sheets: Log Finance'),
  // Marketing → Firebase → Sheets
  C('Marketing AI Agent','main','Firebase: Marketing Update'),
  C('Firebase: Marketing Update','main','Sheets: Log Marketing'),
  // Manager → Firebase → Sheets
  C('Manager AI Agent','main','Firebase: Manager Update'),
  C('Firebase: Manager Update','main','Sheets: Log Manager'),
  // Frontliner → Firebase
  C('Frontliner AI Agent','main','Firebase: Frontliner Update'),
  // All Sheets → Global Context (use admin path as representative merge)
  C('Sheets: Log Admin','main','Update Global Context'),
  C('Sheets: Log Finance','main','Update Global Context'),
  C('Sheets: Log Marketing','main','Update Global Context'),
  C('Sheets: Log Manager','main','Update Global Context'),
  C('Firebase: Frontliner Update','main','Update Global Context'),
  // LLM connections
  C('OpenRouter: Admin',         'ai_languageModel',         'Admin AI Agent'),
  C('Cerebras: Admin Backup',    'ai_languageModelFallback', 'Admin AI Agent'),
  C('DeepSeek: Finance',         'ai_languageModel',         'Finance AI Agent'),
  C('Groq: Finance Backup',      'ai_languageModelFallback', 'Finance AI Agent'),
  C('Mistral: Marketing',        'ai_languageModel',         'Marketing AI Agent'),
  C('OpenRouter: Mktg Backup',   'ai_languageModelFallback', 'Marketing AI Agent'),
  C('Gemini: Manager',           'ai_languageModel',         'Manager AI Agent'),
  C('Groq: Manager Backup',      'ai_languageModelFallback', 'Manager AI Agent'),
  C('Cerebras: Frontliner',      'ai_languageModel',         'Frontliner AI Agent'),
  C('Mistral: Front Backup',     'ai_languageModelFallback', 'Frontliner AI Agent'),
  C('Groq: Telegram',            'ai_languageModel',         'Telegram AI Agent'),
  // FIX: Groq sebagai LLM untuk Finance Retry node (menghilangkan warning ⚠)
  C('Groq: Finance Retry',       'ai_languageModel',         'Finance: Hitung Ulang'),
  // Memory connections
  C('Redis Memory: Admin','ai_memory','Admin AI Agent'),
  C('Redis Memory: Finance','ai_memory','Finance AI Agent'),
  C('Redis Memory: Marketing','ai_memory','Marketing AI Agent'),
  C('Redis Memory: Manager','ai_memory','Manager AI Agent'),
  C('Redis Memory: Frontliner','ai_memory','Frontliner AI Agent'),
  C('Redis Memory: Telegram','ai_memory','Telegram AI Agent'),
  // Telegram flow
  C('Telegram Trigger','main','Prepare Telegram Context'),
  C('Prepare Telegram Context','main','Telegram AI Agent'),
  C('Telegram AI Agent','main','Telegram: Kirim Balasan'),
);

// ── Deploy ────────────────────────────────────────────────────────
const payload = JSON.stringify({ name:'FusionNeural_Autonomous_Core_v2', nodes, connections, settings:{executionOrder:'v1'}, staticData:null });

function call(method, path, body, cb){
  const opts={ hostname:'localhost', port:5678, path, method, headers:{ 'X-N8N-API-KEY':API_KEY, 'Content-Type':'application/json', 'Content-Length':Buffer.byteLength(body) }};
  const req=http.request(opts,res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>cb(res.statusCode,d));});
  req.on('error',e=>cb(0,e.message)); req.write(body); req.end();
}

console.log(`Deploying v2 (${nodes.length} nodes, 4 fixes applied)...`);
call('PUT',`/api/v1/workflows/${WF_ID}`,payload,(code,body)=>{
  if(code===200){
    const r=JSON.parse(body);
    console.log(`✅ Deployed: ${r.name} | ${r.nodes.length} nodes`);
    call('POST',`/api/v1/workflows/${WF_ID}/activate`,'{}', (c2,b2)=>{
      try{ const r2=JSON.parse(b2); console.log(r2.active?'✅ AKTIF!':'⚠️  Aktifkan manual di UI'); }
      catch{ console.log('⚠️  Aktifkan manual di UI'); }
    });
  } else {
    console.error(`❌ ${code}:`, body.slice(0,400));
  }
});
