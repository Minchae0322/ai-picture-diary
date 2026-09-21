import pathlib, yaml, sys
root = pathlib.Path(sys.argv[1] if len(sys.argv)>1 else '.')
bad=[]; n=0
for f in sorted(root.rglob('SKILL.md')):
    if 'project-skill' in str(f) and 'templates' in str(f): continue
    n+=1; t=f.read_text()
    try:
        d=yaml.safe_load(t.split('---')[1])
        if d.get('name')!=f.parent.name: bad.append((str(f), f"name 불일치: {d.get('name')}"))
        if not d.get('description'): bad.append((str(f),'description 없음'))
    except Exception as e: bad.append((str(f), f"YAML: {str(e)[:70]}"))
print(f"검사 {n}개 | 문제 {len(bad)}개")
for a,b in bad: print("  ",a,b)
