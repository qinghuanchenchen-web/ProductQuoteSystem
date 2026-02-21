// 全局 JavaScript 逻辑 (应用于所有页面)

document.addEventListener('DOMContentLoaded', () => {
    // 移动端菜单切换
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('show');
        });
    }

    // 处理导航栏高亮 (虽然目前高亮是写死在HTML的，但可以防未更新情况)
    // 自动为当前路径添加 active 状态
    const currentLocation = location.pathname.split("/").slice(-1)[0] || "index.html";
    const navItems = document.querySelectorAll('.nav-link');
    navItems.forEach(link => {
        if (link.getAttribute('href') === currentLocation) {
            navItems.forEach(n => n.classList.remove('active'));
            link.classList.add('active');
        }
    });

    // 针对 Quote 页面的特殊逻辑：接收 URL 参数自动填充表单
    if (currentLocation === "quote.html" || window.location.pathname.includes("quote")) {
        autoFillFormFromUrl();
    }
});

// Quote页面专用：从网址参数读取并填充基础信息
function autoFillFormFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const productName = params.get('name');
    const costPrice = params.get('cost');

    if (productName && document.getElementById('product-name')) {
        document.getElementById('product-name').value = productName;
    }
    if (costPrice && document.getElementById('cost-price')) {
        document.getElementById('cost-price').value = costPrice;
    }
}
