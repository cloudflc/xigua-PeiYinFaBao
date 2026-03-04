# 脚本转配音发包模板工具

一个基于 CloudBase 的网页应用，用于将脚本文件转换为配音发包模板格式。

## 功能特点

- 📁 支持上传 .docx 格式的脚本文件
- 🎭 自动分析脚本中的角色列表
- ✅ 默认选中常用角色（小八、孙小弟、胖达、妮可、旁白）
- 📋 生成标准的配音发包模板
- 🔄 自动去除对话中的括号内容
- 💾 支持下载生成的模板文件

## 技术栈

- **前端**：HTML5, CSS3, JavaScript
- **后端**：CloudBase 云函数
- **存储**：CloudBase 存储
- **认证**：CloudBase 匿名认证

## 目录结构

```
├── index.html          # 主页面
├── style.css           # 样式文件
├── script.js           # 前端逻辑
├── functions/          # CloudBase 云函数
│   ├── analyzeScript/  # 分析脚本文件
│   ├── generateTemplate/ # 生成模板
│   ├── package.json    # 依赖配置
│   └── config.json     # 云函数配置
└── README.md           # 说明文档
```

## 部署步骤

### 1. 准备 CloudBase 环境

1. 登录 [CloudBase 控制台](https://console.cloud.tencent.com/tcb)
2. 创建新的环境
3. 启用 **存储** 和 **云函数** 服务
4. 在存储中创建以下目录：
   - `scripts/` - 用于存储上传的脚本文件
   - `templates/` - 用于存储生成的模板文件

### 2. 部署云函数

1. 安装 CloudBase CLI：
   ```bash
   npm install -g @cloudbase/cli
   ```

2. 登录 CloudBase：
   ```bash
   tcb login
   ```

3. 进入 functions 目录并安装依赖：
   ```bash
   cd functions
   npm install
   ```

4. 部署云函数：
   ```bash
   tcb functions:deploy analyzeScript generateTemplate
   ```

### 3. 配置前端

1. 打开 `script.js` 文件
2. 将 `your-cloudbase-env` 替换为你的 CloudBase 环境 ID

### 4. 部署静态网站

1. 在 CloudBase 控制台中，进入 **静态网站** 服务
2. 启用静态网站
3. 上传 `index.html`、`style.css` 和 `script.js` 文件
4. 复制网站访问地址

## 使用方法

1. 打开部署好的网站
2. 点击或拖拽上传脚本文件
3. 等待系统分析脚本并显示角色列表
4. 选择需要配音的角色（默认已选中常用角色）
5. 点击「生成并下载模板」按钮
6. 保存生成的配音发包模板文件

## 注意事项

- 仅支持 .docx 格式的脚本文件
- 脚本文件中的角色格式应为：`角色名(位置):` 或 `角色名:`
- 对话内容会自动去除括号内的描述性文字
- 生成的模板包含完整的角色说明和标准表格格式

## 开发说明

### 云函数依赖

- `@cloudbase/node-sdk` - CloudBase  Node.js SDK
- `docx` - 处理 Word 文档

### 前端依赖

- CloudBase JavaScript SDK（通过 CDN 引入）

## 故障排除

- **上传失败**：检查文件格式是否为 .docx
- **分析失败**：检查脚本文件格式是否正确
- **生成失败**：检查 CloudBase 云函数配置和权限

## 许可证

MIT