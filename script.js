// 初始化应用时加载历史记录
document.addEventListener('DOMContentLoaded', () => {
    renderHistory();
});

// 计算报价的核心逻辑
function calculateQuote() {
    // 1. 获取输入值
    const nameInput = document.getElementById('product-name').value.trim();
    const costInput = document.getElementById('cost-price').value;
    const marginInput = document.getElementById('profit-margin').value;
    const shippingInput = document.getElementById('shipping-fee').value;

    // 2. 表单验证
    if (!nameInput) {
        alert("请输入产品名称");
        return;
    }
    const cost = parseFloat(costInput);
    const margin = parseFloat(marginInput);
    if (isNaN(cost) || cost < 0 || isNaN(margin) || margin < 0) {
        alert("请输入有效的成本价和利润率（必须为大于0的数字）");
        return;
    }
    const shipping = shippingInput === "" ? 0 : parseFloat(shippingInput);
    if (isNaN(shipping) || shipping < 0) {
        alert("运费必须是大于等于0的数字");
        return;
    }

    // 3. 计算逻辑
    // 利润 = 成本 * (利润率 / 100)
    const expectedProfit = cost * (margin / 100);
    // 最终报价 = 成本 + 运费 + 利润
    const finalPrice = cost + shipping + expectedProfit;

    // 4. 更新UI显示结果
    document.getElementById('res-name').textContent = nameInput;
    document.getElementById('res-cost').textContent = `￥ ${cost.toFixed(2)}`;
    document.getElementById('res-shipping').textContent = `￥ ${shipping.toFixed(2)}`;
    document.getElementById('res-profit').textContent = `￥ ${expectedProfit.toFixed(2)}`;
    
    // 数字动画效果
    animateValue("res-final-price", 0, finalPrice, 500);

    // 显示结果区域
    document.getElementById('result-container').classList.remove('hidden');

    // 5. 保存记录 (加入本地存储历史)
    saveRecord({
        name: nameInput,
        finalPrice: finalPrice,
        date: new Date().toLocaleString()
    });
}

// 数字增长动画辅助函数
function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        // ease out effect
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentVal = start + easeProgress * (end - start);
        obj.innerHTML = currentVal.toFixed(2);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// 重置表单
function resetForm() {
    document.getElementById('quote-form').reset();
    document.getElementById('result-container').classList.add('hidden');
    document.getElementById('product-name').focus();
}

// --- 历史记录管理系统 ---

function saveRecord(record) {
    // 从 localStorage 获取现有的记录，如果没有则为空数组
    let history = JSON.parse(localStorage.getItem('quoteHistory')) || [];
    // 把新记录加到开头
    history.unshift(record);
    // 只保留最近的20条记录
    if (history.length > 20) {
        history.pop();
    }
    // 保存回 localStorage
    localStorage.setItem('quoteHistory', JSON.stringify(history));
    // 重新渲染历史记录列表
    renderHistory();
}

function renderHistory() {
    const historyList = document.getElementById('history-list');
    const historyCount = document.getElementById('history-count');
    
    let history = JSON.parse(localStorage.getItem('quoteHistory')) || [];
    
    // 更新徽章数字
    historyCount.textContent = history.length;

    if (history.length === 0) {
        historyList.innerHTML = '<div class="empty-state">暂无记录，快去生成第一笔报价吧！</div>';
        return;
    }

    // 清空当前列表并重新组装
    historyList.innerHTML = '';
    history.forEach(item => {
        const itemHtml = `
            <div class="history-item">
                <div class="hi-info">
                    <span class="hi-name">${item.name}</span>
                    <span class="hi-date">${item.date}</span>
                </div>
                <div class="hi-price">￥${item.finalPrice.toFixed(2)}</div>
            </div>
        `;
        // insertAdjacentHTML比innerHTML +=性能更好
        historyList.insertAdjacentHTML('beforeend', itemHtml);
    });
}
