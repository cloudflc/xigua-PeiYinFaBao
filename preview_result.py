from docx import Document

def read_template(file_path):
    doc = Document(file_path)
    table = doc.tables[0]
    
    print(f"=== {file_path} 转换结果预览 ===")
    print(f"{'序号':<6}{'角色':<15}{'位置':<10}{'台词':<50}")
    print("=" * 80)
    
    for i, row in enumerate(table.rows):
        if i == 0:
            continue
        cells = [cell.text for cell in row.cells]
        seq = cells[0]
        role = cells[1]
        content = cells[2]
        position = cells[3]
        
        content_preview = content[:47] + "..." if len(content) > 47 else content
        print(f"{seq:<6}{role:<15}{position:<10}{content_preview:<50}")
        if i > 10:
            print(f"... (共 {len(table.rows)-1} 条对话)")
            break

read_template("音乐播放器-1_配音发包模板.docx")
