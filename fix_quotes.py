import os

base_dir = r"c:\Olivia\FUSION NEURAL\frontend\src\components\pixel-office"

for root, _, files in os.walk(base_dir):
    for file in files:
        if not file.endswith('.ts') and not file.endswith('.tsx'):
            continue
        path = os.path.join(root, file)
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # fix double quotes
        content = content.replace("from ''", "from '")
        content = content.replace("''", "'")
        
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)

print("Fixed double quotes")
