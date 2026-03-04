# 使用 Node.js 14 作为基础镜像
FROM node:14-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY functions/package.json functions/package-lock.json ./

# 安装依赖
RUN npm install

# 复制项目文件
COPY . .

# 设置环境变量
ENV NODE_ENV production

# 暴露端口（如果需要）
EXPOSE 3000

# 启动命令（这里只是一个示例，实际启动取决于 CloudBase 的配置）
CMD ["node", "functions/analyzeScript/index.js"]