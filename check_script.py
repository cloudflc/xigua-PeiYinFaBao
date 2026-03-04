from docx import Document

def read_docx_detailed(file_path):
    doc = Document(file_path)
    print(f"=== {file_path} 详细内容 ===")
    for i, para in enumerate(doc.paragraphs):
        if para.text.strip():
            print(f"段落 {i}: [{para.text.strip()}]")
    print()

read_docx_detailed("音乐播放器-1.docx")
