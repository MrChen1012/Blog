# 🚀 Vue 人如何玩转 React 自定义 Hook？从 Mixins 到 Hook 的华丽转身

> 在 Vue 中，我们曾经依赖 mixin 来实现逻辑复用，它简洁、方便，但在大型项目中也暴露出种种问题：变量来源不明、命名冲突、逻辑耦合……
>
> 本文将带你从 Vue 的角度出发，理解自定义 Hook 的设计理念，并通过实战演示其强大之处，帮助你完成从 mixin 到 Hook 的思维跃迁。

## 🧭 Vue 开发者痛点：从 Mixins 到 Composables

**😣 混入之痛 —— mixins：**

```ts
// Vue Mixins：全局状态污染警告！
const loggerMixin = {
  methods: { log(msg) { console.log(msg) } }
}
export default { mixins: [loggerMixin] }
```

- **问题**：隐式依赖、命名冲突、来源不明。

**✅ Vue3 Composables:**

```ts
// Vue 3 Composables：清晰的逻辑复用
export function useCounter() {
  const count = ref(0)
  const increment = () => count.value++
  return { count, increment }
}
```

- **优点**：明确依赖关系、按需引用。

**React 的自定义 Hook，则可以视为更高阶的 `Composables`：更灵活、更易组合、更契合函数式编程理念。**

## 🔁 从 mixin 到 Hook：两种逻辑复用方式的对比

### 举个栗子：监听窗口宽度变化

#### Vue 的 mixin 示例

```ts
export default {
  data() {
    return {
      width: window.innerWidth,
    };
  },
  mounted() {
    window.addEventListener('resize', this.updateWidth);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.updateWidth);
  },
  methods: {
    updateWidth() {
      this.width = window.innerWidth;
    },
  },
};
```

使用时只需要 `mixins: [resizeMixin]`，非常方便。但也有问题：

- 数据和行为耦合，难以测试
- 命名冲突风险大
- 外部看不到内部逻辑，调试困难

#### React 的自定义 Hook 实现

```ts
import { useEffect, useState } from 'react';

export function useWindowSize() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return width;
}
```

使用方式：

```ts
const width = useWindowSize();
```

**优势明显：**

- 数据和逻辑内聚，职责单一
- 命名可控，避免冲突
- 高度可组合与复用

## 🧠 自定义 Hook 是什么？

> 自定义 Hook 就是一个以 `use` 开头的函数，它内部可以使用其他 Hook，并封装逻辑实现复用。

#### 📌 特点

- 必须以 `use` 开头，才能被 React 正确识别
- 内部可使用其他 Hook（如 `useState`、`useEffect`）
- 本身不具备 UI 渲染功能，仅负责组织逻辑
- 支持嵌套、组合，便于测试与重构

## 🧩 写好自定义 Hook 的 4 个关键点

1. **命名以** `**use**` **开头**，才能被 React 正确识别
2. **保持纯函数**，不要直接修改 DOM 或状态以外的东西
3. **合理使用** `**useEffect**` **管理副作用**，避免闭包陷阱
4. **提取为独立模块，方便测试与维护**

## 🌟 常用自定义 Hook

### 1. `useDebounce`： 输入防抖

**场景**：搜索输入场景，用户输入时不立即触发请求，而是停顿一段时间后再执行。

```ts
import { useState, useEffect } from "react";

function useDebounce(value, delay = 500) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
```

**使用方式：**

```ts
const [input, setInput] = useState("");
const debouncedInput = useDebounce(input, 300);
```

### 2. `usePrevious`： 获取前一个状态值

**场景**：比较 props 或 state 的前后变化。

```ts
import { useRef, useEffect } from "react";

function usePrevious(value) {
  const ref = useRef();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}
```

**使用方式：**

```ts
const previousCount = usePrevious(count);
```

------

### 3. `useClickOutside`： 点击外部关闭弹窗

**场景**：实现点击弹窗外关闭菜单、模态框等。

```ts
import { useEffect } from "react";

function useClickOutside(ref, handler) {
  useEffect(() => {
    function listener(e) {
      if (!ref.current || ref.current.contains(e.target)) return;
      handler(e);
    }

    document.addEventListener("mousedown", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
    };
  }, [ref, handler]);
}
```

**使用方式：**

```ts
const modalRef = useRef();
useClickOutside(modalRef, () => setShow(false));
```

### 4. `useToggle`： 布尔值切换

**场景**：常用于控制模态框、侧边栏的显示与隐藏。

```ts
import { useState, useCallback } from "react";

function useToggle(defaultValue = false) {
  const [state, setState] = useState(defaultValue);
  const toggle = useCallback(() => setState(v => !v), []);
  return [state, toggle];
}
```

**使用方式：**

```ts
const [isOpen, toggleOpen] = useToggle();
```

### 5. `useLocalStorage`： 本地持久化

**场景**：将状态持久化到 localStorage。

```ts
import { useState } from "react";

function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (err) {
      return initialValue;
    }
  });

  const setValue = (value) => {
    const valToStore = value instanceof Function ? value(storedValue) : value;
    setStoredValue(valToStore);
    localStorage.setItem(key, JSON.stringify(valToStore));
  };

  return [storedValue, setValue];
}
```

**使用方式：**

```ts
const [theme, setTheme] = useLocalStorage('theme', 'light');
```

------



## ✅ 总结

自定义 Hook 是 Vue 开发者理解 React 的一座桥梁，它优雅地解决了 mixin 存在的隐式逻辑问题，让逻辑复用变得更加清晰、纯粹、可维护。

从 mixin 到 Hook，不只是代码结构的变化，更是一次范式的转变。

希望这篇文章能帮你快速掌握 **自定义 Hook**，如果你觉得有帮助，别忘了点个赞👍或关注我后续的 **重学 React** 系列！

