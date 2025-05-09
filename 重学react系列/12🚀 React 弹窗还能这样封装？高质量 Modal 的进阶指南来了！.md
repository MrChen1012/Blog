## 🚀 React 弹窗还能这样封装？高质量 Modal 的进阶指南来了！

> 弹窗写得溜，组件封装不犯愁！趁着五一假期前还有点空，我们再把 Modal 升个级...

## 🧱 基础弹窗搞定了？那该进阶了！

之前我们已经搞定了一个基础版的 Modal 组件，实现了以下功能：

- ✅ 打开/关闭控制
- ✅ 内置确认和取消按钮
- ✅ 使用 Portal 挂载到 `body`
- ✅ 自动缓存 Portal 容器，避免重复创建
- ✅ 支持受控和非受控两种模式
- ✅ 自定义 `useModal` Hook
- ✅ 对外暴露 `open` / `close` 方法

虽然功能已经很全面了，但如果你以为这就完了，那你可太小看它了！

今天，我们继续升级，搞一个更强、更灵活、更优雅的高质量弹窗组件 💪

## 🎯 目标：更丝滑、更灵活、更优雅！

我们这次要做的增强包括：

- 默认自动打开：更友好的首次体验
- 支持 ESC 键和点击遮罩关闭
- 更清晰的代码结构，模块拆分

## ✅ 支持 defaultOpen：默认弹窗更丝滑

默认情况下，我们的弹窗是关闭的，没毛病。但是有些场景，比如一进页面就需要弹窗提示，或者首次使用时给用户一些引导提示，这时候每次都通过 ref 或 props 控制就显得略繁琐。

我们来搞个 `defaultOpen`，让非受控场景也能一把丝滑。

```ts
// src/Modal/index.jsx
// 新增 defaultOpen 属性
const Modal = forwardRef(
  ({ isOpen: controlledIsOpen, onChange, title, children, defaultOpen }, ref) => {
    const [isOpen, setIsOpen] = useControlledState(controlledIsOpen, onChange, defaultOpen || false)	//设置默认值

...
)
```

> 这里为了方便展示，我把 `props` 解构出来了，平时使用 `ts` 的小伙伴可以定义接口类型。

我们新增非受控属性 `defaultOpen`，不影响受控模式逻辑，只在第一次渲染时生效，后续交互由组件内部状态管理。

`useControlledState` 是我们上篇文章抽离的 **受控/非受控模式支持** 逻辑，第三参数正是我们当时留出来的扩展，用于处理 **打开/关闭** 默认值。

```ts
  const [internalValue, setInternalValue] = useState(defaultValue)

  const isControlled = value !== undefined
  const finalValue = isControlled ? value : internalValue
```

**直接测试一把：**

```ts
// App
<Modal defaultOpen>
  <p>默认打开的弹窗</p>
</Modal>
```

![1](C:\cgj\1code\我的\面试\1博客\img\Modal组件进阶\1.png)

哦豁，报错了！

这其实是 `ReactDOM.createPortal` 的常见问题：Portal 容器还没创建出来就调用了 `createPortal`。

为了解决“Target container is not a DOM element”错误，我们需要确保在使用 `ReactDOM.createPortal` 时目标 `DOM` 元素已存在。

![2](C:\cgj\1code\我的\面试\1博客\img\Modal组件进阶\2.png)

```ts
const [isPortalReady, setIsPortalReady] = useState(false)
```

我们用 `isPortalReady` 来标记容器创建完成，再去 render 组件。

![3](C:\cgj\1code\我的\面试\1博客\img\Modal组件进阶\3.png)

这样我们就实现了。

**⚠️ 注意**

当你传入了 `isOpen`，也就是走的受控模式时，`defaultOpen` 就不起作用了（受控优先）。

**举个栗子：**

```ts
export default function App() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="App">
      <button onClick={() => setIsOpen(true)}>打开弹窗</button>

      <Modal isOpen={isOpen} onChange={setIsOpen} defaultOpen={true}>
        <p>受控模式会忽略 defaultOpen</p>
      </Modal>
    </div>
  )
}
```

![ainimation1](C:\cgj\1code\我的\面试\1博客\img\Modal组件进阶\ainimation1.gif)

## ✅ 支持 ESC/遮罩关闭：用户体验更优

虽然我们的弹窗已经具备了关闭按钮，但是为了用户体验更好，我们决定加上点击遮罩以及键盘 ESC 关闭弹窗逻辑。

我们新增 `props` 去进行控制，方便后续特定场景下可控制。

![4](C:\cgj\1code\我的\面试\1博客\img\Modal组件进阶\4.png)

```ts
closeOnEsc = true,
closeOnOverlayClick = true
```

你可以根据场景灵活开启或关闭这些功能。

### ESC 关闭功能：

```ts

const Modal = forwardRef(...){
...
    const handleClose = useCallback(() => {
      setIsOpen(false)
      onChange?.(false)
    }, [setIsOpen, onChange])

    useEffect(() => {
      if (!closeOnEsc || !isOpen) return
      const handleKeyDown = e => {
        if (e.key === 'Escape') handleClose()
      }

      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, closeOnEsc, handleClose])
...
)
```

我们做了：

- 提取 `handleClose` 为统一关闭方法
- 使用 `useCallback` 避免重复创建函数
- 监听键盘 `e.key === 'Escape'`，触发 `handleClose` 关闭函数。

测试一下：

![ainimation2](C:\cgj\1code\我的\面试\1博客\img\Modal组件进阶\ainimation2.gif)

ESC 关闭弹窗功能实现了，我们再来看点击遮罩层关闭功能。

### 点击遮罩关闭

写过弹窗的小伙伴可能都知道，遮罩层这一块还是有不少坑的，所以我们需要：

- 避免事件冒泡影响弹窗内点击
- 避免点击穿透
- 确保点击的是“遮罩本身”，而不是弹窗子元素

我们分别从 `css` 跟 `js` 层进行处理，把坑解决了，再去完善点击遮罩层关闭弹窗功能。

**样式层优化**

![image-20250430175737077](C:\Users\chenl\AppData\Roaming\Typora\typora-user-images\image-20250430175737077.png)

我们添加 `pointer-events: auto`，确保遮罩层可被点击，再去优化禁用状态下的鼠标箭头样式。

`js` 层优化

```ts
<div className="modal" onClick={e => e.stopPropagation()}>
```

使用 `e.stopPropagation()` 阻止点击事件冒泡。

**实现点击遮罩层关闭功能**

```ts
...    
    const handleOverlayClick = useCallback(
      e => {
        if (
          closeOnOverlayClick &&
          e.target === e.currentTarget // 确保点击的是遮罩层本身
        ) {
          handleClose()
        }
      },
      [closeOnOverlayClick, handleClose]
    )
    ...
    <div className="modal-overlay" onClick={handleOverlayClick}>
...
```

![ainimation3](C:\cgj\1code\我的\面试\1博客\img\Modal组件进阶\ainimation3.gif)

到这里我们就实现了点击遮罩以及键盘 ESC 关闭弹窗，是不是一开始想着：不就是两个点击事件吗？

实际上背后还是有些小细节的，可以做到性能优化以及保障其稳定性。

## 🧩 模块抽离，让代码更清爽

随着我们的功能一点点增加，代码量也开始一行行的多了起来。

我们不能等到几百上千行代码再去想着怎样抽离模块，现在就开始把我们加的功能抽离出来吧。

### 抽离 Portal 容器管理逻辑 → `usePortal.js`

```ts
// src\hooks\usePortal.js
import { useEffect, useRef, useState } from 'react'

export default function usePortal() {
  const portalRootRef = useRef(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const root = document.createElement('div')
    document.body.appendChild(root)
    portalRootRef.current = root
    setIsReady(true)

    return () => {
      document.body.removeChild(root)
    }
  }, [])

  return [portalRootRef, isReady]
}
```

### 抽离关闭事件处理 → `useCloseHandlers.js`

```ts
// src\hooks\useCloseHandlers.js
import { useEffect, useCallback } from 'react'

export function useCloseOnEsc(handleClose, isOpen, closeOnEsc) {
  useEffect(() => {
    if (!closeOnEsc || !isOpen) return

    const handler = e => e.key === 'Escape' && handleClose()
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, closeOnEsc, handleClose])
}

export function useCloseOverlayClick(handleClose, closeOnOverlayClick) {
  return useCallback(
    e => {
      if (
        closeOnOverlayClick &&
        e.target === e.currentTarget // 确保点击的是遮罩层本身
      ) {
        handleClose()
      }
    },
    [closeOnOverlayClick, handleClose]
  )
}
```

再去进行引入使用：

```ts
// src\Modal\index.jsx
import { useEffect, forwardRef, useImperativeHandle, useRef, useState, useCallback } from 'react'
import ReactDOM from 'react-dom'
import useControlledState from '../hooks/useControlledState'
import usePortal from '../hooks/usePortal'
import { useCloseOnEsc, useCloseOverlayClick } from '../hooks/useCloseHandlers'
import './index.scss'

const Modal = forwardRef(
  (
    {
      isOpen: controlledIsOpen,
      onChange,
      title,
      children,
      defaultOpen,
      closeOnEsc = true,
      closeOnOverlayClick = true
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useControlledState(controlledIsOpen, onChange, defaultOpen || false)
    const [portalRootRef, isPortalReady] = usePortal()

    useImperativeHandle(ref, () => ({
      open: () => setIsOpen(true),
      close: () => setIsOpen(false)
    }))

    // 统一关闭处理函数
    const handleClose = useCallback(() => {
      setIsOpen(false)
      onChange?.(false)
    }, [setIsOpen, onChange])

    // ESC关闭功能
    useCloseOnEsc(handleClose, isOpen, closeOnEsc)

    // 遮罩层点击关闭
    useCloseOverlayClick(handleClose, closeOnOverlayClick)

    return isOpen && isPortalReady
      ? ReactDOM.createPortal(
          <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>{title}</h3>
              <div className="modal-body">{children}</div>
              <div className="modal-footer">
                <button onClick={handleClose}>确认</button>
                <button onClick={handleClose}>取消</button>
              </div>
            </div>
          </div>,
          portalRootRef.current
        )
      : null
  }
)

export default Modal
```

这样我们的代码就很清晰了，哪块功能在哪里一目了然，也方便维护修改。

完整项目代码可前往我的 [Github 仓库](https://github.com/MrChen1012/React-Demo) 查看。

------

## 🧭 还有下一步扩展？

> 要放假啦！节后再继续更新，感兴趣的小伙伴可以关注下～

后面我们还可以继续升级，比如：

- ✅ 支持弹窗动画（进入/退出）
- ✅ 支持嵌套弹窗，父子弹窗独立控制
- ✅ 支持弹窗拖拽
- ✅ 提供 `Modal.confirm` 风格的静态方法调用（类似 antd）

## 🧠 小结：弹窗封装，其实不只是 UI 组件

弹窗这东西，看起来是个 UI 组件，背后其实是 **交互逻辑 + 状态管理 + 用户体验** 的结合体。

本次我们给弹窗加上了更多用户友好的功能，也顺带优化了组件结构：

| 功能                  | 支持 | 描述                           |
| --------------------- | ---- | ------------------------------ |
| `defaultOpen`         | ✅    | 非受控初始状态                 |
| `closeOnEsc`          | ✅    | 按 ESC 关闭                    |
| `closeOnOverlayClick` | ✅    | 点击遮罩关闭                   |
| 抽离逻辑模块          | ✅    | Portal 与关闭行为模块化        |
| 稳定性优化            | ✅    | 防止挂载未完成就渲染导致的错误 |

如果你觉得这篇文章对你有帮助，欢迎点赞 👍、收藏 ⭐、评论 💬 让我知道你在看！
后续我也会持续输出更多 **高性能 React 实战技巧**，敬请期待！❤️

