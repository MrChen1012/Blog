# 揭秘Vue3源码之computed：懒计算与缓存机制全解析

## 前言

在Vue3中，`computed`是个神奇的存在。你可能已经在项目里用得飞起，但你有没有想过它到底是怎么工作的？

- 为什么`computed`是懒惰的？
- 它和`watch`有什么本质区别？
- Vue3是如何优化`computed`让它更高效的？

今天就带着这些疑问，走进`computed`的源码世界，把它从头到脚扒个干净！

> 本文参考源码版本：`3.5.13`

------

## 计算属性的日常——一个生动的栗子

想象一下，你是个摸鱼大师，每天都要计算“摸鱼时长”（`computed`）。但只有当老板盯着你（`依赖变化`）时，你才会重新计算，以免被发现摸太久。

```vue
<template>
  <div>
    <p>上班时间：{{ workHours }}</p>
    <p>摸鱼时长：{{ fishingTime }}</p>
    <button @click="changeWorkHours">修改工时</button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const workHours = ref(8);
const fishingTime = computed(() => 12 - workHours.value);

const changeWorkHours = () => {
  workHours.value = Math.floor(Math.random() * 12);
};
</script>
```

这个`computed`计算出的`fishingTime`（摸鱼时长）只有在`workHours`变化时才会更新，否则一直复用上次的计算结果，省时省力。

那么`computed`是如何实现这个“懒惰”的特性的呢？让我们深入源码一探究竟！

------

## `computed`的源码揭秘

### `computed`函数

我们从`computed`的入口`packages/reactivity/src/computed.ts`开始：

```ts
export function computed<T>(
  getterOrOptions: ComputedGetter<T> | WritableComputedOptions<T>,
  debugOptions?: DebuggerOptions,
  isSSR = false
) {
  let getter: ComputedGetter<T>;
  let setter: ComputedSetter<T> | undefined;

  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions;
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }

  return new ComputedRefImpl(getter, setter, isSSR);
}
```

这段代码干了几件事：

- 区分传入的是函数（只读）还是对象（可写）。
- 创建`ComputedRefImpl`实例。

![](C:\cgj\1code\我的\面试\1博客\img\computed\excalidraw1.png)

所以，`computed`的核心逻辑其实都藏在`ComputedRefImpl`里。接下来，让我们看看这个类是如何让`computed`变得聪明的。

### `ComputedRefImpl`的核心机制

```ts
export class ComputedRefImpl<T = any> implements Subscriber {
  _value: any = undefined; // 缓存计算后的值
  readonly dep: Dep = new Dep(this); // 依赖管理
  readonly __v_isRef = true; // 标记为 ref
  readonly __v_isReadonly: boolean;
  flags: EffectFlags = EffectFlags.DIRTY; // 标记 dirty 状态
  globalVersion: number = globalVersion - 1; // 依赖版本
  isSSR: boolean;
  effect: this = this; // 兼容 effect API

  constructor(
    public fn: ComputedGetter<T>,
    private readonly setter: ComputedSetter<T> | undefined,
    isSSR: boolean
  ) {
    this.__v_isReadonly = !setter;
    this.isSSR = isSSR;
  }
```

核心点：

- `_value`：缓存计算结果，避免重复计算。
- `dep`：管理依赖关系。
- `flags`：`EffectFlags.DIRTY`表示“该计算属性需要重新计算”。

### `value`的`getter`

```ts
get value(): T {
  this.dep.track(); // 依赖收集
  refreshComputed(this); // 关键！刷新计算值
  return this._value;
}
```

**它做了什么？**

1. 依赖收集，让`computed`知道谁在用它。
2. 调用`refreshComputed`，如果需要，重新计算。
3. 返回缓存的`_value`，避免重复计算。

### `refreshComputed`函数（简化版）

```ts
export function refreshComputed(computed: ComputedRefImpl): undefined {
  if (!(computed.flags & EffectFlags.DIRTY)) return;
  computed.flags &= ~EffectFlags.DIRTY;

  try {
    computed._value = computed.fn();
  } catch (err) {
    throw err;
  }
}
```

这个函数的作用是：**确保只有当计算属性真的需要更新时，才执行计算。**

### `value`的`setter`（仅适用于可写`computed`）

```ts
set value(newValue) {
  if (this.setter) {
    this.setter(newValue);
  } else {
    console.warn('Write operation failed: computed value is readonly');
  }
}
```

- **如果是可写`computed`**，调用`setter`。
- **如果是只读`computed`**，警告你“别瞎改”！

## 栗子

回头看看一开始的栗子，当老板盯着你(`依赖变化`)时，进入工作状态，重新计算“摸鱼时长”(`computed`)

![](C:\cgj\1code\我的\面试\1博客\img\computed\excalidraw2.png)



------

## `computed`的惰性原理

Vue3的`computed`依赖`ReactiveEffect`来管理更新：

1. **首次访问`value`**
   - 发现是“脏的”（`flags = DIRTY`），所以执行`getter`，计算值并缓存。
   - 计算完成后，标记为“干净的”（`flags = 0`），下次访问直接返回缓存。
2. **依赖变化时**
   - 计算属性不会立刻计算，而是先把`flags`设为`DIRTY`，等到下一次访问时才计算。

> **这就是“懒计算”的精髓！**

------

## `computed`与其他响应式API的对比

在Vue3中，除了`computed`外，还有`watch`、`watchEffect` 以及直接使用`reactive`数据等方式来处理响应式数据。它们各自的特点和适用场景如下：

1. **`computed` vs `reactive/ref`**
   - **`reactive/ref`**：用于创建基础响应式数据，当数据变化时，任何依赖它的部分都会立即收到更新。
   - **`computed`**：建立在`reactive/ref`的基础上，computed的值是派生的、只读的（除非提供`setter`），并且具有缓存特性。对于依赖项未发生变化的情况下，多次访问 computed 时不会重新计算，有效减少不必要的计算量。
2. **`computed` vs `watch/watchEffect`**
   - **`watch/watchEffect`**：主要用于副作用操作，比如API调用、DOM操作或触发异步任务。`watch`在数据变化时会立即执行回调，并且可以访问旧值和新值。
   - **`computed`**：关注于数据的派生和缓存，不适合放置副作用逻辑。它在访问时根据依赖进行计算，且结果会被缓存，适用于那些需要频繁访问但不希望每次都重新计算的场景。

综上所述，如果目标是生成一个新的值并且希望它具备缓存功能，应选择`computed`；如果需要在数据变化时触发某些副作用，则`watch`或`watchEffect`更为合适。

| 特性     | computed          | watch/watchEffect   |
| -------- | ----------------- | ------------------- |
| 计算时机 | 访问`value`时计算 | 依赖变化时立即执行  |
| 是否缓存 | 是                | 否                  |
| 适用场景 | 计算新值          | 监听副作用（API等） |



------

## 结论

`computed`是`Vue3`响应式系统中的重要一环，它通过`ReactiveEffect`实现了**惰性计算**和**缓存机制**，让我们的代码更加高效。

在使用`computed`时，牢记以下几点：

- 它是**惰性求值**的，只有当你访问`value`时才会计算。
- 依赖变化时，它不会立即重新计算，而是**等你下次访问时才更新**。
- `computed`**会缓存结果**，除非依赖变了，否则不会重复计算。

