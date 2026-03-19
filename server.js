const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun } = require('docx');
const { AlignmentType, TableLayoutType, WidthType } = require('docx');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const PORT = 8888;

if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

app.post('/api/analyze', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '没有上传文件' });
        }

        const fileName = req.file.originalname.toLowerCase();
        let text;
        let headings = new Set();

        if (fileName.endsWith('.docx')) {
            const result = await mammoth.convertToHtml({ path: req.file.path });
            const html = result.value;
            const headingMatches = html.matchAll(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi);
            for (const match of headingMatches) {
                const headingText = match[1].replace(/<[^>]+>/g, '').trim();
                if (headingText) {
                    headings.add(headingText);
                }
            }
            const rawResult = await mammoth.extractRawText({ path: req.file.path });
            text = rawResult.value;
        } else if (fileName.endsWith('.txt')) {
            text = fs.readFileSync(req.file.path, 'utf-8');
        } else {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: '不支持的文件格式' });
        }

        const speakers = new Set();
        const lines = text.split('\n');
        
        function isDecorLine(text) {
            return /^[-=_*~]{3,}.*[-=_*~]{3,}$/.test(text);
        }

        function cleanContent(text) {
            return text.replace(/[（(][^）)]*[）)]/g, '').trim();
        }

        const speakerPattern = /^([^:：]+)[:：]\s*$/;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;
            
            if (isDecorLine(trimmedLine)) continue;
            
            if (headings.has(trimmedLine)) continue;
            
            const match = trimmedLine.match(speakerPattern);
            if (match) {
                let speaker = match[1].trim();
                speaker = speaker.replace(/[（(][^）)]*[）)]$/g, '').trim();
                if (speaker.length > 0 && speaker.length <= 20) {
                    speakers.add(speaker);
                }
            }
        }

        fs.unlinkSync(req.file.path);

        res.json({
            speakers: Array.from(speakers).sort()
        });
    } catch (error) {
        console.error('分析失败:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/generate', upload.single('file'), async (req, res) => {
    try {
        const { speakers, keepSpeakers } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ error: '没有上传文件' });
        }
        
        if (!speakers) {
            return res.status(400).json({ error: '没有选择说话人' });
        }
        
        const selectedSpeakers = JSON.parse(speakers);
        const selectedKeepSpeakers = keepSpeakers ? JSON.parse(keepSpeakers) : [];
        
        const fileName = req.file.originalname.toLowerCase();
        let text;
        let headings = new Set();

        if (fileName.endsWith('.docx')) {
            const result = await mammoth.convertToHtml({ path: req.file.path });
            const html = result.value;
            const headingMatches = html.matchAll(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi);
            for (const match of headingMatches) {
                const headingText = match[1].replace(/<[^>]+>/g, '').trim();
                if (headingText) {
                    headings.add(headingText);
                }
            }
            const rawResult = await mammoth.extractRawText({ path: req.file.path });
            text = rawResult.value;
        } else if (fileName.endsWith('.txt')) {
            text = fs.readFileSync(req.file.path, 'utf-8');
        } else {
            return res.status(400).json({ error: '不支持的文件格式' });
        }

        function isDecorLine(text) {
            return /^[-=_*~]{3,}.*[-=_*~]{3,}$/.test(text);
        }

        function cleanSpeakerName(name) {
            return name.replace(/[（(][^）)]*[）)]$/g, '').trim();
        }

        const dialogues = [];
        const lines = text.split('\n');
        
        let currentSpeaker = null;
        let currentContent = [];
        
        const speakerPattern = /^([^:：]+)[:：]\s*$/;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;
            
            if (isDecorLine(trimmedLine)) continue;
            
            if (headings.has(trimmedLine)) continue;
            
            const match = trimmedLine.match(speakerPattern);
            if (match) {
                let potentialSpeaker = match[1].trim();
                potentialSpeaker = cleanSpeakerName(potentialSpeaker);
                
                if (!potentialSpeaker) continue;
                
                if (selectedSpeakers.includes(potentialSpeaker)) {
                    if (currentSpeaker && currentContent.length > 0) {
                        const content = currentContent.join('\n').trim();
                        if (content) {
                            dialogues.push({
                                speaker: currentSpeaker,
                                content: content
                            });
                        }
                    }
                    currentSpeaker = potentialSpeaker;
                    currentContent = [];
                } else {
                    if (currentSpeaker) {
                        currentContent.push(trimmedLine);
                    }
                }
            } else if (currentSpeaker && trimmedLine) {
                currentContent.push(trimmedLine);
            }
        }
        
        if (currentSpeaker && currentContent.length > 0) {
            const content = currentContent.join('\n').trim();
            if (content) {
                dialogues.push({
                    speaker: currentSpeaker,
                    content: content
                });
            }
        }
        
        console.log('选择的说话人:', selectedSpeakers);
        console.log('保留的说话人:', selectedKeepSpeakers);
        console.log('解析到的对话数量:', dialogues.length);
        
        for (const dialogue of dialogues) {
            console.log(`对话: [${dialogue.speaker}]`);
            console.log(`  内容: ${dialogue.content.substring(0, 30)}...`);
        }
        
        const filteredDialogues = dialogues.filter(d => selectedKeepSpeakers.includes(d.speaker));
        
        function cleanContent(text) {
            return text.replace(/[（(][^）)]*[）)]/g, '').trim();
        }
        
        filteredDialogues.forEach(d => {
            d.content = cleanContent(d.content);
        });
        
        console.log('过滤后的对话数量:', filteredDialogues.length);
        
        const roleDescriptions = {
            '孙小弟': '——正派\n男，心理年龄相当于人类的 5 / 6 岁。古腾堡学院的学员，活泼，可爱，淘气， 充满好奇心，喜欢捣乱，喜欢用调皮的招式对付敌人。去「飞船捣乱」就是他的主意。',
            '妮可': '——正派\n女性，古腾堡学院的学生，孙小弟的小伙伴之一。实际年龄相当于人类的 8 岁。聪明伶俐，性格外向，有着女孩子特有的温柔，善于思考和发现问题。非常爱美，怕脏。会一定魔法（但遇到事情时几乎不起作用）。',
            '小八': '孙小弟的小伙伴之一，一个拥有超级AI的小机器人，其人格对应的年龄为 5 岁左右。古腾堡学院的吉祥物，是非观非常非常明确，能够准确地看到事情中不对的一面，对其他人进行劝阻（虽然通常无效，并且尝尝被逼无奈做自己认为不对的事情）。有着超乎想象的知识储备量，是走动的百科全书。有人类的情感，喜欢夸奖，喜欢被摸头，讨厌一个人相处，讨厌被说自己没用，对妮可的魔法非常好奇。',
            '胖达': '——正派\n孙小弟的小伙伴之一，男，相当于年龄7岁。古腾堡学院的学生。贪吃，喜欢吃各种好吃的食物，听见食物就会流口水，看见食物就会不受控制地去吃。善良而单纯。讨厌运动，喜欢捯饬修理各种机器，但水平不高，修好一个毛病的同时，会造成一个新的毛病。'
        };

        const children = [];

        children.push(new Paragraph({
            text: '西瓜创客配音Python需求单',
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: '西瓜创客配音Python需求单', bold: true, size: 32 })]
        }));
        
        children.push(new Paragraph({
            text: `时间 ${new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}`,
            spacing: { after: 200 }
        }));
        
        children.push(new Paragraph({ text: '写在前面，开始录制前务必仔细阅读#' }));
        children.push(new Paragraph({
            text: '西瓜创客是一家在线少儿编程教育公司，用户对象为6-12岁小朋友，课程是以视频的形式在线上进行学习，本次配音是用于课程中的角色，需要保证声音塑造符合用户年龄层次，配音需要符合对应人物性别和性格特征。',
            spacing: { after: 150 }
        }));
        
        children.push(new Paragraph({ text: '版权及保密' }));
        children.push(new Paragraph({
            text: '凡牵涉甲方的所有文档、音视频文件、图片素材均需要保密，未经甲方授权，不可透露无关人员',
            spacing: { after: 150 }
        }));
        
        children.push(new Paragraph({ text: '角色说明' }));
        
        selectedKeepSpeakers.forEach(speaker => {
            if (roleDescriptions[speaker]) {
                children.push(new Paragraph({ text: speaker, bold: true }));
                children.push(new Paragraph({ text: roleDescriptions[speaker], spacing: { after: 100 } }));
            }
        });

        if (filteredDialogues.length > 0) {
            children.push(new Table({
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
                    ...filteredDialogues.map(dialogue => new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph({ text: dialogue.speaker, alignment: AlignmentType.CENTER })]
                            }),
                            new TableCell({
                                children: dialogue.content.split('\n').map(line => 
                                    new Paragraph({ text: line, spacing: { after: 100 } })
                                )
                            }),
                            new TableCell({
                                children: [new Paragraph({ text: '' })]
                            })
                        ]
                    }))
                ]
            }));
        }

        const templateDoc = new Document({
            sections: [{
                properties: {},
                children: children
            }]
        });
        
        const buffer = await Packer.toBuffer(templateDoc);
        const outputPath = path.join('uploads', `template_${Date.now()}.docx`);
        fs.writeFileSync(outputPath, buffer);
        
        fs.unlinkSync(req.file.path);
        
        res.download(outputPath, `配音发包模板_${Date.now()}.docx`, (err) => {
            if (err) {
                console.error('下载失败:', err);
            }
            if (fs.existsSync(outputPath)) {
                fs.unlinkSync(outputPath);
            }
        });
    } catch (error) {
        console.error('生成失败:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});
