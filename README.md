# Blog
2025年前端复习资料，近期打算跳槽，利用ai给自己进行一波查漏补缺

## 高级进阶篇

### 1. **架构设计相关**

- [**微前端（Micro Frontend）**](https://github.com/MrChen1012/Blog/issues/1)：类似微服务架构在前端的应用，通过独立的小模块组合形成完整的前端应用。
- [**单页面应用（SPA）与多页面应用（MPA）**](https://github.com/MrChen1012/Blog/issues/2)：深入讨论SPA的优缺点、如何处理SEO问题（如服务端渲染SSR、预渲染等）。
- [**状态管理（State Management）**](https://github.com/MrChen1012/Blog/issues/3)：除了Redux，提到一些较为复杂的状态管理模式，如Flux、Recoil、Zustand等。
- [**服务端渲染（SSR）与静态生成（SSG）**](https://github.com/MrChen1012/Blog/issues/4)：如Next.js、Nuxt.js的实现，讨论它们在SEO和性能优化中的作用。
- **Component Driven Development (CDD)**：前端开发方法论，强调基于组件的开发流程和工具，如Storybook等。

### 2. **性能优化**

- [**虚拟滚动（Virtual Scrolling）**](https://github.com/MrChen1012/Blog/issues/5)：针对长列表的性能优化，减少不必要的渲染。
- **懒加载与预加载（Lazy Loading & Prefetching）**：在资源加载和图片加载中使用的技术。
- **Critical Rendering Path**：浏览器渲染的关键路径，优化页面加载速度。
- **Web Workers**：提高性能的并发执行技术，能将密集计算的任务放到后台线程。
- **Service Workers & PWA（Progressive Web Apps）**：提升离线使用体验、缓存管理、离线支持等。

### 3. **前端框架和库**

- **React Suspense**：用于异步加载的一个技术，可以帮助优雅地管理异步操作和资源加载。
- **React Concurrent Mode**：并发渲染模式，可以提升应用的响应能力和流畅度。
- **Vue Composition API**：Vue 3引入的Composition API，和传统的Options API对比，如何提升代码的可维护性和复用性。
- **WebComponents**：自定义元素、Shadow DOM、HTML模板等，可以创建具有封装性的可复用组件。
- **GraphQL**：一种高效的数据查询语言，如何替代传统的RESTful API，讨论数据获取的优化和灵活性。

### 4. **开发工具和技术**

- **CI/CD（持续集成和持续部署）**：前端如何结合CI/CD自动化构建、测试、发布流程。
- **Webpack深度优化**：包括Tree Shaking、Code Splitting、Module Federation等高级配置和优化技巧。
- **Babel与Polyfill**：前端代码兼容不同浏览器版本的技巧，如何使用Babel进行ES6+语法的转译。
- **前端容器化**：如何使用Docker容器化前端开发环境，适应团队开发。

### 5. **其他高级概念**

- **设计模式**：如观察者模式（Observer）、工厂模式（Factory）、策略模式（Strategy）等，如何在前端代码中灵活应用。
- **异步编程模式**：深入探讨Promise、async/await的实现原理，Event Loop、任务队列和微任务、宏任务之间的区别。
- **代理与装饰器模式（Proxy & Decorator）**：如何在前端开发中应用代理和装饰器来解决一些复杂的设计问题。

### 6. **浏览器相关**

- **浏览器渲染原理**：包括DOM、CSSOM、渲染树的构建，如何影响页面加载时间。
- **跨域解决方案**：JSONP、CORS、WebSocket、iframe跨域等，理解不同跨域方案的优缺点。
- **内存泄漏**：如何排查并解决前端应用中的内存泄漏问题，如何使用浏览器开发者工具进行调试。

### 7. **前端安全**

- **XSS（跨站脚本攻击）**、**CSRF（跨站请求伪造）**：如何防止前端安全漏洞。
- **CSP（Content Security Policy）**：如何通过CSP提升前端应用的安全性。

### 8. **前端测试**

- **Jest**、**Mocha**、**Cypress**：讨论前端测试的策略、单元测试与集成测试的区别，如何进行端到端测试。
- **TDD/BDD（Test-Driven Development / Behavior-Driven Development）**：如何在开发中通过测试驱动开发，提高代码质量。
