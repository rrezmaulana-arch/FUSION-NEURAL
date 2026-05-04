"""
FusionNeural CORE — Generator Final v4
Ground truth dari audit kode (04-May-2026):

INTERACTIVE (Webhook):
  /api/agents → { agent, task, message, sessionId }
  route key = agent (frontliner/manager/admin/finance/marketing)
  sub-route  = task (copywriting/inventory_chatbot/master_calculator/dll)

  Pages yang memanggil per agent:
  ADMIN    : InventoryTrackerPage, OrderStreamPage, SupplySignalsPage, SupplierHubPage
  FINANCE  : ProfitLedgerPage, OperationalBurnPage, ROIIntelligencePage, FinancialPolicyPage, TaxCalculatorPage
  MARKETING: CampaignForgePage, MarketSignalsPage, ContentLaunchpadPage, ConversionFeedbackPage,
             BrandDNAPage, LaunchSimulatorPage, ImageStudioPage
  MANAGER  : ManagerDashboard, AgentOrchestratorPage, ExecutiveSummaryPage, AgentHealthPage, StrategicAuditPage
  /api/marketing { type:'image', prompt } → image branch
  /api/search    { query, num }           → search branch

AUTOPILOT (Schedule 60 min):
  Step 1: Baca Inventaris Firebase → Simulasi Penjualan → Update Stok
  Step 2: Deteksi Stok Rendah (<=5) → Smart Restock (+50 unit)
  Step 3: Finance Signal → Log Pengeluaran + Update Firebase budget
  Step 4: Master Report → Tulis ke Sheets Autopilot
"""
import json, os

OUT    = os.path.join(os.path.dirname(__file__), 'fusionneural-CORE.json')
PY     = 'http://localhost:8000'
UPSTASH= 'https://proud-reptile-111133.upstash.io'
TOKEN  = 'Bearer gQAAAAAAAbIdAAIgcDE0MzRlZjM0YTEyMzg0OTI3YjhjZDA1MTdkM2FkNjE5Zg'
FB_RTDB= 'https://fusion-neural-default-rtdb.firebaseio.com'
FBAUTH = 'AIzaSyCmI02tN-czvSp16wA4ik8aSwZhOxQxLmg'
AHDR   = [{'name':'Authorization','value':TOKEN}]

_uid = 0
def nid():
    global _uid; _uid += 1; return f'n{_uid}'

def N(nm, typ, ver, pos, params):
    return {'id':nid(),'name':nm,'type':f'n8n-nodes-base.{typ}','typeVersion':ver,'position':pos,'parameters':params}

def wh(nm, path, x, y):
    return N(nm,'webhook',2,[x,y],{'httpMethod':'POST','path':path,'responseMode':'responseNode','options':{}})

def sched(nm, x, y):
    return N(nm,'scheduleTrigger',1.3,[x,y],{'rule':{'interval':[{'field':'cronExpression','expression':'0 * * * *'}]}})

def code(nm, x, y, js):
    return N(nm,'code',2,[x,y],{'jsCode':js})

def http_post(nm, x, y, url, kvs):
    return N(nm,'httpRequest',4.4,[x,y],{'method':'POST','url':url,'sendBody':True,'contentType':'json',
        'specifyBody':'keypair','bodyParameters':{'parameters':kvs},'options':{}})

def http_patch(nm, x, y, url, kvs):
    return N(nm,'httpRequest',4.4,[x,y],{'method':'PATCH','url':url,'sendBody':True,'contentType':'json',
        'specifyBody':'keypair','bodyParameters':{'parameters':kvs},'options':{}})

def http_get(nm, x, y, url, hdrs=[]):
    return N(nm,'httpRequest',4.4,[x,y],{'method':'GET','url':url,'sendHeaders':bool(hdrs),
        'headerParameters':{'parameters':hdrs},'options':{}})

def sw_rules(nm, x, y, rules_map):
    values = [{'conditions':{'options':{'caseSensitive':True,'leftValue':'','typeValidation':'strict'},
               'conditions':[{'id':f'c{i}','leftValue':le,'rightValue':rv,
                              'operator':{'type':'string','operation':'equals'}}],'combinator':'and'},
               'renameOutput':True,'outputKey':ok} for i,(ok,le,rv) in enumerate(rules_map)]
    return N(nm,'switch',3.4,[x,y],{'mode':'rules','rules':{'values':values}})

def respond(nm, x, y):
    return N(nm,'respondToWebhook',1.1,[x,y],{'respondWith':'json',
        'responseBody':"={{ JSON.stringify($json) }}",'options':{'responseCode':200}})

def redis_incr(nm, x, y, key):
    return http_get(nm,x,y,f'{UPSTASH}/INCR/api_usage:{key}',AHDR)

def fb_status(nm, x, y, agent):
    return http_patch(nm,x,y,f'{FB_RTDB}/agents/{agent}.json?auth={FBAUTH}',[
        {'name':'status','value':'active'},
        {'name':'lastCall','value':'={{ new Date().toISOString() }}'},
    ])

def sheets(nm, x, y, agent_expr, result_expr, sess_expr):
    return http_post(nm,x,y,f'{PY}/log-activity',[
        {'name':'agent',    'value': agent_expr},
        {'name':'result',   'value': result_expr},
        {'name':'sessionId','value': sess_expr},
    ])

def py_trigger(nm, x, y, agent_val, task_val):
    """Panggil /trigger-agent Python. agent & task dari payload n8n."""
    return http_post(nm,x,y,f'{PY}/trigger-agent',[
        {'name':'agent',    'value': agent_val},
        {'name':'task',     'value': task_val},
        {'name':'message',  'value': '={{ $json.message || "" }}'},
        {'name':'sessionId','value': '={{ $json.sessionId || "auto" }}'},
    ])

# ─────────────────────────────────────────────────────────────────────────────
nodes = []
conns = {}

def add(n): nodes.append(n); return n['name']

def link(src, tgt, out=0):
    conns.setdefault(src,{'main':[]})
    while len(conns[src]['main']) <= out: conns[src]['main'].append([])
    conns[src]['main'][out].append({'node':tgt,'type':'main','index':0})

# ─────────────────────────────────────────────────────────────────────────────
# PREP — normalize payload dari 3 API entry point:
#   /api/agents   { agent, task, message, sessionId }
#   /api/marketing { type, prompt }         → agent=marketing, task=copywriting/visual_creator
#   /api/search   { query, num }            → agent=search
# ─────────────────────────────────────────────────────────────────────────────
PREP_JS = """
const body = $input.first().json?.body ?? $input.first().json ?? {};
const rawAgent  = (body.agent  || body.role  || 'frontliner').toLowerCase().trim();
const rawType   = (body.type   || 'text').toLowerCase(); // marketing: 'text'|'image'
const rawTask   = (body.task   || '').toLowerCase();
const sessionId = body.sessionId || `sess_${Date.now()}`;
const message   = body.message || body.prompt || body.query || '';

// Tentukan route: frontliner/manager/admin/finance/marketing/image_gen/search
let route = rawAgent;
if (rawAgent === 'marketing' && rawType === 'image') route = 'image_gen';
if (rawAgent === 'search') route = 'search';

// Task fallback per agent jika tidak dikirim
const DEFAULT_TASK = {
  frontliner: 'sales_chat',
  manager:    'executive_overview',
  admin:      'inventory_chatbot',
  finance:    'allocation_strategy',
  marketing:  'copywriting',
  image_gen:  'visual_creator',
  search:     'supplier_research',
};
const task = rawTask || DEFAULT_TASK[route] || rawTask;

return [{ json: { agent: rawAgent, route, task, message, sessionId, num: body.num || 5 } }];
""".strip()

# ─────────────────────────────────────────────────────────────────────────────
# INTERACTIVE LANE
# ─────────────────────────────────────────────────────────────────────────────
add(wh('Pintu Webhook', 'fusionneural-core', 0, 500))
add(code('Siapkan Konteks', 240, 500, PREP_JS))
link('Pintu Webhook', 'Siapkan Konteks')

ROUTER_RULES = [
    ('frontliner', '={{ $json.route }}', 'frontliner'),
    ('manager',    '={{ $json.route }}', 'manager'),
    ('admin',      '={{ $json.route }}', 'admin'),
    ('finance',    '={{ $json.route }}', 'finance'),
    ('marketing',  '={{ $json.route }}', 'marketing'),
    ('image_gen',  '={{ $json.route }}', 'image_gen'),
    ('search',     '={{ $json.route }}', 'search'),
]
add(sw_rules('Router Agen', 480, 500, ROUTER_RULES))
link('Siapkan Konteks', 'Router Agen')

RESPOND = 'Menanggapi Vercel'
add(respond(RESPOND, 2200, 500))

# ─────────────────────────────────────────────────────────────────────────────
# Branch per agent — Y layout (frontliner paling bawah, search paling atas)
# ─────────────────────────────────────────────────────────────────────────────
BRANCHES = [
    # (route_key, router_out_idx, agent_val, task_val, y)
    ('search',     6, 'admin',      '={{ $json.task }}',  -200),
    ('image_gen',  5, 'marketing',  'visual_creator',      0),
    ('marketing',  4, 'marketing',  '={{ $json.task }}',  200),
    ('finance',    3, 'finance',    '={{ $json.task }}',  400),
    ('admin',      2, 'admin',      '={{ $json.task }}',  600),
    ('manager',    1, 'manager',    '={{ $json.task }}',  800),
    ('frontliner', 0, 'frontliner', '={{ $json.task }}', 1000),
]

for (route, ridx, py_agent_val, py_task_val, y) in BRANCHES:
    x0 = 780

    if route == 'search':
        # Search: panggil /search Python langsung
        add(http_post(f'Python: Search', x0, y, f'{PY}/search',[
            {'name':'query','value':'={{ $json.message }}'},
            {'name':'num',  'value':'={{ $json.num }}'},
        ]))
        link('Router Agen', 'Python: Search', ridx)
        norm_js = ("const d=$input.first().json;const c=$node['Siapkan Konteks'].json;"
                   "return [{json:{agent:'search',task:c.task,provider:'Serper',"
                   "result:JSON.stringify({organic:(d.organic||[]).slice(0,5)}),"
                   "sessionId:c.sessionId,timestamp:new Date().toISOString()}}];")
        add(code('Hasil Search', x0+240, y, norm_js))
        link('Python: Search', 'Hasil Search')
        prev = 'Hasil Search'

    elif route == 'image_gen':
        # Image gen: panggil /generate-image Python
        add(http_post('Python: Image Gen', x0, y, f'{PY}/generate-image',[
            {'name':'prompt','value':'={{ $json.message }}'},
        ]))
        link('Router Agen', 'Python: Image Gen', ridx)
        img_js = ("const d=$input.first().json;const c=$node['Siapkan Konteks'].json;"
                  "const b64=d.base64?`data:${d.mimeType||'image/jpeg'};base64,${d.base64}`:(d.result||'');"
                  "return [{json:{agent:'marketing',task:'visual_creator',provider:'HuggingFace',"
                  "result:b64,sessionId:c.sessionId,timestamp:new Date().toISOString()}}];")
        add(code('Hasil Image', x0+240, y, img_js))
        link('Python: Image Gen', 'Hasil Image')
        prev = 'Hasil Image'

    else:
        # Standard: panggil /trigger-agent Python
        py_nm = f'Python: {route.capitalize()}'
        add(py_trigger(py_nm, x0, y, py_agent_val, py_task_val))
        link('Router Agen', py_nm, ridx)
        norm_js = (f"const d=$input.first().json;const c=$node['Siapkan Konteks'].json;"
                   f"return [{{json:{{agent:c.agent,task:c.task,provider:d.provider||'python',"
                   "result:d.result||d.output||'',sessionId:c.sessionId,"
                   "timestamp:new Date().toISOString()}}}}];")
        norm_nm = f'Hasil {route.capitalize()}'
        add(code(norm_nm, x0+240, y, norm_js))
        link(py_nm, norm_nm)

        # Finance: tambah cek harga nol → retry
        if route == 'finance':
            chk_js = ("const d=$input.first().json;const zero=/Rp\\s*0[^,.\\d]|0\\s*Rupiah/i.test(d.result||'');"
                      "return [{json:{...d,_hasZeroPrice:zero}}];")
            add(code('Finance: Cek Harga', x0+480, y, chk_js))
            link(norm_nm, 'Finance: Cek Harga')
            add(N('Finance: Apakah Harga Nol?','if',2,[x0+720,y],{'conditions':{'options':
                {'caseSensitive':True,'leftValue':'','typeValidation':'strict'},
                'conditions':[{'id':'cz','leftValue':'={{ $json._hasZeroPrice }}','rightValue':True,
                               'operator':{'type':'boolean','operation':'equals'}}],'combinator':'and'}}))
            link('Finance: Cek Harga','Finance: Apakah Harga Nol?')
            # True → retry
            add(py_trigger('Finance: Hitung Ulang', x0+960, y-130, 'finance','master_calculator'))
            link('Finance: Apakah Harga Nol?','Finance: Hitung Ulang',0)
            # False (valid) → lanjut
            rd_nm = 'Redis: Finance'
            add(redis_incr(rd_nm, x0+960, y, 'finance'))
            link('Finance: Apakah Harga Nol?',rd_nm,1)
            link('Finance: Hitung Ulang',rd_nm)
            prev = rd_nm
        else:
            prev = norm_nm

    # Shared chain: Redis → Firebase → Sheets → Respond
    agent_key = 'marketing' if route in ('image_gen','marketing') else route
    if route != 'finance':
        rd_nm = f'Redis: {route}'
        add(redis_incr(rd_nm, x0+480, y, agent_key))
        link(prev, rd_nm)
        prev = rd_nm

    fb_nm = f'Firebase: {route}'
    add(fb_status(fb_nm, x0+720 if route!='finance' else x0+1200, y, agent_key))
    link(prev if route!='finance' else 'Redis: Finance', fb_nm)

    sh_nm = f'Sheets: {route}'
    sh_x = (x0+960) if route!='finance' else (x0+1440)
    add(sheets(sh_nm, sh_x, y,
               f"={{{{ $node['Siapkan Konteks'].json.agent }}}}",
               "={{ ($json.result||'').substring(0,800) }}",
               f"={{{{ $node['Siapkan Konteks'].json.sessionId }}}}"))
    link(fb_nm, sh_nm)
    link(sh_nm, RESPOND)

# ─────────────────────────────────────────────────────────────────────────────
# AUTOPILOT LANE (y=1400+)
# ─────────────────────────────────────────────────────────────────────────────
AP_Y = 1450

add(sched('Jadwal 60 Menit', 0, AP_Y))

# Step 1: Baca inventaris
add(http_get('AP1: Baca Inventaris', 240, AP_Y, f'{FB_RTDB}/inventory.json?auth={FBAUTH}'))
link('Jadwal 60 Menit', 'AP1: Baca Inventaris')

SALES_JS = """
const inv = $input.first().json || {};
const items = Object.entries(inv);
const session_id = `auto_${Date.now()}`;
let sold = [];
let total_rev = 0;
const shuffled = items.sort(() => Math.random()-0.5).slice(0,10);
for (const [id, item] of shuffled) {
  if (!item || typeof item.stok === 'undefined') continue;
  const demand = Math.floor(Math.random()*5)+1;
  const actual = Math.min(demand, item.stok);
  const newStok = item.stok - actual;
  const status = newStok <= 0 ? 'CRITICAL_LOW' : (newStok <= 5 ? 'LOW' : 'IN STOCK');
  const harga = item.harga || item.price || 50000;
  sold.push({ id, name: item.name||id, sold: actual, newStok, status, revenue: actual*harga });
  total_rev += actual * harga;
}
return [{ json: { session_id, items_sold: sold, total_revenue: total_rev } }];
""".strip()
add(code('AP1: Simulasi Penjualan', 480, AP_Y, SALES_JS))
link('AP1: Baca Inventaris', 'AP1: Simulasi Penjualan')

add(http_post('AP1: Update Stok Firebase', 720, AP_Y, f'{PY}/admin-action',[
    {'name':'action', 'value':'batch_update_stock'},
    {'name':'payload','value':'={{ JSON.stringify($json.items_sold) }}'},
    {'name':'sessionId','value':'={{ $json.session_id }}'},
]))
link('AP1: Simulasi Penjualan','AP1: Update Stok Firebase')

# Step 2: Restock
RESTOCK_DETECT_JS = """
const sim = $node['AP1: Simulasi Penjualan'].json;
const lowItems = (sim.items_sold||[]).filter(i => i.newStok <= 5);
return [{ json: { ...sim, lowItems, restockCount: lowItems.length } }];
""".strip()
add(code('AP2: Deteksi Stok Rendah', 960, AP_Y, RESTOCK_DETECT_JS))
link('AP1: Update Stok Firebase','AP2: Deteksi Stok Rendah')

add(http_post('AP2: Smart Restock', 1200, AP_Y, f'{PY}/admin-action',[
    {'name':'action',   'value':'smart_restock'},
    {'name':'lowItems', 'value':'={{ JSON.stringify($json.lowItems) }}'},
    {'name':'addQty',   'value':'50'},
    {'name':'sessionId','value':'={{ $json.session_id }}'},
]))
link('AP2: Deteksi Stok Rendah','AP2: Smart Restock')

# Step 3: Finance signal
FINANCE_SIG_JS = """
const prev = $node['AP2: Deteksi Stok Rendah'].json;
const sim  = $node['AP1: Simulasi Penjualan'].json;
const est_cost = (prev.lowItems||[]).length * 50 * 50000;
return [{ json: {
  from_agent: 'Admin', to_agent: 'Finance', signal_type: 'AUTO_RESTOCK',
  data: JSON.stringify({ restock_count: (prev.lowItems||[]).length, quantity: 50, estimated_cost: est_cost }),
  session_id: prev.session_id, total_revenue: sim.total_revenue, estimated_cost: est_cost
}}];
""".strip()
add(code('AP3: Buat Finance Signal', 1440, AP_Y, FINANCE_SIG_JS))
link('AP2: Smart Restock','AP3: Buat Finance Signal')

add(http_post('AP3: Kirim Signal ke Python', 1680, AP_Y, f'{PY}/signal',[
    {'name':'from_agent',  'value':'Admin'},
    {'name':'to_agent',    'value':'finance'},
    {'name':'signal_type', 'value':'AUTO_RESTOCK'},
    {'name':'data',        'value':'={{ $json.data }}'},
    {'name':'sessionId',   'value':'={{ $json.session_id }}'},
]))
link('AP3: Buat Finance Signal','AP3: Kirim Signal ke Python')

add(http_patch('AP3: Update Budget Firebase', 1680, AP_Y+160, f'{FB_RTDB}/finance_metrics/remaining_budget.json?auth={FBAUTH}',[
    {'name':'last_expense','value':'={{ $node["AP3: Buat Finance Signal"].json.estimated_cost }}'},
    {'name':'updatedAt',   'value':'={{ new Date().toISOString() }}'},
]))
link('AP3: Buat Finance Signal','AP3: Update Budget Firebase')

# Step 4: Master report
REPORT_JS = """
const sig = $node['AP3: Buat Finance Signal'].json;
const sim = $node['AP1: Simulasi Penjualan'].json;
const units = (sim.items_sold||[]).reduce((s,i)=>s+i.sold,0);
const health = sig.estimated_cost < 5000000 ? 'OK' : 'BUDGET_INSUFFICIENT';
const ts = new Date().toISOString();
return [{ json: {
  log: `${ts} | Sales: ${units} units | Restocked: ${sig.data ? JSON.parse(sig.data).restock_count : 0} Items | Total Expense: Rp ${sig.estimated_cost?.toLocaleString()} | System Health: ${health}`,
  health, session_id: sig.session_id
}}];
""".strip()
add(code('AP4: Master Report', 1920, AP_Y, REPORT_JS))
link('AP3: Kirim Signal ke Python','AP4: Master Report')

add(http_post('AP4: Tulis Autopilot Log', 2160, AP_Y, f'{PY}/log-activity',[
    {'name':'agent',    'value':'autopilot_master'},
    {'name':'result',   'value':'={{ $json.log }}'},
    {'name':'sessionId','value':'={{ $json.session_id }}'},
]))
link('AP4: Master Report','AP4: Tulis Autopilot Log')

# ─────────────────────────────────────────────────────────────────────────────
wf = {
    'name': 'FusionNeural — CORE ORCHESTRATOR v4',
    'nodes': nodes,
    'connections': conns,
    'settings': {'executionOrder':'v1'},
    'pinData':{}
}

with open(OUT,'w',encoding='utf-8') as f:
    json.dump(wf,f,ensure_ascii=False,indent=2)

all_names = {n['name'] for n in nodes}
connected_tgt = set()
for v in conns.values():
    for out in v['main']:
        for e in out: connected_tgt.add(e['node'])
orphans = all_names - connected_tgt - {'Pintu Webhook','Jadwal 60 Menit'}

print(f'DONE — {len(nodes)} nodes | {os.path.getsize(OUT):,} bytes')
if orphans: print(f'WARNING orphans: {orphans}')
else: print('OK: Semua node terhubung')
