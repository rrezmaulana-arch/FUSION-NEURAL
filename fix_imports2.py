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
            
        # Add import { ColorValue } from types
        if 'ColorValue' in content and not 'interface ColorValue' in content and not 'import { ColorValue }' in content and not 'import type { ColorValue }' in content:
            rel_depth = os.path.relpath(root, base_dir).count(os.sep)
            if rel_depth == 0:
                content = "import type { ColorValue } from './types';\n" + content
            elif rel_depth == 1:
                content = "import type { ColorValue } from '../types';\n" + content
            elif rel_depth == 2:
                content = "import type { ColorValue } from '../../types';\n" + content

        # Fix constants import path
        rel_depth = os.path.relpath(root, base_dir).count(os.sep)
        
        # Replace all variants of ../constants with the correct one
        correct_constants = "'./constants'" if rel_depth == 0 else "'" + "../" * rel_depth + "constants'"
        content = re.sub(r'\'(\.\./)+constants\'', correct_constants, content)
        content = re.sub(r'\'(\.\./)+constants\.js\'', correct_constants, content)

        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)

print("Imports fixed 2.")
