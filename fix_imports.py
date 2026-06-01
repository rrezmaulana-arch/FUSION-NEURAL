import os
import re

base_dir = r"c:\Olivia\FUSION NEURAL\frontend\src\components\pixel-office"

for root, _, files in os.walk(base_dir):
    for file in files:
        if not file.endswith('.ts') and not file.endswith('.tsx'):
            continue
            
        path = os.path.join(root, file)
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Replace .js extensions in imports with .ts or remove them
        content = re.sub(r'from\s+[\'"](.+?)\.js[\'"]', r"from '\1'", content)
        
        # Fix constants import path depending on depth
        rel_depth = os.path.relpath(root, base_dir).count(os.sep)
        if rel_depth == 0:
            content = content.replace("'../constants'", "'./constants'")
        elif rel_depth == 1:
            content = content.replace("'../../constants'", "'../constants'")
        elif rel_depth == 2:
            content = content.replace("'../../../constants'", "'../../constants'")
            
        # Remove ColorValue import from UI
        content = re.sub(r'import type \{ ColorValue \} from .*components/ui/types.*;', '', content)
        # Export ColorValue from types.ts
        if file == 'types.ts':
            content = content.replace('export type { ColorValue }', '// ')
            content += '\nexport interface ColorValue { h: number; s: number; b: number; c: number; }\n'
            
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)

print("Imports fixed.")
