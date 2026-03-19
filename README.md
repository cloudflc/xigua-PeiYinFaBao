# 脚本转配音发包模板工具

一个将脚本文件转换为配音发包模板的在线工具。

## 功能特点

- 📁 支持上传 .docx 和 .txt 格式的脚本文件
- 🎭 自动分析脚本中的说话人列表
- 🔄 两步选择：先选择所有说话人，再选择需要保留的说话人
- ✨ 自动过滤标题、装饰线和括号内容
- 📝 保留台词中的换行格式
- 💾 生成标准的配音发包模板（Word文档）

## 技术栈

- **前端**：HTML5, CSS3, JavaScript
- **后端**：Node.js + Express
- **文档处理**：mammoth (docx读取), docx (Word生成)

## 目录结构

```
├── index.html          # 主页面
├── style.css           # 样式文件
├── server.js           # Express后端服务
├── package.json        # Node.js依赖配置
└── README.md          # 说明文档
```

## 本地运行

```bash
# 安装依赖
npm install

# 启动服务
npm start
# 或
node server.js
```

服务启动后访问 http://localhost:8888

## 部署到 Render

1. 将代码推送到 GitHub
2. 访问 https://dashboard.render.com
3. 创建 Web Service，连接 GitHub 仓库
4. 设置：
   - Build Command: `npm install`
   - Start Command: `node server.js`
5. 部署完成后获得公开访问链接

## 使用方法

1. 上传脚本文件（.docx 或 .txt）
2. 选择所有识别出的说话人
3. 选择需要保留台词的说话人（取消勾选不需要的）
4. 点击确认并生成
5. 下载生成的配音发包模板

## 脚本格式示例

```
倩倩老师：你好呀！
孙小鼠：倩倩老师好！
我们的任务是：今天要学习新知识
胖达：太好了！
小八：我也想学！
```

## 注意事项

- 说话人格式：`说话人:` 或 `说话人：`
- 括号内容会自动从说话人名称中移除（如 "孙小鼠(PPT)" → "孙小鼠"）
- 装饰线格式会被跳过（如 `---内容---`）
- docx文件中的标题样式会被识别并跳过

## 许可证

MIT
