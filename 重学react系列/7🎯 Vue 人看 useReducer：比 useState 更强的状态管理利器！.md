# 🎯 Vue 人看 useReducer：比 useState 更强的状态管理利器！

> 如果你正在从 Vue 转向 React，习惯了 Vuex，那 `useReducer` 会是你在 React 世界里最熟悉的“老朋友”。本文将通过一个「计时器」例子，帮你从 0 到 1 搞懂 `useReducer`。

## 🧠 为什么我们需要 useReducer？

还记得你第一次用 `useState` 管理多个状态时的痛苦吗？

```ts
const [title, setTitle] = useState('');
const [content, setContent] = useState('');
const [tags, setTags] = useState([]);
```

当业务越做越复杂，状态越来越多，`useState` 变得捉襟见肘。逻辑分散、更新混乱，不小心还会写出 bug...

你开始怀念 Vue 的 Vuex：状态统一管理，逻辑清晰。

这时候，React 的 `useReducer` 就该登场了！

------



## 🔍 useReducer 是什么？

> `useReducer` 是 React 内置的一个 Hook，用来处理复杂状态更新逻辑。

怎样去理解这句话？

比如我们现在在实现一个计时器的需求，需要有 `开始、暂停、计次、重置` 功能，我们用 `useState` 去创建需要用到的值：

```ts
export default function TimerUseState() {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [laps, setLaps] = useState([]);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setTime((prev) => prev + 10);
      }, 10);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const handleStartStop = () => {
    setIsRunning(!isRunning);
  };

  const recordLap = () => {
    setLaps((prev) => [...prev, time]);
  };

  const reset = () => {
    setIsRunning(false);
    setTime(0);
    setLaps([]);
  };

  return (
    <div>
      <h2>{(time / 1000).toFixed(2)}s</h2>
      <button onClick={handleStartStop}>{isRunning ? "暂停" : "开始"}</button>
      <button onClick={recordLap} disabled={!isRunning}>
        计次
      </button>
      <button onClick={reset}>重置</button>
      <div>计次记录：{laps.join(", ")}</div>
    </div>
  );
}
```

我们看下大致功能：

![ainimation1](C:\cgj\1code\我的\面试\1博客\img\useReducer\ainimation1.gif)

功能实现了，但是问题也很多：

- 状态管理分散，多个 `state` 变量
- 逻辑分散在多个函数
- 每次修改需要定位到各处地方
- 新增功能需要修改多个位置

而 `useReducer` 就是用来解决这些问题的，接下来我们用 `useReducer` 去进行优化。

## ⚡ 快速上手：3 分钟学会 useReducer

使用 `useReducer` 优化上面计时器：

### 第一步：创建 initialState 存储所需变量

```ts
const initialState = {
  time: 0,
  isRunning: false,
  laps: [],
};
```

我们把所有的状态都统一收拢到一个对象里，便于管理。

### 第二步：创建 reducer 函数集中更新逻辑

```ts
function reducer(state, action) {
  switch (action.type) {
    case "toggle":
      return { ...state, isRunning: !state.isRunning };
    case "tick":
      return { ...state, time: state.time + 10 };
    case "lap":
      return { ...state, laps: [...state.laps, state.time] };
    case "reset":
      return { isRunning: false, time: 0, laps: [] };
    default:
      return state;
  }
}
```

注意：**React 的 `dispatch` 类似 Vuex 的 `commit`，但必须返回新对象！**

> “React 是通过比较对象引用判断是否需要重新渲染的，所以必须返回新对象。”

### 第三步：创建 useReducer，修改 useEffect 更新调用

```ts
  const [state, dispatch] = useReducer(reducer, initialState);
  const { time, isRunning, laps } = state;

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        dispatch({ type: "tick" });
      }, 10);
    }
    return () => clearInterval(interval);
  }, [isRunning]);
```

改完后我们再来看下：

![ainimation2](C:\cgj\1code\我的\面试\1博客\img\useReducer\ainimation2.gif)

功能上没问题，我们使用 `useReducer` 优化后：

- 统一状态管理为 **单一对象**。
- 所有更新逻辑集中在 `reducer` 函数。
- 后续功能变动只需要改动 `reducer` 函数。
- 新增功能通过添加 `action` 类型轻松扩展。

**完整代码如下：**

```ts
import { useReducer, useEffect } from "react";

const initialState = {
  time: 0,
  isRunning: false,
  laps: [],
};

function reducer(state, action) {
  switch (action.type) {
    case "toggle":
      return { ...state, isRunning: !state.isRunning };
    case "tick":
      return { ...state, time: state.time + 10 };
    case "lap":
      return { ...state, laps: [...state.laps, state.time] };
    case "reset":
      return { isRunning: false, time: 0, laps: [] };
    default:
      return state;
  }
}

export default function TimerUseState() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { time, isRunning, laps } = state;

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        dispatch({ type: "tick" });
      }, 10);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  return (
    <div>
      <h2>{(time / 1000).toFixed(2)}s</h2>
      <button onClick={() => dispatch({ type: "toggle" })}>
        {isRunning ? "暂停" : "开始"}
      </button>
      <button onClick={() => dispatch({ type: "lap" })} disabled={!isRunning}>
        计次
      </button>
      <button onClick={() => dispatch({ type: "reset" })}>重置</button>
      <div>计次记录：{laps.join(", ")}</div>
    </div>
  );
}
```

可以看到，我们只用了三步，就把状态集中管理起来，接下来我们再看下两者对比以及 `useReducer` 的更多使用细节。

## 🆚 useReducer vs useState：该怎么选？

| 对比项   | useState           | useReducer                         |
| -------- | ------------------ | ---------------------------------- |
| 适合场景 | 状态简单、独立     | 状态复杂、关联强、更新依赖前一状态 |
| 更新方式 | setState(value)    | dispatch({ type, payload })        |
| 状态结构 | 多个 useState 分散 | 单一 reducer 统一管理              |
| 可维护性 | 中大型项目容易混乱 | 状态逻辑集中、便于测试与维护       |
| Vue 类比 | data + methods     | Vuex 的 state + mutation           |

在状态管理分散，逻辑分散的情况下我们更应该去选用 `useReducer`。

![img1](C:\cgj\1code\我的\面试\1博客\img\useReducer\img1.png)

`useReducer` + `useContext` 还可以实现一个迷你版的 Vuex，具体案例可以参考前面的文章：[用 useContext 实现 Vuex 同款全局状态管理！](https://juejin.cn/post/7494078158218231835)

------

> **虽然 useReducer 看起来很优雅，但在实际开发中，也有不少坑。下面我们来逐一拆解。**

## 🚨 常见陷阱与解决方案

### 1. 直接修改 state 对象

**错误示例：**

```ts
function reducer(state, action) {
  switch (action.type) {
    case 'ADD_TAG':
      state.tags.push(action.payload); // 直接修改原数组
      return state; // 错误：返回同一个引用
    default:
      return state;
  }
}
```

**这会导致：**

- **组件不更新**：React 依赖不可变数据判断是否需要重新渲染。
- **难以调试**：Redux DevTools 无法正确显示状态变化。

**优化：**

```ts
case 'ADD_TAG':
  return {
    ...state,
    tags: [...state.tags, action.payload]
  };
```

### 2. 巨型 Reducer 函数

**错误示例：**

```ts
function reducer(state, action) {
  // 处理用户操作
  // 处理商品数据
  // 处理订单逻辑
  // 超过 500 行代码...
}
```

**这会导致：**

- 难以维护，找一个修改点如同大海捞针。
- 多人协助时容易频繁修改代码导致冲突。

**优化：**

拆分多个 `Reducer`，模块化代码。

### 3. 异步操作

**错误示例：**

```ts
function reducer(state, action) {
  switch (action.type) {
    case 'FETCH_DATA':
      fetch('/api/data').then(res => {
        state.data = res;
      });
      return state;
  }
}
```

**这会导致：**

- 多个请求返回顺序不确定
- 状态更新脱离 `Reducer` 控制

**优化：**

```ts
// 正确流程：在组件层处理异步
useEffect(() => {
  let isActive = true;
  dispatch({ type: 'FETCH_START' });
  
  fetch('/api/data')
    .then(res => isActive && dispatch({ type: 'FETCH_SUCCESS', payload: res }))
    .catch(err => isActive && dispatch({ type: 'FETCH_FAILURE', error: err }));

  return () => isActive = false;
}, []);

// Reducer 处理纯同步更新
case 'FETCH_SUCCESS':
  return { ...state, data: action.payload, loading: false };
```

------

## 🎯 写在最后

`useReducer` 是 React 中一把处理复杂状态的利器，尤其适合逻辑多、状态依赖强的场景。对 Vue 用户来说，它就像是 React 版的 Vuex，用起来既熟悉又顺手。

**如果你在用 `useState` 管状态用得头大，不妨试试 `useReducer`，真的会上瘾！**

希望这篇文章能帮你快速掌握 **useReducer**，如果你觉得有帮助，别忘了点个赞👍或关注我后续的 **重学 React** 系列！

