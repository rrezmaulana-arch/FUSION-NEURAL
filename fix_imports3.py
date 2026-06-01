import os

base_dir = r"c:\Olivia\FUSION NEURAL\frontend\src\components\pixel-office"

def replace_constants(file_path, correct_import):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # replace all variants of constants imports
    import re
    content = re.sub(r"from '\.?\.\/?(\.\.\/)*constants'", f"from '{correct_import}'", content)
    content = re.sub(r"from '\.?\.\/?(\.\.\/)*constants\.js'", f"from '{correct_import}'", content)
    content = re.sub(r"from '\.?\.\/?(\.\.\/)*types'", f"from '{correct_import.replace('constants', 'types')}'", content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

for root, _, files in os.walk(base_dir):
    for file in files:
        if not file.endswith('.ts') and not file.endswith('.tsx'):
            continue
        path = os.path.join(root, file)
        rel_depth = os.path.relpath(root, base_dir).count(os.sep)
        
        correct = "'./constants'" if rel_depth == 0 else "'" + "../" * rel_depth + "constants'"
        replace_constants(path, correct)

print("Fixed imports 3")
