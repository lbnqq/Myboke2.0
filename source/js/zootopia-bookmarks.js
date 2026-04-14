/**
 * 疯狂动物城 - 文章书签功能
 * Zootopia Bookmarks Feature
 * Version: 1.0.0
 */

(function(window) {
  'use strict';

  // ==================== 配置 ====================
  const BookmarksConfig = {
    // 存储键名
    storageKey: 'zootopia-bookmarks',

    // 书签最大数量限制
    maxBookmarks: 100,

    // 自动备份到localStorage
    autoSave: true,

    // 启用快捷键
    enableShortcuts: true,

    // 收藏按钮位置
    buttonPosition: 'article-header', // 'article-header', 'floating', 'both'

    // 动画设置
    animation: {
      showDuration: 300,
      hideDuration: 300,
      easing: 'ease-out'
    },

    // 主题色
    colors: {
      primary: '#FF9F43',
      secondary: '#0ABDE3',
      gradient: true,
      inactive: '#CCCCCC'
    },

    // 显示收藏数量徽章
    showCountBadge: true,

    // 导入/导出功能
    enableImportExport: true
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

    // 生成唯一ID
    generateId: function() {
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // 安全JSON操作
    safeJSON: {
      parse: function(str) {
        try {
          return JSON.parse(str);
        } catch (e) {
          return {};
        }
      },
      stringify: function(obj) {
        try {
          return JSON.stringify(obj);
        } catch (e) {
          return '{}';
        }
      }
    }
  };

  // ==================== 数据管理器 ====================
  const DataManager = {
    // 获取所有书签
    getAll: function() {
      const data = localStorage.getItem(BookmarksConfig.storageKey);
      return Utils.safeJSON.parse(data) || {};
    },

    // 保存所有书签
    saveAll: function(bookmarks) {
      if (BookmarksConfig.autoSave) {
        localStorage.setItem(BookmarksConfig.storageKey, Utils.safeJSON.stringify(bookmarks));
      }
    },

    // 添加书签
    add: function(article) {
      const bookmarks = this.getAll();
      const id = Utils.generateId();
      bookmarks[id] = {
        id: id,
        title: article.title,
        url: article.url,
        dateAdded: new Date().toISOString(),
        excerpt: article.excerpt || '',
        tags: article.tags || [],
        category: article.category || '',
        readCount: 0
      };

      // 检查限制
      if (Object.keys(bookmarks).length > BookmarksConfig.maxBookmarks) {
        // 删除最旧的书签
        const oldest = Object.entries(bookmarks)
          .sort((a, b) => new Date(a[1].dateAdded) - new Date(b[1].dateAdded))[0];
        if (oldest) {
          delete bookmarks[oldest[0]];
        }
      }

      this.saveAll(bookmarks);
      return id;
    },

    // 移除书签
    remove: function(bookmarkId) {
      const bookmarks = this.getAll();
      if (bookmarks[bookmarkId]) {
        delete bookmarks[bookmarkId];
        this.saveAll(bookmarks);
        return true;
      }
      return false;
    },

    // 检查是否已收藏
    exists: function(articleUrl) {
      const bookmarks = this.getAll();
      return Object.values(bookmarks).some(b => b.url === articleUrl);
    },

    // 通过URL查找书签ID
    findIdByUrl: function(articleUrl) {
      const bookmarks = this.getAll();
      const entry = Object.values(bookmarks).find(b => b.url === articleUrl);
      return entry ? entry.id : null;
    },

    // 获取所有书签列表（按日期倒序）
    list: function(limit) {
      const bookmarks = this.getAll();
      const list = Object.values(bookmarks).sort((a, b) =>
        new Date(b.dateAdded) - new Date(a.dateAdded)
      );
      return limit ? list.slice(0, limit) : list;
    },

    // 增加阅读次数
    incrementReadCount: function(bookmarkId) {
      const bookmarks = this.getAll();
      if (bookmarks[bookmarkId]) {
        bookmarks[bookmarkId].readCount = (bookmarks[bookmarkId].readCount || 0) + 1;
        this.saveAll(bookmarks);
      }
    },

    // 清空所有书签
    clearAll: function() {
      this.saveAll({});
    },

    // 导出书签（JSON）
    export: function() {
      return Utils.safeJSON.stringify(this.getAll());
    },

    // 导入书签（JSON）
    import: function(jsonString) {
      const data = Utils.safeJSON.parse(jsonString);
      if (typeof data === 'object' && data !== null) {
        const current = this.getAll();
        const merged = { ...current, ...data };
        this.saveAll(merged);
        return Object.keys(data).length;
      }
      return 0;
    },

    // 获取统计信息
    getStats: function() {
      const bookmarks = this.getAll();
      const list = Object.values(bookmarks);
      return {
        total: list.length,
        thisWeek: list.filter(b => {
          const date = new Date(b.dateAdded);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return date >= weekAgo;
        }).length,
        byTag: this._groupBy('tags', list),
        byCategory: this._groupBy('category', list)
      };
    },

    _groupBy: function(key, array) {
      return array.reduce((acc, item) => {
        const value = item[key];
        if (value) {
          if (Array.isArray(value)) {
            value.forEach(v => {
              acc[v] = (acc[v] || 0) + 1;
            });
          } else {
            acc[value] = (acc[value] || 0) + 1;
          }
        }
        return acc;
      }, {});
    }
  };

  // ==================== 按钮渲染器 ====================
  const ButtonRenderer = {
    // 创建收藏按钮
    createBookmarkButton: function(articleUrl, articleTitle) {
      const button = document.createElement('button');
      button.id = 'zootopia-bookmark-button';
      button.className = 'zootopia-bookmark-button';
      button.setAttribute('aria-label', '收藏文章');
      button.setAttribute('title', '收藏文章 (快捷键: F)');
      button.setAttribute('type', 'button');
      button.dataset.articleUrl = articleUrl;

      const isBookmarked = DataManager.exists(articleUrl);
      this._updateButtonState(button, isBookmarked);

      // 样式
      button.style.cssText = `
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 8px 16px;
        background: ${isBookmarked
          ? 'linear-gradient(135deg, var(--zt-primary, #FF9F43), var(--zt-secondary, #0ABDE3))'
          : 'rgba(255, 255, 255, 0.1)'};
        border: ${isBookmarked ? 'none' : '2px solid rgba(255, 159, 67, 0.3)'};
        border-radius: 20px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        color: ${isBookmarked ? 'white' : 'var(--zt-primary, #FF9F43)'};
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        outline: none;
        -webkit-tap-highlight-color: transparent;
      `;

      // 图标
      const icon = this._getIcon(isBookmarked);
      button.innerHTML = `${icon}<span>收藏</span>`;

      // 点击事件
      button.addEventListener('click', function(e) {
        e.preventDefault();
        Bookmarks.toggle(articleUrl, articleTitle);
      });

      // 键盘支持
      button.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          Bookmarks.toggle(articleUrl, articleTitle);
        }
      });

      return button;
    },

    // 更新按钮状态
    _updateButtonState: function(button, isBookmarked) {
      if (isBookmarked) {
        button.style.background = 'linear-gradient(135deg, var(--zt-primary, #FF9F43), var(--zt-secondary, #0ABDE3))';
        button.style.border = 'none';
        button.style.color = 'white';
        button.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <span>已收藏</span>
        `;
      } else {
        button.style.background = 'rgba(255, 255, 255, 0.1)';
        button.style.border = '2px solid rgba(255, 159, 67, 0.3)';
        button.style.color = 'var(--zt-primary, #FF9F43)';
        button.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
          </svg>
          <span>收藏</span>
        `;
      }
    },

    // 获取图标
    _getIcon: function(isBookmarked) {
      if (isBookmarked) {
        return `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        `;
      } else {
        return `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
          </svg>
        `;
      }
    }
  };

  // ==================== 侧边栏渲染器 ====================
  const SidebarRenderer = {
    createSidebar: function() {
      const sidebar = document.createElement('div');
      sidebar.id = 'zootopia-bookmarks-sidebar';
      sidebar.className = 'zootopia-bookmarks-sidebar';
      sidebar.setAttribute('aria-label', '书签侧边栏');

      sidebar.style.cssText = `
        position: fixed;
        top: 50%;
        right: 20px;
        transform: translateY(-50%);
        width: 280px;
        max-height: 80vh;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        z-index: 9998;
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;

      // 标题栏
      const header = document.createElement('div');
      header.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px;
        background: linear-gradient(135deg, var(--zt-primary, #FF9F43), var(--zt-secondary, #0ABDE3));
        color: white;
        font-weight: 600;
        font-size: 16px;
      `;
      header.innerHTML = `
        <span>📚 我的收藏</span>
        <button id="zootopia-bookmarks-toggle" class="zootopia-bookmarks-toggle" style="
          background: rgba(255,255,255,0.2);
          border: none;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          cursor: pointer;
          color: white;
          font-size: 18px;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        ">−</button>
      `;

      // 内容区
      const content = document.createElement('div');
      content.id = 'zootopia-bookmarks-content';
      content.className = 'zootopia-bookmarks-content';
      content.style.cssText = `
        padding: 12px;
        overflow-y: auto;
        max-height: calc(80vh - 60px);
      `;

      sidebar.appendChild(header);
      sidebar.appendChild(content);

      // 初始隐藏
      setTimeout(() => {
        sidebar.style.opacity = '1';
      }, 100);

      return { sidebar, header, content };
    },

    renderList: function(container) {
      const bookmarks = DataManager.list(20);
      const stats = DataManager.getStats();

      if (bookmarks.length === 0) {
        container.innerHTML = `
          <div style="
            text-align: center;
            padding: 40px 20px;
            color: rgba(0,0,0,0.5);
            font-size: 14px;
          ">
            <div style="font-size: 48px; margin-bottom: 16px;">📖</div>
            <div>还没有收藏的文章</div>
            <div style="font-size: 12px; margin-top: 8px;">阅读文章时点击收藏按钮</div>
          </div>
        `;
        return;
      }

      let html = `
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 4px;
          font-size: 12px;
          color: rgba(0,0,0,0.6);
          border-bottom: 1px solid rgba(0,0,0,0.08);
          margin-bottom: 8px;
        ">
          <span>共 ${stats.total} 篇收藏</span>
          <div>
            <button id="zootopia-bookmarks-export" style="
              background: none;
              border: none;
              color: var(--zt-primary, #FF9F43);
              cursor: pointer;
              font-size: 12px;
              padding: 4px 8px;
              border-radius: 4px;
            ">导出</button>
            <button id="zootopia-bookmarks-clear" style="
              background: none;
              border: none;
              color: rgba(255, 0, 0, 0.6);
              cursor: pointer;
              font-size: 12px;
              padding: 4px 8px;
              border-radius: 4px;
            ">清空</button>
          </div>
        </div>
      `;

      bookmarks.forEach(bookmark => {
        const date = new Date(bookmark.dateAdded);
        const dateStr = date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });

        html += `
          <div class="zootopia-bookmark-item" data-id="${bookmark.id}" style="
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 12px;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.6);
            margin-bottom: 8px;
            transition: all 0.2s ease;
            cursor: pointer;
          ">
            <div style="
              flex-shrink: 0;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background: linear-gradient(135deg, var(--zt-primary, #FF9F43), var(--zt-secondary, #0ABDE3));
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 14px;
            ">📚</div>
            <div style="flex: 1; min-width: 0;">
              <div style="
                font-size: 13px;
                font-weight: 500;
                color: #333;
                line-height: 1.4;
                margin-bottom: 4px;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
              ">${this._escapeHtml(bookmark.title)}</div>
              <div style="
                font-size: 11px;
                color: rgba(0,0,0,0.5);
                display: flex;
                gap: 8px;
                align-items: center;
              ">
                <span>${dateStr}</span>
                ${bookmark.readCount > 0 ? `<span>👁 ${bookmark.readCount}</span>` : ''}
              </div>
            </div>
            <button class="zootopia-bookmark-remove" data-id="${bookmark.id}" style="
              flex-shrink: 0;
              background: none;
              border: none;
              cursor: pointer;
              color: rgba(0,0,0,0.3);
              font-size: 16px;
              padding: 4px;
              border-radius: 4px;
              transition: all 0.2s;
            " title="移除">✕</button>
          </div>
        `;
      });

      container.innerHTML = html;

      // 绑定事件
      this._bindEvents(container);
    },

    _escapeHtml: function(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    },

    _bindEvents: function(container) {
      // 书签项点击（跳转）
      container.querySelectorAll('.zootopia-bookmark-item').forEach(item => {
        item.addEventListener('click', function(e) {
          if (e.target.classList.contains('zootopia-bookmark-remove')) return;
          const id = this.dataset.id;
          const bookmarks = DataManager.getAll();
          if (bookmarks[id]) {
            DataManager.incrementReadCount(id);
            window.open(bookmarks[id].url, '_blank', 'noopener,noreferrer');
          }
        });
      });

      // 移除按钮
      container.querySelectorAll('.zootopia-bookmark-remove').forEach(btn => {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          const id = this.dataset.id;
          if (confirm('确定要移除这篇收藏吗？')) {
            DataManager.remove(id);
            Bookmarks.updateUI();
            Bookmarks.showNotification('已移除收藏');
          }
        });
      });

      // 导出按钮
      const exportBtn = container.querySelector('#zootopia-bookmarks-export');
      if (exportBtn) {
        exportBtn.addEventListener('click', function() {
          const json = DataManager.export();
          const blob = new Blob([json], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `bookmarks-${new Date().toISOString().split('T')[0]}.json`;
          a.click();
          URL.revokeObjectURL(url);
          Bookmarks.showNotification('书签已导出');
        });
      }

      // 清空按钮
      const clearBtn = container.querySelector('#zootopia-bookmarks-clear');
      if (clearBtn) {
        clearBtn.addEventListener('click', function() {
          if (confirm('确定要清空所有收藏吗？此操作不可撤销。')) {
            DataManager.clearAll();
            Bookmarks.updateUI();
            Bookmarks.showNotification('已清空所有收藏');
          }
        });
      }
    }
  };

  // ==================== 浮动按钮 ====================
  const FloatingButton = {
    create: function() {
      const btn = document.createElement('button');
      btn.id = 'zootopia-bookmarks-float';
      btn.className = 'zootopia-bookmarks-float';
      btn.setAttribute('aria-label', '打开书签面板');
      btn.setAttribute('title', '查看收藏');

      btn.style.cssText = `
        position: fixed;
        right: 24px;
        bottom: 100px;
        width: 56px;
        height: 56px;
        background: linear-gradient(135deg, var(--zt-primary, #FF9F43), var(--zt-secondary, #0ABDE3));
        border: none;
        border-radius: 50%;
        cursor: pointer;
        z-index: 9997;
        box-shadow: 0 4px 16px rgba(255, 159, 67, 0.4);
        display: none;
        align-items: center;
        justify-content: center;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        -webkit-tap-highlight-color: transparent;
      `;

      const stats = DataManager.getStats();
      btn.innerHTML = `
        <div style="
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
          ${stats.total > 0 ? `
            <span style="
              position: absolute;
              top: -4px;
              right: -4px;
              background: #ff4757;
              color: white;
              font-size: 10px;
              font-weight: bold;
              min-width: 18px;
              height: 18px;
              border-radius: 9px;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 0 5px;
            ">${stats.total > 99 ? '99+' : stats.total}</span>
          ` : ''}
        </div>
      `;

      btn.addEventListener('click', function() {
        Bookmarks.toggleSidebar();
      });

      btn.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.1)';
        this.style.boxShadow = '0 6px 24px rgba(255, 159, 67, 0.6)';
      });

      btn.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
        this.style.boxShadow = '0 4px 16px rgba(255, 159, 67, 0.4)';
      });

      return btn;
    }
  };

  // ==================== 主控制器 ====================
  const Bookmarks = {
    instance: null,
    initialized: false,
    sidebar: null,
    floatBtn: null,
    currentArticle: null,

    // 初始化
    init: function(config) {
      if (this.initialized) return;

      if (config) {
        Object.assign(BookmarksConfig, config);
      }

      this.currentArticle = this._getCurrentArticle();

      // 创建侧边栏
      if (!document.getElementById('zootopia-bookmarks-sidebar')) {
        const { sidebar, header, content } = SidebarRenderer.createSidebar();
        document.body.appendChild(sidebar);
        this.sidebar = sidebar;

        // 侧边栏切换按钮
        header.querySelector('.zootopia-bookmarks-toggle').addEventListener('click', () => {
          this.toggleSidebar();
        });
      }

      // 创建浮动按钮
      if (!document.getElementById('zootopia-bookmarks-float') && BookmarksConfig.buttonPosition !== 'article-header') {
        this.floatBtn = FloatingButton.create();
        document.body.appendChild(this.floatBtn);
        this._updateFloatButtonVisibility();
      }

      // 在文章头部添加收藏按钮
      if (BookmarksConfig.buttonPosition !== 'floating' && this.currentArticle) {
        this._injectArticleButton();
      }

      // 注册快捷键
      if (BookmarksConfig.enableShortcuts) {
        this._registerShortcuts();
      }

      // 监听收藏事件
      document.addEventListener('bookmark:added', () => this.updateUI());
      document.addEventListener('bookmark:removed', () => this.updateUI());

      // 初始更新
      setTimeout(() => this.updateUI(), 100);

      this.initialized = true;
      this.instance = this;

      console.log('🐰🦊 Bookmarks Module initialized');
    },

    // 切换书签状态
    toggle: function(articleUrl, articleTitle) {
      if (!articleUrl || !articleTitle) {
        const article = this._getCurrentArticle();
        if (article) {
          articleUrl = article.url;
          articleTitle = article.title;
        }
      }

      if (!articleUrl) {
        console.warn('Bookmarks: Cannot toggle - no article URL');
        return;
      }

      const existingId = DataManager.findIdByUrl(articleUrl);

      if (existingId) {
        // 移除
        DataManager.remove(existingId);
        this.showNotification('已取消收藏');
        document.dispatchEvent(new CustomEvent('bookmark:removed'));
      } else {
        // 添加
        DataManager.add({
          title: articleTitle,
          url: articleUrl,
          excerpt: this._getArticleExcerpt(),
          tags: this._getArticleTags(),
          category: this._getArticleCategory()
        });
        this.showNotification('已添加收藏');
        document.dispatchEvent(new CustomEvent('bookmark:added'));
      }

      this.updateUI();
    },

    // 更新所有UI状态
    updateUI: function() {
      const article = this.currentArticle || this._getCurrentArticle();

      // 更新文章头部按钮
      const articleBtn = document.getElementById('zootopia-bookmark-button');
      if (articleBtn && article) {
        const isBookmarked = DataManager.exists(article.url);
        ButtonRenderer._updateButtonState(articleBtn, isBookmarked);
      }

      // 更新侧边栏列表
      if (this.sidebar) {
        const content = this.sidebar.querySelector('#zootopia-bookmarks-content');
        if (content) {
          SidebarRenderer.renderList(content);
        }
      }

      // 更新浮动按钮计数
      if (this.floatBtn) {
        this.floatBtn.remove();
        this.floatBtn = FloatingButton.create();
        document.body.appendChild(this.floatBtn);
        this._updateFloatButtonVisibility();
      }
    },

    // 切换侧边栏显示
    toggleSidebar: function() {
      if (!this.sidebar) return;

      const isVisible = this.sidebar.style.opacity === '1' && this.sidebar.style.pointerEvents !== 'none';
      const content = this.sidebar.querySelector('#zootopia-bookmarks-content');

      if (isVisible) {
        this.sidebar.style.opacity = '0';
        this.sidebar.style.pointerEvents = 'none';
        this.sidebar.style.transform = 'translateY(-50%) scale(0.95)';
      } else {
        this.sidebar.style.opacity = '1';
        this.sidebar.style.pointerEvents = 'auto';
        this.sidebar.style.transform = 'translateY(-50%) scale(1)';
        // 刷新列表
        if (content) {
          SidebarRenderer.renderList(content);
        }
      }
    },

    // 注入文章头部按钮
    _injectArticleButton: function() {
      const selectors = [
        '.post-header',
        '.article-header',
        '.entry-header',
        'header.post-meta',
        '.post-info'
      ];

      const container = selectors.map(s => document.querySelector(s)).find(el => el);
      if (container) {
        const btn = ButtonRenderer.createBookmarkButton(this.currentArticle.url, this.currentArticle.title);
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(0,0,0,0.1);';
        wrapper.appendChild(btn);
        container.appendChild(wrapper);
      }
    },

    // 更新浮动按钮可见性
    _updateFloatButtonVisibility: function() {
      if (!this.floatBtn) return;

      const stats = DataManager.getStats();
      this.floatBtn.style.display = stats.total > 0 ? 'flex' : 'none';
    },

    // 注册快捷键
    _registerShortcuts: function() {
      document.addEventListener('keydown', function(e) {
        // F 键快速收藏（当不在输入框中时）
        if (e.key === 'f' && !this._isTyping(e.target)) {
          const article = Bookmarks._getCurrentArticle();
          if (article) {
            Bookmarks.toggle(article.url, article.title);
          }
        }

        // Ctrl/Cmd + B 打开书签面板
        if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
          e.preventDefault();
          Bookmarks.toggleSidebar();
        }
      }.bind(this));
    },

    _isTyping: function(target) {
      const tag = target.tagName.toLowerCase();
      const type = target.type ? target.type.toLowerCase() : '';
      return ['input', 'textarea', 'select'].includes(tag) ||
             type.includes('text') || type.includes('search') || type.includes('email') || type.includes('password');
    },

    // 获取当前文章信息
    _getCurrentArticle: function() {
      const title = document.title || document.querySelector('h1')?.textContent?.trim() || '';
      const url = window.location.href;

      // 排除非文章页面
      const excludePatterns = [
        /\/$/,
        /\/index\.html?$/,
        /\/tags\//,
        /\/categories\//,
        /\/archives\//,
        /\/search\?/
      ];

      if (excludePatterns.some(p => p.test(url))) {
        return null;
      }

      return {
        title: title,
        url: url,
        excerpt: this._getArticleExcerpt(),
        tags: this._getArticleTags(),
        category: this._getArticleCategory()
      };
    },

    _getArticleExcerpt: function() {
      const selectors = ['.post-content', '.article-content', '.entry-content', '.content'];
      const content = selectors.map(s => document.querySelector(s)).find(el => el);
      if (content) {
        const text = content.textContent || '';
        return text.trim().substring(0, 200);
      }
      return '';
    },

    _getArticleTags: function() {
      const tags = Array.from(document.querySelectorAll('.post-tags a, .article-tag, .tags a')).map(a => a.textContent.trim());
      return tags;
    },

    _getArticleCategory: function() {
      const categoryEl = document.querySelector('.post-category, .article-category, .categories a');
      return categoryEl ? categoryEl.textContent.trim() : '';
    },

    // 显示通知
    showNotification: function(message, type = 'success') {
      // 移除现有通知
      const existing = document.querySelector('.zootopia-bookmarks-notification');
      if (existing) existing.remove();

      const notification = document.createElement('div');
      notification.className = 'zootopia-bookmarks-notification';
      notification.textContent = message;
      notification.style.cssText = `
        position: fixed;
        top: 24px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 24px;
        background: ${type === 'success'
          ? 'linear-gradient(135deg, var(--zt-primary, #FF9F43), var(--zt-secondary, #0ABDE3))'
          : 'rgba(255, 0, 0, 0.8)'};
        color: white;
        border-radius: 24px;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;

      document.body.appendChild(notification);

      // 动画进入
      requestAnimationFrame(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(-50%) translateY(0)';
      });

      // 自动消失
      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(-50%) translateY(-10px)';
        setTimeout(() => notification.remove(), 300);
      }, 2000);
    },

    // 销毁
    destroy: function() {
      if (this.sidebar) {
        this.sidebar.remove();
        this.sidebar = null;
      }
      if (this.floatBtn) {
        this.floatBtn.remove();
        this.floatBtn = null;
      }
      const articleBtn = document.getElementById('zootopia-bookmark-button');
      if (articleBtn) articleBtn.remove();
      this.initialized = false;
    },

    // 更新配置
    updateConfig: function(newConfig) {
      Object.assign(BookmarksConfig, newConfig);
      if (this.initialized) {
        this.destroy();
        this.init();
      }
    }
  };

  // ==================== 导出 API ====================
  window.Bookmarks = {
    init: function(config) {
      Bookmarks.init(config);
    },

    toggle: function(url, title) {
      Bookmarks.toggle(url, title);
    },

    add: function(article) {
      return DataManager.add(article);
    },

    remove: function(id) {
      return DataManager.remove(id);
    },

    list: function(limit) {
      return DataManager.list(limit);
    },

    getStats: function() {
      return DataManager.getStats();
    },

    exists: function(url) {
      return DataManager.exists(url);
    },

    showSidebar: function() {
      Bookmarks.toggleSidebar();
    },

    hideSidebar: function() {
      if (Bookmarks.sidebar) {
        Bookmarks.sidebar.style.opacity = '0';
        Bookmarks.sidebar.style.pointerEvents = 'none';
      }
    },

    export: function() {
      return DataManager.export();
    },

    import: function(json) {
      return DataManager.import(json);
    },

    clearAll: function() {
      if (confirm('确定要清空所有收藏吗？')) {
        DataManager.clearAll();
        Bookmarks.updateUI();
        Bookmarks.showNotification('已清空所有收藏');
      }
    },

    destroy: function() {
      Bookmarks.destroy();
    },

    updateConfig: function(config) {
      Bookmarks.updateConfig(config);
    }
  };

  // ==================== 自动初始化 ====================
  if (document.readyState === 'complete') {
    setTimeout(() => {
      if (window.Zootopia && window.Zootopia.coreLoaded) {
        Bookmarks.init();
      } else {
        document.addEventListener('zootopia:loaded', function() {
          setTimeout(() => Bookmarks.init(), 500);
        });
      }
    }, 100);
  } else {
    window.addEventListener('load', function() {
      setTimeout(() => {
        if (window.Zootopia && window.Zootopia.coreLoaded) {
          Bookmarks.init();
        } else {
          document.addEventListener('zootopia:loaded', function() {
            setTimeout(() => Bookmarks.init(), 500);
          });
        }
      }, 100);
    });
  }

  console.log('🐰🦊 Bookmarks Module loaded');

})(window);
