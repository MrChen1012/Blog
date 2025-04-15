# 🚀 Vue人看React useRef：它不只是替代 ref


> 如果你是从 Vue 转到 React 的开发者，初见 `useRef` 可能会想：这不就是 React 版的 `ref` 吗？但真相是 —— 它能做的，比你想象得多得多。

## 👀 Vue 人初见 useRef

在 Vue 中，`ref` 是我们访问 DOM 或响应式数据的利器。但在 React 中，`useRef` 并不止是一个获取 DOM 的工具，它更像是一个“不会引起重新渲染的变量容器”。

如果你在想：

-   “为啥我改了 `ref.current`，界面却没更新？”
-   “这玩意儿跟 Vue 的 `ref` 好像不太一样？”
-   “它除了操作 DOM 还能干嘛？”

这篇文章，就帮你用 Vue 人的视角，彻底搞懂 `useRef` 的多种用法与常见陷阱。

* * *

## 🔍 什么是 useRef

引入 React 文档的话：

> "`useRef` 是一个 React Hook，它能帮助引用一个不需要渲染的值"

`useRef` 创建的是一个普通的 `Javascript` 对象，里面仅有一个 `current` 属性，用于读取和修改。

```ts
import { useRef } from "react";

function Example() {
  const countRef = useRef(0);
  countRef.current += 1;
}
```

`useRef` 是一个 **可变的盒子**，你可以把任何值塞进去，它不会重新触发组件 `render`，但你可以随时取用。

##### 🧪 举个栗子：

```ts
export default function Example() {
  const countRef = useRef(0);
  console.log("render");

  return (
    <button onClick={() => (countRef.current += 1)}>
      点击count：{countRef.current}
    </button>
  );
}
```

我们创建一个按钮去给 `countRef` 进行自增，我们看看组件有没有重新 `render`。


![ainimation1.gif](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/27e7121b182e429ca6c2d82c3d4369d5~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgSmlhbmdKaWFuZw==:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzM2ODU1OTM1OTU2NDA4OCJ9&rk3s=e9ecf3d6&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1744798359&x-orig-sign=g4DltgGAX548dU4Z16UQvHAImwU%3D)

可以看到，虽然 `countRef` 数据自增了，但是却不会 **触发新的渲染**。

> "当你希望组件“记住”某些信息，但又不想让这些信息 **触发新的渲染** 时，你可以使用 **useRef**"

如果你比较熟悉 `useState`，我们可以举个更简单的例子：

```ts
import { useState } from "react";

export default function Example() {
  const [countRef, never] = useState({ current: 0 });

  return (
    <button onClick={() => (countRef.current += 1)}>
      点击count：{countRef.current}
    </button>
  );
}
```

原则上 `useRef` 可以在 `useState` 的基础上实现：

> 不使用`setup`函数去改变值，不去触发新的渲染。

了解了基本概念，我们再来看看它与 Vue 的 `ref` 有哪些关键不同。

## ⚔️ useRef 和 Vue ref 的区别

| 对比点           | useRef                              | Vue ref                        |
| ---------------- | ----------------------------------- | ------------------------------ |
| 响应性           | 不具备响应性，不触发 render         | 具备响应性，数据变化会更新视图 |
| 使用场景         | DOM引用、缓存变量、定时器、历史值等 | DOM引用、响应式数据            |
| 数据结构         | `{ current: value }`                | `value` 是响应式对象           |
| 是否引发视图更新 | 否                                  | 是                             |

Vue 的 `ref` 是 **响应式容器**，值变化会自动更新视图；

而 React 的 `useRef` 更像一个可读写但**不具响应性**的变量盒子。

## 🧩 useRef 常见使用场景

前面介绍完 `useRef` 的基本概念和使用方法，我们接下来看看平时开发中比较常见的使用场景：

### 1. 定时器引用

我们来实现一个 **简易计时器**

```ts
import { useState, useRef } from "react";

export default function Example() {
  const [time, setTime] = useState(0);
  const timerRef = useRef(null);

  const handleStart = () => {
    if (timerRef.current) return;
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setTime(Date.now() - startTime);
    }, 10);
  };
  const handleStop = () => {
    if (!timerRef.current) return;
    clearInterval(timerRef.current);
    timerRef.current = null;
    console.log("销毁定时器：", timerRef.current);
  };

  return (
    <>
      <h1>计时器： {time}</h1>
      <button onClick={handleStart}>开始</button>
      <button onClick={handleStop}>停止</button>
    </>
  );
}
```

-   按下开始键，**计时器** 开始进行计时，这时候把定时器存到 `timerRef` 中
-   按下停止键，销毁当前定时器，防止出现 **闭包导致的内存泄漏**。


![ainimation2.gif](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/63ca86db396c4519ae1b5804774c08c2~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgSmlhbmdKaWFuZw==:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzM2ODU1OTM1OTU2NDA4OCJ9&rk3s=e9ecf3d6&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1744798367&x-orig-sign=YfNxCJB1Kp0YBlZ0A%2BBz%2BPxLniE%3D)

### 2. 操作 DOM

我们假定一个场景，用户进入页面时，我们需要用户光标默认 **聚焦到输入框**。

```ts
import { useEffect, useRef } from "react";

export default function Example() {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return <input ref={inputRef} />;
}
```

我们需要：

-   使用 `useRef` 创建 `inputRef`，默认值为 `null`。
-   使用 `ref={inputRef}` 去存储当前 `DOM` 元素。
-   通过 `useEffect` 在进入页面时进行 `inputRef.current?.focus()`

这里类似 Vue 的 `ref="xxx"` + `this.$refs.xxx.focus()`。

> **注意：** 不要在渲染过程中读取或写入`ref.current`，会使`ref`变得不可预测。


![ainimation3.gif](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/56385f7cf0184ea6a0d3b67b90ca75c1~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgSmlhbmdKaWFuZw==:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzM2ODU1OTM1OTU2NDA4OCJ9&rk3s=e9ecf3d6&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1744798374&x-orig-sign=Mh83gZ0Y8ECvPSRDW5hgPp8J9M4%3D)

使用 `ref` 去存储正常的标签都能正常获取其 `DOM` 元素，但是当你尝试将 `ref` 放在 **自定义组件** 上，会发生什么呢？

### 3. 绑定自定义组件的 ref

我们先来实践一下：

```ts
import { useEffect, useRef } from "react";

function MyInput(props) {
  return <input {...props} />;
}

export default function Example() {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return <MyInput ref={inputRef} />;
}
```

我们创建一个 `MyInput` 子组件，然后把 `ref` 绑定到我们子组件上。

控制台直接给我们弹了报错：


![image-20250415174214785.png](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/0bc67d78069247e1b7eee004190f605e~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgSmlhbmdKaWFuZw==:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzM2ODU1OTM1OTU2NDA4OCJ9&rk3s=e9ecf3d6&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1744798383&x-orig-sign=sxldMShiV7JYd7vKi5AD2e2mwfA%3D)

React 向控制台打印一条错误消息，提示我们如果想操控子组件，需要去使用 `forwardRef` API。

### `forwardRef` 的用法

-   `forwardRef`表示允许子组件将其 `DOM` 节点放入 `ref` 中，默认情况下是不允许的。
-   `forwardRef`会让传入的子组件多一个 `ref` 作为第二个参数传入，用于存储当前 `DOM` 节点，第一个参数为 `props`。

我们改进下：

```ts
const MyInput = forwardRef((props, ref) => {
  return <input {...props} ref={ref} />;
});
```

我们将 `ref` 绑定到 `MyInput` 组件中的 `input`，再来看看效果：


![ainimation4.gif](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/bd0e1873658e4ddd89c67c348ae6e1f5~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgSmlhbmdKaWFuZw==:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzM2ODU1OTM1OTU2NDA4OCJ9&rk3s=e9ecf3d6&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1744798389&x-orig-sign=LGh7S89RzL5thgVkH14Pn9OAqy4%3D)

现在不会报错了，并且 `input` 框也正常 **聚焦** 了。

* * *

## 总结

-   `useRef` 用于存储值且不想去触发 `render` 的场景。
-   `useRef` 创建的值通过 `.current` 去进行 **读取、修改**。
-   常见用于存储 **定时器、 `DOM` 节点**。
-   存储自定义组件的 `DOM` 节点需配合 `forwardRef` API 使用。
-   需要注意 **不要在渲染过程中读取或写入 `ref.current`**。

如果你也是从 Vue 转过来的，看到这里可能已经对 `useRef` 有了更清晰的认知 —— 它并不是 Vue 的 `ref` 替代品，而是一种完全不同思路下的**状态管理补充工具**。

希望这篇文章能帮你快速掌握 **useRef**，如果你觉得有帮助，别忘了点个赞👍或关注我后续的 **重学 React** 系列！