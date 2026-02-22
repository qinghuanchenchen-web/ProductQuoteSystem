let currentQuoteId = "";
let quoteCountToday = 1;

let quoteHistory = [];


document.addEventListener('DOMContentLoaded', () => {
    // Check local storage for today's count
    const today = new Date().toISOString().split('T')[0];
    const savedDate = localStorage.getItem('lastQuoteDate');
    if (savedDate === today) {
        quoteCountToday = parseInt(localStorage.getItem('quoteCountToday') || "1", 10);
    } else {
        localStorage.setItem('lastQuoteDate', today);
        localStorage.setItem('quoteCountToday', "1");
        quoteCountToday = 1;
    }

    // Listen to radio changes
    document.querySelectorAll('input[name="quote-type"]').forEach(radio => {
        radio.addEventListener('change', calculateQuote); // Re-calc on toggle
    });

    // Load History
    const savedHistory = localStorage.getItem('quoteHistory');
    if (savedHistory) {
        try {
            quoteHistory = JSON.parse(savedHistory);
        } catch (e) {
            quoteHistory = [];
        }
    }
    renderHistory();
});

function addItem() {
    const container = document.getElementById('items-container');
    const existingRows = container.querySelectorAll('.item-row');
    if (existingRows.length >= 9) {
        alert('最多只能添加9个产品项目以适配该模板！');
        return;
    }

    const firstRow = existingRows[0];
    const newRow = firstRow.cloneNode(true);
    // Clear inputs in cloned row
    newRow.querySelectorAll('input').forEach(input => {
        if (input.type === 'number' && input.classList.contains('item-qty')) input.value = '1';
        else input.value = '';
    });
    // Enable delete button
    newRow.querySelector('.del-btn').disabled = false;
    container.appendChild(newRow);

    // Enable delete of first row if > 1
    if (container.querySelectorAll('.item-row').length > 1) {
        container.querySelector('.item-row .del-btn').disabled = false;
    }
}

function removeItem(btn) {
    const container = document.getElementById('items-container');
    const row = btn.closest('.item-row');
    row.remove();

    const remainingRows = container.querySelectorAll('.item-row');
    if (remainingRows.length === 1) {
        remainingRows[0].querySelector('.del-btn').disabled = true;
    }
    calculateQuote();
}

function calculateQuote() {
    // 1. Setup ID
    const now = new Date();
    const dateStr = now.getFullYear().toString() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0');
    currentQuoteId = dateStr + "-" + String(quoteCountToday).padStart(2, '0');

    const isInternal = document.querySelector('input[name="quote-type"]:checked').value === 'internal';
    const profitRate = parseFloat(document.getElementById('profit-rate').value) || 0;
    // const taxFee = parseFloat(document.getElementById('tax-fee').value) || 0; // This will be set automatically
    const debugFee = parseFloat(document.getElementById('debug-fee').value) || 0;

    // Build items
    const rows = document.querySelectorAll('.item-row');
    const tbody = document.getElementById('tpl-items-body');
    tbody.innerHTML = ''; // clear

    let totalItemsCost = 0;
    let totalItemsFinal = 0;

    let hasValidationErrors = false;

    rows.forEach((row, index) => {
        const model = row.querySelector('.item-model').value || '';
        if (!model) hasValidationErrors = true;

        const qty = parseInt(row.querySelector('.item-qty').value) || 1;
        const cost = parseFloat(row.querySelector('.item-cost').value) || 0;
        const remark = row.querySelector('.item-remark').value || '';

        let unitDisplayPrice = cost;
        // Always include profit in the sales unit price regardless of internal/external view
        unitDisplayPrice = cost * (1 + profitRate / 100);
        const rowTotal = unitDisplayPrice * qty;

        totalItemsCost += (cost * qty);
        totalItemsFinal += rowTotal;

        const rowProfitAmount = rowTotal - (cost * qty);
        const internalDataStr = isInternal ? `
            <td class="internal-only-col">${cost.toFixed(2)}</td>
            <td class="internal-only-col">${(cost * qty).toFixed(2)}</td>
            <td>${unitDisplayPrice.toFixed(2)}</td>
            <td>${rowTotal.toFixed(2)}</td>
            <td class="internal-only-col">${rowProfitAmount.toFixed(2)}</td>
        ` : `
            <td>${unitDisplayPrice.toFixed(2)}</td>
            <td>${rowTotal.toFixed(2)}</td>
        `;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td class="left-align-cell">${model}</td>
            <td>${qty}</td>
            ${internalDataStr}
            <td>${remark}</td>
        `;
        tbody.appendChild(tr);
    });

    if (hasValidationErrors) {
        alert("请填写所有产品的型号");
        return;
    }

    // Pad remaining rows up to 9
    const drawnRows = rows.length;
    for (let i = drawnRows; i < 9; i++) {
        const tr = document.createElement('tr');
        if (i === 8 && !isInternal) {
            // For the 9th row in external view ONLY, display the "合计销售金额"
            tr.innerHTML = `
                <td>9</td>
                <td class="left-align-cell" colspan="3" style="font-weight: bold; text-align: center; color: #e53e3e;">合计销售金额:</td>
                <td style="font-weight: bold; color: #e53e3e;" id="tpl-main-total-bottom">${totalItemsFinal.toFixed(2)}</td>
                <td></td>
             `;
        } else {
            const padDataStr = isInternal ? `
                <td class="internal-only-col"></td>
                <td class="internal-only-col"></td>
                <td></td>
                <td></td>
                <td class="internal-only-col"></td>
             ` : `
                <td></td>
                <td></td>
             `;
            tr.innerHTML = `
                <td>${i + 1}</td>
                <td></td>
                <td></td>
                ${padDataStr}
                <td></td>
             `;
        }
        tbody.appendChild(tr);
    }

    // Update Profit Row
    const totalProfit = totalItemsCost * (profitRate / 100);

    // --- 自动计算 13% 税费 ---
    let baseAmountForTax = totalItemsFinal;
    if (isInternal) {
        baseAmountForTax += totalProfit;
    }
    const computedTax = baseAmountForTax * 0.13;
    const taxInput = document.getElementById('tax-fee');
    if (taxInput) {
        taxInput.value = computedTax.toFixed(2);
        taxInput.readOnly = true; // Auto-calculated field
    }
    // Use computed tax and debug hereafter
    const taxFee = computedTax;

    // Grand Total
    // Both internal and external items now include profit natively.
    // So Grand Total is Items Final + Tax + Debug.
    let grandTotal = totalItemsFinal + taxFee + debugFee;

    document.getElementById('tpl-main-total-top').textContent = grandTotal.toFixed(2);
    document.getElementById('tpl-quote-id').textContent = currentQuoteId;

    const currentUser = localStorage.getItem('loginUser') || 'admin';
    const tplPreparer = document.getElementById('tpl-preparer');
    const tplViewer = document.getElementById('tpl-viewer');
    if (tplPreparer) tplPreparer.textContent = currentUser;
    if (tplViewer) tplViewer.textContent = currentUser;

    // Collect Summary for History
    const modelNames = [];
    rows.forEach(r => {
        const m = r.querySelector('.item-model').value;
        const q = r.querySelector('.item-qty').value;
        if (m) modelNames.push(`${m} (x${q || 1})`);
    });

    const currentQuoteData = {
        id: currentQuoteId,
        timestamp: new Date().getTime(),
        modelSummary: modelNames.join('; '),
        totalCost: totalItemsCost,
        totalSales: totalItemsFinal,
        totalProfit: totalProfit,
        taxFee: taxFee,
        debugFee: debugFee,
        grandTotal: grandTotal,
        preparer: currentUser
    };

    saveToHistory(currentQuoteData);

    // Update Layout Colspans and Text for headers
    const titleColspan = document.getElementById('tpl-title-colspan');
    const metaLeftColspan = document.getElementById('tpl-meta-colspan-left');
    const metaRightColspan = document.getElementById('tpl-meta-colspan-right');
    if (titleColspan) {
        titleColspan.setAttribute('colspan', isInternal ? 9 : 6);
        titleColspan.textContent = isInternal ? '内部公司报价清单' : '公司报价清单';
    }
    if (metaLeftColspan) metaLeftColspan.setAttribute('colspan', isInternal ? 3 : 2);
    if (metaRightColspan) {
        metaRightColspan.setAttribute('colspan', isInternal ? 6 : 4);
        // We ensure the total text is completely hidden in both views. We just keep the span for data but hide the text node.
        metaRightColspan.innerHTML = `<span id="tpl-main-total-top" style="display:none;">${grandTotal.toFixed(2)}</span>`;
    }

    // Header construction based on mode
    const theadHeaderRow = document.getElementById('thead-header-row');
    if (theadHeaderRow) {
        if (isInternal) {
            theadHeaderRow.innerHTML = `
                <th width="8%">序号:</th>
                <th width="22%">型号</th>
                <th width="8%">数量</th>
                <th width="12%" class="internal-only-col">成本单价(元)</th>
                <th width="12%" class="internal-only-col">成本金额(元)</th>
                <th width="12%">销售单价(元)</th>
                <th width="12%">销售金额(元)</th>
                <th width="12%" class="internal-only-col">利润额(元)</th>
                <th width="10%">备注</th>
            `;
        } else {
            theadHeaderRow.innerHTML = `
                <th width="8%">序号:</th>
                <th width="28%">型号</th>
                <th width="10%">数量</th>
                <th width="18%">销售单价(元)</th>
                <th width="18%">合计销售金额(元)</th>
                <th width="18%">备注</th>
            `;
        }
    }

    // Handle Visual Toggle
    const printTpl = document.getElementById('printable-quote');

    // Calculate Bottom Fees and Totals Rows Display Layout
    const feesBody = document.querySelector('.fee-body');
    if (feesBody) {
        if (isInternal) {
            feesBody.innerHTML = `
                <tr id="row-profit" class="internal-row">
                    <td class="left-align-cell" colspan="2" style="text-align: center;">利益明细汇聚 (${profitRate}%)</td><td class="qty-cell">-</td><td class="price-cell internal-only-col"></td><td class="price-cell internal-only-col"></td><td class="price-cell"></td><td class="price-cell"></td><td id="tpl-profit-total" class="price-cell internal-only-col">${totalProfit.toFixed(2)}</td><td></td>
                </tr>
                <tr id="row-tax">
                    <td class="left-align-cell" colspan="2" style="text-align: center;">税费</td><td class="qty-cell">1</td><td class="price-cell internal-only-col"></td><td class="price-cell internal-only-col"></td><td class="price-cell"></td><td class="price-cell"></td><td id="tpl-tax-total" class="price-cell internal-only-col">${taxFee.toFixed(2)}</td><td></td>
                </tr>
                <tr id="row-debug">
                    <td class="left-align-cell" colspan="2" style="text-align: center;">调试费</td><td class="qty-cell">1</td><td class="price-cell internal-only-col"></td><td class="price-cell internal-only-col"></td><td class="price-cell"></td><td class="price-cell"></td><td id="tpl-debug-total" class="price-cell internal-only-col">${debugFee.toFixed(2)}</td><td></td>
                </tr>
                <tr id="row-grand-total">
                    <td class="left-align-cell" colspan="2" style="font-weight: bold; color: #e53e3e; text-align: center;">合计:</td><td class="qty-cell">1</td><td class="price-cell internal-only-col"></td><td class="price-cell internal-only-col"></td><td class="price-cell"></td><td class="price-cell"></td><td id="tpl-grand-total-bottom" class="price-cell internal-only-col" style="font-weight: bold; color: #e53e3e;">${grandTotal.toFixed(2)}</td><td></td>
                </tr>
            `;

            // 移除顶部的总价字样 (内部)
            const rightColspan = document.getElementById('tpl-meta-colspan-right');
            if (rightColspan) {
                rightColspan.innerHTML = `<span id="tpl-main-total-top" style="display:none;">${grandTotal.toFixed(2)}</span>`;
            }

        } else {
            // 销售报价 (给客户看的) 不显示税费和调试费明细
            feesBody.innerHTML = ``;
            // 移除顶部的总价字样 (外部)
            const rightColspan = document.getElementById('tpl-meta-colspan-right');
            if (rightColspan) {
                // Keep the span for calculation but hide it visually in the header, 
                // because we show the total at row 9 now
                rightColspan.innerHTML = `<span id="tpl-main-total-top" style="display:none;">${grandTotal.toFixed(2)}</span>`;
            }
        }
    }

    if (isInternal) {
        printTpl.classList.remove('external-mode');
        // Do not add the top total here anymore for internal either
        const rightColspan = document.getElementById('tpl-meta-colspan-right');
        if (rightColspan) {
            rightColspan.innerHTML = `<span id="tpl-main-total-top" style="display:none;">${grandTotal.toFixed(2)}</span>`;
        }
    } else {
        printTpl.classList.add('external-mode');
    }

    const resContainer = document.getElementById('result-container');
    if (resContainer) {
        resContainer.style.display = 'block';
    }
}

function resetForm() {
    document.getElementById('quote-form').reset();
    document.getElementById('result-container').style.display = 'none';
}

function printQuote() {
    window.print();
}

function saveToHistory(quoteData) {
    // Avoid exact duplicate ID spamming the history log if clicking generate multiple times
    const existingIndex = quoteHistory.findIndex(q => q.id === quoteData.id);
    if (existingIndex > -1) {
        quoteHistory[existingIndex] = quoteData; // Overwrite
    } else {
        quoteHistory.unshift(quoteData); // prepend
    }
    // Cap at 100 history items to prevent clutter and localstorage limits
    if (quoteHistory.length > 100) quoteHistory.pop();

    localStorage.setItem('quoteHistory', JSON.stringify(quoteHistory));
    renderHistory();
}

function renderHistory() {
    const list = document.getElementById('history-list');
    const badge = document.getElementById('history-count');
    if (!list || !badge) return;

    badge.textContent = quoteHistory.length;

    if (quoteHistory.length === 0) {
        list.innerHTML = '<div class="empty-state">暂无记录，快去生成第一笔报价吧！</div>';
        return;
    }

    list.innerHTML = '';
    quoteHistory.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.style = 'padding: 1rem; border-bottom: 1px solid #eee; display: flex; flex-direction: column; gap: 0.5rem;';

        const d = new Date(item.timestamp);
        const timeStr = d.toLocaleDateString() + ' ' + d.toLocaleTimeString();

        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong>NO: ${item.id}</strong>
                <span style="font-size:0.85em; color:#666;">${timeStr}</span>
            </div>
            <div style="font-size:0.9em; color:#444; margin-bottom: 0.5rem;">
                核心产品：${item.modelSummary}
            </div>
            <div style="font-size:0.85em; color:#666; margin-bottom: 0.5rem;">
                录入人：${item.preparer || '未知'} &nbsp;|&nbsp; 查阅人：${localStorage.getItem('loginUser') || 'admin'}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.9em; padding: 0.5rem; background: #f8fafc; border-radius: 4px;">
                <span>总价：<strong>¥${item.grandTotal.toFixed(2)}</strong></span>
                <span style="color:#16a34a;">利润：¥${item.totalProfit.toFixed(2)}</span>
            </div>
        `;
        list.appendChild(div);
    });
}

function exportToExcel() {
    if (quoteHistory.length === 0) {
        alert("暂无历史记录可导出");
        return;
    }
    const wb = XLSX.utils.book_new();
    const ws_data = [];

    // Header Row
    ws_data.push(["报价单号", "生成时间", "录入人", "产品摘要", "总成本(元)", "销售金额(元)", "利润额(元)", "税费(元)", "调试费(元)", "最终总价(元)"]);

    quoteHistory.forEach(item => {
        const d = new Date(item.timestamp);
        const timeStr = d.toLocaleDateString() + " " + d.toLocaleTimeString();
        ws_data.push([
            item.id,
            timeStr,
            item.preparer || '未知',
            item.modelSummary,
            item.totalCost.toFixed(2),
            item.totalSales.toFixed(2),
            item.totalProfit.toFixed(2),
            item.taxFee.toFixed(2),
            item.debugFee.toFixed(2),
            item.grandTotal.toFixed(2)
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    ws['!cols'] = [
        { wch: 20 }, // 报价单号
        { wch: 22 }, // 生成时间
        { wch: 15 }, // 录入人
        { wch: 40 }, // 产品摘要
        { wch: 12 }, // 总成本
        { wch: 15 }, // 销售金额
        { wch: 12 }, // 利润额
        { wch: 10 }, // 税费
        { wch: 10 }, // 调试费
        { wch: 15 }  // 最终总价
    ];

    XLSX.utils.book_append_sheet(wb, ws, "历史内部汇总");
    XLSX.writeFile(wb, "产品历史报价汇总日志.xlsx");
}

function exportTemplate(exportAsInternal) {
    if (!document.getElementById('tpl-quote-id') || document.getElementById('tpl-quote-id').textContent === '-') {
        alert("请先生成报价单!");
        return;
    }
    const wb = XLSX.utils.book_new();
    const ws_data = [];

    // --- 1. 表头区域 ---
    if (exportAsInternal) {
        ws_data.push(["内部公司报价清单", null, null, null, null, null, null, null, null]);
    } else {
        ws_data.push(["公司报价清单", null, null, null, null, null]);
    }

    const quoteId = document.getElementById('tpl-quote-id').textContent;
    const profitRate = parseFloat(document.getElementById('profit-rate').value) || 0;
    const debugFee = parseFloat(document.getElementById('debug-fee').value) || 0;

    // Recalculate totals
    let totalItemsCost = 0;
    let totalItemsFinal = 0;
    const itemsData = [];

    const rows = document.querySelectorAll('.item-row');
    rows.forEach((row, index) => {
        const model = row.querySelector('.item-model').value || '';
        if (!model) return;

        const qty = parseInt(row.querySelector('.item-qty').value) || 1;
        const cost = parseFloat(row.querySelector('.item-cost').value) || 0;
        const remark = row.querySelector('.item-remark').value || '';

        let unitDisplayPrice = cost;
        // Always include profit in the sales unit price regardless of internal/external view
        unitDisplayPrice = cost * (1 + profitRate / 100);
        const rowTotal = unitDisplayPrice * qty;

        totalItemsCost += (cost * qty);
        totalItemsFinal += rowTotal;

        const rowProfitAmount = rowTotal - (cost * qty);

        if (exportAsInternal) {
            itemsData.push([
                (index + 1).toString(), model, qty.toString(),
                cost.toFixed(2), (cost * qty).toFixed(2),
                unitDisplayPrice.toFixed(2), rowTotal.toFixed(2),
                rowProfitAmount.toFixed(2), remark
            ]);
        } else {
            itemsData.push([
                (index + 1).toString(), model, qty.toString(),
                unitDisplayPrice.toFixed(2), rowTotal.toFixed(2), remark
            ]);
        }
    });

    const totalProfit = totalItemsCost * (profitRate / 100);
    let baseAmountForTax = totalItemsFinal;
    const taxFee = baseAmountForTax * 0.13;

    let grandTotal = totalItemsFinal + taxFee + debugFee;

    if (exportAsInternal) {
        ws_data.push([
            "报价编号：" + quoteId, null, null,
            null, null, null, null, null, null
        ]);
    } else {
        ws_data.push([
            "报价编号：" + quoteId, null,
            null, null, null, null
        ]);
    }

    const currentUser = localStorage.getItem('loginUser') || 'admin';
    const currentPreparer = document.getElementById('tpl-preparer') ? document.getElementById('tpl-preparer').textContent : currentUser;
    ws_data.push([
        "录入人：" + currentPreparer, null,
        "查阅人：" + currentUser, null, null, null
    ]);

    // Headers
    if (exportAsInternal) {
        ws_data.push(["序号:", "型号", "数量", "成本单价(元)", "成本金额(元)", "销售单价(元)", "销售金额(元)", "利润额(元)", "备注"]);
    } else {
        ws_data.push(["序号:", "型号", "数量", "销售单价(元)", "合计销售金额(元)", "备注"]);
    }

    // Items
    itemsData.forEach(r => ws_data.push(r));

    // Padding up to 9 items
    for (let i = itemsData.length; i < 9; i++) {
        if (i === 8 && !exportAsInternal) {
            // For external quotes, the 9th row is the total row
            ws_data.push(["9", "合计销售金额:", "", "", totalItemsFinal.toFixed(2), ""]);
        } else {
            if (exportAsInternal) ws_data.push([(i + 1).toString(), "", "", "", "", "", "", "", ""]);
            else ws_data.push([(i + 1).toString(), "", "", "", "", ""]);
        }
    }

    // Fees
    if (exportAsInternal) {
        // Omitting sequence number and putting title in first column, second column is null (to be merged)
        ws_data.push([`利益明细汇聚 (${profitRate}%)`, null, "-", "", "", "", "", totalProfit.toFixed(2), ""]);
        ws_data.push(["税费", null, "1", "", "", "", "", taxFee.toFixed(2), ""]);
        ws_data.push(["调试费", null, "1", "", "", "", "", debugFee.toFixed(2), ""]);
        ws_data.push(["合计:", null, "1", "", "", "", "", grandTotal.toFixed(2), ""]);
    }

    ws_data.push([]);
    ws_data.push(["本报价含13%税费,不含运费。", null, null, null, null, null]);
    ws_data.push(["设备质保期1年", null, null, null, null, null]);
    ws_data.push(["本报价有效期30天", null, null, null, null, null]);
    ws_data.push([]);
    ws_data.push(["______科技有限公司", null, null, null, null, null]);
    ws_data.push(["公司电话:", "400-888-9999", null, null, "联系方式:", "13800138000"]);
    ws_data.push(["联系人:", "Admin", null, null, null, null]);

    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    const merges = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: exportAsInternal ? 8 : 5 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
        { s: { r: 1, c: 2 }, e: { r: 1, c: exportAsInternal ? 8 : 5 } },
        { s: { r: ws_data.length - 7, c: 0 }, e: { r: ws_data.length - 7, c: exportAsInternal ? 8 : 5 } },
        { s: { r: ws_data.length - 6, c: 0 }, e: { r: ws_data.length - 6, c: exportAsInternal ? 8 : 5 } },
        { s: { r: ws_data.length - 5, c: 0 }, e: { r: ws_data.length - 5, c: exportAsInternal ? 8 : 5 } },
        { s: { r: ws_data.length - 3, c: 0 }, e: { r: ws_data.length - 3, c: exportAsInternal ? 8 : 5 } },
    ];

    if (exportAsInternal) {
        // Merge columns 0 and 1 for the 4 fee rows specifically
        const totalRows = ws_data.length;
        const feeStartIndex = totalRows - 11; // Depends on exact row count: last are 3 empty + contact info. So fee rows are exactly 11,10,9,8 rows from end.
        // Let's just find the exact row indexes using the known sizes:
        // Header(1) + Meta(1) + Prep(1) + ColHeader(1) + Items(9) = 13 rows.
        // So Fees start at row index 13.
        merges.push({ s: { r: 13, c: 0 }, e: { r: 13, c: 1 } });
        merges.push({ s: { r: 14, c: 0 }, e: { r: 14, c: 1 } });
        merges.push({ s: { r: 15, c: 0 }, e: { r: 15, c: 1 } });
        merges.push({ s: { r: 16, c: 0 }, e: { r: 16, c: 1 } });
    }

    ws['!merges'] = merges;

    if (exportAsInternal) {
        ws['!cols'] = [{ wch: 8 }, { wch: 22 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 }];
    } else {
        ws['!cols'] = [{ wch: 8 }, { wch: 30 }, { wch: 10 }, { wch: 18 }, { wch: 18 }, { wch: 20 }];
    }

    XLSX.utils.book_append_sheet(wb, ws, "报价单");
    XLSX.writeFile(wb, `报价单_${quoteId}_${exportAsInternal ? '内部' : '客户'}.xlsx`);

    quoteCountToday++;
    localStorage.setItem('quoteCountToday', quoteCountToday.toString());
}
