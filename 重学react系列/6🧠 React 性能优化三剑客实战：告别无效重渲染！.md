# 🧠 useMemo + memo + useContext 性能优化实战：从无感重渲染到丝滑体验

> 在 Vue 中我们可能依赖 Vuex + computed 进行状态共享和性能优化，而在 React 里呢？不需要用 Redux，靠 `useContext`、`memo`、`useMemo` 三剑客就能构建高性能组件通信方案！

## 🧩 useContext 再回顾：状态共享不等于性能优化

上篇问题我们讲了 `useContext` 实现全局状态管理，但也提到了 `useContext` 引起的性能问题：

> “每当`useContext`内的数据发生变化，都会导致 **所有使用`useContext()`的组件**重新渲染。”

```ts
const ThemeContext = createContext('light');

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Toolbar />
    </ThemeContext.Provider>
  );
}

function Toolbar() {
  return <ThemedButton />;
}

function ThemedButton() {
  const theme = useContext(ThemeContext);
  return <button className={theme}>按钮</button>;
}
```

虽然 `useContext` 很好用，但它有一个致命的性能问题：**只要 `Provider` 的 `value` 改变，所有用到这个 `context` 的组件都会重新渲染**，哪怕组件内部根本没用到变化的值。

`useContext` 本身并不具备“避免不必要渲染”的能力。

接下来，我们将通过一个实际项目场景，讲解如何组合使用 `useMemo`、`memo` 和 `useContext`，从而将一次看似不起眼的性能问题，打磨成用户几乎无感的丝滑体验。

------



## 🧩 回顾三剑客

简单回顾下三剑客（想详细了解更多概念的请翻阅之前文章）：

### 🟦 `useContext`

- 用于在组件树中共享状态
- 类似 Vue 的 `provide` / `inject`

```ts
const ThemeContext = createContext();
const value = useContext(ThemeContext);
```

### 🟩 `memo`

- 用于缓存组件结构
- 类似 Vue 的 `v-memo` + `pureComponent` 行为

```ts
const MemoComponent = memo(Component);
```

### 🟨 `useMemo`

- 用于缓存变量值或对象引用，避免不必要计算或更新
- 类似 Vue 的 `computed`（但是手动依赖）

```ts
const memoizedValue = useMemo(() => computeVal(), [deps]);
```

### 三剑客作用

| Hook         | 作用                                           |
| ------------ | ---------------------------------------------- |
| `useContext` | 跨组件传递状态                                 |
| `memo`       | 记忆组件，避免无意义的重新渲染                 |
| `useMemo`    | 记忆复杂数据或对象，避免引用变化导致子组件更新 |

三者组合的思路是：

> “将不会变的值用`useMemo`缓存，传给`Context`，再通过`memo`包裹真正消费这些值的子组件。”

## 🧩 场景背景

你在开发一个社交 App 的文章详情页，页面中包含：

- 一篇文章信息
- 一组评论列表（`CommentList`）
- 一个点赞按钮（`LikeButton`）

> 点赞按钮点击后只影响点赞数，但由于组件结构未优化，整个评论列表也会 **无意义刷新** —— 这是我们要优化的核心问题。

## ❌ 优化前代码（每次点赞导致所有子组件刷新）

```ts
import { useState } from "react";

export default function App() {
  const [likes, setLikes] = useState(0);
  const [comments] = useState([
    { id: 1, author: "张三", content: "写得真好！" },
    { id: 2, author: "李四", content: "受教了！" },
  ]);

  return (
    <div>
      <LikeButton likes={likes} onLike={() => setLikes(likes + 1)} />
      <CommentList comments={comments} />
    </div>
  );
}

function LikeButton({ likes, onLike }) {
  return <button onClick={onLike}>👍 点赞 ({likes})</button>;
}

function CommentList({ comments }) {
  console.log("CommentList 渲染");
  return (
    <ul>
      {comments.map((comment) => (
        <li key={comment.id}>
          <strong>{comment.author}：</strong>
          {comment.content}
        </li>
      ))}
    </ul>
  );
}
```

**痛点分析：**

- 每次点击点赞按钮，父组件 `App` 重新渲染。
- 尽管 `comments` 没有变化，`CommentList` 仍然重新渲染。

![ainimation1](C:\cgj\1code\我的\面试\1博客\img\react三剑客优化性能\ainimation1.gif)

## ✅ 简单，用 memo 直接解决

```ts
import { useState, memo } from "react";

const MemoCommentList = memo(CommentList);

export default function App() {
  const [likes, setLikes] = useState(0);
  const [comments] = useState([
    { id: 1, author: "张三", content: "写得真好！" },
    { id: 2, author: "李四", content: "受教了！" },
  ]);

  return (
    <div>
      <LikeButton likes={likes} onLike={() => setLikes(likes + 1)} />
      <MemoCommentList comments={comments} />
    </div>
  );
}
...
```

我们引入 `memo`，创建 `memo` 组件 `MemoCommentList`，此时再看：

![ainimation2](C:\cgj\1code\我的\面试\1博客\img\react三剑客优化性能\ainimation2.gif)

**哦豁！？这就解决了？如此简单？**

此时一位热心网友 **JiangJiang** 出现了，他也想来发表评论：

此时评论区来了位 **帅哥-JiangJiang**，他也想发表评论：

```ts
import { useState, memo, createContext, useContext } from "react";

const CommentContext = createContext(null);
const MemoCommentList = memo(CommentList);

export default function App() {
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState([
    { id: 1, author: "张三", content: "写得真好！" },
    { id: 2, author: "李四", content: "受教了！" },
  ]);

  return (
    <div>
      <CommentContext.Provider value={{ comments, setComments }}>
        <LikeButton likes={likes} onLike={() => setLikes(likes + 1)} />
        <MemoCommentList />
      </CommentContext.Provider>
    </div>
  );
}

function LikeButton({ likes, onLike }) {
  return <button onClick={onLike}>👍 点赞 ({likes})</button>;
}

function CommentList() {
  const { comments } = useContext(CommentContext);
  console.log("CommentList 渲染");
  return (
    <>
      <ul>
        {comments.map((comment) => (
          <li key={comment.id}>
            <strong>{comment.author}：</strong>
            {comment.content}
          </li>
        ))}
      </ul>
      <SendRemark />
    </>
  );
}

function SendRemark() {
  const { comments, setComments } = useContext(CommentContext);
  const handleAdd = () => {
    const newComment = {
      id: comments.length + 1,
      author: "JiangJiang",
      content: "这篇文章不错！",
    };
    setComments([...comments, newComment]);
  };
  return <button onClick={handleAdd}>路过的 JiangJiang</button>;
}
```

补充了下逻辑：

- 新增 `SendRemark` 组件给 **JiangJiang** 发表评论。
- 组件层级比较深，我们使用 `useContext` 来进行状态管理。
- 评论区数据 `comments` 改为从 `context` 中获取。

![img1](C:\cgj\1code\我的\面试\1博客\img\react三剑客优化性能\img1.png)

我们再来看：

![ainimation3](C:\cgj\1code\我的\面试\1博客\img\react三剑客优化性能\ainimation3.gif)

恩，路过的 `JiangJiang` 发表了评论，导致 `comments` 数据变更，引起 `CommentList` 重新渲染，这没问题。

但是...为什么点赞又引起了 `CommentList` 的重新渲染？刚刚使用 `memo` 不是已经解决了？

**就像我路过评论区，却因为点赞被拉进去挨了一顿重渲染的“毒打”……**

### **问题出现在哪里？就在 `context` 上：**

#### 1.`context` 对象引用变化

 `CommentContext.Provider` 的 `value` 中传递了一个新对象：

```ts
value={{ comments, setComments }}
```

每次 `App` 组件渲染（比如点赞时 `likes` 变化），这个对象都会被重新创建，**即使内容未变，但引用地址变化了**。

#### 2.`memo` 对 `context` 无效

`memo` 只能阻止 props 变化导致的渲染，但 **当组件消费的 Context 值变化时（即使内容相同但引用变化），`memo` 也无法阻止渲染**。

**知道了问题所在，那有什么办法可以缓存整个 Context 的 value 对象，保持引用稳定？**

**答案就是：`useMemo`**

## ✅ memo + useMemo + useContext：三剑客联动优化

使用 `useMemo` 解决上面问题，缓存 `value`：

```ts
import { useState, memo, createContext, useContext, useMemo } from "react";

const CommentContext = createContext(null);
const MemoCommentList = memo(CommentList);
const useMemoComments = () => useContext(CommentContext);

export default function App() {
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState([
    { id: 1, author: "张三", content: "写得真好！" },
    { id: 2, author: "李四", content: "受教了！" },
  ]);

  const memoComments = useMemo(() => ({ comments, setComments }), [comments]);

  return (
    <div>
      <CommentContext.Provider value={memoComments}>
        <LikeButton likes={likes} onLike={() => setLikes(likes + 1)} />
        <MemoCommentList />
      </CommentContext.Provider>
    </div>
  );
}

function LikeButton({ likes, onLike }) {
  return <button onClick={onLike}>👍 点赞 ({likes})</button>;
}

function CommentList() {
  const { comments } = useMemoComments();
  console.log("CommentList 渲染");
  return (
    <>
      <ul>
        {comments.map((comment) => (
          <li key={comment.id}>
            <strong>{comment.author}：</strong>
            {comment.content}
          </li>
        ))}
      </ul>
      <SendRemark />
    </>
  );
}

function SendRemark() {
  const { comments, setComments } = useMemoComments();
  const handleAdd = () => {
    const newComment = {
      id: comments.length + 1,
      author: "JiangJiang",
      content: "这篇文章不错！",
    };
    setComments([...comments, newComment]);
  };
  return <button onClick={handleAdd}>路过的 JiangJiang</button>;
}
```

我们加上了：

- 使用 `useMemo` 缓存 `context` 传入的 `value`。
- 自定义了 `Hook：useMemoComments`，方便导出数据。

此时就大功告成了，改变数据也不会引起不相关组件更新：

![ainimation4](C:\cgj\1code\我的\面试\1博客\img\react三剑客优化性能\ainimation4.gif)

相对比优化前的代码，我们做了什么？

- 使用 `memo` 保证子组件只在真正依赖的数据变化是才更新。
- 配合 `useContext` 进行全局状态管理。
- 使用 `useMemo` 缓存 `context value` 值，解决不相关组件也随数据更新问题。

## 🎯 优化效果对比

#### 优化前

![img2](C:\cgj\1code\我的\面试\1博客\img\react三剑客优化性能\img2.png)

#### 优化后

![img3](C:\cgj\1code\我的\面试\1博客\img\react三剑客优化性能\img3.png)

------



## 🧠 总结：三者配合的心法

`useContext` 虽然让跨层级传参变得优雅，但它对性能的 **副作用** 常常被忽视：只要 `value` 的引用发生变化，所有消费它的组件都会 **无差别更新**，哪怕这些组件并未使用发生变化的那部分值。

本文通过一个点赞 + 评论的实战场景，详细剖析了这种性能问题的根源，并通过以下三种方式给出了解决方案：

1. **useMemo 保持 value 稳定**：避免不必要的引用变化；
2. **memo 缓存消费组件**：提升组件重用率，减少重渲染；
3. **组件职责拆分**：精细控制渲染粒度，配合 `memo` 更高效。

当这三种策略协同配合时，能最大化发挥 React 的性能潜力，实现真正意义上的 **按需渲染**。

希望这篇文章能帮你更深入理解 `useContext` 背后的运行机制，在写业务时也能写出更高性能、更易维护的代码，如果你觉得有帮助，别忘了点个赞👍或关注我后续的 **重学 React** 系列！。
