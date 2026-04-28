/**
 * 疯狂动物城 - 阅读进度指示器
 * Zootopia Reading Progress Indicator
 * Version: 1.0.0
 */

(function(window) {
  'use strict';

  // ==================== 配置 ====================
  const ReadingProgressConfig = {
    // 进度条高度
    height: 4,

    // 位置：'top' (顶部) 或 'sidebar' (侧边)
    position: 'top',

    // 主题色
    colors: {
      primary: '#FF9F43',  // 撒哈拉金橙
      secondary: '#0ABDE3', // 冰川蓝
      gradient: true
    },

    // 动画设置
    animation: {
      smooth: true,
      duration: 200,
      easing: 'ease-out'
    },

    // 自动隐藏（sidebar模式）
    autoHide: false,
    hideDelay: 2000,

    // 偏移量（顶部模式下）
    offsetTop: 0,

    // 排除选择器（不需要显示进度条的元素）
    excludeSelectors: [
      '.not-reading-progress',
      '.no-progress'
    ]
  };

  // ==================== 工具函数 ====================
  const Utils = {
    // 防抖
    debounce: function(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait || 150);
      };
    },

    // 节流
    throttle: function(func, limit) {
      let inThrottle;
      return function(...args) {
        if (!inThrottle) {
          func.apply(this, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit || 100);
        }
      };
    },

    // 检查是否应该显示进度条
    shouldShowProgress: function() {
      const { excludeSelectors } = ReadingProgressConfig;
      const path = window.location.pathname;

      // 只对文章页面显示
      if (!path.includes('/20') || path.endsWith('index.html')) {
        return false;
      }

      // 检查排除选择器
      if (excludeSelectors.length > 0) {
        const excluded = document.querySelector(excludeSelectors.join(','));
        if (excluded) {
          return false;
        }
      }

      return true;
    },

    // 获取文章内容容器
    getArticleContent: function() {
      const selectors = [
        '.post-content',
        '.article-content',
        '.entry-content',
        'main article',
        '.markdown-body',
        '#content',
        '.content'
      ];

      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) return element;
      }

      return document.body;
    }
  };

  // ==================== 进度条渲染器 ====================
  const ProgressRenderer = {
    // 顶部进度条
    createTopProgressBar: function() {
      const bar = document.createElement('div');
      bar.id = 'zootopia-reading-progress';
      bar.className = 'zootopia-reading-progress-top';
      bar.style.cssText = `
        position: fixed;
        top: ${ReadingProgressConfig.offsetTop}px;
        left: 0;
        width: 0%;
        height: ${ReadingProgressConfig.height}px;
        background: ${ReadingProgressConfig.colors.gradient
          ? `linear-gradient(90deg, ${ReadingProgressConfig.colors.primary}, ${ReadingProgressConfig.colors.secondary})`
          : ReadingProgressConfig.colors.primary};
        z-index: 9999;
        transition: width 0.1s ease-out;
        pointer-events: none;
        box-shadow: 0 2px 8px rgba(255, 159, 67, 0.3);
      `;

      // 末端光标：小爪印跟随
      var cursor = document.createElement('span');
      cursor.className = 'zt-progress-cursor';
      cursor.innerHTML = '&#128062;'; // paw emoji
      cursor.style.cssText =
        'position:absolute;right:-6px;top:-4px;font-size:11px;' +
        'opacity:0.7;transition:opacity 0.2s ease,transform 0.2s ease;' +
        'transform:rotate(20deg);';
      bar.appendChild(cursor);

      return bar;
    },

    // 侧边进度条
    createSidebarProgress: function() {
      const container = document.createElement('div');
      container.id = 'zootopia-reading-progress-sidebar';
      container.className = 'zootopia-reading-progress-sidebar';
      container.style.cssText = `
        position: fixed;
        top: 50%;
        right: 20px;
        transform: translateY(-50%);
        width: ${ReadingProgressConfig.height}px;
        height: 200px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: ${ReadingProgressConfig.height}px;
        z-index: 9999;
        opacity: 1;
        transition: opacity 0.3s ease;
      `;

      const fill = document.createElement('div');
      fill.id = 'zootopia-reading-progress-fill';
      fill.className = 'zootopia-reading-progress-fill';
      fill.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 0%;
        background: ${ReadingProgressConfig.colors.gradient
          ? `linear-gradient(180deg, ${ReadingProgressConfig.colors.primary}, ${ReadingProgressConfig.colors.secondary})`
          : ReadingProgressConfig.colors.primary};
        border-radius: ${ReadingProgressConfig.height}px;
        transition: height 0.1s ease-out;
      `;

      container.appendChild(fill);
      return { container, fill };
    },

    // 创建进度条
    create: function() {
      if (ReadingProgressConfig.position === 'sidebar') {
        const { container, fill } = this.createSidebarProgress();
        return { container, fill, type: 'sidebar' };
      } else {
        const bar = this.createTopProgressBar();
        return { container: bar, fill: bar, type: 'top' };
      }
    }
  };

  // ==================== 进度计算器 ====================
  const ProgressCalculator = {
    // 计算阅读进度百分比
    calculate: function() {
      const content = Utils.getArticleContent();
      if (!content) return 0;

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const contentTop = content.offsetTop;
      const contentHeight = content.scrollHeight;

      // 内容可滚动高度
      const scrollableHeight = contentHeight - windowHeight - contentTop;

      if (scrollableHeight <= 0) return 0;

      // 计算进度（考虑顶部偏移）
      const scrolled = scrollTop - contentTop + (windowHeight * 0.3);
      let progress = (scrolled / scrollableHeight) * 100;

      // 限制在 0-100 之间
      progress = Math.max(0, Math.min(100, Math.round(progress)));

      return progress;
    },

    // 更新进度显示
    update: function(progressBar) {
      var progress = this.calculate();
      var prev = this._prevProgress || 0;

      if (progressBar.type === 'sidebar') {
        progressBar.fill.style.height = progress + '%';
      } else {
        progressBar.container.style.width = progress + '%';
      }

      // 到达底部时隐藏（针对侧边模式）
      if (ReadingProgressConfig.position === 'sidebar' &&
          ReadingProgressConfig.autoHide) {
        if (progress >= 100) {
          progressBar.container.style.opacity = '0';
        } else {
          progressBar.container.style.opacity = '1';
        }
      }

      // 100% 完成脉冲动画
      if (progress >= 100 && prev < 100) {
        progressBar.container.classList.add('zt-progress-done');
        // 3秒后移除
        setTimeout(function() {
          progressBar.container.classList.remove('zt-progress-done');
        }, 3000);
      }

      this._prevProgress = progress;
    }
  };

  // ==================== 事件管理器 ====================
  const EventManager = {
    init: function(progressBar) {
      // 使用 requestAnimationFrame 优化性能
      let ticking = false;

      const onScroll = function() {
        if (!ticking) {
          window.requestAnimationFrame(function() {
            ProgressCalculator.update(progressBar);
            ticking = false;
          });
          ticking = true;
        }
      };

      // 监听滚动
      window.addEventListener('scroll', onScroll, { passive: true });

      // 页面加载时计算一次
      if (document.readyState === 'complete') {
        setTimeout(() => ProgressCalculator.update(progressBar), 100);
      } else {
        window.addEventListener('load', function() {
          setTimeout(() => ProgressCalculator.update(progressBar), 100);
        });
      }

      // 窗口大小改变时重新计算
      window.addEventListener('resize', Utils.throttle(function() {
        ProgressCalculator.update(progressBar);
      }, 250));
    }
  };

  // ==================== 进度指示器主类 ====================
  const ReadingProgressIndicator = {
    instance: null,
    initialized: false,
    progressBar: null,

    // 初始化
    init: function() {
      if (this.initialized) return;

      // 检查是否应该显示
      if (!Utils.shouldShowProgress()) {
        return;
      }

      // 创建进度条
      this.progressBar = ProgressRenderer.create();
      document.body.appendChild(this.progressBar.container);

      // 绑定事件
      EventManager.init(this.progressBar);

      this.initialized = true;
      this.instance = this;

      console.log('🐰🦊 Reading Progress Indicator initialized');
    },

    // 手动设置进度
    setProgress: function(percentage) {
      if (this.progressBar) {
        percentage = Math.max(0, Math.min(100, percentage));
        if (this.progressBar.type === 'sidebar') {
          this.progressBar.fill.style.height = percentage + '%';
        } else {
          this.progressBar.container.style.width = percentage + '%';
        }
      }
    },

    // 显示/隐藏
    show: function() {
      if (this.progressBar) {
        this.progressBar.container.style.display = 'block';
      }
    },

    hide: function() {
      if (this.progressBar) {
        this.progressBar.container.style.display = 'none';
      }
    },

    // 销毁
    destroy: function() {
      if (this.progressBar && this.progressBar.container) {
        this.progressBar.container.remove();
      }
      this.initialized = false;
      this.progressBar = null;
    },

    // 更新配置
    updateConfig: function(newConfig) {
      Object.assign(ReadingProgressConfig, newConfig);
      if (this.initialized) {
        this.destroy();
        this.init();
      }
    }
  };

  // ==================== 导出 API ====================
  window.ReadingProgress = {
    init: function(config) {
      if (config) {
        Object.assign(ReadingProgressConfig, config);
      }
      ReadingProgressIndicator.init();
    },

    setProgress: function(percentage) {
      ReadingProgressIndicator.setProgress(percentage);
    },

    show: function() {
      ReadingProgressIndicator.show();
    },

    hide: function() {
      ReadingProgressIndicator.hide();
    },

    destroy: function() {
      ReadingProgressIndicator.destroy();
    },

    updateConfig: function(config) {
      ReadingProgressIndicator.updateConfig(config);
    }
  };

  // ==================== 自动初始化 ====================
  if (document.readyState === 'complete') {
    setTimeout(() => {
      if (window.Zootopia && window.Zootopia.coreLoaded) {
        ReadingProgressIndicator.init();
      } else {
        // 等待 Zootopia Core 加载
        document.addEventListener('zootopia:loaded', function() {
          setTimeout(() => ReadingProgressIndicator.init(), 500);
        });
      }
    }, 100);
  } else {
    window.addEventListener('load', function() {
      setTimeout(() => {
        if (window.Zootopia && window.Zootopia.coreLoaded) {
          ReadingProgressIndicator.init();
        } else {
          document.addEventListener('zootopia:loaded', function() {
            setTimeout(() => ReadingProgressIndicator.init(), 500);
          });
        }
      }, 100);
    });
  }

  console.log('🐰🦊 Reading Progress Module loaded');

})(window);
