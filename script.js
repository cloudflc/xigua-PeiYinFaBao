const app = tcb.init({
    env: 'your-cloudbase-env'
});

const auth = app.auth();
const storage = app.storage();
const functions = app.functions();

let uploadedFile = null;
let selectedRoles = [];

// 初始化
async function init() {
    try {
        await auth.signInAnonymously();
        console.log('匿名登录成功');
    } catch (error) {
        console.error('登录失败:', error);
        alert('初始化失败，请刷新页面重试');
    }
}

// 监听文件上传
document.getElementById('fileInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        alert('请上传 .docx 格式的文件');
        return;
    }
    
    showLoading();
    
    try {
        const fileID = await uploadFile(file);
        uploadedFile = { file, fileID };
        
        const roles = await analyzeFile(fileID);
        displayRoles(roles);
        
        document.querySelector('.roles-section').style.display = 'block';
    } catch (error) {
        console.error('上传失败:', error);
        alert('文件处理失败，请重试');
    } finally {
        hideLoading();
    }
});

// 上传文件到 CloudBase 存储
async function uploadFile(file) {
    const filename = `scripts/${Date.now()}_${file.name}`;
    const result = await storage.uploadFile({
        cloudPath: filename,
        fileContent: file
    });
    return result.fileID;
}

// 分析文件获取角色列表
async function analyzeFile(fileID) {
    const result = await functions.callFunction({
        name: 'analyzeScript',
        data: { fileID }
    });
    return result.result.roles;
}

// 显示角色列表
function displayRoles(roles) {
    const rolesList = document.getElementById('rolesList');
    rolesList.innerHTML = '';
    
    const defaultRoles = ['小八', '孙小弟', '胖达', '妮可', '旁白'];
    
    roles.forEach(role => {
        const roleItem = document.createElement('div');
        roleItem.className = 'role-item';
        
        const isDefault = defaultRoles.some(defaultRole => role.includes(defaultRole));
        
        roleItem.innerHTML = `
            <input type="checkbox" id="role-${role}" value="${role}" ${isDefault ? 'checked' : ''}>
            <label for="role-${role}">${role}</label>
        `;
        
        rolesList.appendChild(roleItem);
    });
    
    document.querySelector('.generate-section').style.display = 'block';
}

// 全选
document.getElementById('selectAllBtn').addEventListener('click', () => {
    document.querySelectorAll('.role-item input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = true;
    });
});

// 全不选
document.getElementById('deselectAllBtn').addEventListener('click', () => {
    document.querySelectorAll('.role-item input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
});

// 生成模板
document.getElementById('generateBtn').addEventListener('click', async () => {
    const selectedCheckboxes = document.querySelectorAll('.role-item input[type="checkbox"]:checked');
    selectedRoles = Array.from(selectedCheckboxes).map(cb => cb.value);
    
    if (selectedRoles.length === 0) {
        alert('请至少选择一个角色');
        return;
    }
    
    showLoading();
    
    try {
        const result = await functions.callFunction({
            name: 'generateTemplate',
            data: {
                fileID: uploadedFile.fileID,
                roles: selectedRoles
            }
        });
        
        const templateFileID = result.result.fileID;
        await downloadFile(templateFileID);
    } catch (error) {
        console.error('生成失败:', error);
        alert('生成模板失败，请重试');
    } finally {
        hideLoading();
    }
});

// 下载文件
async function downloadFile(fileID) {
    const url = await storage.getTempFileURL({ fileID });
    const link = document.createElement('a');
    link.href = url.tempFileURL;
    link.download = `配音发包模板_${Date.now()}.docx`;
    link.click();
}

// 显示加载
function showLoading() {
    document.getElementById('loading').style.display = 'flex';
}

// 隐藏加载
function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// 初始化
init();