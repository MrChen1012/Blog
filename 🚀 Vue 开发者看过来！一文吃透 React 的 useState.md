# 🚀 Vue 开发者看过来！一文吃透 React 的 useState

> 作为 Vue 转 React 的前端，我刚开始接触 `useState` 时踩了不少坑。这篇文章我会用尽量通俗的方式，帮你彻底掌握它的用法和原理！

## 什么是 useState？

React 官方对 `useState` 的定义是：

> “useState 是一个 Hook，它允许你在函数组件中添加状态。”

这意味着，在 React 函数组件中，你可以像类组件一样维护局部状态。

**我的理解**

useState 相当于 Vue 组件里的 data，但它的更新方式和思路和 Vue 不一样，得靠 `setState` 显式更新。

***

## useState 的基本用法

### 我们简单举个栗子，一个常见的计数器

```ts
import { useState } from 'react'

export default function Counter() {
    const [count, setCount] = useState(0)

    return (
        <button onClick={() => setCount(count + 1)}>
            点击了 {count} 次
        </button>
    )
}
```

当我们点击按钮时，会触发 `setCount` 方法，改变 `count` 的值。

React 会存储新状态，使用新值重新渲染组件，并更新 UI。

![ainimation1.gif](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/90204f218a544090b2cf13f1b6084751~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgSmlhbmdKaWFuZw==:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzM2ODU1OTM1OTU2NDA4OCJ9&rk3s=f64ab15b&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1744974036&x-orig-sign=bAMRwsEbuj20BKULhBlfhzNTmk8%3D)

`useState` 返回一个由两个值组成的数组，例如 `[count, setCount]`

*   第一个参数是当前的 `state`，初始值为 `useState(initialState)` 传入的值, `initialState` 可以是任何类型的值。
*   第二个参数是 `set` 方法，它允许你把 `state` 改变为任何其他值。你可以随意命名，但最好统一命名为：`setInitialState`.

需要注意的一点是：**当 `useState` 状态的值更新时，组件会重新渲染。**

**举个栗子**

```ts
import { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0);

  console.log("执行Counter");

  return <button onClick={() => setCount(count + 1)}>点击了 {count} 次</button>;
}

```

![ainimation2.gif](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/87aac10003474d8cb48739c19ea28d7a~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgSmlhbmdKaWFuZw==:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzM2ODU1OTM1OTU2NDA4OCJ9&rk3s=f64ab15b&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1744974036&x-orig-sign=iR5jKNndi2RaHB9Z9LgZS9XRaxE%3D)

可以看到我们每次触发 `count` 改变都会重新执行一次 `Counter` 函数，如果想避免这种情况也有办法，那就是 React 的另外一个 `Hook` ： `useMemo`，本文暂不做讲解，感兴趣的自行[前往官网查阅](https://react.docschina.org/reference/react/useMemo)。

## 多个 useState 的执行顺序很重要

```ts
function Demo() {
  const [count, setCount] = useState(0);
  const [visible, setVisible] = useState(true);

  // 注意顺序不能动态变化！
}
```

### ❌ 错误示例

```ts
if (someCondition) {
  const [flag, setFlag] = useState(false); // 报错：Hook 调用顺序改变
}
```

### ✅ 解决思路

*   始终把所有的 Hook 放在组件顶层，不要放在 if/for/函数里。

> React 内部依靠 Hook 的「调用顺序」来管理每个 state，如果调用顺序发生变化，React 无法正确“对应”上每个 state。
>
> 这也是 React 为了性能和可预测性作出的权衡，不使用依赖名称，而是**通过顺序索引定位 state**，需要我们在编码中遵守「稳定顺序」这一原则。

**接下来我们看一些常见的 useState 使用陷阱，提前避坑少踩雷！**

## 🧨 陷阱1：state 如同一张快照

### **举个栗子**

```ts
import { useState } from 'react'

export default function Counter() {
    const [count, setCount] = useState(0)

    const handleClick = () => {
        setCount(count + 1)
        console.log('点击了按钮, 计数器的值为: ' + count);
    }

    return (
        <button onClick={handleClick}>
            点击了 {count} 次
        </button>
    )
}
```

点击一次按钮，控制台会输出什么？

![ainimation3.gif](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/3fd2c9c94e594fc7b94d1a8817cb1541~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgSmlhbmdKaWFuZw==:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzM2ODU1OTM1OTU2NDA4OCJ9&rk3s=f64ab15b&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1744974036&x-orig-sign=%2FGQeVJ6aO54kBijDBYvjSR23QHM%3D)

是不是感觉很奇怪，为什么 `count` 的值还是改变前的值？

难道 `count` 的改变是异步的？我们加个定时器看看：

```ts
import { useState } from 'react'

export default function Counter() {
    const [count, setCount] = useState(0)

    const handleClick = () => {
        setCount(count + 1)
        setTimeout(() => {
            console.log('点击了按钮, 计数器的值为: ' + count);
        }, 2000);
    }

    return (
        <button onClick={handleClick}>
            点击了 {count} 次
        </button>
    )
}
```

![ainimation4.gif](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/6460ca75e03742df9397e42db888d9dc~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgSmlhbmdKaWFuZw==:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzM2ODU1OTM1OTU2NDA4OCJ9&rk3s=f64ab15b&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1744974036&x-orig-sign=HUlp%2F%2FzgxWwssCYeQGvfw05kYII%3D)

上面栗子得出结论，`state` 更新的值跟异步无关，我们套用官网的解释

> **一个 state 变量的值永远不会在一次渲染的内部发生变化，** 即使其事件处理函数的代码是异步的。
>
> **React 会使 state 的值始终”固定“在一次渲染的各个事件处理函数内部。**

那如果我们就是想在重新渲染之前读取最新的 `state` 怎么办？

## 解决方案：set 传入更新函数

在说明解决方案前我们再举一个栗子：**多次更新数据**

```ts
export default function Counter() {
    const [count, setCount] = useState(0)

    const handleClick = () => {
        setCount(count + 1)
        setCount(count + 1)
        setCount(count + 1)
    }

    return (
        <>
            <h1>{count}</h1>
            <button onClick={handleClick}>增加数字</button>
        </>
    )
}
```

大伙们觉得点击一次按钮，会输出什么结果？

调用了3次 `setCount(count + 1)`，结果会是3吗？

![ainimation5.gif](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/3b2cbac012604575a0897efccd0fa6b0~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgSmlhbmdKaWFuZw==:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzM2ODU1OTM1OTU2NDA4OCJ9&rk3s=f64ab15b&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1744974036&x-orig-sign=gN7o0bDZsXRmIEPwN71%2F4WZBHmo%3D)

正如前面所说的，**每一次渲染的state值都是固定的**，因此无论你调用多少次 `setCount(count + 1)`，在第一次渲染的事件处理函数内部的 `count` 值总是 `0` ：

我们可以通过传入一个 **更新函数** 去解决此类问题，比如 `setCount(count=>count + 1)`，我们改写上面栗子

```ts
export default function Counter() {
    const [count, setCount] = useState(0)

    const handleClick = () => {
        setCount(count=>count + 1)
        setCount(count=>count + 1)
        setCount(count=>count + 1)
    }

    return (
        <>
            <h1>{count}</h1>
            <button onClick={handleClick}>增加数字</button>
        </>
    )
}
```

现在尝试下点击按钮看看效果

![ainimation6.gif](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/73a7f5f545e5437dbd994c3e237238be~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgSmlhbmdKaWFuZw==:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzM2ODU1OTM1OTU2NDA4OCJ9&rk3s=f64ab15b&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1744974036&x-orig-sign=9rsbktwaathEbrsVoxcLMFDQub0%3D)

栗子中的 `count=>count + 1` 称为更新函数，当你传递给 `set` 方法作为参数时：

*   React 会将此函数加入队列，以便在事件处理函数中的所有其他代码运行后进行处理。
*   在下一次渲染期间，React 会遍历队列并给你更新之后的最终 state。

## 🧠 为什么 React 不像 Vue 那样，直接修改值就能响应？

React 的理念是**数据驱动视图的单向数据流**，通过 `setState` 显式调用，能：

*   更清晰知道 state 的更新来源，方便调试和测试；
*   允许 React 批量处理多次 state 更新，提高性能；
*   与函数式编程理念一致，避免隐式副作用；

相比之下，Vue 的响应式更自动化，但也容易陷入“修改值却视图不更新”的问题，React 的方式更「显性」。

## 🧨 陷阱2：state 中的对象、数组更新

### **举个栗子**

```ts
export default function User() {
    const [user, setUser] = useState(
        {
            name: 'JiangJiang',
            age: 18 
        }
    )

    const handleClick = () => {
        user.age = 19
    }

    return (
        <>
            <h1>名字：{user.name}</h1>
            <h2>年龄：{user.age}</h2>
            <button onClick={handleClick}>长大</button>
        </>
    )
}
```

这里我们不通过 `setUser` 函数，而是直接去操控 `user` 对象，去改变其 `age` 值。

![ainimation7.gif](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/1cd4750375134faa9d152cc0390788cc~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgSmlhbmdKaWFuZw==:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzM2ODU1OTM1OTU2NDA4OCJ9&rk3s=f64ab15b&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1744974036&x-orig-sign=3oBVf%2BTqwFBrikER9xeSs1alPrk%3D)

不出意外，果然是不行的，让我们看看官方文档是怎么描述的：

> state 中可以保存任意类型的 JavaScript 值，包括对象。但是，你不应该直接修改存放在 React state 中的对象。相反，当你想要更新一个对象时，你需要创建一个新的对象（或者将其拷贝一份），然后将 state 更新为此对象。

可以得出结论，每次去改变对象的值时，必须通过 `set` 方法去进行改变，并且相当于重新创建一个对象（或者是浅拷贝），然后将 state 更新为此对象。

```ts
export default function User() {
    const [user, setUser] = useState({
        name: 'JiangJiang',
        age: 18
    })

    const handleClick = () => {
        setUser({
            name: 'JiangJiang',
            age: user.age - 1
        })
    }

    return (
        <>
            <h1>名字：{user.name}</h1>
            <h2>年龄：{user.age}</h2>
            <button onClick={handleClick}>逆龄</button>
        </>
    )
}
```

![ainimation8.gif](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/e435e134b5354b0ea4141467d2a8d786~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgSmlhbmdKaWFuZw==:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzM2ODU1OTM1OTU2NDA4OCJ9&rk3s=f64ab15b&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1744974036&x-orig-sign=slTAor8JjAwJBE8zy6Xs8%2F6e400%3D)

> 嘿嘿嘿...

### 更新数组的方式也一样：

```ts
const [list, setList] = useState([1, 2, 3]);

setList([...list, 4]); // 添加元素
setList(list.filter(item => item !== 2)); // 删除元素
```

**React 默认是通过「浅比较」来判断 state 是否变化的（也就是 === 判断）。**

*   直接修改对象属性不会改变对象引用，React 判断“没变”就不会更新；
*   而创建新对象，改变了引用，React 才能识别到变化。

## useState 和 Vue 响应式的差异

| 对比项   | React (useState)             | Vue (响应式)                     |
| -------- | ---------------------------- | -------------------------------- |
| 状态存储 | 函数组件内通过 useState 定义 | 组件实例中的 data                |
| 状态更新 | 必须用 setState              | 直接修改属性即可                 |
| 原理     | 状态更新会触发整组件重新执行 | 依赖收集 + 精准更新视图          |
| 易错点   | 不能直接修改 state           | 响应式陷阱较多（如数组变异方法） |

## ✅ 总结

*   `useState` 是 React 函数组件管理状态的基础
*   用法虽然简单，但细节多、坑也不少
*   尤其是对象、数组、多个 state 管理，值得认真掌握

掌握 **useState**，是迈入 React 世界的第一步，也是之后理解 **useEffect**、**useReducer** 的基础。

希望这篇文章能帮你快速掌握 **useState**，如果你觉得有帮助，别忘了点个赞👍或关注我后续的 **重学 React** 系列！