# Project: FUSION NEURAL
# Created by: Miftah Afreza Maulana (rrez_.maulana)
# Role: Product Engineer (UI/UX & Full-Stack)
# Copyright (c) 2026. All rights reserved.
import re

with open('main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix CORS
content = content.replace('allow_origins=["*"]', 'allow_origins=["http://localhost:5173", "https://fusion-neural.vercel.app"]')

# 2. Add Auth imports
content = content.replace('from fastapi.middleware.cors import CORSMiddleware', 
'''from fastapi import Depends, Header
from fastapi.security import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware''')

# 3. Add Auth verification logic
auth_logic = '''
BACKEND_API_KEY = os.getenv("BACKEND_API_KEY", "")
api_key_header = APIKeyHeader(name="X-API-KEY", auto_error=False)

async def verify_api_key(api_key: str = Depends(api_key_header)):
    if not api_key or api_key != BACKEND_API_KEY:
        raise HTTPException(status_code=403, detail="Akses Ditolak: Invalid API Key")
    return api_key

# ── Configuration'''
content = content.replace('# ── Configuration', auth_logic)

# 4. Secure Endpoints
content = content.replace('async def get_business_logic():', 'async def get_business_logic(api_key: str = Depends(verify_api_key)):')
content = content.replace('async def update_business_logic(data: dict):', 'async def update_business_logic(data: dict, api_key: str = Depends(verify_api_key)):')
content = content.replace('async def trigger_agent(req: AgentRequest):', 'async def trigger_agent(req: AgentRequest, api_key: str = Depends(verify_api_key)):')
content = content.replace('async def log_activity(req: LogRequest):', 'async def log_activity(req: LogRequest, api_key: str = Depends(verify_api_key)):')
content = content.replace('async def search_supplier(req: SearchRequest):', 'async def search_supplier(req: SearchRequest, api_key: str = Depends(verify_api_key)):')

# 5. PII Masking
mask_func = '''
def mask_pii(text: str) -> str:
    # Mask phone numbers (10-13 digits)
    text = re.sub(r'\\b08\\d{8,11}\\b', '[PHONE REDACTED]', text)
    # Mask emails
    text = re.sub(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+', '[EMAIL REDACTED]', text)
    return text

async def log_to_sheets(agent: str, log_data: str, session_id: str):
    log_data = mask_pii(log_data)
'''
content = content.replace('async def log_to_sheets(agent: str, log_data: str, session_id: str):', mask_func)

# 6. Kill Switch
kill_switch_target = '    while True:\n        await asyncio.sleep(logic.get("business_hours", {}).get("active_interval_minutes", 10) * 60)'
kill_switch_code = '''    while True:
        await asyncio.sleep(logic.get("business_hours", {}).get("active_interval_minutes", 10) * 60)
        
        # Kill Switch Check
        kill_switch = await redis_get("fn:kill_switch")
        if kill_switch == "ON":
            print("[AutoLoop] 🚨 KILL SWITCH ACTIVE. Loop suspended.")
            continue'''
content = content.replace(kill_switch_target, kill_switch_code)

# 7. Remove duplicate log_to_signals
# The file has it duplicated twice. We'll use regex to remove the second block.
content = re.sub(r'(async def log_to_signals.*?except Exception as e:\n        print\(f"\[signals\] ❌ Error: \{e\}"\)\n\n).*?(async def log_to_signals)', r'\1\n', content, flags=re.DOTALL)

with open('main.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch applied successfully.")
