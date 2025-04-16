# 🚀 Vue 人看 useMemo：别再滥用它做性能优化

> 对 Vue 开发者来说，初见 `useMemo` 很容易以为它就是 React 版的 `computed`，但真相可能让你大吃一惊：它**不是**响应式的魔法工具，也**不是**你随手就该加的性能“神器”。

## 👀 Vue 人初识 useMemo

在 Vue 中，`computed` 是一个非常熟悉的概念。我们用它来基于响应式数据做缓存计算，性能好、语义清晰、自动依赖追踪。

所以当你初到 React，看到 `useMemo(fn, deps)`，可能会下意识地认为：

- “这是 React 的 computed 吧？”
- “那我是不是应该所有计算都包一层 useMemo？”
- “加了 useMemo 性能就一定更好吗？”

答案是：**并不是**。

------

## 🧠 useMemo 到底是什么

> React 官方定义：`useMemo`会在依赖项不变的情况下返回缓存的结果，避免不必要的计算。

```ts
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
```

本质上，useMemo 会记住上一次依赖项变化时的返回值，并在依赖未变时直接复用，省去了函数再次执行的开销。

- 当 `[a, b]` 没变时，不会重新执行 `computeExpensiveValue`，直接使用上一次的缓存值。
- 它是 **缓存计算结果**，不是缓存组件。
- 它 **不是副作用函数**，只是一个计算表达式。

我们看看它的基本用法：

```ts
useMemo(calculateValue, dependencies)
```

- `calculateValue`：一个 **纯函数**，不能带副作用。
- `dependencies` ：**依赖项列表**，传入一个函数中使用的 **响应式变量** 组成的数组，新值与旧值进行 **浅比较**，有变化是才触发 `calculateValue` 。

**光看概念可能有些抽象，我们举个栗子对比一下。**

## 📊 栗子：总分计算器

假设现在有个简单需求：一个老师需要录入学生成绩，并实时展示总分。

```react
export default function Example() {
  const [inputVal, setInputVal] = useState("");
  const [subject, setSubject] = useState([
    { id: 1, subject: "语文", grade: 60 },
    { id: 2, subject: "数学", grade: 60 },
    { id: 3, subject: "英语", grade: 60 },
  ]);
  const handleAdd = (id: number) => {
    setSubject(
      subject.map((item) =>
        item.id === id ? { ...item, grade: item.grade + 1 } : item
      )
    );
  };
  const handleSub = (id: number) => {
    setSubject(
      subject.map((item) =>
        item.id === id ? { ...item, grade: item.grade - 1 } : item
      )
    );
  };
  const total = () => {
    console.log("计算总分");
    return subject.reduce((prev, next) => prev + next.grade, 0);
  };
  return (
    <div>
      <input
        type="text"
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
      />

      <h2>总分{total()}</h2>
      <table>
        <thead>
          <tr>
            <th>学科</th>
            <th>成绩</th>
          </tr>
        </thead>
        <tbody>
          {subject.map((item) => (
            <tr key={item.id}>
              <td>{item.subject}</td>
              <td>
                <button onClick={() => handleSub(item.id)}>-</button>
                <span>{item.grade}</span>
                <button onClick={() => handleAdd(item.id)}>+</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

这里我们创建了各学科成绩以及一个总分计算函数，我们再看看：

![ainimation1](C:\cgj\1code\我的\面试\1博客\img\useMemo\ainimation1.gif)

确实，我们每次修改各科目成绩都重新了计算总分，但是 `input` 输入，也触发了总分计算，造成了额外性能支出。

那是因为：

> `useState` 每次改变时都会触发组件的 `render` 更新。

我们接下来使用 `useMemo` 优化一下 `total`：

```react
    const total = useMemo(() => {
      console.log("计算总分");
      return subject.reduce((prev, next) => prev + next.grade, 0);
    }, [subject]);
```

我们用 `useMemo` 创建一个 `total`，依赖项列表监听 `subject` 的变化，因为 `useMemo` 返回的是一个值，所以 `总分{total()}=>总分{total}`，我们再看看：

![ainimation2](C:\cgj\1code\我的\面试\1博客\img\useMemo\ainimation2.gif)

此时我们再去改变 `inputVal` 就不会再去触发 `total` 重新计算了。

**`useMemo` 看起来挺好用的，那么我们是不是可以把它当成 Vue 中的 `computed`，去随处使用呢？**

## ⚠️ useMemo ≠ computed（至少不是你理解的那种）

| 对比点     | Vue computed             | React useMemo              |
| ---------- | ------------------------ | -------------------------- |
| 响应性原理 | 自动追踪依赖             | 手动传入依赖数组           |
| 缓存机制   | 精准依赖、精准缓存       | 基于依赖数组的**浅比较**   |
| 使用场景   | 常用、推荐               | 慎用、不一定带来性能收益   |
| 渲染影响   | 自动挂载到模板、影响视图 | 仅在变量中缓存，需手动使用 |

可以看到，`useMemo` **不会自动响应依赖变动**，你需要手动指定依赖项。一旦你写错依赖项，它可能根本不会重新计算。

`useMemo` 能否滥用？结合官方文档得出结论：

> `useMemo` 仅用于 **跳过代价昂贵的重新计算**。

所以你真的需要问自己：

> 这个计算是否**足够昂贵**？
> 这个缓存能否**带来实际收益**？

举个简单计算栗子：

```ts
const total = useMemo(() => price * count, [price, count]);
```

 这么轻量的乘法计算，其实用不上 `useMemo`，你缓存它只会浪费内存和处理成本。

> `useMemo` 本身并不会提升性能，它只是避免了重复计算 **但你得用对场景。**

## ✅ useMemo 的正确用法

### 1. 昂贵计算

比如你要筛选、排序、格式化一个大型数组：

```ts
const filteredList = useMemo(() => {
  return list.filter(item => item.visible);
}, [list]);
```

这种操作如果放在渲染中，每次都执行会非常吃资源，用 `useMemo` 合理优化能显著提升性能。

**除了缓存计算，useMemo 还有一个不那么明显的用法 —— 它能帮你避免子组件的无意义渲染。**

### 2. 避免不必要的子组件更新

**举个栗子：**

```ts
import { useState, useMemo, memo } from "react";

const MemoChild = memo(Child);
export default function Example() {
  const [count, setCount] = useState(0);

  const config = { text: "Hello", color: "blue" };

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>Click me ({count})</button>
      <MemoChild config={config} />
    </div>
  );
}

function Child({ config }) {
  console.log("👶 子组件重新渲染");
  return <div style={{ color: config.color }}>子组件内容：{config.text}</div>;
}
```

**不使用 `useMemo`：每次渲染都会触发子组件更新：**

![ainimation3](C:\cgj\1code\我的\面试\1博客\img\useMemo\ainimation3.gif)

为什么会这样？

- `Parent` 每次点击按钮后重新渲染。
- 虽然 `config` 内容不变，但每次都会创建新的对象引用。
- `MemoChild` 虽然是 `memo` 创建的，但 `props.config !== 上一次的 config`，所以依旧会重新渲染！

> "`memo` 允许你的组件在 props 没有改变的情况下跳过重新渲染。"

关于 `memo` 的使用我们下篇文章详细讲解，让我们先用 `useMemo` 解决上面问题：

```ts
    const config = useMemo(() => {
        return { text: 'Hello', color: 'blue' }
    }, [])
```

使用 `useMemo` 缓存对象，避免子组件无意义更新，我们再看看：

![ainimation4](C:\cgj\1code\我的\面试\1博客\img\useMemo\ainimation4.gif)

- 由于 `useMemo` 缓存了 `config`，引用始终稳定。
- `React.memo` 检测到 `props` 未变，因此跳过子组件更新。

这个栗子也说明了：

> 不是`useMemo`自己提升性能，而是**配合 memo 化子组件**、**确保 props 引用不变**，才真正避免了性能浪费。

------



## 🧩 总结

- `useMemo` 是 React 提供的 **缓存计算结果** 的工具。
- 它并不具备 Vue `computed` 的响应式能力，使用上需谨慎。
- 使用场景包括：**昂贵计算、避免子组件重复渲染**。
- 使用前，请认真评估：**这段计算是否值得缓存？**

希望这篇文章能帮你快速掌握 **useMemo**，如果你觉得有帮助，别忘了点个赞👍或关注我后续的 **重学 React** 系列！

