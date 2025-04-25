# 🧠 面试官让我渲染10万条数据？看我用 React 虚拟列表轻松搞定

> 面试官：假设页面有10万条数据...
> 我（挥手打断）：👌告辞！

## ☠️ 死亡面试题重现

**面试官露出神秘微笑："请渲染这个10万条数据的数组..."**

```ts
function App() {
  const [data] = useState(Array(100000).fill().map((_,i) => `数据项 ${i+1}`));
  
  return (
    <ul style={{ height: '400px', overflow: 'auto' }}>
      {data.map(item => (
        <li key={item} style={{ height: '50px' }}>{item}</li>
      ))}
    </ul>
  );
}
```

**我：~~👌告辞！~~**

**我：~~既然你诚心诚意的问了，那我就大发慈悲的告诉你！~~**

**我：好咧，哥，听我细嗦。**

直接在页面上渲染10万条数据，这会导致：

- 页面直接卡死
- 内存占用飙升
- 滚动时FPS暴跌到个位数帧

所以这种大数据渲染场景，我们可以用 **虚拟列表** 去实现。

------

## 📚 什么是虚拟列表？

**虚拟列表** 的核心思想就是：

> **“只渲染可视区域 + 少量缓冲区内容”**，不该看的，统统不渲染！

**举个栗子：**

想象你有一个能装1000本书的大书架，但是你的房间只有一面墙那么大的窗户（屏幕），每次只能看到10本书。这时候你有两个选择：

1. **笨办法**：把1000本书全都摆到窗户后面，但每次只能看到10本，其他990本白占地方还浪费体力（内存和性能）
2. **聪明办法**：只在窗户后面放15本书（多放5本备用），当你要往下看时，快速把后面的书往前挪，同时补充新书（动态渲染）

每次滑动，只需替换这 15 本即可 —— 这就是虚拟列表的核心思想。

## 🔍 虚拟列表实现原理

我们就用上面的 **聪明方法** 举例：

- **算高度**：整个列表要占多少空间？（就像算书堆叠一起的总高度）
2. **看窗口**：现在屏幕上能看到哪部分？（看窗户的高度）
3. **精投放**：只渲染看得见和附近的内容（就像只摆窗口附近的几本书）

我们还需要注意一些点：

- **缓冲区**：就像在窗户上下多放5本书，防止抽出一本出现空位(滑动时突然白屏)
- **快速定位**：通过计算知道第500本书应该出现在哪个位置，不用从头数
- **重复利用**：滑出视野的书架格子会被回收，用来装新出现的书（DOM复用）

虚拟列表结构为 **外层到里层**：可视盒子 -> 总列表盒子 -> 真实渲染列表盒子。

![无标题-2025-04-03-1027](C:\cgj\1code\我的\面试\1博客\img\虚拟列表\无标题-2025-04-03-1027.png)

------

> 下面我们用 React 实现一个简单的虚拟列表。

## ✅ 实现定高虚拟列表

### 1. 创建基础结构

```ts
function VirtualList({ data, itemHeight = 50 }) {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const containerHeight = 500;

  return (
    <div
      ref={containerRef}
      className="overflow-y-auto bg-gray-50"
      style={{ height: `${containerHeight}px` }}
      onScroll={(e) => {
        // 当滚动时，记住滚动位置（后续讲解）
        setScrollTop(e.currentTarget.scrollTop);
      }}
    >
      {/* 这里后续添加内容 */}
    </div>
  );
}
```

这里我们做了：

- 创建 `containerRef` 获取可视盒子 `dom` 节点。
- 创建 `scrollTop` 获取页面当前滚动高度，方便后面计算。
- 可视盒子高度定义 `500`，创建可视盒子 `div`。

### 2. 计算要显示哪些书本（计算可见列表）

```ts
function VirtualList({ data, itemHeight = 50 }) {
  ...
  const buffer = 3 // 缓冲区多显示3个

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer)
  const endIndex = Math.min(
      data.length,
      startIndex + Math.ceil(containerHeight / itemHeight) + buffer * 2
  )
  ...
}
```

这里我们做了：

- 创建缓冲区
- 计算开始可见列表首/尾项：`startIndex`、`endIndex`

`startIndex` 的计算很好理解：

- 当前滚动位置 / 列表高度 再向下取整就是 **真实渲染列表** 首项。
- 由于我们存在缓冲区，所以我们需要减去上层缓冲区，才是视口展示的列表第一项。
- 由于列表前3项展示时，上层缓冲区不完整，所以我们需要使用 `Math.max` 兼容。

`endIndex` 的计算也差不多：

- 直接使用 `startIndex` + 真实渲染列表长度 + 缓冲区 * 2 就是 **真实渲染列表** 尾项。
- 缓冲区 * 2 是因为上下层都有 **缓冲区**。

### 3. 堆积书本（创建真实渲染列表）

```jsx
function VirtualList({ data, itemHeight = 50 }) {
  ...
  return (
    <div
      ref={containerRef}
      className="overflow-y-auto bg-gray-50"
      style={{ height: `${containerHeight}px` }}
      onScroll={(e) => {
        setScrollTop(e.currentTarget.scrollTop);
      }}
    >
      <div
        className="relative"
        style={{ height: `${data.length * itemHeight}px` }}
      >
        <div
          className="absolute w-full"
          style={{
            transform: `translateY(${startIndex * itemHeight}px)`,
          }}
        >
          {data.slice(startIndex, endIndex).map((item) => (
            <div
              key={item.id}
              className="border-b p-4 text-center bg-white hover:bg-blue-50 transition-colors"
              style={{ height: `${itemHeight}px` }}
            >
              {item.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

这里我们做了：

- 创建了 **总列表盒子**、**真实渲染列表盒子**，动态计算其高度。
- 根据 `startIndex、endIndex` 渲染 **真实渲染列表 dom**。
- `startIndex * itemHeight` 动态计算其偏移量。

### 4. 运行一下看看

**整个流程下来，其实可以发现，只要明白其原理，实现起来是很简单的，我们创建个数据测试一下：**

```jsx
export default function App() {
  // 生成测试数据（100000条）
  const mockData = useMemo(
    () =>
      Array.from({ length: 100000 }, (_, i) => ({
        id: i,
        content: `Item ${i} - 欢迎学习虚拟列表 🚀`,
      })),
    []
  );
  return (
    <div className="h-screen">
      <VirtualList data={mockData} />
    </div>
  );
}
```

![ainimation1](C:\cgj\1code\我的\面试\1博客\img\虚拟列表\ainimation1.gif)

无论我们怎样去滚动，`dom` 数都是固定的，变化的只有 **数组项**、**偏移量**。

**定高虚拟列表实现关键是 “算哪几项该渲染 + 算偏移位置”。高度一致让计算简单高效。**

------

刚刚我们实现了定高虚拟列表，页面运行贼流畅！

但现实往往不如理想 —— 有时候每一项的内容都不同，导致高度也不同，那该怎么办？

## 🔀 不定高虚拟列表

如果每条数据项高度都一样（比如上面定高的 50px），我们可以直接按位置精准计算渲染区域。

但现实往往残酷 —— **有些数据“高高在上”，有些却“矮人一截”**。

这就要用到 **不定高虚拟列表**。

### 1. 记录每项高度

```jsx
  const [itemHeights, setItemHeights] = useState({});

  const updateHeight = useCallback((index, height) => {
    setItemHeights((prev) => {
      if (prev[index] === height) return prev;
      return { ...prev, [index]: height };
    });
  }, []);

  // 列表组件每项获取高度加入 itemHeights
  <div
    ref={(ref) => {
      if (ref && itemHeights[item.id] !== ref.offsetHeight) {
        updateHeight(item.id, ref.offsetHeight);
      }
    }}
    key={item.id}
    className="border-b p-4 text-center bg-white hover:bg-blue-50 transition-colors"
    style={{ height: `${itemHeight}px` }}
  >
    {item.content}
  </div>
```

我们要为每一项绑定一个 `ref`，在渲染完成后收集其实际高度。

### 2. 根据滚动距离算出 `startIndex`、`endIndex`

```jsx

  const [startIndex, endIndex, totalHeight] = useMemo(() => {
    let total = 0;
    let start = 0;
    let end = data.length;
    let bufferTop = 0;

    // 找出可视区的起点：scrollTop 对应哪个 index
    for (let i = 0; i < data.length; i++) {
      const h = itemHeights[i] || itemHeight; // 如果还没测量，就先按50算
      if (total + h >= scrollTop) {
        start = Math.max(0, i - buffer);
        bufferTop = total;
        break;
      }
      total += h;
    }

    // 找出可视区终点
    let visibleHeight = 0;
    for (let i = start; i < data.length; i++) {
      visibleHeight += itemHeights[i] || itemHeight;
      if (visibleHeight >= containerHeight) {
        end = Math.min(data.length, i + buffer * 2);
        break;
      }
    }

    // 计算总高度（外层容器用）
    const allHeight = data.reduce(
      (acc, _, i) => acc + (itemHeights[i] || itemHeight),
      0
    );

    return [start, end, allHeight];
  }, [scrollTop, itemHeights, data.length]);
```

我们不能再用 index 算 `startIndex = scrollTop / itemHeight` 了，而是：

- 从头开始累加每项高度，可能有 `ref` 没获取到的情况出现，所以使用默认高度处理 `itemHeights[i] || itemHeight`。
- 直到发现某一项正好出现在 `scrollTop` 附近，它就是第一个显示的元素。
- 然后继续往后加，直到加满整个容器的高度，就知道要渲染到哪一项结束。

####  `startIndex` 计算原理如下：

 ![img2](C:\cgj\1code\我的\面试\1博客\img\虚拟列表\img2.png)

- 第一步我们获取了所有列表项高度数组 `itemHeights`。
- 获取每项列表项高度数组后，遍历总列表，累加前面高度。
- 当累加的值>=当前 `scrollTop`，当前遍历到的索引 - 上层缓冲区数，得到的结果就是 `startIndex`。

####  `endIndex` 计算原理如下：

![img3](C:\cgj\1code\我的\面试\1博客\img\虚拟列表\img3.png)

- 遍历总列表数组，从 `startIndex` 索引,开始累加。
- 累加值 `>= containerHeight`，当前的索引 + 缓冲区数，便是 `endIndex`。

### 3. 计算偏移量 `offsetTop`，用来定位视图

```jsx
  const offsetTop = useMemo(() => {
    let offset = 0;
    for (let i = 0; i < startIndex; i++) {
      offset += itemHeights[i] || itemHeight;
    }
    return offset;
  }, [itemHeights, startIndex]);
```

我们需要让内容从 `offsetTop` 开始“下移”，这个 `offset` 是前面所有元素的高度累加值（不再是 `startIndex * itemHeight` 了）。

### 4. 渲染结构换成最新值

```jsx
  return (
    <div
      ref={containerRef}
      className="overflow-y-auto bg-gray-50"
      style={{ height: `${containerHeight}px` }}
      onScroll={(e) => {
        setScrollTop(e.currentTarget.scrollTop);
      }}
    >
      <div className="relative" style={{ height: `${totalHeight}px` }}>
        <div
          className="absolute w-full"
          style={{
            transform: `translateY(${offsetTop}px)`,
          }}
        >
          {data.slice(startIndex, endIndex).map((item, i) => (
            <div
              key={item.id}
              ref={(ref) => {
                if (ref) {
                  const h = ref.offsetHeight;
                  if (h && itemHeights[startIndex + i] !== h) {
                    updateHeight(startIndex + i, h);
                  }
                }
              }}
              className="border-b p-4 text-center bg-white hover:bg-blue-50 transition-colors"
            >
              {item.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
```

### 5. 创建个随机高度数据跑跑

```ts
  const mockData = useMemo(() => {
    return Array.from({ length: 100000 }, (_, i) => {
      const randomRepeat = Math.floor(Math.random() * 20) + 1; // 1~20个重复
      return {
        id: i,
        content:
          `Item ${i} - `.padEnd(randomRepeat * 10, "🌟") +
          "欢迎学习虚拟列表 🚀",
      };
    });
  }, []);
```

![ainimation2](C:\cgj\1code\我的\面试\1博客\img\虚拟列表\ainimation2.gif)

到这里我们就实现了 `不定高虚拟列表`，明白其原理后实现起来就很快捷了。

### 完整代码

```jsx
"use client";
import { useState, useRef, useMemo, useCallback } from "react";

export default function App() {
  const mockData = useMemo(() => {
    return Array.from({ length: 100000 }, (_, i) => {
      const randomRepeat = Math.floor(Math.random() * 20) + 1; // 1~20个重复
      return {
        id: i,
        content:
          `Item ${i} - `.padEnd(randomRepeat * 10, "🌟") +
          "欢迎学习虚拟列表 🚀",
      };
    });
  }, []);
  return (
    <div className="h-screen">
      <VirtualList data={mockData} />
    </div>
  );
}

function VirtualList({ data, itemHeight = 50 }) {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const containerHeight = 500;
  const buffer = 3;

  const [itemHeights, setItemHeights] = useState({});

  const updateHeight = useCallback((index, height) => {
    setItemHeights((prev) => {
      if (prev[index] === height) return prev;
      return { ...prev, [index]: height };
    });
  }, []);

  const [startIndex, endIndex, totalHeight] = useMemo(() => {
    let total = 0;
    let start = 0;
    let end = data.length;
    let bufferTop = 0;

    // 找出可视区域起点
    for (let i = 0; i < data.length; i++) {
      const h = itemHeights[i] || itemHeight;
      if (total + h >= scrollTop) {
        start = Math.max(0, i - buffer);
        bufferTop = total;
        break;
      }
      total += h;
    }

    // 继续找出可视区域终点
    let visibleHeight = 0;
    for (let i = start; i < data.length; i++) {
      visibleHeight += itemHeights[i] || itemHeight;
      if (visibleHeight >= containerHeight) {
        end = Math.min(data.length, i + buffer * 2);
        break;
      }
    }

    const allHeight = data.reduce((acc, _, index) => {
      return acc + (itemHeights[index] || itemHeight);
    }, 0);

    return [start, end, allHeight];
  }, [scrollTop, itemHeights, data.length]);

  const offsetTop = useMemo(() => {
    let offset = 0;
    for (let i = 0; i < startIndex; i++) {
      offset += itemHeights[i] || itemHeight;
    }
    return offset;
  }, [itemHeights, startIndex]);

  return (
    <div
      ref={containerRef}
      className="overflow-y-auto bg-gray-50"
      style={{ height: `${containerHeight}px` }}
      onScroll={(e) => {
        setScrollTop(e.currentTarget.scrollTop);
      }}
    >
      <div className="relative" style={{ height: `${totalHeight}px` }}>
        <div
          className="absolute w-full"
          style={{
            transform: `translateY(${offsetTop}px)`,
          }}
        >
          {data.slice(startIndex, endIndex).map((item, i) => (
            <div
              key={item.id}
              ref={(ref) => {
                if (ref) {
                  const h = ref.offsetHeight;
                  if (h && itemHeights[startIndex + i] !== h) {
                    updateHeight(startIndex + i, h);
                  }
                }
              }}
              className="border-b p-4 text-center bg-white hover:bg-blue-50 transition-colors"
            >
              {item.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

```



## 🎉 小结：定高 vs 不定高

| 特性     | 定高虚拟列表                 | 不定高虚拟列表                   |
| -------- | ---------------------------- | -------------------------------- |
| 每项高度 | 相同                         | 不同                             |
| 性能     | 极佳（计算快速）             | 稍慢（需测量每项）               |
| 实现难度 | 简单                         | 略复杂（需动态记录与偏移计算）   |
| 使用场景 | 聊天列表、商品卡片等高度一致 | 评论列表、动态内容卡片等高度不一 |

------



## 🧠 总结：这题我稳了！

- 🚀 **定高虚拟列表** 更适合内容结构一致的场景（如聊天记录、统一高度卡片）
- 🤹 **不定高虚拟列表** 更适合内容差异大、富文本样式多的列表（如动态、评论流）
- 🔧 不定高实现更复杂，但灵活性更强，掌握后面试“秒杀”虚拟滚动题！

如果你觉得这篇文章对你有帮助，欢迎点赞 👍、收藏 ⭐、评论 💬 让我知道你在看！
后续我也会持续输出更多 **高性能 React 实战技巧**，敬请期待！❤️

