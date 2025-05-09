# 🚀 React 弹窗还能这样写？手撸一个高质量 Modal 玩起来！

> 用了这么久 React，是时候自己封装个组件玩玩了。这次我们不讲虚的，从 0 开始动手写一个 Modal，支持受控、Portal 挂载等功能，写完你绝对能吹。

## 🧠 为什么要自己写 Modal？

在我们的日常开发中，Modal（弹窗）组件几乎无处不在，从简单提示框到复杂表单提交，需求层出不穷。

虽然大多数时候我们依赖 UI 框架的现成组件，但一旦遇到复杂场景，例如自定义动画、拖拽行为、Portal 渲染或状态控制，内置 Modal 往往显得力不从心。

那问题来了，UI 库不给力的时候，我们能不能自己写一个更灵活、能打的 Modal？

答案是：当然可以！而且写完你会发现，真的不难，还挺有成就感～

**为什么要自己写？**

- 满足复杂业务需求
- 灵活定制与扩展
- 理解组件设计模式
- 提升架构与编码能力

------



## 🎯 明确我们要实现什么

先搞定基础功能，再逐步扩展：

- 支持打开 / 关闭
- 自定义标题与内容
- 支持挂载到 body
- 支持受控 / 非受控模式

路要一步一步走，饭要一口一口吃，先实现基本功能，再去扩展后续的：**动画过渡、自定义footer、拖拽等...**

最终我们将拥有一个高可扩展、易维护的 Modal 组件。

## 🛠 搭好开发环境

这里直接使用最新的 React 19，使用 Create React App 去创建项目。

```ts
npx create-react-app modal-component
```

再装个 `sass` 来写样式：

```ts
npm install --save sass
```

## 🧱 撸一个能用的 Modal 出来！

### 1. 搭好基础结构

> 为了方便看思路，`css` 部分代码会在小节最后贴上，实操可先把 `css` 贴上再跟着下面逻辑一步一步操作。

先在 `App.jsx` 里加个按钮控制弹窗的显示：

`src/App.jsx`

```ts
import { useState } from 'react'
import Modal from './Modal'
import './App.scss'

export default function App() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="App">
      <button onClick={() => setIsOpen(true)}>打开弹窗</button>

      {isOpen && (
        <Modal ></Modal>
      )}
    </div>
  )
}
```

`src/Modal/index.jsx`

```ts
import './index.scss'

export default function Modal()  {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>弹窗</h3>
        <div className="modal-body">这是您需要确认的内容</div>
        <div className="modal-footer">
          <button>确认</button>
          <button>取消</button>
        </div>
      </div>
    </div>
  );
};
```

我们创建 `isOpen` 去控制弹窗的显示隐藏，创建了弹窗组件 `Modal`，现在实现了正常 **打开弹窗** 功能。

但是我们打开了弹窗，还没有关闭功能，所以我们需要通过 **父子传值**，给 `Modal` 传递关闭弹窗的方法。

```ts
// App.jsx
<Modal onClose={() => setIsOpen(false)}></Modal>

// Modal/index.jsx
<button onClick={onClose}>确认</button>
<button onClick={onClose}>取消</button>
```

到这里，弹窗基本能正常 **开关自如** 了，虽然还有点原始，但好歹是能用了。

![ainimation1](C:\cgj\1code\我的\面试\1博客\img\Modal组件\ainimation1.gif)

### 2. 支持自定义标题 & 内容

平时使用 UI 库的弹窗组件，弹窗标题跟内容通常都是自定义传入的，所以我们继续优化：

`Modal`

![image-20250429151923829](C:\Users\chenl\AppData\Roaming\Typora\typora-user-images\image-20250429151923829.png)

使用方式也更灵活：

`App`

![image-20250429151941856](C:\Users\chenl\AppData\Roaming\Typora\typora-user-images\image-20250429151941856.png)



我们把 `title、children` 进行抽离，通过传入去展示。

![ainimation2](C:\cgj\1code\我的\面试\1博客\img\Modal组件\ainimation2.gif)

现在弹窗上的标题跟内容已经是我们传入的自定义内容了。

接下来我们进行去优化弹窗的 **通用性**。

假设现在有一个 **小tips**，定位到按钮的下方，而且层级要比弹窗高，那么会发生什么呢？

![image-20250429153047286](C:\Users\chenl\AppData\Roaming\Typora\typora-user-images\image-20250429153047286.png)

![ainimation3](C:\cgj\1code\我的\面试\1博客\img\Modal组件\ainimation3.gif)

可以看到我们的弹窗组件被这个 **小tips** 遮挡住了，那肯定是不行的，我们可以通过修改弹窗层级去修复问题：

![image-20250429153312441](C:\Users\chenl\AppData\Roaming\Typora\typora-user-images\image-20250429153312441.png)

![ainimation4](C:\cgj\1code\我的\面试\1博客\img\Modal组件\ainimation4.gif)

虽然看似可以通过提高 z-index 解决，但随着复杂度增加，z-index 管理容易混乱。

但是我们总不能每出现一次这种问题都去改一下层级吧，那我们应该怎么解决呢？

### 3. 用 Portal 实现层级隔离

通过 `ReactDOM.createPortal` 将弹窗渲染到 `<body>` 下，脱离父容器 DOM 层级限制。

我们优化下代码：

```ts
// Modal
import { useEffect } from 'react'
import ReactDOM from 'react-dom'
import './index.scss'

export default function Modal({ title, children, onClose }) {
  // 为 Portal 动态创建挂载节点
  const portalRoot = document.createElement('div')

  useEffect(() => {
    // 挂载到 body
    document.body.appendChild(portalRoot)
    return () => {
      // 组件卸载时移除节点
      document.body.removeChild(portalRoot)
    }
  }, [portalRoot])

  return ReactDOM.createPortal(
    <div className="modal-overlay">
		...
    </div>,
    portalRoot
  )
}
```

我们做了啥：

- 创建 `DOM` 节点存储当前 `Modal` 组件。
- 通过 `ReactDOM.createPortal` 将弹窗渲染到 `<body>` 下。
- 需注意组件卸载时移除节点。

点击打开弹窗按钮，观察 `DOM` 变化：

![ainimation5](C:\cgj\1code\我的\面试\1博客\img\Modal组件\ainimation5.gif)

可以看到，`Modal` 直接挂载到 `body` 节点下了。

这样有什么好处呢：

> 当多个弹窗同时存在时，挂载到 `<body>` 可以统一管理 `z-index`，避免层级错乱。

### 4. 使用 `useRef` Portal 容器

功能是实现了，但其实我们上面的代码是 **存在问题** 的。

- 每次组件渲染都会执行 `document.createElement('div')`，即使组件已经挂载。
- `useEffect` 的依赖项是 `portalRoot`（每次渲染都不同）。

上面代码不仅会影响性能，还可能会造成内存泄露。

又可以用上前面我们 `useRef` 篇文章学习到的知识点了，我们优化一下：

```ts
...  
  const portalRootRef = useRef(null)

  useEffect(() => {
    const portalRoot = document.createElement('div')
    document.body.appendChild(portalRoot)
    portalRootRef.current = portalRoot

    return () => {
      if (portalRootRef.current) {
        document.body.removeChild(portalRootRef.current)
      }
    }
  }, [])
...
```

我们做了：

- `useRef` 保证组件生命周期内始终使用同一个 `DOM` 节点。
- `document.body.contains()` 检查避免重复移除。
- 卸载时置空 `portalRootRef.current` 释放内存。

### 5. 支持受控与非受控双模式

在优化前我们先理解两种模式的区别：

|    模式    |  状态管理方  |             适用场景             |
| :--------: | :----------: | :------------------------------: |
|  **受控**  |  父组件控制  | 需要同步外部状态的场景（如表单） |
| **非受控** | 组件内部管理 |   独立弹窗，不需要外部状态同步   |

想深入理解可以看我上篇文章：[🧠 面试官：受控组件都分不清？还敢说自己写过 React？](https://juejin.cn/post/7497804336568057895)

受控/非受控模式，我们用是否传入 `isOpen` 进行区分：

![image-20250429162758649](C:\Users\chenl\AppData\Roaming\Typora\typora-user-images\image-20250429162758649.png)

```ts
// Modal
export default function Modal({ isOpen: controlledIsOpen, title, children, onClose }) {
  // 非受控状态
  const [isInternalOpen, setInternalOpen] = useState(false)
  // 是否受控
  const isControlled = controlledIsOpen !== undefined
  // 实际使用的状态 受控/非受控
  const isOpen = isControlled ? controlledIsOpen : isInternalOpen

  const handleCloss = () => {
    if (isControlled) {
      onClose?.()
    } else {
      setInternalOpen(false)
    }
  }
  ...
  return isOpen
    ? ReactDOM.createPortal(
        ...
      )
    : null
}
```

优化点：

- 添加 `props：` `isOpen`，传入 `isOpen` 表示受控模式。
- 受控模式由调用方通过 `isOpen` 控制是否关闭组件。
- 非受控模式由组件内部 `isInternalOpen` 控制是否关闭组件。

我们在 App 里使用看下，首先是 **受控模式**：

```ts
// App
export default function App() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="App">
      <button onClick={() => setIsOpen(true)}>受控模式打开</button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="受控弹窗">
        <p>父组件完全控制开关状态</p>
      </Modal>
    </div>
  )
}
```

我们在弹窗组件上打个 `debugger` 看看：

![image-20250429164001462](C:\Users\chenl\AppData\Roaming\Typora\typora-user-images\image-20250429164001462.png)

断点信息告诉我们，当前由外部传入的 `onClose` 控制 `Modal` 组件。

![ainimation6](C:\cgj\1code\我的\面试\1博客\img\Modal组件\ainimation6.gif)

接下来我们再试下 **非受控模式**：

由于非受控模式不再依赖父组件传递的 `isOpen` 控制弹窗是否打开，所以我们需要通过 `ref` 把自身方法暴露出去给父组件使用。

`Modal`

![image-20250429165749041](C:\Users\chenl\AppData\Roaming\Typora\typora-user-images\image-20250429165749041.png)

```ts
// Modal
import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'

const Modal = forwardRef(({ isOpen: controlledIsOpen, title, children, onClose }, ref) => {
...
  // 暴露 open/close 方法供父组件调用（用于非受控模式）
  useImperativeHandle(ref, () => ({
    open: () => setInternalOpen(true),
    close: () => setInternalOpen(false)
  }))
...
})

export default Modal
```

`App`

```ts
export default function App() {
  const [isOpen, setIsOpen] = useState(false)
  const modalRef = useRef()

  return (
    <div className="App">
      <button onClick={() => modalRef.current.open()}>打开非受控弹窗</button>

      <Modal ref={modalRef} title="非受控弹窗标题">
        <p>这个弹窗完全自己管理状态！</p>
        <p>父组件不需要传递任何状态</p>
      </Modal>
    </div>
  )
}
```

我们做了啥：

- 通过 `forwardRef, useImperativeHandle` 向父组件暴露 `open` 方法。
- 父组件通过 `open` 可以直接操作弹窗状态。
- **不传递 isOpen/onClose**，非受控模式下父组件无需管理状态，通过 `ref` 即可控制

![ainimation7](C:\cgj\1code\我的\面试\1博客\img\Modal组件\ainimation7.gif)

### 6. 自定义 Hook

虽然说实现了 **受控/非受控模式支持**，但同时我们也在 `Modal` 里写了一坨代码，不利于后续维护，所以我们抽离出一个自定义 Hook `useControlledState`，优化一下代码。

新建文件 `hooks/useControlledState.js`，把 **受控/非受控模式支持** 逻辑抽离出来：

```ts
import { useState } from 'react'

export default function useControlledState(value, onChange, defaultValue) {
  const [internalValue, setInternalValue] = useState(defaultValue)

  const isControlled = value !== undefined
  const finalValue = isControlled ? value : internalValue

  const setValue = newValue => {
    if (isControlled) {
      onChange?.(newValue)
    } else {
      setInternalValue(newValue)
    }
  }

  return [finalValue, setValue]
}
```

再去优化 `Modal`

```ts
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import ReactDOM from 'react-dom'
import useControlledState from '../hooks/useControlledState'
import './index.scss'

const Modal = forwardRef((props, ref) => {
  const [isOpen, setIsOpen] = useControlledState(props.isOpen, props.onClose, false)

  useImperativeHandle(ref, () => ({
    open: () => setIsOpen(true),
    close: () => setIsOpen(false)
  }))

  const portalRootRef = useRef(null)

  useEffect(() => {
    const portalRoot = document.createElement('div')
    document.body.appendChild(portalRoot)
    portalRootRef.current = portalRoot

    return () => {
      if (portalRootRef.current) {
        document.body.removeChild(portalRootRef.current)
      }
    }
  }, [])

  return isOpen
    ? ReactDOM.createPortal(
        <div className="modal-overlay">
          <div className="modal">
            <h3>{props.title}</h3>
            <div className="modal-body">{props.children}</div>
            <div className="modal-footer">
              <button onClick={() => setIsOpen(false)}>确认</button>
              <button onClick={() => setIsOpen(false)}>取消</button>
            </div>
          </div>
        </div>,
        portalRoot
      )
    : null
})

export default Modal
```

优化完成，我们再去页面上看下是否正常使用：

![ainimation8](C:\cgj\1code\我的\面试\1博客\img\Modal组件\ainimation8.gif)

**没毛病！**

### 7. 小总结

到这里我们的弹窗组件一步一步完善了：

- ✅ 支持打开/关闭
- ✅ 有基本的确认/取消按钮
- ✅ 支持挂载到 body
- ✅ 支持受控/非受控 模式
- ✅ 抽离自定义 Hook，优化代码

完整代码：

`css部分`

```ts
// App.scss
.App {
  position: relative;
  text-align: center;
  > button {
    margin: 400px auto;
  }
  .tips {
    position: absolute;
    top: 440px;
    left: 50%;
    transform: translate(-50%, 0);
    z-index: 999;
    background: pink;
  }
}

// Modal/index.scss
.modal-overlay {
  z-index: 999999999;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal {
  background: white;
  padding: 20px;
  border-radius: 8px;
  min-width: 300px;
}

.modal-footer {
  margin-top: 20px;
  text-align: right;
}

button {
  margin-left: 10px;
  padding: 6px 12px;
  cursor: pointer;
}
```

完整项目代码可前往我的 [Github 仓库](https://github.com/MrChen1012/React-Demo) 查看。

## 🚀 接下来的进阶扩展？

没错！这还只是起点，下一篇我们将加上：

- 🎞️ 弹窗动画
- ⌨️ 支持按下 Esc 键关闭
- 🧩 footer 插槽定制化
- 🧲 支持拖动弹窗
- 🔒 防止背景滚动穿透

想挑战自己，做出一个真正“好用 + 好看 + 好扩展”的 `Modal` 吗？我们下篇见！

## 🧩 最后

自己封装组件不仅能提升 React 能力，还能提升你架构设计的思维方式。

如果你觉得这篇文章对你有帮助，欢迎点赞 👍、收藏 ⭐、评论 💬 让我知道你在看！
后续我也会持续输出更多 **高性能 React 实战技巧**，敬请期待！❤️