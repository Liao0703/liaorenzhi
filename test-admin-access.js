// Admin访问测试脚本
// 在浏览器控制台中运行此脚本来测试admin功能

console.log('🧪 开始Admin访问测试...');

// 测试函数：检查当前登录状态
function checkCurrentLoginStatus() {
    console.log('\n=== 当前登录状态检查 ===');
    
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('learning_user');
    
    console.log('Token存在:', !!token);
    console.log('用户数据存在:', !!user);
    
    if (user) {
        try {
            const userData = JSON.parse(user);
            console.log('当前用户:', userData);
            console.log('用户角色:', userData.role);
            console.log('是否为admin:', userData.role === 'admin');
        } catch (e) {
            console.error('解析用户数据失败:', e);
        }
    }
}

// 测试函数：模拟admin登录
async function testAdminLogin() {
    console.log('\n=== 测试Admin登录 ===');
    
    try {
        // 获取API基础URL
        const getApiUrl = () => {
            const hostname = window.location.hostname;
            if (hostname === '116.62.65.246' || 
                hostname === 'www.liaorenzhi.top' || 
                hostname === 'liaorenzhi.top' ||
                hostname.includes('vercel.app')) {
                return 'http://116.62.65.246:3001';
            }
            return 'http://localhost:3001';
        };

        const response = await fetch(`${getApiUrl()}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'admin',
                password: '123456'
            })
        });

        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Admin登录成功!');
            console.log('用户信息:', data.user);
            console.log('Token:', data.token);
            
            // 保存到本地存储
            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('learning_user', JSON.stringify(data.user));
            
            console.log('💾 已保存登录信息');
            
            // 验证保存的数据
            setTimeout(() => {
                checkCurrentLoginStatus();
                console.log('\n🔄 建议刷新页面以查看admin功能');
            }, 500);
            
        } else {
            console.error('❌ Admin登录失败:', data.error);
        }
    } catch (error) {
        console.error('🔥 登录请求失败:', error);
    }
}

// 测试函数：检查admin路由访问
function testAdminRouteAccess() {
    console.log('\n=== 测试Admin路由访问 ===');
    
    const user = localStorage.getItem('learning_user');
    if (!user) {
        console.log('❌ 无用户登录，无法测试路由访问');
        return;
    }
    
    try {
        const userData = JSON.parse(user);
        console.log('当前用户角色:', userData.role);
        
        if (userData.role === 'admin') {
            console.log('✅ 用户具有admin权限');
            console.log('可访问路由:');
            console.log('  - /admin (管理后台)');
            console.log('  - /maintenance-admin (维护管理)');
            console.log('  - /dashboard (普通功能)');
            
            // 测试跳转到admin页面
            if (window.location.pathname !== '/admin') {
                console.log('\n🔗 可以尝试访问: ' + window.location.origin + '/admin');
            }
        } else {
            console.log('❌ 用户不具有admin权限，当前角色:', userData.role);
        }
    } catch (e) {
        console.error('❌ 解析用户数据失败:', e);
    }
}

// 测试函数：强制设置admin角色（临时解决方案）
function forceSetAdminRole() {
    console.log('\n=== 强制设置Admin角色 ===');
    
    const user = localStorage.getItem('learning_user');
    if (!user) {
        console.log('❌ 无用户数据，无法设置角色');
        return;
    }
    
    try {
        const userData = JSON.parse(user);
        const originalRole = userData.role;
        userData.role = 'admin';
        
        localStorage.setItem('learning_user', JSON.stringify(userData));
        
        console.log('🔄 角色已从', originalRole, '变更为', userData.role);
        console.log('💾 已保存到本地存储');
        console.log('🔄 建议刷新页面以应用更改');
        
        // 验证更改
        setTimeout(() => {
            checkCurrentLoginStatus();
        }, 200);
        
    } catch (e) {
        console.error('❌ 设置角色失败:', e);
    }
}

// 测试函数：清理并重新登录
function cleanAndRelogin() {
    console.log('\n=== 清理并重新登录 ===');
    
    // 清理本地存储
    localStorage.removeItem('auth_token');
    localStorage.removeItem('learning_user');
    console.log('🗑️ 已清理本地存储');
    
    // 重新登录
    setTimeout(() => {
        testAdminLogin();
    }, 1000);
}

// 主测试函数
async function runAdminTests() {
    console.log('🧪 开始完整的Admin功能测试...\n');
    
    // 1. 检查当前状态
    checkCurrentLoginStatus();
    
    // 2. 测试路由访问
    testAdminRouteAccess();
    
    // 3. 如果不是admin，尝试登录
    const user = localStorage.getItem('learning_user');
    if (user) {
        try {
            const userData = JSON.parse(user);
            if (userData.role !== 'admin') {
                console.log('\n🔄 当前用户不是admin，尝试重新登录...');
                await testAdminLogin();
            }
        } catch (e) {
            console.log('\n🔄 用户数据异常，尝试重新登录...');
            await testAdminLogin();
        }
    } else {
        console.log('\n🔄 无登录用户，尝试admin登录...');
        await testAdminLogin();
    }
}

// 提供给控制台的便捷函数
window.adminTest = {
    checkStatus: checkCurrentLoginStatus,
    login: testAdminLogin,
    checkRoute: testAdminRouteAccess,
    forceAdmin: forceSetAdminRole,
    cleanRelogin: cleanAndRelogin,
    runAll: runAdminTests
};

console.log('\n📋 可用的测试函数:');
console.log('  adminTest.checkStatus() - 检查当前状态');
console.log('  adminTest.login() - 测试admin登录');
console.log('  adminTest.checkRoute() - 检查路由访问权限');
console.log('  adminTest.forceAdmin() - 强制设置admin角色');
console.log('  adminTest.cleanRelogin() - 清理并重新登录');
console.log('  adminTest.runAll() - 运行完整测试');

console.log('\n🚀 运行 adminTest.runAll() 开始完整测试');

// 自动运行完整测试
runAdminTests();