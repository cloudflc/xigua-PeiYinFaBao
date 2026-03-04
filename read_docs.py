from docx import Document

def read_docx(file_path):
    doc = Document(file_path)
    content = []
    for para in doc.paragraphs:
        if para.text.strip():
            content.append(para.text)
    return '\n'.join(content)

print("=== 配音发包模板.docx 内容 ===")
template_content = read_docx("配音发包模板.docx")
print(template_content)
print("\n" + "="*50 + "\n")

print("=== 音乐播放器-1.docx 内容 ===")
script_content = read_docx("音乐播放器-1.docx")
print(script_content)
