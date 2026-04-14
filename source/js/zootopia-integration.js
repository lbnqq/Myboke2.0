/**
 * 疯狂动物城 - 主集成文件
 * Zootopia Main Integration
 * Version: 4.4.0
 *
 * 管理所有Zootopia组件的加载和初始化
 */

(function(window) {
    'use strict';

    // ==================== 版本信息 ====================
    const VERSION = '4.4.0';
    const BUILD_DATE = '2026-04-13';

    // ==================== 组件依赖图 ====================
    const COMPONENT_DEPENDENCIES = {
        'zootopia-core': [],
        'zootopia-dialogue-bubbles': ['zootopia-core'],
        'zootopia-card-collection': ['zootopia-core'],
        'zootopia-community': ['zootopia-core'],
        'zootopia-reading-progress': ['zootopia-core'],
        'zootopia-back-to-top': ['zootopia-core'],
        'zootopia-bookmarks': ['zootopia-core'],
        'zootopia-performance-dashboard': ['zootopia-core'],
        'zootopia-easter-eggs': ['zootopia-core'],
        'zootopia-theme-features': ['zootopia-core'],
        'zootopia-search-advanced': ['zootopia-core'],
        'zootopia-keyboard-shortcuts': ['zootopia-core'],
        'zootopia-microinteractions': ['zootopia-core'],
        'zootopia-mobile-optimizer': ['zootopia-core'],
        'zootopia-accessibility': ['zootopia-core'],
        'zootopia-health-check': ['zootopia-core'],
        'zootopia-checkin': ['zootopia-core'],
        'zootopia-comment-reactions': ['zootopia-core'],
        'zootopia-loader': ['zootopia-core'],
        'zootopia-performance-monitor': ['zootopia-core'],
        'zootopia-post-enhancement': ['zootopia-core'],
        'zootopia-progressive-loader': ['zootopia-core'],
        'zootopia-reading-history': ['zootopia-core'],
        'zootopia-resource-loader': ['zootopia-core'],
        'zootopia-search-suggestions': ['zootopia-core'],
        'zootopia-seasonal': ['zootopia-core'],
        'zootopia-seo-optimizer': ['zootopia-core'],
        'zootopia-share-enhancement': ['zootopia-core'],
        'zootopia-system-monitor': ['zootopia-core'],
        'zootopia-ui-components': ['zootopia-core'],
        'zootopia-user-onboarding': ['zootopia-core'],
        'zootopia-utility': ['zootopia-core'],
        'zootopia-zpd-ticket': ['zootopia-core']
    };

    // ==================== 加载器类 ====================
    class ZootopiaLoader {
        constructor() {
            this.loadedComponents = new Set();
            this.loadErrors = [];
            this.loadStartTime = Date.now();
            this.config = {
                debug: false,
                lazyLoad: true,
                loadOrder: [
                    'zootopia-core',
                    'zootopia-dialogue-bubbles',
                    'zootopia-reading-progress',
                    'zootopia-back-to-top',
                    'zootopia-bookmarks',
                    'zootopia-search-suggestions',
                    'zootopia-community',
                    'zootopia-theme-features',
                    'zootopia-ui-components',
                    'zootopia-accessibility',
                    'zootopia-mobile-optimizer',
                    'zootopia-performance-dashboard',
                    'zootopia-microinteractions',
                    'zootopia-keyboard-shortcuts'
                ],
                autoInitialize: true,
                loadTimeout: 10000
            };
        }

        // 检查脚本是否已加载
        isScriptLoaded(componentName) {
            const scriptIds = [
                componentName + '.js',
                componentName.replace('zootopia-', '') + '.js'
            ];

            return Array.from(document.scripts).some(script => {
                const src = script.src || '';
                return scriptIds.some(id => src.includes(id));
            });
        }

        // 动态加载脚本
        async loadScript(componentName) {
            if (this.loadedComponents.has(componentName)) {
                return Promise.resolve();
            }

            // 检查是否已加载
            if (this.isScriptLoaded(componentName)) {
                this.loadedComponents.add(componentName);
                return Promise.resolve();
            }

            const script = document.createElement('script');
            script.src = `/js/${componentName}.js`;
            script.async = true;
            script.dataset.zootopia = 'true';
            script.dataset.component = componentName;

            return new Promise((resolve, reject) => {
                script.onload = () => {
                    this.loadedComponents.add(componentName);
                    this.log(`✅ ${componentName} 加载成功`);
                    resolve();
                };

                script.onerror = () => {
                    const error = `❌ ${componentName} 加载失败`;
                    this.loadErrors.push(error);
                    this.log(error, 'error');
                    reject(new Error(error));
                };

                // 超时处理
                const timeout = setTimeout(() => {
                    reject(new Error(`${componentName} 加载超时`));
                }, this.config.loadTimeout);

                script.onload = () => {
                    clearTimeout(timeout);
                    this.loadedComponents.add(componentName);
                    this.log(`✅ ${componentName} 加载成功`);
                    resolve();
                };

                document.head.appendChild(script);
            });
        }

        // 加载依赖
        async loadDependencies(componentName) {
            const dependencies = COMPONENT_DEPENDENCIES[componentName] || [];

            for (const dep of dependencies) {
                try {
                    await this.loadScript(dep);
                } catch (e) {
                    this.log(`依赖加载失败: ${dep}`, 'warn');
                }
            }
        }

        // 批量加载
        async loadComponents(componentNames) {
            const promises = componentNames.map(name => this.loadComponent(name));
            return Promise.allSettled(promises);
        }

        // 加载单个组件（包含依赖）
        async loadComponent(componentName) {
            try {
                this.log(`开始加载: ${componentName}`);
                await this.loadDependencies(componentName);
                await this.loadScript(componentName);
            } catch (e) {
                this.log(`加载 ${componentName} 失败: ${e.message}`, 'error');
                throw e;
            }
        }

        // 初始化已加载的组件
        initializeComponents() {
            const log = (msg) => {
                if (this.config.debug) {
                    console.log(`[ZootopiaLoader] ${msg}`);
                }
            };

            // 等待核心模块加载
            if (!window.ZootopiaCore) {
                log('ZootopiaCore 未加载，跳过初始化');
                return;
            }

            // 初始化社区模块（第28轮新增）
            if (window.ZootopiaCommunity && typeof window.ZootopiaCommunity.init === 'function') {
                try {
                    window.ZootopiaCommunity.init();
                    log('社区面板已初始化');
                } catch (e) {
                    log(`社区面板初始化失败: ${e.message}`, 'error');
                }
            }

            // 初始化阅读进度模块（第29轮新增）
            if (window.ReadingProgress && typeof window.ReadingProgress.init === 'function') {
                try {
                    window.ReadingProgress.init();
                    log('阅读进度指示器已初始化');
                } catch (e) {
                    log(`阅读进度指示器初始化失败: ${e.message}`, 'error');
                }
            }

            // 初始化返回顶部按钮（第30轮新增）
            if (window.BackToTop && typeof window.BackToTop.init === 'function') {
                try {
                    window.BackToTop.init();
                    log('返回顶部按钮已初始化');
                } catch (e) {
                    log(`返回顶部按钮初始化失败: ${e.message}`, 'error');
                }
            }

            // 初始化书签功能（第31轮新增）
            if (window.Bookmarks && typeof window.Bookmarks.init === 'function') {
                try {
                    window.Bookmarks.init();
                    log('书签功能已初始化');
                } catch (e) {
                    log(`书签功能初始化失败: ${e.message}`, 'error');
                }
            }

            // 初始化搜索建议功能（第32轮新增）
            if (window.ZootopiaCore && window.ZootopiaCore.searchSuggestions && typeof window.ZootopiaCore.searchSuggestions.init === 'function') {
                try {
                    window.ZootopiaCore.searchSuggestions.init();
                    log('搜索建议功能已初始化');
                } catch (e) {
                    log(`搜索建议功能初始化失败: ${e.message}`, 'error');
                }
            }

            // 可以在这里添加其他组件的初始化逻辑
            log(`所有组件初始化完成 (耗时: ${Date.now() - this.loadStartTime}ms)`);
        }

        // 日志输出
        log(message, level = 'info') {
            if (this.config.debug) {
                const levels = {
                    info: console.log,
                    warn: console.warn,
                    error: console.error
                };
                levels[level](`[ZootopiaLoader] ${message}`);
            }
        }

        // 获取加载状态
        getStatus() {
            return {
                loaded: Array.from(this.loadedComponents),
                errors: this.loadErrors,
                totalLoaded: this.loadedComponents.size,
                loadTime: Date.now() - this.loadStartTime
            };
        }
    }

    // ==================== CSS 加载器 ====================
    function loadStylesheet(filename) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `/css/${filename}`;
        link.dataset.zootopia = 'true';

        const head = document.getElementsByTagName('head')[0];
        if (head) {
            head.appendChild(link);
        }

        return link;
    }

    // ==================== 自动加载器 ====================
    function autoLoad() {
        const loader = new ZootopiaLoader();

        // 配置调试模式
        if (window.location.search.includes('zootopia-debug')) {
            loader.config.debug = true;
        }

        // 按配置顺序加载
        const componentsToLoad = loader.config.loadOrder.filter(name => {
            // 只加载实际存在的文件
            return true; // 假设所有组件都存在
        });

        loader.loadComponents(componentsToLoad)
            .then(() => {
               loader.initializeComponents();

                // 输出加载报告
                if (loader.config.debug) {
                    console.table(loader.getStatus());
                }

                // 触发全局事件
                window.dispatchEvent(new CustomEvent('zootopia:loaded', {
                    detail: {
                        version: VERSION,
                        buildDate: BUILD_DATE,
                        components: Array.from(loader.loadedComponents),
                        loadTime: Date.now() - loader.loadStartTime
                    }
                }));
            })
            .catch(err => {
                console.error('Zootopia 组件加载失败:', err);
            });
    }

    // ==================== 预加载关键CSS ====================
    function preloadCriticalCSS() {
        const criticalCSS = [
            'zootopia.css',
            'zootopia-dialogue-bubbles.css',
            'zootopia-community.css',
            'zootopia-reading-progress.css',
            'zootopia-back-to-top.css',
            'zootopia-bookmarks.css',
            'zootopia-search-suggestions.css'
        ];

        criticalCSS.forEach(filename => {
            loadStylesheet(filename);
        });
    }

    // ==================== 注册全局对象 ====================
    window.Zootopia = {
        version: VERSION,
        buildDate: BUILD_DATE,
        loader: null,
        initialized: false,

        // 手动加载组件
        load: function(componentName) {
            if (!this.loader) {
                this.loader = new ZootopiaLoader();
            }
            return this.loader.loadComponent(componentName);
        },

        // 批量加载
        loadBatch: function(componentNames) {
            if (!this.loader) {
                this.loader = new ZootopiaLoader();
            }
            return this.loader.loadComponents(componentNames);
        },

        // 获取状态
        getStatus: function() {
            if (!this.loader) {
                return { loaded: [], errors: [], totalLoaded: 0, loadTime: 0 };
            }
            return this.loader.getStatus();
        },

        // 重新初始化
        reinit: function() {
            if (this.loader) {
                this.loader.initializeComponents();
            }
        }
    };

    // ==================== 执行加载 ====================
    if (document.readyState === 'complete') {
        setTimeout(() => {
            preloadCriticalCSS();
            autoLoad();
        }, 100);
    } else {
        window.addEventListener('load', () => {
            setTimeout(() => {
                preloadCriticalCSS();
                autoLoad();
            }, 100);
        });
    }

    console.log(`🐰🦊 Zootopia v${VERSION} 集成器已启动 - 构建日期: ${BUILD_DATE}`);

})(window);
