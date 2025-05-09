# 🚀 Vue 人眼中的 React Router：从 router-view 到 Outlet，原来这么玩！

> 本文不仅教你“怎么用 React Router”，更从 Vue 开发者的角度 **对照理解每一个概念**，帮助你快速上手并真正掌握这个强大的路由库。

## 🧭 Vue 人学 React Router 特别有优势？

如果你长期使用 Vue，初次接触 React Router 会有一种“莫名熟悉”的感觉：嵌套路由、动态参数、编程式导航……甚至连 `<router-view>` 的概念也几乎一模一样。但深入之后你会发现：**相似的只是 API 表层，核心思想和实现机制却大不相同。**

我们将从最熟悉的几个点出发：

- 路由配置怎么写？
- `<router-view>` 对应什么？
- `this.$router.push` 到底变成了什么？
- 守卫、懒加载、滚动控制还能用吗？

让我们带着这些问题，边对照边实战。

------

## 1️⃣ 路由配置对比：对象 vs JSX

在 Vue 中，我们通常使用对象方式集中定义路由，每个路由条目由 `path` 和 `component` 等字段组成，整体挂载到 `VueRouter` 实例上。

```js
const router = new VueRouter({
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: About },
  ]
})
```

React Router 的配置方式虽然也使用数组结构，但元素本质上是 **JSX 驱动的组件化配置**，强调的是 **声明式组件组合** 的理念。

```jsx
const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/about', element: <About /> },
]);
```

**核心差异：**

| 对比项   | Vue Router            | React Router                 |
| -------- | --------------------- | ---------------------------- |
| 路由定义 | 配置对象（component） | JSX 元素（element）          |
| 文件推荐 | `router/index.js`     | `routes.jsx`（建议抽离组件） |
| 扩展字段 | 支持 `meta`           | 可添加任意自定义属性         |

**Tips：** 如果你习惯 Vue 的 `meta` 字段，也可以在 React 路由对象中添加自定义字段来实现权限、标题等扩展需求。

------

## 2️⃣ 路由出口：router-view ➜ Outlet

在 Vue 项目中，`<router-view>` 是几乎所有页面的“动态内容承载区”。每当路由切换，它就会自动渲染对应组件。

```vue
<template>
  <router-view />
</template>
```

React 中没有这样的语法糖组件，而是通过 `react-router-dom` 提供的 `<Outlet />` 实现相同功能。

```jsx
function App() {
  return <Outlet />;
}
```

它们作用一致：**当前路由命中的子组件插槽**。不同在于：

- Vue 是自动注入组件栈中的 `<router-view>`；
- React 需要手动引入 `<Outlet />`，它更明确地体现了“组合”的思想。

React 更加强调“**一切显式组合**”，让你清楚每一层结构的存在。

------

## 3️⃣ 编程式导航对比：this.$router.push ➜ useNavigate

Vue 中，我们习惯通过 `this.$router.push` 进行路由跳转：

```js
this.$router.push('/about')
this.$router.push({ path: '/search', query: { q: 'vue' } })
```

而在 React 中，我们则使用 Hook 获取跳转函数：

```jsx
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate()
navigate('/about')
navigate({ pathname: '/search', search: '?q=vue' })
```

**注意几点：**

- React 的导航必须在函数组件中使用；
- 不会自动拼接 query，你需要自己构造 `search` 字符串；
- 替换跳转可用 `navigate('/path', { replace: true })`。

> **推荐封装：** 如果你经常处理 query，可封装一个帮助函数处理 URL 拼接，更加优雅。

------

## 4️⃣ 动态参数获取对比：$route.params ➜ useParams

在 Vue 中获取动态参数很直观：

```js
// 路由配置
{ path: '/user/:id', component: User }

// 组件内访问
const userId = this.$route.params.id;
```

React 中通过 `useParams()`：

```jsx
// 路由配置
{ path: "/user/:id", element: <User /> }

// 组件内获取
import { useParams } from 'react-router-dom';

function User() {
  const { id } = useParams();  // 直接解构参数
  return <div>用户ID: {id}</div>;
}
```

小贴士：

- `useParams()` 只负责匹配 `:xxx` 路径参数；
- 如果你还需要获取 `?q=keyword` 这样的查询参数，则要使用 `useLocation()`；
- 在大型页面中，也可以封装一个自定义 Hook 来同时提取 params 和 search，更方便复用。

举例：

```js
const useQuery = () => {
  return new URLSearchParams(useLocation().search);
}
```

------

## 5️⃣ 嵌套路由写法：children 一样，但语法更严格

Vue 的嵌套路由结构如下：

```js
{
  path: '/dashboard',
  component: Dashboard,
  children: [
    { path: 'profile', component: Profile }
  ]
}
```

React 的写法也相似，但对路径、嵌套结构要求更高：

```jsx
{
  path: '/dashboard',
  element: <Dashboard />,
  children: [
    { path: 'profile', element: <Profile /> }
  ]
}
```

注意事项：

- 子路由的 `path` **不能以 `/` 开头**，否则会被识别为根路径；
- 父组件必须包含 `<Outlet />` 组件，负责渲染子路由；
- 可以搭配 `<NavLink>` 实现子导航栏，并使用其 `isActive` 状态自动高亮选中菜单项。

------

## 6️⃣ 路由守卫怎么实现？用组件包装！

Vue Router 提供全局的 `beforeEach` 导航守卫机制，统一控制页面访问权限：

```js
router.beforeEach((to, from, next) => {
  if (!isAuthed && to.meta.requiresAuth) {
    next('/login')
  } else {
    next()
  }
})
```

React Router 则没有全局守卫概念，而是通过组件化方式实现“局部控制”：

```jsx
const PrivateRoute = ({ children }) => {
  const isAuthed = useAuth(); // 自定义 Hook 返回认证状态
  return isAuthed ? children : <Navigate to="/login" replace />;
}
```

使用时，直接包裹需要控制的页面即可：

```jsx
{
  path: '/dashboard',
  element: (
    <PrivateRoute>
      <Dashboard />
    </PrivateRoute>
  )
}
```

> 优点在于更灵活、粒度更细。你甚至可以为每一个子页面设置不同的守卫逻辑，而不是一个统一的钩子。

------

## 7️⃣ 异步路由加载（懒加载）：Vue 也有，React 更灵活

Vue 支持异步组件导入，常用于路由懒加载：

```js
const UserProfile = () => import('./UserProfile.vue')
```

React 的做法稍复杂一些，需要借助 `React.lazy` 和 `Suspense`：

```jsx
import { lazy, Suspense } from 'react';

const UserProfile = lazy(() => import('./UserProfile'));

<Suspense fallback={<Loading />}>
  <UserProfile />
</Suspense>
```

重点：

- 必须使用 `<Suspense>` 包裹懒加载组件，否则加载期间不会有任何提示；
- 可以将 `<Suspense>` 放在路由出口的高层，统一处理所有懒加载页面；
- 结合 `React Router v6.4+` 的数据加载器（Loader）功能，还可以进一步实现 SSR 支持。

------

## 8️⃣ 滚动行为处理：Vue 内置，React 手动

Vue Router 提供了 `scrollBehavior()` 钩子，来控制页面切换后的滚动位置：

```js
scrollBehavior() {
  return { x: 0, y: 0 }
}
```

React Router 没有内建 scrollBehavior，但提供了更灵活的实现方式。你可以利用 `useEffect` 和 `useLocation` 自定义 Hook，搭配 `window.scrollTo()` 控制滚动行为。

```jsx
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
```

使用方式：

```jsx
<>
  <ScrollToTop />
  <RouterProvider router={router} />
</>
```

小贴士：

- 可以使用 `window.scrollTo({ top: 0, behavior: 'smooth' })` 实现平滑滚动；
- 也可以针对特定路由设置不同的滚动策略，进一步个性化。

------

## 🛠 实战：基于 V6.4 的完整路由实践项目

我们来实现一个小型 React 应用，包含首页（Home）、关于页（About）、用户页（User），并且展示。

项目结构：

```ts
src/
├── main.jsx
├── router.jsx
├── App.jsx
├── pages/
│   ├── Home.jsx
│   ├── About.jsx
│   ├── Login.jsx
│   └── user/
│       ├── UserLayout.jsx
│       ├── UserList.jsx
│       └── UserDetail.jsx
```



### 1. `main.jsx`：挂载 RouterProvider

`src\index.jsx`

```ts
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import router from './router';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
```

### 2. `router.jsx`：集中式路由配置 + 路由守卫

```ts
import {
  createBrowserRouter,
  redirect
} from 'react-router-dom';
import App from './App';
import Home from './pages/Home';
import About from './pages/About';
import Login from './pages/Login';
import UserLayout from './pages/user/UserLayout';
import UserList from './pages/user/UserList';
import UserDetail from './pages/user/UserDetail';

// 模拟鉴权
const isAuthenticated = false;

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'about', element: <About /> },
      { path: 'login', element: <Login /> },

      {
        path: 'users',
        element: <UserLayout />,
        loader: () => {
          if (!isAuthenticated) {
            throw redirect('/login');
          }
          return null;
        },
        children: [
          { index: true, element: <UserList /> },
          { path: ':id', element: <UserDetail /> },
        ],
      },

      { path: '*', element: <h2>页面未找到</h2> },
    ],
  },
]);

export default router;
```

### 3. `App.jsx`：导航栏 + Outlet

```ts
import { Outlet, Link } from 'react-router-dom';

export default function App() {
  return (
    <div>
      <nav>
        <Link to="/">首页</Link> |
        <Link to="/about">关于</Link> |
        <Link to="/users">用户</Link> |
        <Link to="/login">登录</Link>
      </nav>
      <hr />
      <Outlet />
    </div>
  );
}
```

### 4. `pages/Home.jsx`：编程式导航

```ts
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div>
      <h2>首页</h2>
      <button onClick={() => navigate('/about')}>跳转到关于</button>
    </div>
  );
}
```

### 5. 各子文件代码

```ts
// pages/About.jsx
export default function About() {
  return <h2>关于页面</h2>;
}

// pages/Login.jsx
export default function Login() {
  return <h2>请登录后访问用户页面</h2>;
}
```

### 6. `pages/user/UserLayout.jsx`：嵌套父路由组件

```ts
import { Outlet, Link } from 'react-router-dom';

export default function UserLayout() {
  return (
    <div>
      <h2>👤 用户中心</h2>
      <Link to="/users">用户列表</Link>
      <Outlet />
    </div>
  );
}
```

### 7. `pages/user/UserList.jsx`：动态参数跳转

```ts
import { Link } from 'react-router-dom';

export default function UserList() {
  const users = [
    { id: 1, name: '张三' },
    { id: 2, name: '李四' },
  ];

  return (
    <div>
      <h3>用户列表</h3>
      <ul>
        {users.map(user => (
          <li key={user.id}>
            <Link to={`/users/${user.id}`}>{user.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 8. `pages/user/UserDetail.jsx`：获取动态参数

```ts
import { useParams } from 'react-router-dom';

export default function UserDetail() {
  const { id } = useParams();

  return (
    <div>
      <h3>用户详情</h3>
      <p>当前用户ID：{id}</p>
    </div>
  );
}
```

### 9. 小总结

这个实战项目实现了：路由集中配置、嵌套路由、编程式导航、动态参数传递以及获取、路由守卫、声明式跳转。

> 麻雀虽小，五脏俱全哈~

## ✅ 总结：React Router 学起来没你想的难！

React Router 和 Vue Router 在“看上去很像”的表象下，隐藏着完全不同的实现哲学：

- **Vue 更倾向于集中式配置与隐式结构注入**；
- **React Router 强调显式组合、组件优先、Hooks 驱动**；

从路由配置、导航跳转，到嵌套结构、懒加载、权限控制，React Router 提供了一个更灵活但也更自由的生态。如果你是 Vue 开发者，这篇文章相信能让你在理解差异的基础上，快速掌握 React Router 的使用方式和设计理念。

> **记住一句话：React Router 不是“更复杂”，它只是“更组合”！**

如果你觉得这篇文章对你有帮助，欢迎点赞 👍、收藏 ⭐、评论 💬 让我知道你在看！
后续我也会持续输出更多 **React 重学系列文章**，敬请期待！❤️