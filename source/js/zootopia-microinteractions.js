/**
 * 疯狂动物城微交互动画系统
 * Zootopia Microinteractions
 *
 * 流畅的过渡动画，智能反馈效果，统一动画语言
 */

(function() {
  'use strict';

  const MicrointeractionsConfig = {
    // 动画配置
    duration: {
      fast: 150,
      normal: 300,
      slow: 500
    },

    // 缓动函数
    easing: {
      default: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0.0, 1, 1)',
      out: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    },

    // 减少动画偏好
    respectReducedMotion: true,

    // 微交互类型
    interactions: {
      hover: true,
      focus: true,
      active: true,
      load: true,
      scroll: true,
      appear: true
    },

    // 动画性能
    performance: {
      gpuAcceleration: true,
      willChange: true,
      containLayout: true
    }
  };

  /**
   * 微交互管理器
   */
  const Microinteractions = {
    prefersReducedMotion: false,
    intersectionObserver: null,
    scrollHandler: null,

    /**
     * 初始化
     */
    init: function() {
      this.detectReducedMotion();
      this.setupHoverEffects();
      this.setupFocusEffects();
      this.setupActiveEffects();
      this.setupScrollAnimations();
      this.setupAppearAnimations();
      this.setupLoadingAnimations();
    },

    /**
     * 检测减少动画偏好
     */
    detectReducedMotion: function() {
      if (MicrointeractionsConfig.respectReducedMotion) {
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // 监听变化
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
          this.prefersReducedMotion = e.matches;
        });
      }
    },

    /**
     * 设置悬停效果
     */
    setupHoverEffects: function() {
      if (!MicrointeractionsConfig.interactions.hover) return;
      if (this.prefersReducedMotion) return;

      // 为所有可交互元素添加悬停效果
      document.addEventListener('mouseover', (e) => {
        const target = e.target.closest('a, button, .card, .zt-interactive');
        if (target) {
          this.addHoverEffect(target);
        }
      }, true);

      document.addEventListener('mouseout', (e) => {
        const target = e.target.closest('a, button, .card, .zt-interactive');
        if (target) {
          this.removeHoverEffect(target);
        }
      }, true);
    },

    /**
     * 添加悬停效果
     */
    addHoverEffect: function(element) {
      element.classList.add('zt-hover');

      // 添加GPU加速
      if (MicrointeractionsConfig.performance.gpuAcceleration) {
        element.style.transform = 'translateZ(0)';
        element.style.willChange = 'transform';
      }
    },

    /**
     * 移除悬停效果
     */
    removeHoverEffect: function(element) {
      element.classList.remove('zt-hover');
      element.style.transform = '';
      element.style.willChange = '';
    },

    /**
     * 设置焦点效果
     */
    setupFocusEffects: function() {
      if (!MicrointeractionsConfig.interactions.focus) return;

      document.addEventListener('focusin', (e) => {
        const target = e.target;
        if (target.matches('a, button, input, textarea, select, [tabindex]')) {
          this.addFocusEffect(target);
        }
      }, true);

      document.addEventListener('focusout', (e) => {
        const target = e.target;
        if (target.matches('a, button, input, textarea, select, [tabindex]')) {
          this.removeFocusEffect(target);
        }
      }, true);
    },

    /**
     * 添加焦点效果
     */
    addFocusEffect: function(element) {
      element.classList.add('zt-focused');
    },

    /**
     * 移除焦点效果
     */
    removeFocusEffect: function(element) {
      element.classList.remove('zt-focused');
    },

    /**
     * 设置激活效果
     */
    setupActiveEffects: function() {
      if (!MicrointeractionsConfig.interactions.active) return;
      if (this.prefersReducedMotion) return;

      document.addEventListener('mousedown', (e) => {
        const target = e.target.closest('a, button, .card, .zt-interactive');
        if (target) {
          this.addActiveEffect(target);
        }
      }, true);

      document.addEventListener('mouseup', (e) => {
        const target = e.target.closest('a, button, .card, .zt-interactive');
        if (target) {
          this.removeActiveEffect(target);
        }
      }, true);
    },

    /**
     * 添加激活效果
     */
    addActiveEffect: function(element) {
      element.classList.add('zt-active');
      element.style.transform = 'scale(0.98)';
    },

    /**
     * 移除激活效果
     */
    removeActiveEffect: function(element) {
      element.classList.remove('zt-active');
      element.style.transform = '';
    },

    /**
     * 设置滚动动画
     */
    setupScrollAnimations: function() {
      if (!MicrointeractionsConfig.interactions.scroll) return;
      if (this.prefersReducedMotion) return;

      let ticking = false;

      window.addEventListener('scroll', () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            this.handleScroll();
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });
    },

    /**
     * 处理滚动
     */
    handleScroll: function() {
      const scrollTop = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / scrollHeight) * 100;

      // 更新滚动进度条
      this.updateProgressBar(scrollPercent);

      // 视差效果
      this.updateParallax(scrollTop);
    },

    /**
     * 更新进度条
     */
    updateProgressBar: function(percent) {
      let progressBar = document.querySelector('.zt-scroll-progress');

      if (!progressBar) {
        progressBar = document.createElement('div');
        progressBar.className = 'zt-scroll-progress';
        document.body.appendChild(progressBar);
      }

      progressBar.style.width = percent + '%';
    },

    /**
     * 更新视差效果
     */
    updateParallax: function(scrollTop) {
      const parallaxElements = document.querySelectorAll('[data-parallax]');

      parallaxElements.forEach(element => {
        const speed = parseFloat(element.dataset.parallax) || 0.5;
        const yPos = -(scrollTop * speed);
        element.style.transform = `translateY(${yPos}px)`;
      });
    },

    /**
     * 设置出现动画
     */
    setupAppearAnimations: function() {
      if (!MicrointeractionsConfig.interactions.appear) return;
      if (this.prefersReducedMotion) return;

      this.intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target;
            const animation = element.dataset.appear || 'zt-fade-in-up';
            const delay = parseInt(element.dataset.delay) || 0;

            setTimeout(() => {
              element.classList.add(animation);
              element.classList.add('zt-appeared');
            }, delay);

            this.intersectionObserver.unobserve(element);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '50px'
      });

      // 观察所有需要动画的元素
      const elements = document.querySelectorAll('[data-appear]');
      elements.forEach(el => this.intersectionObserver.observe(el));

      // 自动为文章内容元素添加入场动画
      this.autoAnimateArticleContent();
    },

    /**
     * 自动为文章内容添加入场动画
     * 标题、段落、图片、引用块依次渐入，形成阅读节奏
     */
    autoAnimateArticleContent: function() {
      var container = document.getElementById('article-container');
      if (!container) return;

      var targets = container.querySelectorAll(
        'h2, h3, p, img, blockquote, table, .highlight'
      );

      if (!targets.length) return;

      // 设置初始隐藏状态
      targets.forEach(function(el) {
        el.style.opacity = '0';
        el.style.transform = 'translateY(12px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      });

      var articleObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            var el = entry.target;
            var idx = Array.from(targets).indexOf(el);
            var stagger = Math.min(idx * 60, 400);
            setTimeout(function() {
              el.style.opacity = '1';
              el.style.transform = 'translateY(0)';
            }, stagger);
            articleObserver.unobserve(el);
          }
        });
      }, { threshold: 0.05, rootMargin: '30px' });

      targets.forEach(function(el) { articleObserver.observe(el); });
    },

    /**
     * 设置加载动画
     */
    setupLoadingAnimations: function() {
      if (!MicrointeractionsConfig.interactions.load) return;

      // 页面加载动画
      document.documentElement.classList.add('zt-page-loading');

      window.addEventListener('load', () => {
        setTimeout(() => {
          document.documentElement.classList.remove('zt-page-loading');
          document.documentElement.classList.add('zt-page-loaded');
        }, 100);
      });

      // 元素加载动画
      this.observeLoadingElements();
    },

    /**
     * 观察加载元素
     */
    observeLoadingElements: function() {
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        if (img.complete) {
          img.classList.add('zt-loaded');
        } else {
          img.addEventListener('load', () => {
            img.classList.add('zt-loaded');
          });
        }
      });
    },

    /**
     * 自定义动画
     */
    animate: function(element, options = {}) {
      const {
        properties = {},
        duration = MicrointeractionsConfig.duration.normal,
        easing = MicrointeractionsConfig.easing.default,
        delay = 0
      } = options;

      if (this.prefersReducedMotion) {
        // 对于减少动画偏好，直接应用最终状态
        Object.assign(element.style, properties);
        return Promise.resolve();
      }

      return new Promise((resolve) => {
        setTimeout(() => {
          element.style.transition = `all ${duration}ms ${easing}`;
          Object.assign(element.style, properties);

          setTimeout(() => {
            element.style.transition = '';
            resolve();
          }, duration);
        }, delay);
      });
    },

    /**
     * 淡入
     */
    fadeIn: function(element, duration = MicrointeractionsConfig.duration.normal) {
      return this.animate(element, {
        properties: { opacity: '1' },
        duration,
        easing: MicrointeractionsConfig.easing.out
      });
    },

    /**
     * 淡出
     */
    fadeOut: function(element, duration = MicrointeractionsConfig.duration.normal) {
      return this.animate(element, {
        properties: { opacity: '0' },
        duration,
        easing: MicrointeractionsConfig.easing.in
      });
    },

    /**
     * 滑入
     */
    slideIn: function(element, direction = 'up', duration = MicrointeractionsConfig.duration.normal) {
      const transforms = {
        up: ['translateY(20px)', 'translateY(0)'],
        down: ['translateY(-20px)', 'translateY(0)'],
        left: ['translateX(20px)', 'translateX(0)'],
        right: ['translateX(-20px)', 'translateX(0)']
      };

      const [from, to] = transforms[direction] || transforms.up;

      element.style.transform = from;
      element.style.opacity = '0';

      return this.animate(element, {
        properties: {
          transform: to,
          opacity: '1'
        },
        duration,
        easing: MicrointeractionsConfig.easing.default
      });
    },

    /**
     * 缩放
     */
    scale: function(element, scale = 1.1, duration = MicrointeractionsConfig.duration.fast) {
      return this.animate(element, {
        properties: { transform: `scale(${scale})` },
        duration,
        easing: MicrointeractionsConfig.easing.default
      });
    },

    /**
     * 弹跳
     */
    bounce: function(element, duration = MicrointeractionsConfig.duration.slow) {
      return this.animate(element, {
        properties: { transform: 'scale(1.1)' },
        duration: duration / 2,
        easing: MicrointeractionsConfig.easing.default
      }).then(() => {
        return this.animate(element, {
          properties: { transform: 'scale(1)' },
          duration: duration / 2,
          easing: MicrointeractionsConfig.easing.bounce
        });
      });
    },

    /**
     * 抖动
     */
    shake: function(element, duration = MicrointeractionsConfig.duration.fast) {
      return this.animate(element, {
        properties: { transform: 'translateX(-5px)' },
        duration: duration / 4,
        easing: MicrointeractionsConfig.easing.default
      }).then(() => {
        return this.animate(element, {
          properties: { transform: 'translateX(5px)' },
          duration: duration / 4,
          easing: MicrointeractionsConfig.easing.default
        });
      }).then(() => {
        return this.animate(element, {
          properties: { transform: 'translateX(-5px)' },
          duration: duration / 4,
          easing: MicrointeractionsConfig.easing.default
        });
      }).then(() => {
        return this.animate(element, {
          properties: { transform: 'translateX(0)' },
          duration: duration / 4,
          easing: MicrointeractionsConfig.easing.default
        });
      });
    }
  };

  // 导出 API
  ZootopiaCore.microinteractions = Microinteractions;
  ZootopiaCore.microinteractionsConfig = MicrointeractionsConfig;

  // 全局 API
  window.ztAnimate = (element, options) => Microinteractions.animate(element, options);
  window.ztFadeIn = (element, duration) => Microinteractions.fadeIn(element, duration);
  window.ztFadeOut = (element, duration) => Microinteractions.fadeOut(element, duration);
  window.ztSlideIn = (element, direction, duration) => Microinteractions.slideIn(element, direction, duration);
  window.ztScale = (element, scale, duration) => Microinteractions.scale(element, scale, duration);
  window.ztBounce = (element, duration) => Microinteractions.bounce(element, duration);
  window.ztShake = (element, duration) => Microinteractions.shake(element, duration);

  // 自动初始化
  ZootopiaCore.dom.then(() => {
    Microinteractions.init();
    console.log('✨ 微交互动画系统已就绪');
  });

})();
