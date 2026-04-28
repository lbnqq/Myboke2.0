/**
 * 疯狂动物城文章页面增强系统
 * Zootopia Post Enhancement
 *
 * 相关文章推荐、阅读时间显示、文章评分等功能
 */

(function() {
  'use strict';

  const PostEnhancementConfig = {
    // 相关文章
    relatedPosts: {
      enabled: true,
      maxPosts: 6,
      algorithm: 'tags', // tags, category, mixed
      showThumbnail: true
    },

    // 阅读时间
    readingTime: {
      enabled: true,
      wordsPerMinute: 300,
      showIcon: true,
      position: 'meta' // meta, separate
    },

    // 文章评分
    rating: {
      enabled: true,
      maxStars: 5,
      allowUserRating: true,
      saveToLocalStorage: true
    },

    // 文章目录增强
    tocEnhancement: {
      enabled: true,
      showProgress: true,
      autoCollapse: true
    },

    // 文章分享
    share: {
      enabled: true,
      position: 'bottom', // top, bottom, both
      showCount: false
    }
  };

  /**
   * 文章增强管理器
   */
  const PostEnhancement = {
    /**
     * 初始化
     */
    init: function() {
      // 确保在文章页面
      if (!this.isPostPage()) return;

      // 显示阅读时间
      if (PostEnhancementConfig.readingTime.enabled) {
        this.showReadingTime();
      }

      // 相关文章
      if (PostEnhancementConfig.relatedPosts.enabled) {
        this.showRelatedPosts();
      }

      // 文章评分
      if (PostEnhancementConfig.rating.enabled) {
        this.initRating();
      }

      // 打印按钮
      this.addPrintButton();

      // 阅读完毕检测
      this.detectReadCompletion();
    },

    /**
     * 检查是否是文章页面
     */
    isPostPage: function() {
      return document.querySelector('article.post') ||
             document.querySelector('.post-content') ||
             document.body.classList.contains('post-page');
    },

    /**
     * 显示阅读时间
     */
    showReadingTime: function() {
      const content = document.querySelector('.post-content, .entry-content, article');
      if (!content) return;

      const text = content.textContent || '';
      const words = text.trim().split(/\s+/).length;
      const minutes = Math.ceil(words / PostEnhancementConfig.readingTime.wordsPerMinute);

      const readingTimeElement = document.createElement('span');
      readingTimeElement.className = 'zt-reading-time';
      readingTimeElement.innerHTML = `
        ${PostEnhancementConfig.readingTime.showIcon ? '<span class="zt-icon">⏱️</span>' : ''}
        <span class="zt-text">约 ${minutes} 分钟</span>
      `;

      // 插入到元信息区域
      const meta = document.querySelector('.post-meta, .entry-meta, .post-header-meta');
      if (meta) {
        meta.appendChild(readingTimeElement);
      }
    },

    /**
     * 显示相关文章
     */
    showRelatedPosts: function() {
      const currentTags = this.getCurrentTags();
      const currentCategory = this.getCurrentCategory();
      const currentUrl = window.location.pathname;

      // 获取所有文章
      const allPosts = this.getAllPosts();

      // 计算相关性分数
      const scored = allPosts
        .filter(post => post.url !== currentUrl)
        .map(post => ({
          ...post,
          score: this.calculateRelevanceScore(post, currentTags, currentCategory)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, PostEnhancementConfig.relatedPosts.maxPosts);

      if (scored.length === 0) return;

      // 渲染相关文章
      this.renderRelatedPosts(scored);
    },

    /**
     * 获取当前文章标签
     */
    getCurrentTags: function() {
      const tags = document.querySelectorAll('.post-tags a, .entry-tags a');
      return Array.from(tags).map(tag => tag.textContent.toLowerCase());
    },

    /**
     * 获取当前文章分类
     */
    getCurrentCategory: function() {
      const category = document.querySelector('.post-category a, .entry-category a');
      return category ? category.textContent.toLowerCase() : '';
    },

    /**
     * 获取所有文章
     */
    getAllPosts: function() {
      // 从 localStorage 获取缓存的文章列表
      const cached = localStorage.getItem('zt_all_posts');

      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          console.warn('Failed to parse cached posts');
        }
      }

      // 从页面中提取文章信息
      const posts = [];

      document.querySelectorAll('.post-item, article.post, .post-card').forEach(post => {
        const title = post.querySelector('.post-title, h1, h2, .entry-title')?.textContent || '';
        const url = post.querySelector('a')?.href || post.dataset.url || '';
        const excerpt = post.querySelector('.post-excerpt, .entry-excerpt, p')?.textContent || '';
        const thumbnail = post.querySelector('img')?.src || '';
        const date = post.querySelector('.post-date, time')?.textContent || '';

        posts.push({ title, url, excerpt, thumbnail, date });
      });

      // 缓存文章列表
      try {
        localStorage.setItem('zt_all_posts', JSON.stringify(posts));
      } catch (e) {
        console.warn('Failed to cache posts');
      }

      return posts;
    },

    /**
     * 计算相关性分数
     */
    calculateRelevanceScore: function(post, tags, category) {
      let score = 0;

      // 标签匹配（权重最高）
      const postTags = post.tags || [];
      const matchingTags = tags.filter(tag => postTags.includes(tag));
      score += matchingTags.length * 10;

      // 分类匹配
      if (category && post.category === category) {
        score += 5;
      }

      return score;
    },

    /**
     * 渲染相关文章
     */
    renderRelatedPosts: function(posts) {
      const container = document.createElement('div');
      container.className = 'zt-related-posts';
      container.innerHTML = `
        <h3 class="zt-related-posts-title">📚 相关文章</h3>
        <div class="zt-related-posts-list">
          ${posts.map(post => this.renderPostCard(post)).join('')}
        </div>
      `;

      // 插入到文章内容后面
      const article = document.querySelector('article.post') || document.querySelector('.post-content');
      if (article) {
        article.parentNode.insertBefore(container, article.nextSibling);
      }
    },

    /**
     * 渲染文章卡片
     */
    renderPostCard: function(post) {
      const thumbnail = PostEnhancementConfig.relatedPosts.showThumbnail && post.thumbnail ?
        `<img src="${post.thumbnail}" alt="${post.title}" class="zt-related-post-thumb">` : '';

      return `
        <a href="${post.url}" class="zt-related-post">
          ${thumbnail}
          <div class="zt-related-post-content">
            <h4 class="zt-related-post-title">${post.title}</h4>
            ${post.excerpt ? `<p class="zt-related-post-excerpt">${post.excerpt.substring(0, 100)}...</p>` : ''}
            ${post.date ? `<span class="zt-related-post-date">${post.date}</span>` : ''}
          </div>
        </a>
      `;
    },

    /**
     * 初始化评分系统
     */
    initRating: function() {
      const article = document.querySelector('article.post');
      if (!article) return;

      // 获取文章 URL 作为唯一标识
      const postUrl = window.location.pathname;

      // 加载已保存的评分
      const savedRating = this.loadRating(postUrl);

      // 创建评分组件
      const ratingContainer = document.createElement('div');
      ratingContainer.className = 'zt-post-rating';
      ratingContainer.innerHTML = `
        <div class="zt-rating-stars">
          ${this.renderStars(savedRating)}
        </div>
        <div class="zt-rating-text">
          <span class="zt-rating-score">${savedRating > 0 ? savedRating.toFixed(1) : '暂无评分'}</span>
          <span class="zt-rating-count">(${this.getRatingCount(postUrl)} 人评分)</span>
        </div>
      `;

      // 插入到文章元信息区域
      const meta = document.querySelector('.post-meta, .entry-meta');
      if (meta) {
        meta.appendChild(ratingContainer);
      }

      // 附加事件
      if (PostEnhancementConfig.rating.allowUserRating) {
        this.attachRatingEvents(ratingContainer, postUrl);
      }
    },

    /**
     * 渲染星星
     */
    renderStars: function(rating) {
      const stars = [];
      const fullStars = Math.floor(rating);
      const hasHalfStar = rating % 1 >= 0.5;

      for (let i = 1; i <= PostEnhancementConfig.rating.maxStars; i++) {
        if (i <= fullStars) {
          stars.push('<span class="zt-star zt-star-full">★</span>');
        } else if (i === fullStars + 1 && hasHalfStar) {
          stars.push('<span class="zt-star zt-star-half">★</span>');
        } else {
          stars.push('<span class="zt-star zt-star-empty">☆</span>');
        }
      }

      return stars.join('');
    },

    /**
     * 附加评分事件
     */
    attachRatingEvents: function(container, postUrl) {
      const stars = container.querySelectorAll('.zt-star');

      stars.forEach((star, index) => {
        star.style.cursor = 'pointer';

        star.addEventListener('click', () => {
          const rating = index + 1;
          this.saveRating(postUrl, rating);
          this.updateRatingDisplay(container, rating);

          if (window.ztNotify) {
            ztNotify({
              type: 'success',
              message: `评分成功：${rating} 星`,
              duration: 2000
            });
          }
        });

        // 悬停效果
        star.addEventListener('mouseenter', () => {
          this.highlightStars(stars, index);
        });

        star.addEventListener('mouseleave', () => {
          this.resetStars(stars);
        });
      });
    },

    /**
     * 高亮星星
     */
    highlightStars: function(stars, index) {
      stars.forEach((star, i) => {
        if (i <= index) {
          star.classList.add('zt-star-highlight');
          star.textContent = '★';
        } else {
          star.classList.remove('zt-star-highlight');
          star.textContent = '☆';
        }
      });
    },

    /**
     * 重置星星
     */
    resetStars: function(stars) {
      stars.forEach(star => {
        star.classList.remove('zt-star-highlight');
      });
    },

    /**
     * 更新评分显示
     */
    updateRatingDisplay: function(container, rating) {
      const starsContainer = container.querySelector('.zt-rating-stars');
      const scoreText = container.querySelector('.zt-rating-score');
      const countText = container.querySelector('.zt-rating-count');

      starsContainer.innerHTML = this.renderStars(rating);
      scoreText.textContent = rating.toFixed(1);

      // 重新附加事件
      this.attachRatingEvents(container, window.location.pathname);
    },

    /**
     * 保存评分
     */
    saveRating: function(postUrl, rating) {
      const ratings = this.getAllRatings();
      ratings[postUrl] = {
        rating: rating,
        timestamp: Date.now()
      };

      try {
        localStorage.setItem('zt_post_ratings', JSON.stringify(ratings));
      } catch (e) {
        console.warn('Failed to save rating:', e);
      }
    },

    /**
     * 加载评分
     */
    loadRating: function(postUrl) {
      const ratings = this.getAllRatings();
      return ratings[postUrl]?.rating || 0;
    },

    /**
     * 获取所有评分
     */
    getAllRatings: function() {
      try {
        const data = localStorage.getItem('zt_post_ratings');
        return data ? JSON.parse(data) : {};
      } catch (e) {
        return {};
      }
    },

    /**
     * 获取评分人数
     */
    getRatingCount: function(postUrl) {
      // 这里应该从服务器获取真实数据
      // 临时返回模拟数据
      return Math.floor(Math.random() * 100) + 10;
    },

    /**
     * 添加打印按钮
     */
    addPrintButton: function() {
      const article = document.querySelector('article.post');
      if (!article) return;

      const printButton = document.createElement('button');
      printButton.className = 'zt-print-button';
      printButton.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
        </svg>
        <span>打印文章</span>
      `;

      printButton.addEventListener('click', () => {
        window.print();
      });

      // 插入到文章内容前面
      const container = document.createElement('div');
      container.className = 'zt-print-button-container';
      container.appendChild(printButton);
      article.parentNode.insertBefore(container, article);
    },

    /**
     * 检测阅读完毕，滚动到底部时显示完成提示
     */
    detectReadCompletion: function() {
      var article = document.getElementById('article-container');
      if (!article) return;

      var postUrl = window.location.pathname;
      var key = 'zt_read_' + postUrl;
      var alreadyShown = sessionStorage.getItem(key);
      if (alreadyShown) return;

      var startScroll = window.scrollY;
      var startTime = Date.now();
      var completed = false;

      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting && !completed) {
            completed = true;
            observer.disconnect();

            var elapsed = Math.round((Date.now() - startTime) / 1000);
            var mins = Math.floor(elapsed / 60);
            var secs = elapsed % 60;
            var timeStr = mins > 0 ? mins + '分' + secs + '秒' : secs + '秒';

            var scrollPx = Math.round(window.scrollY - startScroll);

            var banner = document.createElement('div');
            banner.className = 'zt-read-complete';
            banner.innerHTML =
              '<div class="zt-read-complete-inner">' +
                '<span class="zt-read-complete-icon">&#10003;</span>' +
                '<div class="zt-read-complete-text">' +
                  '<strong>阅读完毕</strong>' +
                  '<span class="zt-read-complete-stats">用时 ' + timeStr + ' · 滚动 ' + scrollPx + 'px</span>' +
                '</div>' +
              '</div>';

            var postNav = document.querySelector('.post-nav') ||
                          document.querySelector('#post-comment') ||
                          article.parentNode;
            postNav.parentNode.insertBefore(banner, postNav);

            setTimeout(function() {
              banner.classList.add('show');
            }, 50);

            // 5秒后缩小
            setTimeout(function() {
              banner.classList.add('compact');
            }, 5000);

            sessionStorage.setItem(key, '1');
          }
        });
      }, { threshold: 0.7 });

      // 观察文章末尾
      var lastChild = article.lastElementChild;
      if (lastChild) {
        observer.observe(lastChild);
      }
    }
  };

  // 导出 API
  ZootopiaCore.postEnhancement = PostEnhancement;
  ZootopiaCore.postConfig = PostEnhancementConfig;

  // 全局 API
  window.ztShowRelatedPosts = () => PostEnhancement.showRelatedPosts();
  window.ztRefreshReadingTime = () => PostEnhancement.showReadingTime();

  // 自动初始化
  ZootopiaCore.dom.then(() => {
    PostEnhancement.init();
  });

})();
