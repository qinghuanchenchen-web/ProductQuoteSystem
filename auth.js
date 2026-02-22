// 身份验证逻辑 (Authentication Logic)

// 校验登录状态
function checkAuth() {
    const isAuthenticated = localStorage.getItem('siteAuth') === 'true';
    return isAuthenticated;
}

// 保护路由：如果未登录，强制跳转到登录页
function requireAuth() {
    if (!checkAuth()) {
        window.location.href = 'login.html';
    }
}

// 执行登录操作
function login(username, password) {
    // 允许的10个账号列表，账号和密码相同 (例如: user01/user01)
    const validUsers = [
        'user01', 'user02', 'user03', 'user04', 'user05',
        'user06', 'user07', 'user08', 'user09', 'user10',
        'admin' // 保留admin方便测试
    ];

    if (validUsers.includes(username) && password === username) {
        localStorage.setItem('siteAuth', 'true');
        localStorage.setItem('loginUser', username); // 记录当前登录的用户名
        window.location.href = 'index.html';
        return true;
    } else {
        return false; // 登录失败
    }
}

// 注销登录
function logout() {
    localStorage.removeItem('siteAuth');
    localStorage.removeItem('loginUser');
    window.location.href = 'login.html';
}
