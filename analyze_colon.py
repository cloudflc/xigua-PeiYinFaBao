from docx import Document

def analyze_script(file_path):
    doc = Document(file_path)
    print(f"=== {file_path} 冒号使用情况分析 ===")
    
    for i, para in enumerate(doc.paragraphs):
        text = para.text.strip()
        if not text:
            continue
        
        if '倩倩老师' in text:
            print(f"段落 {i}: {text}")
        
        if '：' in text or ':' in text:
            if text.endswith('：') or text.endswith(':'):
                print(f"段落 {i} [角色行]: {text}")
            else:
                parts = text.split('：') if '：' in text else text.split(':')
                if len(parts) > 1:
                    first_part = parts[0].strip()
                    if '（' not in first_part and '(' not in first_part:
                        print(f"段落 {i} [可能误判]: {text}")

analyze_script("音乐播放器-1.docx")
