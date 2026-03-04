// generateTemplate 云函数
// 生成配音发包模板
const tcb = require('@cloudbase/node-sdk');
const app = tcb.init({ env: process.env.TCB_ENV });
const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun } = require('docx');
const { AlignmentType, TableLayoutType, WidthType } = require('docx');

exports.main = async (event, context) => {
    try {
        const { fileID, roles } = event;
        
        // 下载文件到本地
        const result = await app.storage().downloadFile({ fileID });
        const filePath = path.join('/tmp', `script_${Date.now()}.docx`);
        fs.writeFileSync(filePath, result.fileContent);
        
        // 分析文档
        const doc = new Document(filePath);
        const dialogues = [];
        
        let currentRole = null;
        let currentContent = [];
        
        // 解析对话
        const rolePattern = /^([^(]+)(?:\(([^)]+)\))?[:：]$/;
        
        for (const para of doc.paragraphs) {
            const text = para.text.trim();
            if (!text) continue;
            
            const match = rolePattern.test(text);
            if (match) {
                if (currentRole && currentContent.length > 0) {
                    const content = currentContent.join('\n').trim();
                    // 移除括号内容
                    const cleanedContent = content.replace(/[（\(][^）\)]*[）\)]/g, '').trim();
                    if (cleanedContent) {
                        dialogues.push({
                            role: currentRole,
                            content: cleanedContent
                        });
                    }
                }
                
                const roleMatch = text.match(rolePattern);
                if (roleMatch) {
                    currentRole = roleMatch[1].trim();
                    currentContent = [];
                }
            } else if (currentRole) {
                currentContent.push(text);
            }
        }
        
        // 处理最后一段对话
        if (currentRole && currentContent.length > 0) {
            const content = currentContent.join('\n').trim();
            const cleanedContent = content.replace(/[（\(][^）\)]*[）\)]/g, '').trim();
            if (cleanedContent) {
                dialogues.push({
                    role: currentRole,
                    content: cleanedContent
                });
            }
        }
        
        // 过滤角色
        const filteredDialogues = dialogues.filter(d => roles.includes(d.role));
        
        // 创建新文档
        const templateDoc = new Document({
            sections: [{
                properties: {},
                children: [
                    // 标题
                    new Paragraph({
                        text: '西瓜创客配音Python需求单',
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({ text: '西瓜创客配音Python需求单', bold: true, size: 32 })
                        ]
                    }),
                    
                    // 时间
                    new Paragraph({
                        text: `时间 ${new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}`,
                        spacing: { after: 200 }
                    }),
                    
                    // 说明
                    new Paragraph({ text: '写在前面，开始录制前务必仔细阅读#' }),
                    new Paragraph({
                        text: '西瓜创客是一家在线少儿编程教育公司，用户对象为6-12岁小朋友，课程是以视频的形式在线上进行学习，本次配音是用于课程中的角色，需要保证声音塑造符合用户年龄层次，配音需要符合对应人物性别和性格特征。',
                        spacing: { after: 150 }
                    }),
                    
                    new Paragraph({ text: '版权及保密' }),
                    new Paragraph({
                        text: '凡牵涉甲方的所有文档、音视频文件、图片素材均需要保密，未经甲方授权，不可透露无关人员',
                        spacing: { after: 150 }
                    }),
                    
                    new Paragraph({ text: '角色说明' }),
                    
                    // 角色描述
                    ...generateRoleDescriptions(roles),
                    
                    // 表格
                    new Table({
                        layout: TableLayoutType.FIXED,
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({
                                        children: [new Paragraph({ text: '人物', alignment: AlignmentType.CENTER, bold: true })]
                                    }),
                                    new TableCell({
                                        children: [new Paragraph({ text: '台词', alignment: AlignmentType.CENTER, bold: true })]
                                    }),
                                    new TableCell({
                                        children: [new Paragraph({ text: '备注', alignment: AlignmentType.CENTER, bold: true })]
                                    })
                                ]
                            }),
                            ...filteredDialogues.map((dialogue, index) => new TableRow({
                                children: [
                                    new TableCell({
                                        children: [new Paragraph({ text: dialogue.role, alignment: AlignmentType.CENTER })]
                                    }),
                                    new TableCell({
                                        children: [new Paragraph({ text: dialogue.content })]
                                    }),
                                    new TableCell({
                                        children: [new Paragraph({ text: '' })]
                                    })
                                ]
                            }))
                        ]
                    })
                ]
            }]
        });
        
        // 生成文档
        const buffer = await Packer.toBuffer(templateDoc);
        const outputPath = path.join('/tmp', `template_${Date.now()}.docx`);
        fs.writeFileSync(outputPath, buffer);
        
        // 上传到存储
        const templateFileID = await app.storage().uploadFile({
            cloudPath: `templates/${Date.now()}_配音发包模板.docx`,
            fileContent: fs.createReadStream(outputPath)
        });
        
        // 清理临时文件
        fs.unlinkSync(filePath);
        fs.unlinkSync(outputPath);
        
        return {
            fileID: templateFileID.fileID
        };
    } catch (error) {
        console.error('生成模板失败:', error);
        return {
            error: error.message
        };
    }
};

// 生成角色描述
function generateRoleDescriptions(roles) {
    const roleDescriptions = {
        '孙小弟': '——正派\n男，心理年龄相当于人类的 5 / 6 岁。古腾堡学院的学员，活泼，可爱，淘气， 充满好奇心，喜欢捣乱，喜欢用调皮的招式对付敌人。去「飞船捣乱」就是他的主意。',
        '妮可': '——正派\n女性，古腾堡学院的学生，孙小弟的小伙伴之一。实际年龄相当于人类的 8 岁。聪明伶俐，性格外向，有着女孩子特有的温柔，善于思考和发现问题。非常爱美，怕脏。会一定魔法（但遇到事情时几乎不起作用）。',
        '小八': '孙小弟的小伙伴之一，一个拥有超级AI的小机器人，其人格对应的年龄为 5 岁左右。古腾堡学院的吉祥物，是非观非常非常明确，能够准确地看到事情中不对的一面，对其他人进行劝阻（虽然通常无效，并且尝尝被逼无奈做自己认为不对的事情）。有着超乎想象的知识储备量，是走动的百科全书。有人类的情感，喜欢夸奖，喜欢被摸头，讨厌一个人相处，讨厌被说自己没用，对妮可的魔法非常好奇。',
        '胖达': '——正派\n孙小弟的小伙伴之一，男，相当于年龄7岁。古腾堡学院的学生。贪吃，喜欢吃各种好吃的食物，听见食物就会流口水，看见食物就会不受控制地去吃。善良而单纯。讨厌运动，喜欢捯饬修理各种机器，但水平不高，修好一个毛病的同时，会造成一个新的毛病。'
    };
    
    const paragraphs = [];
    
    roles.forEach(role => {
        if (roleDescriptions[role]) {
            paragraphs.push(new Paragraph({ text: role, bold: true }));
            paragraphs.push(new Paragraph({ text: roleDescriptions[role], spacing: { after: 100 } }));
        }
    });
    
    return paragraphs;
}