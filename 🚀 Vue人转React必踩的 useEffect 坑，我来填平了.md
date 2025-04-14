# 🚀 Vue人转React必踩的 useEffect 坑，我来填平了


> 这篇文章是写给正从 Vue 转向 React、被 useEffect 弄懵的你。

## 前言

如果你刚从 Vue 进入 React 世界，`useEffect` 可能是你最容易踩坑的 Hook。它看起来像 Vue 的生命周期函数，实际却大不相同。

你是不是也遇到过这些疑惑？

-   “它到底是 `mounted` 还是 `updated` 的替代？”
-   “为什么我的副作用逻辑会无限触发？”
-   “依赖项到底该不该加？加了它就炸，不加它报错？”

别急，这篇文章我会从 **运行时机、依赖项、清除机制** 到 **常见陷阱**，逐一帮你搞清楚 `useEffect` 的使用姿势。

* * *

## 什么是 useEffect

在 React 中，组件的渲染是纯函数，意味着你不能在函数里直接写副作用操作（比如请求接口、DOM 操作、设置定时器等）。而 `useEffect`，就是用来处理这些**副作用（Side Effects）** 的 Hook。

React 官网对它的定义是：

> “在函数组件中处理副作用的方式”

通俗点说，它的作用类似 Vue 的 `mounted`、`watch`、`watchEffect` 加在一起，但规则更明确，也更容易踩坑。

* * *

## useEffect 的基础用法

### 举个栗子

```ts
import { useEffect, useState } from "react";

export default function Example() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log("count 改变了：", count);
  }, [count]);

  return <button onClick={() => setCount(count + 1)}>点击：{count}</button>;
}
```


![ainimation1.gif](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/0bf25f3024f14820bb4080ce5cc408cf~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgSmlhbmdKaWFuZw==:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzM2ODU1OTM1OTU2NDA4OCJ9&rk3s=e9ecf3d6&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1744714298&x-orig-sign=oRrRMWgaCHSd%2Fwq4CRrYQIxqvcM%3D)

上面栗子中：

-   `useEffect` 在组件 **首次挂载** 和 **count 变化时** 执行。
-   `[count]` 是依赖项数组，只有它发生变化时才会重新执行副作用逻辑。

那么为什么一开始我们说：

> "`useEffect`的作用类似 Vue 的 `mounted`、`watch`、`watchEffect` 加在一起"

我们先简单介绍下 `useEffect` 接收的参数：

1.  `setup` 副作用函数，用于执行副作用，它返回一个 `cleanup` 清理函数。
1.  一个 **依赖项列表**，包括这些函数使用的每个组件内的值。

## 模拟 Vue 

### useEffect 实现 `mounted` 效果

```ts
export default function Example() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log("count 改变了：", count);
  }, []);

  return <button onClick={() => setCount(count + 1)}>点击：{count}</button>;
}
```

把 **依赖项列表** 改为传入空数组 `[]`，就能实现 Vue 中的 `mounted` 效果：


![ainimation2.gif](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/bbd6e4bd5d16477f9e257595406aebb4~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgSmlhbmdKaWFuZw==:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzM2ODU1OTM1OTU2NDA4OCJ9&rk3s=e9ecf3d6&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1744714303&x-orig-sign=GSLgRaLnd2IO4MBVSqkSzF7v%2B%2BM%3D)

### useEffect 实现 `watch` 效果

```ts
export default function Example() {
  const [count, setCount] = useState(0);
  const [num, setNum] = useState(0);

  useEffect(() => {
    console.log("count 改变了：", count);
  }, [count]);

  return (
    <>
      <button onClick={() => setCount(count + 1)}>点击count：{count}</button>
      <button onClick={() => setNum(num + 1)}>点击num：{num}</button>
    </>
  );
}
```

我们现在传入 `[count]`，表示用于监听 `count` 的响应式变化，再创建一个 `num` 去作对比，我们看看效果：


![ainimation3.gif](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/111fd88d6e5645118fd759dfb6fe53b1~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgSmlhbmdKaWFuZw==:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzM2ODU1OTM1OTU2NDA4OCJ9&rk3s=e9ecf3d6&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1744714309&x-orig-sign=hruc3HcrLg44BwOi%2FcKUpa1Fj2k%3D)

传入 `[count]`，Effect 会像 Vue 中的 `watch` 一样去监听 `count` 的数据变化，不同点在于旧值 `oldVal` 的值只能从 `cleanup` 函数中获取。

```ts
export default function Example() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log("count新值：", count);
    return () => {
      console.log("count旧值：", count);
    };
  }, [count]);

  return (
    <>
      <button onClick={() => setCount(count + 1)}>点击count：{count}</button>
    </>
  );
}
```


![ainimation4.gif](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/db303635639f4ce8a4e418715f1d1839~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgSmlhbmdKaWFuZw==:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzM2ODU1OTM1OTU2NDA4OCJ9&rk3s=e9ecf3d6&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1744714314&x-orig-sign=v77dNqMbkT5Uj9IazcZNcnbc3yg%3D)

## useEffect 的执行顺序：

1.  组件挂载到页面时，执行 `setup` 函数。
1.  重新渲染依赖项后，使用旧的 `props` 和 `state` 运行 `cleanup` 函数
1.  重新渲染依赖项后，使用新的 `props` 和 `state` 运行 `setup` 函数
1.  组件从页面卸载后，`cleanup` 函数运行最后一次。

## 不同依赖项的行为差异

| 写法                          | 行为                              |
| ----------------------------- | --------------------------------- |
| `useEffect(() => {})`         | 每次 render 都执行                |
| `useEffect(() => {}, [])`     | 仅初次执行（类似 Vue 的 mounted） |
| `useEffect(() => {}, [a, b])` | 依赖 a/b 变化才执行               |

## 几个常见的 useEffect 使用场景

### 场景一：接口请求

```ts
useEffect(() => {
  async function fetchData() {
    const res = await fetch('/api/user');
    const data = await res.json();
    setUser(data);
  }

  fetchData();
}, []);
```

这里有个需要注意的点：使用 `async` 时需要创建一个新的函数去使用，不能直接在 `setup` 函数使用，例如：

```ts
useEffect(async () => {
    const res = await fetch('/api/user');
    const data = await res.json();
    setUser(data);
}, []);
```

这样会直接报错，因为 `useEffect` 返回的是一个 `cleanup` 函数，而 `async` 返回的是一个 `Promise` 函数。

### 场景二：事件监听（添加/移除）

```ts
useEffect(() => {
  const handleResize = () => {
    setWindowWidth(window.innerWidth);
  };

  window.addEventListener('resize', handleResize);

  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);
```

注意使用 `cleanup` 函数清除监听，避免内存泄漏。

### 场景三：长链接（WebSocket等）

```ts
useEffect(() => {
  const socket = new WebSocket('ws://example.com');
  socket.onmessage = (e) => setMessage(e.data);

  return () => socket.close(); // 卸载时断开连接
}, []);
```

同上，组件销毁时需要使用 `cleanup` 函数关闭 `socket`，避免内存泄漏。

## 陷阱1：useEffect 无限触发

```ts
export default function Example() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(count + 1);
  }, [count]);

  return (
    <>
      <button onClick={() => setCount(count + 1)}>点击count：{count}</button>
    </>
  );
}
```

你一改 `count`，它就触发 effect，effect 里又改 `count`，陷入死循环。

> 依赖项中包含的变量 **不要在副作用里更新它**。


![ainimation5.gif](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/5a7539f8f0e349fbbf0e6ca499d85c4e~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgSmlhbmdKaWFuZw==:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzM2ODU1OTM1OTU2NDA4OCJ9&rk3s=e9ecf3d6&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1744714323&x-orig-sign=xaZ%2FS61U7PHiAIJFjafiAAnRp%2FI%3D)

## 陷阱2：忘记清除副作用

```ts
useEffect(() => {
  const socket = new WebSocket('ws://example.com');
  socket.onmessage = (e) => setMessage(e.data);
}, []);
```

这段代码每次调用 `useEffect` 的时候就会创建一个 `socket` 链接，如果我们没有在 `cleanup` 函数中计算关闭链接，那么每次触发 `useEffect` 都会建立一条新的链接，导致性能问题甚至报错。

优化：

```ts
useEffect(() => {
  const socket = new WebSocket('ws://example.com');
  socket.onmessage = (e) => setMessage(e.data);

  return () => socket.close(); // 卸载时断开连接
}, []);
```

* * *

## 总结

**useEffect** 是 React 中处理副作用的核心 Hook，理解它的运行机制能让你写出更健壮的组件逻辑。

-   它在组件渲染后执行，依赖项更新时重新触发。
-   可以返回清除函数，清理事件、定时器、长链接等副作用。
-   编写 useEffect 时，要关注**依赖、时机和清除机制**。
-   警惕副作用中修改依赖项，容易陷入无限循环。

希望这篇文章能帮你快速掌握 **useEffect**，如果你觉得有帮助，别忘了点个赞👍或关注我后续的 **重学 React** 系列！