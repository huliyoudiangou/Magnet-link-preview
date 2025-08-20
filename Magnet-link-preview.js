// ==UserScript==
// @name         磁链图片预览
// @namespace    https://t.me/Melodic_Tides_chat
// @version      4.1
// @description  采用“主题自适应”按钮样式，兼容深色模式，并更新了匹配网站列表。修复了在部分网站上的按钮定位优先级问题。
// @author       MakiZhang
// @copyright    2025, MakiZhang
// @license      CC-BY-NC-SA-4.0
// @match        *://*.anybt.eth.link/*
// @match        *://*.skrbtiu.top/*
// @match        *://*.btmulu.work/*
// @match        *://*.cilian.site/*
// @match        *://*.javbus.com/*
// @match        *://*.north-plus.net/*
// @match        *://*.nyaa.si/*
// @match        *://*.mnmnmnmnmn.com/*
// @match        *://*.pianyuan.org/*
// @match        *://*.pwww.gying.in/*
// @match        *://*.magnet-search.com/*
// @match        *://*.mnplay.xyz/*
// @match        *://*.btstate.com/*
// @match        *://*.btsearch.net/*
// @match        *://*.magnetlink.net/*
// @match        *://*.cursor.vip/*
// @match        *://*.btmulu.cyou/*
// @match        *://*.filemood.com/*
// @match        *://*.btdig.com/*
// @match        *://*.xccl98.xyz/*
// @match        *://*.torrentq.co/*
// @match        *://*.cililianjie.net/*
// @match        *://*.vwcat.com/*
// @match        *://*.u6a6.link/*
// @match        *://*.0mag.net/*
// @match        *://*.3d48.com/*
// @match        *://*.bitsearch.to/*
// @match        *://*.bt4gprx.com/*
// @match        *://*.ntorrents.net/*
// @match        *://*.torrentdownload.info/*
// @match        *://*.similarweb.com/*
// @match        *://*.lamentations1.buzz/*
// @match        *://*.knaben.org/*
// @match        *://*.navix.site/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_setClipboard
// ==/UserScript==

(function () {
    'use strict';

    // =================================================================================
    // 1. 配置与资源
    // =================================================================================
    const config = {
        boxWidth: GM_getValue('boxWidth', 450),
        boxHeight: GM_getValue('boxHeight', 500),
        apiTimeout: GM_getValue('apiTimeout', 15000),
    };

    const icons = {
        copy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
        collapse: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>`,
        expand: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`,
        close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    };

    // =================================================================================
    // 2. UI 模块
    // =================================================================================
    let boxLeft, boxTop;

    function initStyle() {
        const style = document.createElement("style");
        style.textContent = `
            :root {
                --prism-bg: rgba(30, 31, 34, 0.85); --prism-accent: #4A90E2; --prism-text-main: #EAEAEA;
                --prism-text-secondary: #8A8B8E; --prism-radius: 12px; --prism-transition: all 0.2s ease-out;
            }
            #qBox {
                all: initial; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';
                position: fixed; z-index: 99999;
                width: ${config.boxWidth}px; height: ${config.boxHeight}px;
                background: var(--prism-bg); backdrop-filter: blur(10px) saturate(180%); -webkit-backdrop-filter: blur(10px) saturate(180%);
                border-radius: var(--prism-radius); box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
                border: 1px solid rgba(255, 255, 255, 0.1); color: var(--prism-text-main);
                display: flex; flex-direction: column; resize: both; overflow: hidden;
                transition: height 0.3s ease-in-out;
            }
            #qBox.is-collapsed { height: 50px; resize: none; }
            #qTop {
                display: flex; justify-content: space-between; align-items: center; padding: 10px 14px;
                cursor: move; user-select: none; background: rgba(255, 255, 255, 0.05); flex-shrink: 0;
            }
            #qTop .title-info h3 { all: initial; font-family: inherit; font-size: 14px; font-weight: 600; color: var(--prism-text-main); display: block; }
            #qTop .title-info p { all: initial; font-family: inherit; margin-top: 2px; font-size: 12px; color: var(--prism-text-secondary); display: block;}
            #qTop .controls { display: flex; align-items: center; gap: 8px; }
            #qTop .controls .control-btn { all: initial; cursor: pointer; display: flex; align-items: center; justify-content: center; }
            #qTop .controls .control-btn svg { width: 18px; height: 18px; color: var(--prism-text-secondary); transition: var(--prism-transition); }
            #qTop .controls .control-btn:hover svg { color: var(--prism-accent); transform: scale(1.1); }
            #qList {
                flex-grow: 1; display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                gap: 10px; padding: 14px; overflow-y: auto;
            }
            #qList::-webkit-scrollbar { width: 5px; }
            #qList::-webkit-scrollbar-track { background: transparent; }
            #qList::-webkit-scrollbar-thumb { background: #888; border-radius: 6px; }
            #qList.is-message { display: flex; justify-content: center; align-items: center; font-size: 16px; color: var(--prism-text-secondary); }
            #qList a { display: block; border-radius: 6px; overflow: hidden; position: relative; transition: var(--prism-transition); animation: fadeIn 0.3s ease-out; }
            #qList a:hover { transform: scale(1.03); box-shadow: 0 0 15px rgba(74, 144, 226, 0.5); }
            #qList img { width: 100%; height: auto; display: block; background: #333; }
            #qList .skeleton { width: 100%; padding-bottom: 60%; background: rgba(255, 255, 255, 0.08); border-radius: 6px; animation: pulse 1.5s infinite ease-in-out; }

            /* --- V4.0: 全新“主题自适应”按钮样式 --- */
            .preview-img {
                display: inline-flex;
                align-items: center;
                margin-left: 8px;
                padding: 2px 8px;
                font-size: 12px;
                font-weight: 500;
                color: #f0f0f0; /* 亮色文字 */
                background-color: rgba(0, 0, 0, 0.4); /* 半透明深色背景 */
                border: 1px solid rgba(255, 255, 255, 0.2); /* 浅色边框 */
                text-shadow: 1px 1px 2px rgba(0,0,0,0.5); /* 文字阴影，增强可读性 */
                border-radius: 20px;
                cursor: pointer;
                transition: var(--prism-transition);
                vertical-align: middle;
            }
            .preview-img:hover {
                background-color: rgba(0, 0, 0, 0.6);
                border-color: rgba(255, 255, 255, 0.4);
            }

            .q-tooltip { position: relative; }
            .q-tooltip:hover::after {
                content: attr(data-tooltip); position: absolute; bottom: 120%; left: 50%; transform: translateX(-50%);
                background-color: #111; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 12px;
                white-space: nowrap; z-index: 100000;
            }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
        `;
        document.head.appendChild(style);
    }

    function insertBox(magnetUrl, initialTitle) {
        if (document.getElementById('qBox')) {
            const copyBtn = document.getElementById('qBtnCopy');
            if(copyBtn) copyBtn.dataset.magnetUrl = magnetUrl;
             return;
        }
        const qBox = document.createElement("div");
        qBox.id = "qBox";
        qBox.style.left = boxLeft || `calc(100vw - ${config.boxWidth + 50}px)`;
        qBox.style.top = boxTop || "50px";
        qBox.innerHTML = `
            <div id="qTop">
                <div class="title-info">
                    <h3>${initialTitle}</h3>
                    <p>&nbsp;</p>
                </div>
                <div class="controls">
                    <div class="control-btn q-tooltip" data-tooltip="复制磁链" id="qBtnCopy">${icons.copy}</div>
                    <div class="control-btn q-tooltip" data-tooltip="折叠" id="qBtnCollapse">${icons.collapse}</div>
                    <div class="control-btn q-tooltip" data-tooltip="关闭" id="qBtnClose">${icons.close}</div>
                </div>
            </div>
            <div id="qList"></div>
        `;
        document.body.appendChild(qBox);
        const qTop = qBox.querySelector('#qTop'), qBtnClose = qBox.querySelector('#qBtnClose'),
              qBtnCollapse = qBox.querySelector('#qBtnCollapse'), qBtnCopy = qBox.querySelector('#qBtnCopy');
        qBtnCopy.dataset.magnetUrl = magnetUrl;
        let isDragging = false, offsetX, offsetY;
        qTop.addEventListener('mousedown', e => {
             if (e.target.closest('.control-btn')) return;
            isDragging = true;
            offsetX = e.clientX - qBox.offsetLeft;
            offsetY = e.clientY - qBox.offsetTop;
            qBox.style.transition = 'none';
        });
        document.addEventListener('mousemove', e => {
            if(isDragging) { qBox.style.left = `${e.clientX - offsetX}px`; qBox.style.top = `${e.clientY - offsetY}px`; }
        });
        document.addEventListener('mouseup', () => {
            if(isDragging) { isDragging = false; qBox.style.transition = 'height 0.3s ease-in-out'; }
        });
        qBtnClose.addEventListener('click', () => { boxLeft = qBox.style.left; boxTop = qBox.style.top; qBox.remove(); });
        qBtnCollapse.addEventListener('click', () => {
            const isCollapsed = qBox.classList.toggle('is-collapsed');
            qBtnCollapse.innerHTML = isCollapsed ? icons.expand : icons.collapse;
            qBtnCollapse.setAttribute('data-tooltip', isCollapsed ? '展开' : '折叠');
        });
        qBtnCopy.addEventListener('click', (e) => {
            GM_setClipboard(e.currentTarget.dataset.magnetUrl, 'text');
            const originalTooltip = e.currentTarget.getAttribute('data-tooltip');
            e.currentTarget.setAttribute('data-tooltip', '已复制!');
            setTimeout(() => e.currentTarget.setAttribute('data-tooltip', originalTooltip), 1500);
        });
    }

    function updateBoxContent(state, data = {}) {
        const qBox = document.getElementById('qBox');
        if (!qBox) return;
        const qList = qBox.querySelector('#qList'), titleEl = qBox.querySelector('.title-info h3'), countEl = qBox.querySelector('.title-info p');
        qList.innerHTML = '';
        qList.classList.remove('is-message');
        switch (state) {
            case 'loading':
                for (let i = 0; i < 12; i++) { const skeleton = document.createElement('div'); skeleton.className = 'skeleton'; qList.appendChild(skeleton); }
                break;
            case 'success':
                titleEl.textContent = data.name;
                countEl.textContent = `${data.screenshots.length} 张图片`;
                if (data.screenshots.length === 0) { qList.classList.add('is-message'); qList.textContent = "无预览图"; return; }
                data.screenshots.forEach(ss => {
                    const a = document.createElement("a"); a.href = ss.screenshot; a.target = "_blank";
                    const img = document.createElement("img"); img.src = ss.screenshot;
                    img.onerror = function() { this.src = `https://placehold.co/400x200/333/888?text=Load+Failed`; this.onerror = null; };
                    a.appendChild(img); qList.appendChild(a);
                });
                break;
            case 'error':
                qList.classList.add('is-message'); qList.textContent = data.message || '发生未知错误';
                titleEl.textContent = '加载失败'; countEl.textContent = '请稍后再试';
                break;
        }
    }

    // =================================================================================
    // 3. 核心逻辑
    // =================================================================================
    const processedNodes = new Set();
    const regexArr = [/magnet:\?xt=urn:btih:([a-f0-9]{40})/i, /\b([a-f0-9]{40})\b/i];

    function ajax(magnetUrl, initialTitle) {
        insertBox(magnetUrl, initialTitle);
        updateBoxContent('loading');
        GM_xmlhttpRequest({
            method: "GET", url: `https://whatslink.info/api/v1/link?url=${magnetUrl}`,
            headers: { "Referer": "https://whatslink.info/" }, timeout: config.apiTimeout,
            onload: function (xhr) {
                if (xhr.status !== 200) { updateBoxContent('error', { message: `请求接口错误 (Status: ${xhr.status})` }); return; }
                const obj = JSON.parse(xhr.responseText);
                if (obj.error || !obj.screenshots) { updateBoxContent('error', { message: obj.name || '无法解析此链接' }); return; }
                updateBoxContent('success', obj);
            },
            onerror: (xhr) => updateBoxContent('error', { message: `网络请求失败` }),
            ontimeout: () => updateBoxContent('error', { message: `请求超时` })
        });
    }

    function findAndProcessMagnetLinks(rootNode) {
        const walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
        const explicitCandidates = []; // 将包含 <a> 标签（高优先级）
        const implicitCandidates = []; // 将包含文本节点（低优先级）
        const handledHashes = new Set();

        while (walker.nextNode()) {
            const node = walker.currentNode;
            if (node.parentNode.closest('.preview-img, #qBox')) continue;

            let content = '', targetList = null;

            // 通过放入 explicitCandidates 列表来优先处理 <a> 标签
            if (node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() === 'a' && node.href) {
                content = node.href;
                targetList = explicitCandidates;
            // 通过放入 implicitCandidates 列表来降低纯文本节点的优先级
            } else if (node.nodeType === Node.TEXT_NODE && !node.parentNode.closest('a, button, script, style')) {
                content = node.nodeValue;
                targetList = implicitCandidates;
            } else {
                continue;
            }

            for (const regex of regexArr) {
                const match = regex.exec(content);
                if (match) {
                    const hash = match[1].toLowerCase();
                    const title = (node.textContent || '').trim().substring(0, 50) || '磁力链接';
                    const candidate = { hash, magnet: `magnet:?xt=urn:btih:${hash}`, node, title };
                    targetList.push(candidate);
                    break;
                }
            }
        }

        const processCandidate = (candidate) => {
            if (handledHashes.has(candidate.hash) || processedNodes.has(candidate.node)) return;
            addButton(candidate.node, candidate.magnet, candidate.title);
            handledHashes.add(candidate.hash);
        };

        // 首先处理高优先级的链接，然后才处理作为备选的纯文本节点
        explicitCandidates.forEach(processCandidate);
        implicitCandidates.forEach(processCandidate);
    }

    function addButton(node, magnet, title) {
        const button = document.createElement('button');
        button.className = 'preview-img';
        button.textContent = '预览';
        button.dataset.magnetUrl = magnet;
        button.dataset.initialTitle = title;
        const targetNode = node.nodeType === Node.TEXT_NODE ? node.parentNode : node;
        if (targetNode && targetNode.parentNode && !targetNode.querySelector('.preview-img')) {
             targetNode.parentNode.insertBefore(button, targetNode.nextSibling);
             processedNodes.add(node);
        }
    }

    // =================================================================================
    // 4. 启动与初始化
    // =================================================================================
    initStyle();

    document.body.addEventListener('click', event => {
        const button = event.target.closest('.preview-img');
        if (button) {
            event.preventDefault(); event.stopPropagation();
            const { magnetUrl, initialTitle } = button.dataset;
            if (magnetUrl) ajax(magnetUrl, initialTitle);
        }
    });

    findAndProcessMagnetLinks(document.body);

    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    findAndProcessMagnetLinks(node);
                }
            });
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });

})();
