import os
import codecs

src_dir = r"c:\Users\princ\Downloads\College-Library-master\College-Library-master\library\src\main\java"

for root, dirs, files in os.walk(src_dir):
    for f in files:
        if f.endswith('.java'):
            path = os.path.join(root, f)
            with open(path, 'rb') as file:
                content = file.read()
            
            modified = False
            
            if content.startswith(codecs.BOM_UTF8):
                content = content[len(codecs.BOM_UTF8):]
                modified = True
                
            text = content.decode('utf-8')
            
            # Check if it's in dto and needs @Data
            if '\\dto\\' in path or '/dto/' in path:
                if 'public class' in text and '@Data' not in text:
                    lines = text.split('\n')
                    for i, line in enumerate(lines):
                        if line.startswith('public class'):
                            lines.insert(i, '@Data')
                            for j, l in enumerate(lines):
                                if l.startswith('package '):
                                    lines.insert(j+1, '\nimport lombok.Data;\n')
                                    break
                            break
                    text = '\n'.join(lines)
                    content = text.encode('utf-8')
                    modified = True
            
            if modified:
                with open(path, 'wb') as file:
                    file.write(content)
                print(f"Fixed {f}")
