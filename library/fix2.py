import os

src_dir = r"c:\Users\princ\Downloads\College-Library-master\College-Library-master\library\src\main\java"

for root, dirs, files in os.walk(src_dir):
    for f in files:
        if f.endswith('.java'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as file:
                text = file.read()
            
            modified = False
            lines = text.split('\n')
            
            if '@Service' in text or '@RestController' in text:
                if '@RequiredArgsConstructor' not in text:
                    for i, line in enumerate(lines):
                        if line.startswith('public class'):
                            lines.insert(i, '@RequiredArgsConstructor')
                            modified = True
                            break
                    if modified and 'lombok.RequiredArgsConstructor' not in text:
                        for j, l in enumerate(lines):
                            if l.startswith('package '):
                                lines.insert(j+1, '\nimport lombok.RequiredArgsConstructor;\n')
                                break

            if '\\entity\\' in path or '/entity/' in path or '\\dto\\' in path or '/dto/' in path:
                if 'public class' in text:
                    added_annotations = []
                    if '@Builder' not in text: added_annotations.append('@Builder')
                    if '@NoArgsConstructor' not in text: added_annotations.append('@NoArgsConstructor')
                    if '@AllArgsConstructor' not in text: added_annotations.append('@AllArgsConstructor')
                    
                    if added_annotations:
                        for i, line in enumerate(lines):
                            if line.startswith('public class'):
                                for ann in reversed(added_annotations):
                                    lines.insert(i, ann)
                                modified = True
                                break
                        if modified:
                            imports = []
                            if '@Builder' in added_annotations and 'lombok.Builder' not in text: imports.append('import lombok.Builder;')
                            if '@NoArgsConstructor' in added_annotations and 'lombok.NoArgsConstructor' not in text: imports.append('import lombok.NoArgsConstructor;')
                            if '@AllArgsConstructor' in added_annotations and 'lombok.AllArgsConstructor' not in text: imports.append('import lombok.AllArgsConstructor;')
                            if imports:
                                for j, l in enumerate(lines):
                                    if l.startswith('package '):
                                        lines.insert(j+1, '\n' + '\n'.join(imports) + '\n')
                                        break
            
            if modified:
                with open(path, 'w', encoding='utf-8') as file:
                    file.write('\n'.join(lines))
                print(f"Fixed {f}")
