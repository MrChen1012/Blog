# 🤯 Vue 人快上车！用 useContext 实现 Vuex 同款全局状态管理！

> 作为一个 Vue 转 React 的前端，我们早就习惯了使用 Vuex 来管理全局状态，什么 state、mutation、action 一套操作下来玩得贼熟练。但在 React 中，我们没有 Vuex 了，要怎样去进行状态管理呢？

## 🧠 React 的状态管理多麻烦？

如果你刚开始写 React，可能会遇到这些情况：

- props 一层层传，像接力赛；
- 兄弟组件想用一个变量，得倒腾 lifting state；

> “React 没 Vuex/Pinia，那它是怎么搞全局状态的？”

答案就是：

- 中小型项目：`useContext`
- 中大型项目：`Zustand` / `Redux` 等

其实 React 内建的 `useContext` 就是天然的状态传递通道，它虽不是完整状态管理方案，但在很多中小项目中已经够用。

------



## 🧩 什么是 useContext？

一句话：React 的 `useContext` 就是你熟悉的 Vue 的 `inject` + `provide`。

> "`useContext` 允许父组件向其下层无论多深的任何组件提供信息，而无需通过 props 显式传递。"

有点像 Vue 的 `inject` 吧？那我们直接上个栗子，看下怎么用。

**一看就懂的栗子：**

```ts
import { useState, createContext, useContext } from "react";

const UserContext = createContext(null);

export default function Parent() {
  const [user, setUser] = useState("JiangJiang");

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <Child />
    </UserContext.Provider>
  );
}

function Child() {
  const { user } = useContext(UserContext);

  return (
    <div>
      <p>User: {user}</p>
      <Button>Change User</Button>
    </div>
  );
}

function Button({ children }) {
  const { setUser } = useContext(UserContext);
  return <button onClick={() => setUser("帅比-JiangJiang")}>{children}</button>;
}
```

在使用 `useContext` 之前，我们需要先使用 `createContext` 去创建一个 `context`：

```ts
const UserContext = createContext(null);
```

`createContext` 只有一个参数，表示默认值，可以传入任何类型的参数。

上面例子的父子组件顺序为：`Parent` => `Child` => `Button`。

`Button` 想要修改 `user`，通过 `useContext` 去获取 `Parent` 组件中的 `setUser` 方法，我们看看 `useContext` 的用法：

- `useContext` 传入参数是数据所在的 `context`。
- 通过 `xxxContext.Provider` 向下树状传递数据，数据传入的 `key` 是 `value`。
- 树状结构下的子组件可以通过：`useContext(xxxContext)` 去解构使用 `value` 的值。

![ainimation1](C:\cgj\1code\我的\面试\1博客\img\useContext\ainimation1.gif)

简单吧？没有复杂的注册、模块化、mutation，不依赖第三方库，靠原生 API 就能共享状态！

## ⚔️ useContext 和 Vuex 差异

| 对比点     | useContext + Hooks         | Vuex                     |
| ---------- | -------------------------- | ------------------------ |
| 使用成本   | 极低，React 原生支持       | 较高，需要额外引入       |
| 状态更新   | `useState` 或 `useReducer` | mutation / action        |
| 模块化支持 | 需手动管理多个 context     | 官方支持模块化           |
| 适用场景   | 中小项目，状态结构简单     | 中大型项目，复杂状态交互 |

对于中小项目，`useContext` 是完美替代 Vuex 的方案，**大项目再考虑更重型的方案。**

如果你是 Vue 转 React 的开发者，一定能体会到它那份“轻量又优雅”。

## 💡 想要更像 Vuex？useContext + useReducer

还记得 `Vuex` 怎么管理用户状态的吧？有个 `state` 里存着用户信息，有个 `mutation` 或 `action` 控制 **登录/登出**。

React 也可以用 `useReducer` 来实现类似的逻辑：把 **登录/登出** 变成一个个 `action`，统一管理！

### 1. 定义 UserContext 和 reducer

```ts
import { useReducer, createContext, useContext } from 'react'

const UserContext = createContext(null)

// reducer 逻辑
function handleUser(state, action) {
    switch (action.type) {
        case 'LOGIN':
            return {
                isLogin: true,
                userInfo: action.payload
            }
        case 'LOGOUT':
            return {
                isLogin: false,
                userInfo: null
            }
        default:
            return state
    }
}

// Provider 包装组件
export const UserProvider = ({ children }) => {
    const [state, dispatch] = useReducer(handleUser, {
        isLogin: false,
        userInfo: null
    })

    return <UserContext.Provider value={{ state, dispatch }}>{children}</UserContext.Provider>
}

// 自定义 Hook，方便使用
export const useUser = () => useContext(UserContext);
```

- 定义 `handleUser` 函数控制 **登录/登出** 数据。
- 通过 `useReducer` 创建一个 `reducer`。
- 创建一个 `context` 存储 `state` 和 `dispatch` 方法。
- 封装 `Provider` 包装组件。
- 创建自定义 `Hook` `useUser`，方面调用。

### 2. 在顶层 App 包裹 Provider，组件中使用 UserContext

```ts
export default function App() {
  return (
    <UserProvider>
      <Home />
    </UserProvider>
  );
}

function Home() {
  return (
    <div>
      <h2>欢迎来到首页</h2>
      <Profile />
    </div>
  );
}

function Profile() {
  const { state, dispatch } = useUser();
  const handleLogin = () => {
    const fakeUser = "帅比-JiangJiang";
    dispatch({ type: "LOGIN", payload: fakeUser });
  };

  const handleLogout = () => {
    dispatch({ type: "LOGOUT" });
  };
  return (
    <>
      {state.isLogin ? (
        <>
          <p>你好，{state.userInfo}</p>
          <button onClick={() => dispatch({ type: "LOGOUT" })}>退出登录</button>
        </>
      ) : (
        <>
          <p>你还未登录</p>
          <button onClick={handleLogin}>登录</button>
        </>
      )}
    </>
  );
}
```

补充完组件逻辑，我们的简单 **登录/登出** 功能就完成了，我们看下效果：

![ainimation2](C:\cgj\1code\我的\面试\1博客\img\useContext\ainimation2.gif)

------



### 我们来类比一下 Vuex：

| Vuex                              | useReducer + useContext       |
| --------------------------------- | ----------------------------- |
| state                             | `useReducer` 的 `state`       |
| mutation / action                 | `dispatch({ type, payload })` |
| mapState / mapActions             | 自定义 Hook `useUser`         |
| Vue 的 `<App> 根组件里挂载 Store` | `<UserProvider>`              |

同样的登录/登出功能，逻辑一模一样，只是换了个写法。

------

> **`useContext` 这么好用，我们是不是可以无脑的去进行使用呢？**

## 🐢 useContext 的全量更新问题

假设你写了一个像下面这样的 `Provider`：

```ts
<UserContext.Provider value={{ state, dispatch }}>
  {children}
</UserContext.Provider>
```

每当 `state` 或 `dispatch` 中的任意一个变化，**所有使用 `useContext(UserContext)` 的组件，都会重新渲染**，哪怕组件只用了 `userInfo`，也会被牵连重渲染。

这就像 Vue 中你修改了一个 state，结果所有用 `mapState` 的组件都被刷新了，不分青红皂白。

## 😩 为什么会这样？

因为 `useContext` 的机制是：只要 `Provider` 的 `value` 发生了**引用变化**，所有消费者组件就会重新渲染。

> “React 的 context 更新是按引用判断，而不是按值比较！”

```ts
// 每次渲染都会生成一个新对象（即使内容一样）
const obj = { a: 1 }
const obj2 = { a: 1 }

obj === obj2 // false（尽管内容相同）
```

同一个 `context`，用到的组件越多，性能损耗就会越大，比如下面场景：

```ts
<App>
  <Header />
  <Sidebar />
  <Profile />
  <Notifications />
</App>
```

这些组件都通过 `useContext(UserContext)` 拿到了状态，一旦我们在某个组件里改了 `state` 的值，就会连带着别的组件全部被重新渲染一次。

## 🛠️ 优化方案

### 1. 拆分 context

```ts
const UserStateContext = createContext();
const UserDispatchContext = createContext();

export const useUserState = () => useContext(UserStateContext);
export const useUserDispatch = () => useContext(UserDispatchContext);
```

然后在 Provider 中拆开：

```ts
<UserStateContext.Provider value={state}>
  <UserDispatchContext.Provider value={dispatch}>
    {children}
  </UserDispatchContext.Provider>
</UserStateContext.Provider>
```

👉 好处：只用 `state` 的组件，不会因 `dispatch` 变化而重新渲染。

### 2. value 用 useMemo 缓存

如果你传递的是一个对象，可以用 `useMemo` 优化：

```ts
const contextValue = useMemo(() => ({ state, dispatch }), [state, dispatch]);

<UserContext.Provider value={contextValue}>
  {children}
</UserContext.Provider>
```

但注意：如果 `state` 是个对象，任何字段变化都会导致整个对象变新引用。所以这个方案适合中小型 state，不适合超大的嵌套结构。

### 3. 使用第三方库进行状态管理

React 社区已经有很多更轻便又更高性能的状态管理库，比如：

- [`zustand`](https://github.com/pmndrs/zustand)：极简、无 Provider、按需订阅
- [`jotai`](https://github.com/pmndrs/jotai)：原子化思维，每个 state 都是一个最小单元
- [`valtio`](https://github.com/pmndrs/valtio)：像用 Vue 的响应式一样用 state

中大型复杂项目比较推荐引入这些库。

------



## ✅ 总结一下

如果你是 Vue 转 React 的前端，那 `useContext` 使用起来是真香：

- 🚀 快速搞定跨组件状态共享
- 🧩 和 Vuex 类似，结构灵活
- 💡 搭配  `useReducer` / `useMemo`，组合拳更强大
- 🧘‍♀️ 轻量级、零依赖，写起来丝滑舒服

> **小项目别犹豫，大项目也能当基础设施用，`useContext` 真香！**

希望这篇文章能帮你快速掌握 **useContext**，如果你觉得有帮助，别忘了点个赞👍或关注我后续的 **重学 React** 系列！