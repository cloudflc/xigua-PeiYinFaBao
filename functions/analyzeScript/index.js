// analyzeScript 云函数
// 分析脚本文件并提取角色列表
const tcb = require('@cloudbase/node-sdk');
const app = tcb.init({ env: process.env.TCB_ENV });
const fs = require('fs');
const path = require('path');
const { Document } = require('docx');

exports.main = async (event, context) => {
    try {
        const { fileID } = event;
        
        // 下载文件到本地
        const result = await app.storage().downloadFile({ fileID });
        const filePath = path.join('/tmp', `script_${Date.now()}.docx`);
        fs.writeFileSync(filePath, result.fileContent);
        
        // 分析文档
        const doc = new Document(filePath);
        const roles = new Set();
        
        // 解析角色
        const rolePattern = /^([^(]+)(?:\(([^)]+)\))?[:：]$/;
        
        for (const para of doc.paragraphs) {
            const text = para.text.trim();
            if (!text) continue;
            
            const match = rolePattern.test(text);
            if (match) {
                const roleMatch = text.match(rolePattern);
                if (roleMatch) {
                    const role = roleMatch[1].trim();
                    roles.add(role);
                }
            }
        }
        
        // 清理临时文件
        fs.unlinkSync(filePath);
        
        return {
            roles: Array.from(roles).sort()
        };
    } catch (error) {
        console.error('分析脚本失败:', error);
        return {
            error: error.message
        };
    }
};