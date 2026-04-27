/**
 * 疯狂动物城 - 角色彩蛋系统
 * Version: 1.0.0
 *
 * 点击特定元素触发角色彩蛋，增加趣味互动
 *
 * 功能:
 * - 点击彩蛋触发
 * - 角色随机反应
 * - 轻量级实现
 * - 可配置触发器
 */

(function($) {
    'use strict';

    // ========================================
    // 彩蛋配置
    // ========================================

    const EASTER_EGGS = {
        // 朱迪彩蛋
        judy: {
            name: '朱迪',
            emoji: '🐰',
            color: '#FF9F43',
            triggers: [
                '.page-title',
                '.post-title',
                'h1',
                'a[href*="zootopia"]'
            ],
            reactions: [
                { text: 'Try Everything! 🐰', mood: 'excited' },
                { text: '任何人都可以成就任何事！✨', mood: 'inspiring' },
                { text: '绝不放弃！💪', mood: 'determined' },
                { text: '准备好改变世界了吗？🌟', mood: 'motivating' },
                { text: '第一天上班就破了大案！🦊', mood: 'proud' },
                { text: '甜甜圈还在吗？🍩', mood: 'playful' },
                { text: '闪电大叔又在慢吞吞了...🦥', mood: 'amused' },
                { text: '我们要让世界变得更美好！💖', mood: 'hopeful' }
            ],
            sound: 'happy'
        },

        // 尼克彩蛋
        nick: {
            name: '尼克',
            emoji: '🦊',
            color: '#EE5A24',
            triggers: [
                '.author-info',
                '.toc',
                '.reward-button',
                'a[href*="author"]'
            ],
            reactions: [
                { text: 'It\'s called a hustle, sweetheart! 🦊', mood: 'sly' },
                { text: '你知道狐狸怎么说吗？🎭', mood: 'charming' },
                { text: '这就是我的 hustle 😎', mood: 'confident' },
                { text: '爪爪冰棍，纯天然🍦', mood: 'playful' },
                { text: '聪明人才懂的销售技巧 💰', mood: 'clever' },
                { text: '别那样看着我 🦊', mood: 'sassy' },
                { text: '朱迪，你是我的朋友了 ❤️', mood: 'touched' },
                { text: '好吧，算你赢了 🐰', mood: 'impressed' }
            ],
            sound: 'sly'
        },

        // 闪电彩蛋
        flash: {
            name: '闪电',
            emoji: '🦥',
            color: '#10AC84',
            triggers: [
                '.footer',
                '.copyright',
                'a[href*="github"]',
                'button[disabled]'
            ],
            reactions: [
                { text: '你...好...啊...🦥', mood: 'slow' },
                { text: '我...马...上...就...好...', mood: 'patient' },
                { text: '3...0...小...时...⏰', mood: 'focused' },
                { text: '这...个...按...钮...很...好...', mood: 'polite' },
                { text: '需...要...帮...忙...吗...?', mood: 'helpful' },
                { text: '我...很...快...的...💨', mood: 'proud' },
                { text: '谢...谢...你...的...等...待...⏳', mood: 'grateful' }
            ],
            sound: 'slow'
        },

        // 旁克警官彩蛋
        bogo: {
            name: '旁克警官',
            emoji: '🦁',
            color: '#5F27CD',
            triggers: [
                '.search',
                'input[type="search"]',
                '.social-share'
            ],
            reactions: [
                { text: '你是想成为警察吗？🦁', mood: 'serious' },
                { text: '动物城 depends on you! 🏆', mood: 'proud' },
                { text: '打破常规，成就伟大 🌟', mood: 'inspiring' },
                { text: '我相信你，新来的 🐰', mood: 'supportive' },
                { text: '要当真正的警察！👮', mood: 'demanding' },
                { text: '做得好，警官 ✨', mood: 'approving' }
            ],
            sound: 'authoritative'
        },

        // 牛局长彩蛋
        mayor: {
            name: '牛局长',
            emoji: '🐮',
            color: '#FF6B6B',
            triggers: [
                '.aside-content',
                '.webinfo',
                '.card-author'
            ],
            reactions: [
                { text: '动物城需要你！🏙️', mood: 'official' },
                { text: '维护城市和平 🛡️', mood: 'responsible' },
                { text: '谢谢你为动物城服务 💖', mood: 'grateful' },
                { text: '记住，任何人都可以成就任何事 🌟', mood: 'wise' }
            ],
            sound: 'dignified'
        }
    };

    // ========================================
    // 特殊彩蛋（组合触发）
    // ========================================

    const SPECIAL_EGGS = {
        'judy-nick-combo': {
            trigger: 3,  // 3次点击触发
            characters: ['judy', 'nick'],
            message: '🐰🦊 朱迪和尼克：最佳搭档！',
            reward: { points: 10, achievement: 'best_partners' }
        },
        'triple-click': {
            trigger: 3,  // 3次点击同一元素
            message: '🎉 你发现了隐藏彩蛋！',
            reward: { points: 5, achievement: 'easter_egg_hunter' }
        }
    };

    // ========================================
    // 系统状态
    // ========================================

    let clickCount = new Map(); // 跟踪点击次数
    let lastClickTime = new Map();
    let isProcessing = false;
    let cooldownTime = 2000; // 2秒冷却

    // ========================================
    // 核心功能
    // ========================================

    /**
     * 初始化彩蛋系统
     */
    function initEasterEggs() {
        // 检查用户是否启用了彩蛋
        if (!shouldEnableEggs()) {
            console.log('🥚 疯狂动物城彩蛋系统已禁用');
            return;
        }

        // 为所有触发元素添加点击监听
        for (const [charId, char] of Object.entries(EASTER_EGGS)) {
            char.triggers.forEach(trigger => {
                $(document).on('click', trigger, function(e) {
                    handleEasterEgg(e, charId, this);
                });
            });
        }

        // 添加键盘快捷键
        addKeyboardShortcuts();

        // 页面加载随机欢迎彩蛋
        scheduleWelcomeEgg();

        console.log('🥚 疯狂动物城彩蛋系统已启动');
    }

    /**
     * 检查是否启用彩蛋
     */
    function shouldEnableEggs() {
        // 检查localStorage设置
        const disabled = localStorage.getItem('zt_eggs_disabled');
        if (disabled === 'true') return false;

        // 检查用户偏好
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return false;
        }

        return true;
    }

    /**
     * 处理彩蛋触发
     */
    function handleEasterEgg(event, charId, element) {
        // 防止重复触发
        if (isProcessing) return;

        const now = Date.now();
        const lastTime = lastClickTime.get(charId) || 0;

        // 检查冷却时间
        if (now - lastTime < cooldownTime) {
            return;
        }

        // 检查是否是连续点击
        const elementId = getElementId(element);
        const count = (clickCount.get(elementId) || 0) + 1;
        clickCount.set(elementId, count);

        // 清除之前的定时器
        clearTimeout(element.clickTimer);

        // 1秒后重置点击计数
        element.clickTimer = setTimeout(() => {
            clickCount.delete(elementId);
        }, 1000);

        // 触发彩蛋
        isProcessing = true;
        lastClickTime.set(charId, now);

        try {
            // 检查特殊彩蛋
            if (count >= 3) {
                triggerSpecialEgg(element, count);
            } else {
                triggerCharacterEgg(event, charId, element);
            }
        } finally {
            setTimeout(() => {
                isProcessing = false;
            }, 500);
        }
    }

    /**
     * 触发角色彩蛋
     */
    function triggerCharacterEgg(event, charId, element) {
        const char = EASTER_EGGS[charId];
        if (!char) return;

        // 随机选择反应
        const reaction = char.reactions[Math.floor(Math.random() * char.reactions.length)];

        // 显示彩蛋气泡
        showEggBubble(event, char, reaction);

        // 播放音效（可选）
        playEggSound(char.sound);

        // 发送通知
        if (window.ztNotify && Math.random() > 0.5) {
            setTimeout(() => {
                window.ztNotify(reaction.text, 'info', {
                    icon: char.emoji,
                    duration: 2000
                });
            }, 500);
        }
    }

    /**
     * 显示彩蛋气泡
     */
    function showEggBubble(event, char, reaction) {
        const bubble = document.createElement('div');
        bubble.className = 'zt-egg-bubble';
        bubble.innerHTML = `
            <span class="zt-egg-emoji">${char.emoji}</span>
            <span class="zt-egg-text">${reaction.text}</span>
        `;

        // 计算位置
        const x = event.pageX;
        const y = event.pageY;

        bubble.style.left = x + 'px';
        bubble.style.top = (y - 60) + 'px';
        bubble.style.setProperty('--zt-egg-color', char.color);

        document.body.appendChild(bubble);

        // 动画显示
        setTimeout(() => bubble.classList.add('show'), 10);

        // 自动消失
        setTimeout(() => {
            bubble.classList.remove('show');
            setTimeout(() => bubble.remove(), 300);
        }, 2500);
    }

    /**
     * 触发特殊彩蛋
     */
    function triggerSpecialEgg(element, count) {
        const bubble = document.createElement('div');
        bubble.className = 'zt-egg-bubble zt-egg-special';
        bubble.innerHTML = `
            <span class="zt-egg-emoji">🎉</span>
            <span class="zt-egg-text">连续点击${count}次！你发现了隐藏彩蛋！</span>
        `;

        const rect = element.getBoundingClientRect();
        bubble.style.left = (rect.left + rect.width / 2) + 'px';
        bubble.style.top = (rect.top - 60) + 'px';

        document.body.appendChild(bubble);

        setTimeout(() => bubble.classList.add('show'), 10);
        setTimeout(() => {
            bubble.classList.remove('show');
            setTimeout(() => bubble.remove(), 300);
        }, 3000);

        // 奖励积分
        if (window.ztAddPoints) {
            window.ztAddPoints(5, 'easter_egg');
        }

        // 显示通知
        if (window.ztNotify) {
            window.ztNotify('🥚 发现隐藏彩蛋！+5积分', 'success');
        }
    }

    /**
     * 播放彩蛋音效（简化版）
     */
    function playEggSound(type) {
        // 这里可以添加Web Audio API音效
        // 为了保持轻量级，暂时只记录日志
        console.log(`🔊 彩蛋音效: ${type}`);
    }

    /**
     * 添加键盘快捷键
     */
    function addKeyboardShortcuts() {
        // Ctrl + Shift + E: 触发随机彩蛋
        $(document).on('keydown', function(e) {
            if (e.ctrlKey && e.shiftKey && e.key === 'E') {
                e.preventDefault();
                triggerRandomEgg();
            }
        });
    }

    /**
     * 页面加载随机欢迎彩蛋
     * 每个会话只触发一次，延迟2-4秒随机出现
     */
    function scheduleWelcomeEgg() {
        // 每个会话只触发一次
        if (sessionStorage.getItem('zt_welcomed')) return;
        sessionStorage.setItem('zt_welcomed', '1');

        // 随机延迟 2-4 秒
        var delay = 2000 + Math.floor(Math.random() * 2000);

        setTimeout(function() {
            // 随机选一个角色
            var charIds = Object.keys(EASTER_EGGS);
            var charId = charIds[Math.floor(Math.random() * charIds.length)];
            var char = EASTER_EGGS[charId];
            var reaction = char.reactions[Math.floor(Math.random() * char.reactions.length)];

            // 创建右下角欢迎气泡
            var toast = document.createElement('div');
            toast.className = 'zt-egg-bubble zt-welcome-toast';
            toast.innerHTML =
                '<span class="zt-egg-emoji">' + char.emoji + '</span>' +
                '<span class="zt-egg-text">' + char.name + '：' + reaction.text + '</span>';
            toast.style.setProperty('--zt-egg-color', char.color);

            document.body.appendChild(toast);

            // 入场
            setTimeout(function() { toast.classList.add('show'); }, 10);

            // 3秒后离场
            setTimeout(function() {
                toast.classList.remove('show');
                setTimeout(function() { toast.remove(); }, 400);
            }, 3500);
        }, delay);
    }

    /**
     * 触发随机彩蛋
     */
    function triggerRandomEgg() {
        const charIds = Object.keys(EASTER_EGGS);
        const randomCharId = charIds[Math.floor(Math.random() * charIds.length)];
        const char = EASTER_EGGS[randomCharId];
        const reaction = char.reactions[Math.floor(Math.random() * char.reactions.length)];

        // 在屏幕中央显示
        const bubble = document.createElement('div');
        bubble.className = 'zt-egg-bubble zt-egg-center';
        bubble.innerHTML = `
            <span class="zt-egg-emoji">${char.emoji}</span>
            <span class="zt-egg-text">${reaction.text}</span>
        `;
        bubble.style.setProperty('--zt-egg-color', char.color);

        document.body.appendChild(bubble);
        setTimeout(() => bubble.classList.add('show'), 10);
        setTimeout(() => {
            bubble.classList.remove('show');
            setTimeout(() => bubble.remove(), 300);
        }, 3000);

        if (window.ztNotify) {
            window.ztNotify(`${char.name}: ${reaction.text}`, 'info', {
                icon: char.emoji
            });
        }
    }

    /**
     * 获取元素唯一标识
     */
    function getElementId(element) {
        if (element.id) return `#${element.id}`;
        if (element.className) return `.${element.className.split(' ')[0]}`;
        return element.tagName.toLowerCase();
    }

    // ========================================
    // 公共API
    // ========================================

    window.ZtEasterEggs = {
        /**
         * 触发指定角色的彩蛋
         */
        trigger: (charId) => {
            const char = EASTER_EGGS[charId];
            if (char) {
                const reaction = char.reactions[Math.floor(Math.random() * char.reactions.length)];
                triggerRandomEgg();
            }
        },

        /**
         * 触发随机彩蛋
         */
        triggerRandom: () => {
            triggerRandomEgg();
        },

        /**
         * 禁用彩蛋系统
         */
        disable: () => {
            localStorage.setItem('zt_eggs_disabled', 'true');
            console.log('🥚 彩蛋系统已禁用');
        },

        /**
         * 启用彩蛋系统
         */
        enable: () => {
            localStorage.removeItem('zt_eggs_disabled');
            console.log('🥚 彩蛋系统已启用');
        },

        /**
         * 检查是否启用
         */
        isEnabled: () => {
            return localStorage.getItem('zt_eggs_disabled') !== 'true';
        },

        /**
         * 获取所有角色
         */
        getCharacters: () => {
            return Object.keys(EASTER_EGGS);
        }
    };

    // ========================================
    // 全局API
    // ========================================

    window.ztTriggerEgg = (charId) => window.ZtEasterEggs.trigger(charId);
    window.ztDisableEggs = () => window.ZtEasterEggs.disable();
    window.ztEnableEggs = () => window.ZtEasterEggs.enable();

    // ========================================
    // 自动初始化
    // ========================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initEasterEggs);
    } else {
        initEasterEggs();
    }

})(jQuery);
