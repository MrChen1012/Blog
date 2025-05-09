# Vue3源码解析之Ref、Effect



## 前言

上篇文章详细讲解了响应式原理中的核心方法`reactive`，这篇文章我们继续讲解响应式原理中的另一个核心方法`ref`以及副作用函数`effect`，本文参考源码版本为`"version": "3.5.13"`

## ref函数

### 1. 首先让我们看一下它源码中用到了哪些方法

文件位置`packages\reactivity\src\ref.ts`

```js
export function ref(value?: unknown) {
  return createRef(value, false)
}

function createRef(rawValue: unknown, shallow: boolean) {
  if (isRef(rawValue)) {
    return rawValue
  }
  return new RefImpl(rawValue, shallow)
}


/**
 * @internal
 */
class RefImpl<T = any> {
  _value: T
  private _rawValue: T

  dep: Dep = new Dep()

  public readonly [ReactiveFlags.IS_REF] = true
  public readonly [ReactiveFlags.IS_SHALLOW]: boolean = false

  constructor(value: T, isShallow: boolean) {
    this._rawValue = isShallow ? value : toRaw(value)
    this._value = isShallow ? value : toReactive(value)
    this[ReactiveFlags.IS_SHALLOW] = isShallow
  }

  get value() {
    if (__DEV__) {
      this.dep.track({
        target: this,
        type: TrackOpTypes.GET,
        key: 'value',
      })
    } else {
      this.dep.track()
    }
    return this._value
  }

  set value(newValue) {
    const oldValue = this._rawValue
    const useDirectValue =
      this[ReactiveFlags.IS_SHALLOW] ||
      isShallow(newValue) ||
      isReadonly(newValue)
    newValue = useDirectValue ? newValue : toRaw(newValue)
    if (hasChanged(newValue, oldValue)) {
      this._rawValue = newValue
      this._value = useDirectValue ? newValue : toReactive(newValue)
      if (__DEV__) {
        this.dep.trigger({
          target: this,
          type: TriggerOpTypes.SET,
          key: 'value',
          newValue,
          oldValue,
        })
      } else {
        this.dep.trigger()
      }
    }
  }
}

```

可以看到相比较于`reactive`，`ref`的实现很简单，总结来说就是`ref`是用来讲解简单值类型的数据响应，如果传入`ref`的是一个对象，则内部调用`reactive`方法进行深层响应转换

### 2. 断点调试看看具体流程

### 1. 准备一个demo

```js
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
    <script src="../vue/dist/vue.global.js"></script>
</head>

<body>
    <div id="app"></div>
    <script>
        const { ref } = Vue

        const name = ref('JiangJiang')


        setTimeout(() => {
            name.value = '帅哥-JiangJiang'
        }, 2000);
    </script>
</body>

</html>
```

### 2. 代码执行，进入`ref`方法 -> return `createRef`方法 -> return `RefImpl`实例对象，我们具体看看`RefImpl`类

```js
class RefImpl<T = any> {
  _value: T 
  private _rawValue: T

  dep: Dep = new Dep()

  public readonly [ReactiveFlags.IS_REF] = true
  public readonly [ReactiveFlags.IS_SHALLOW]: boolean = false

  constructor(value: T, isShallow: boolean) {
    this._rawValue = isShallow ? value : toRaw(value) // 初始化ref值
    this._value = isShallow ? value : toReactive(value) // 浅数据获取原始值，否则调用toReactive将值变为响应式对象
    this[ReactiveFlags.IS_SHALLOW] = isShallow
  }

  get value() {
    if (__DEV__) {
      this.dep.track({
        target: this,
        type: TrackOpTypes.GET,
        key: 'value',
      })
    } else {
      this.dep.track()
    }
    return this._value
  }

  set value(newValue) {
    const oldValue = this._rawValue
    const useDirectValue =
      this[ReactiveFlags.IS_SHALLOW] ||
      isShallow(newValue) ||
      isReadonly(newValue)
    newValue = useDirectValue ? newValue : toRaw(newValue)
    if (hasChanged(newValue, oldValue)) {
      this._rawValue = newValue
      this._value = useDirectValue ? newValue : toReactive(newValue)
      if (__DEV__) {
        this.dep.trigger({
          target: this,
          type: TriggerOpTypes.SET,
          key: 'value',
          newValue,
          oldValue,
        })
      } else {
        this.dep.trigger()
      }
    }
  }
}
```

### 3. `value` 的 `getter` 和 `setter`

- **`getter`**: 该方法用于获取 `ref` 的值。当访问 `ref.value` 时，会触发此方法。并且会调用 `this.dep.track()` 进行依赖收集，意味着当前的副作用函数会被添加到依赖队列中，依赖于这个 `ref` 的 `effect` 会在值改变时重新执行。

```js
get value() {
  if (__DEV__) {
    this.dep.track({
      target: this,
      type: TrackOpTypes.GET,
      key: 'value',
    });
  } else {
    this.dep.track();
  }
  return this._value;
}
```

- **`setter`**: 当更新 `ref.value` 的值时，`setter` 会被触发。它会根据 `newValue` 和 `oldValue` 的变化来判断是否需要更新。如果值发生变化，并且是深度的（非浅 `ref`），它会将新值转换为响应式值并存储。更新后会调用 `this.dep.trigger()` 来通知所有依赖该 `ref` 的副作用函数，重新执行这些副作用。

```js
set value(newValue) {
  const oldValue = this._rawValue;
  const useDirectValue = 
    this[ReactiveFlags.IS_SHALLOW] ||
    isShallow(newValue) ||
    isReadonly(newValue);
  newValue = useDirectValue ? newValue : toRaw(newValue);
  
  if (hasChanged(newValue, oldValue)) {
    this._rawValue = newValue;
    this._value = useDirectValue ? newValue : toReactive(newValue);

    if (__DEV__) {
      this.dep.trigger({
        target: this,
        type: TriggerOpTypes.SET,
        key: 'value',
        newValue,
        oldValue,
      });
    } else {
      this.dep.trigger();
    }
  }
}
```

### 4. 关键方法解析

- **`toRaw(value)`**: 用于获取原始的未响应式的对象。通常，响应式对象会被封装成代理对象（Proxy），`toRaw` 可以去除这个封装，获得实际的数据。
- **`toReactive(value)`**: 将对象转换为响应式对象，通常会使用 `Proxy` 实现。
- **`this.dep.trigger()`**: 用于触发与该 `ref` 相关的副作用（effect）函数，通知依赖它的地方进行更新。

具体使用参考上篇文章：[手摸手带你阅读Vue3源码之Reactive 下](https://juejin.cn/post/7475754150790266914)

## Effect 副作用函数

### 1. 首先说下我对副作用函数的理解：

1. `vue`初始化的时候，每当某个响应式数据被访问时，相关的副作用函数就会被创建并执行。副作用函数会自动订阅相关数据变化，并进行响应。
2. 在响应式数据发生改变时，相关的副作用函数就会被触发。因为响应式系统中有依赖收集(`track`)跟触发更新(`trigger`)机制，数据变化时，依赖它的副作用函数会被重新执行。
3. 副作用函数是按顺序执行的，并且有去重机制，同一数据变化不会触发重复的副作用函数执行。也就是说，同一个数据在同一时刻触发多次更新，副作用函数不会重复执行，而是合并成一个执行。

### 2. effect函数

进入到`packages\reactivity\src\effect.ts`文件

```js
// 下面加上了注释方便理解
export function effect<T = any>(
  fn: () => T,
  options?: ReactiveEffectOptions,
): ReactiveEffectRunner<T> {
  // 检查fn是否是一个已经执行过的副作用函数，如果是的话，则直接使用，避免多次创建副作用函数
  if ((fn as ReactiveEffectRunner).effect instanceof ReactiveEffect) {
    fn = (fn as ReactiveEffectRunner).effect.fn
  }

  // 创建一个新的副作用函数 ReactiveEffect实例对象
  const e = new ReactiveEffect(fn)
  if (options) {
    // 如果有传入配置，则进行配置合并
    extend(e, options)
  }
  try {
    // 执行副作用函数
    e.run()
  } catch (err) {
    // 发生错误时停止
    e.stop()
    throw err
  }
  // 保证run方法的上下文指向e
  const runner = e.run.bind(e) as ReactiveEffectRunner
  // 把副作用函数挂载到effect上，方便后续访问
  runner.effect = e
  return runner
}
```

从源码上看`effect`方法不难理解，创建副作用函数 -> 使用副作用函数 -> 挂载副作用函数

我们下面看看`new ReactiveEffect(fn)`是如何创建副作用函数的

### 3. `ReactiveEffect`类

```js
export class ReactiveEffect<T = any>
  implements Subscriber, ReactiveEffectOptions
{
  /**
   * @internal
   * 响应式数据链表
   */
  deps?: Link = undefined
  /**
   * @internal
   */
  depsTail?: Link = undefined
  /**
   * @internal
   * 副作用状态管理
   */
  flags: EffectFlags = EffectFlags.ACTIVE | EffectFlags.TRACKING
  /**
   * @internal
   * 指向的下一个副作用函数
   */
  next?: Subscriber = undefined
  /**
   * @internal
   * 清理副作用函数
   */
  cleanup?: () => void = undefined

  // 副作用函数调度器
  scheduler?: EffectScheduler = undefined
  // 停止
  onStop?: () => void
  // 追踪
  onTrack?: (event: DebuggerEvent) => void
  // 触发
  onTrigger?: (event: DebuggerEvent) => void

  constructor(public fn: () => T) {
    // 存在当前活跃的effect作用域且当前作用域生效
    if (activeEffectScope && activeEffectScope.active) {
      // 把当前实例添加进当前当前作用域的副作用函数列表里
      activeEffectScope.effects.push(this)
    }
  }

  pause(): void {
    this.flags |= EffectFlags.PAUSED
  }

  resume(): void {
    if (this.flags & EffectFlags.PAUSED) {
      this.flags &= ~EffectFlags.PAUSED
      if (pausedQueueEffects.has(this)) {
        pausedQueueEffects.delete(this)
        this.trigger()
      }
    }
  }

  /**
   * @internal
   * 通知副作用函数触发更新
   */
  notify(): void {
    if (
      this.flags & EffectFlags.RUNNING &&
      !(this.flags & EffectFlags.ALLOW_RECURSE)
    ) {
      return
    }
    if (!(this.flags & EffectFlags.NOTIFIED)) {
      batch(this)
    }
  }

  // 运行副作用函数
  run(): T {
    // TODO cleanupEffect

    // 如果 effect 已经被停止，则直接执行 `fn()`，但不会收集依赖
    if (!(this.flags & EffectFlags.ACTIVE)) {
      return this.fn()
    }

    // 设置状态为RUNNING
    this.flags |= EffectFlags.RUNNING
    // 清除旧effect函数
    cleanupEffect(this)
    prepareDeps(this)
    // 记录当前effect的上一个副作用函数
    const prevEffect = activeSub
    const prevShouldTrack = shouldTrack
    // 设置当前effect
    activeSub = this
    shouldTrack = true

    try {
      return this.fn()
    } finally {
      if (__DEV__ && activeSub !== this) {
        warn(
          'Active effect was not restored correctly - ' +
            'this is likely a Vue internal bug.',
        )
      }
      // 恢复之前的副作用状态
      cleanupDeps(this)
      activeSub = prevEffect
      shouldTrack = prevShouldTrack
      this.flags &= ~EffectFlags.RUNNING
    }
  }

  stop(): void {
    if (this.flags & EffectFlags.ACTIVE) {
      for (let link = this.deps; link; link = link.nextDep) {
        removeSub(link)
      }
      this.deps = this.depsTail = undefined
      cleanupEffect(this)
      this.onStop && this.onStop()
      this.flags &= ~EffectFlags.ACTIVE
    }
  }

  // 触发副作用执行
  trigger(): void {
    if (this.flags & EffectFlags.PAUSED) {
      // 如果当前effect处于暂停状态 则加入暂停队列
      pausedQueueEffects.add(this)
    } else if (this.scheduler) {
      this.scheduler()
    } else {
      this.runIfDirty()
    }
  }

  /**
   * @internal
   */
  runIfDirty(): void {
    if (isDirty(this)) {
      this.run()
    }
  }

  get dirty(): boolean {
    return isDirty(this)
  }
}

```

`notify`、`run` 和 `trigger` 这三个方法是 `ReactiveEffect` 中最核心、最常用的部分，它们分别对应 **副作用通知、执行、副作用触发**

#### `notify`通知副作用触发

- **作用**：标记该 effect 需要执行，并将其加入批量执行队列。
- **调用时机**：当响应式数据变更时（即 `track` 追踪的依赖变化）。
- 关键逻辑：
  - 先判断当前 effect 是否已经运行（`RUNNING`），且不允许递归执行（`ALLOW_RECURSE`）。
  - 如果尚未被通知（`NOTIFIED`），则调用 `batch(this)` 将 effect 加入执行队列。
- **主要用途**：通知 effect 需要重新执行，避免重复执行同一个 effect。

####  `run`执行副作用

- **作用**：真正执行 effect 逻辑（即 `fn()`），并在运行时管理依赖收集状态。
- 调用时机：
  - effect 初始化时手动调用 `effect.run()`。
  - effect 依赖的响应式数据更新时，被 `trigger()` 触发执行。
- 关键逻辑：
  - **如果 effect 已停止**（`ACTIVE` 被移除），则**直接执行 `fn()`**，但不会收集依赖。
  - 否则：
    1. 标记当前 effect 为 `RUNNING`。
    2. 清理上一次 effect 的依赖（`cleanupEffect(this)`）。
    3. 记录当前 effect 并允许追踪依赖。
    4. **执行 `fn()`**（即副作用逻辑）。
    5. 运行完毕后**恢复之前的 effect**，并取消 `RUNNING` 状态。
- **主要用途**：执行 effect，并在执行时完成依赖收集。

#### `trigger`触发副作用

- **作用**：当响应式数据变化时，触发 effect 执行。
- 调用时机：
  - 响应式数据更新后（`notify()` 调用 `batch()` 处理后），最终会调用 `trigger()` 运行 effect。
- 关键逻辑：
  - **如果 effect 处于暂停状态**（`PAUSED`），则**加入暂停队列**，不会立即执行。
  - **如果有调度器 `scheduler`**（如 `computed` 会有 `scheduler` ），则调用 `scheduler()` 进行调度，而不是直接运行。
  - **否则**，调用 `runIfDirty()` 只在 `dirty` 状态下才执行 `run()`。
- **主要用途**：管理 effect 触发方式，避免不必要的执行，支持调度。

### 4. `EffectScope `类

上面`ReactiveEffect`类中的代码里有用到一个判断

```js

export class ReactiveEffect<T = any>
  implements Subscriber, ReactiveEffectOptions
{
  ...

  constructor(public fn: () => T) {
    // 存在当前活跃的effect作用域且当前作用域生效
    if (activeEffectScope && activeEffectScope.active) {
      // 把当前实例添加进当前当前作用域的副作用函数列表里
      activeEffectScope.effects.push(this)
    }
  }

  ...
}
```

这里用到了`activeEffectScope`，源码中是这样定义的

```js
export let activeEffectScope: EffectScope | undefined
```

`activeEffectScope`的值为`EffectScope`类或`undefined`，我们来看看`EffectScope`类

```js
// 这里省略了部分代码，想去研究的同学可以前往packages\reactivity\src\effectScope.ts
export class EffectScope {
  /**
   * @internal
   * 标记当前作用域是否仍然有效
   */
  private _active = true
  /**
   * @internal track `on` calls, allow `on` call multiple times
   */
  private _on = 0
  /**
   * @internal
   * 当前作用域内的所有副作用函数
   */
  effects: ReactiveEffect[] = []
  /**
   * @internal
   * 清除副作用函数方法
   */
  cleanups: (() => void)[] = []

  private _isPaused = false

  /**
   * only assigned by undetached scope
   * @internal
   * 记录当前作用域的父级作用域（仅当 `detached` 为 `false` 时生效）
   */
  parent: EffectScope | undefined
  /**
   * record undetached scopes
   * @internal
   * 存储当前作用域的子作用域列表
   */
  scopes: EffectScope[] | undefined
  /**
   * track a child scope's index in its parent's scopes array for optimized
   * removal
   * @internal
   */
  private index: number | undefined

  constructor(public detached = false) {
    // 记录当前活跃的effect作用域
    this.parent = activeEffectScope
    /**
     * `detached` 表示该作用域是否独立（即不依附于 `activeEffectScope`）。
     * - `true` 代表这个作用域是独立的，不会被 `parent` 追踪管理。
     * - `false` 代表该作用域是附属于当前 `activeEffectScope` 的，会存入 `activeEffectScope.scopes` 中。
     */
    if (!detached && activeEffectScope) {
      this.index =
        // 把当前this存储到子作用域中
        (activeEffectScope.scopes || (activeEffectScope.scopes = [])).push(
          this,
        ) - 1
    }
  }

  get active(): boolean {
    return this._active
  }

  pause(): void {
    if (this._active) {
      this._isPaused = true
      let i, l
      if (this.scopes) {
        for (i = 0, l = this.scopes.length; i < l; i++) {
          this.scopes[i].pause()
        }
      }
      for (i = 0, l = this.effects.length; i < l; i++) {
        this.effects[i].pause()
      }
    }
  }

  /**
   * Resumes the effect scope, including all child scopes and effects.
   */
  resume(): ...

  // 运行副作用函数
  run<T>(fn: () => T): T | undefined {
    if (this._active) {
      // 记录当前活跃的副作用域
      const currentEffectScope = activeEffectScope
      try {
        // 设置当前作用域为this
        activeEffectScope = this
        return fn()
      } finally {
        // 执行完毕后恢复之前的副作用域，避免影响外部作用域
        activeEffectScope = currentEffectScope
      }
    } else if (__DEV__) {
      warn(`cannot run an inactive effect scope.`)
    }
  }

  ...
}

```

#### 核心作用

- `EffectScope` 主要用于批量管理 `effect` 副作用，允许在 `setup()` 期间创建的 `effect` 归属于特定的作用域。
- 作用域可以嵌套，子作用域会自动跟随父作用域销毁。
- 可以暂停（`pause`）、恢复（`resume`）以及手动停止（`stop`）作用域内的 `effect`。



## 手写一个简单的响应式

##### 1. 写代码前先有思路(不考虑边界情况)：

1. 创建 `reactive`，返回一个 `Proxy` 处理器
2. 定义 `createReactiveObject` 方法，传参 `target`、`baseHandlers`
3. `baseHandlers` 里面定义 `has`、`get`、`set`、`delete` 基本方法
4. 通过 `track`、`trigger` 去实现发布订阅
5. 通过 `effect` 创建副作用函数，并使其能够在依赖发生变化时重新执行

##### 2. 完整代码

```js

// 使用WeakMap存储全局Proxy处理器
const targetMap = new WeakMap()

// 当前活跃的副作用函数
let activeEffect = null

// 创建响应式对象，返回 Proxy 代理对象
function reactive(target) {
    return createReactiveObject(target)
}

// 创建 Proxy 代理对象，拦截 get 和 set 操作
function createReactiveObject(target) {
    return new Proxy(target, baseHandlers)
}

// 默认的拦截器对象
const baseHandlers = {
    // 拦截 set 操作：当对象的属性被修改时触发
    set(target, key, value, receiver) {
        // 获取属性的旧值
        const oldValue = target[key]

        // 使用 Reflect.set 执行实际的 set 操作
        const result = Reflect.set(target, key, value, receiver)

        // 如果属性值发生变化，触发更新（即触发该属性的依赖副作用函数）
        if (oldValue !== value) {
            trigger(target, key)
        }

        // 返回 set 操作的结果
        return result
    },

    // 拦截 get 操作：当读取对象的属性时触发
    get(target, key) {
        // 获取属性值
        const result = Reflect.get(target, key)

        // 触发依赖收集
        track(target, key)

        // 返回属性值
        return result
    }
}

// 依赖收集：将当前的副作用函数（activeEffect）与属性绑定
function track(target, key) {
    // 如果没有活动的副作用函数，则跳过
    if (!activeEffect) return

    // 获取 target 对应的 depsMap（存储所有属性的副作用函数集合）
    let depsMap = targetMap.get(target)

    // 如果 depsMap 不存在，则创建它
    if (!depsMap) {
        targetMap.set(target, (depsMap = new Map()))
    }

    // 获取当前属性的依赖集合
    let deps = depsMap.get(key)

    // 如果该属性的依赖集合不存在，则创建它
    if (!deps) {
        depsMap.set(key, (deps = new Set()))
    }

    // 将当前副作用函数添加到该属性的依赖集合中
    if (!deps.has(activeEffect)) {
        deps.add(activeEffect)
        // 将该依赖集合保存到副作用函数的 deps 数组中
        activeEffect.deps.push(deps)
    }
}

// 触发副作用函数：当属性值发生变化时，触发所有依赖该属性的副作用函数
function trigger(target, key) {
    // 获取 target 对应的 depsMap
    const depsMap = targetMap.get(target)

    // 如果没有 depsMap，说明没有依赖项，直接返回
    if (!depsMap) return

    // 获取该属性的依赖集合
    const deps = depsMap.get(key)

    // 如果存在依赖集合，则遍历并触发所有依赖该属性的副作用函数
    if (deps) {
        deps.forEach(effect => effect())
    }
}

// 创建副作用函数，执行时会自动收集依赖并在数据变化时重新执行
function effect(fn) {
    // 创建一个新的副作用函数，传入用户的函数 fn
    const effectFn = () => {
        // 每次执行副作用函数前，先清理之前的依赖
        cleanup(effectFn)

        // 设置当前副作用函数为活动副作用函数
        activeEffect = effectFn

        // 执行副作用函数
        fn()

        // 执行完成后清空活动副作用函数
        activeEffect = null
    }

    // 为副作用函数添加 deps 数组，用于存储该副作用函数依赖的属性集合
    effectFn.deps = []

    // 立即执行副作用函数，触发依赖收集
    effectFn()

    // 返回副作用函数
    return effectFn
}

// 清理副作用函数的依赖：从所有依赖集合中删除当前副作用函数
function cleanup(effect) {
    // 遍历副作用函数的 deps 数组
    effect.deps.forEach(deps => deps.delete(effect))
    // 清空 deps 数组
    effect.deps.length = 0
}
```

