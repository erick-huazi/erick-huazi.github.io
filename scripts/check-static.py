from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import hashlib, json

root = Path(__file__).resolve().parents[1]
dist = root / 'dist'
class Document(HTMLParser):
    def __init__(self):
        super().__init__(); self.ids=[]; self.refs=[]
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get('id'): self.ids.append(attrs['id'])
        for name in ['href','src','data-quick-href']:
            if attrs.get(name): self.refs.append(attrs[name])
        for item in attrs.get('srcset','').split(','):
            if item.strip(): self.refs.append(item.strip().split()[0])
for name in ['index.html','references.html','404.html','references/index.html']:
    source=(dist/name).read_text(encoding='utf-8')
    assert 'huazi-ai-studio.erickzhang09.chatgpt.site' not in source
    page=Document();page.feed(source)
    assert len(page.ids)==len(set(page.ids)), 'Duplicate IDs in '+name
    for ref in page.refs:
        url=urlsplit(ref)
        if url.scheme or url.netloc or not url.path: continue
        target = dist/unquote(url.path).lstrip('/') if url.path.startswith('/') else (dist/name).parent/unquote(url.path)
        if target.is_dir(): target = target/'index.html'
        assert target.resolve().is_relative_to(dist.resolve()), 'Local asset leaves dist: '+ref
        assert target.is_file(), 'Missing local asset: '+ref
data=json.loads((root/'src/reference-library.json').read_text(encoding='utf-8'))
assert len(data['cases'])==9 and len(data['learning'])==3
template=(dist/'assets/fde-project-brief.txt').read_text(encoding='utf-8')
assert all(item['links'][0][1] in template for item in data['learning']+data['cases'])
assert 'https://erick-huazi.github.io/references.html' in template
assert hashlib.sha256((dist/'assets/wechat-qr.jpg').read_bytes()).hexdigest()=='b0d68c789121c3d57b8240a40096b801208ca391abd11a6adb02b3eb38cdfb2f'
assert not (root/'.openai').exists(), 'Platform settings must stay out of the public copy'
print('Static resources, attribution, GitHub URLs and original QR verified.')
