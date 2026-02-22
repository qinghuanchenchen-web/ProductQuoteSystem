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
    // 固定的演示账号密码
    const validUsername = 'admin';
    const validPassword = 'admin';

    if (username === validUsername && password === validPassword) {
        localStorage.setItem('siteAuth', 'true');
        window.location.href = 'index.html';
        return true;
    } else {
        return false; // 登录失败
    }
}

// 注销登录
function logout() {
    localStorage.removeItem('siteAuth');
    window.location.href = 'login.html';
}
