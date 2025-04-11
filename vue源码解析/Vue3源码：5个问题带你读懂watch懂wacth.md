# Vue3源码：5个问题带你读懂watch

## 前言

在`Vue3`的`Composition API`中，`watch`被广泛使用，无论是在表单监听、数据同步，还是监听路由变化，`watch` 都是`Vue`开发中不可或缺的工具。

它的作用是在每次响应式状态发生改变时触发回调函数。这篇文章将带着5个疑问带你深入理解`watch`源码。

- `watch`是如何监听响应式数据变化的
- `watch(source, cb, { immediate: true })`为什么会立即执行一次 `cb`？
- `watch`默认是“浅监听”，`deep: true`如何实现“深度监听”？
- `watch([refA, refB], cb)`监听多个`ref`，是如何分别获取`oldValue`和`newValue`的？
- 为什么`job`（调度任务）是`watch`的核心？

带着上面5个问题，我们进入源码中进行调试，看看watch是如何运行的，本文参考源码版本为`"version": "3.5.13"`。

## Demo调试

进入源码目录中的单元测试文件`packages\reactivity\__tests__\watch.spec.ts`

```ts
describe('watch', () => {
...

  test('with callback', () => {
    let dummy: any
    const source = ref(0)
    // 此处断点
    watch(source, () => {
      dummy = source.value
    })
    expect(dummy).toBe(undefined)
    source.value++
    expect(dummy).toBe(1)
  })
...
}
```

`vscode`中运行调试，到断点这里进入watch源码文件`packages\reactivity\src\watch.ts`，我们先来看看`watch`函数是怎样实现的

## `watch`函数

由于`watch`函数代码量比较多，我们拆开逻辑一部分一部分的去解读

```ts

export function watch(
  source: WatchSource | WatchSource[] | WatchEffect | object,
  cb?: WatchCallback | null,
  options: WatchOptions = EMPTY_OBJ,
): WatchHandle {
  const { immediate, deep, once, scheduler, augmentJob, call } = options

  const reactiveGetter = (source: object) => {
    if (deep) return source
    if (isShallow(source) || deep === false || deep === 0)
      return traverse(source, 1)
    return traverse(source)
  }

  let effect: ReactiveEffect
  let getter: () => any
  let cleanup: (() => void) | undefined
  let boundCleanup: typeof onWatcherCleanup
  let forceTrigger = false
  let isMultiSource = false

  if (isRef(source)) {
    getter = () => source.value
    forceTrigger = isShallow(source)
  } else if (isReactive(source)) {
    getter = () => reactiveGetter(source)
    forceTrigger = true
  } else if (isArray(source)) {
    isMultiSource = true
    forceTrigger = source.some(s => isReactive(s) || isShallow(s))
    getter = () =>
      source.map(s => {
        if (isRef(s)) {
          return s.value
        } else if (isReactive(s)) {
          return reactiveGetter(s)
        } else if (isFunction(s)) {
          return call ? call(s, WatchErrorCodes.WATCH_GETTER) : s()
        } else {}
      })
  } else if (isFunction(source)) {
    if (cb) {
      // getter with cb
      getter = call
        ? () => call(source, WatchErrorCodes.WATCH_GETTER)
        : (source as () => any)
    } else {
      // no cb -> simple effect
      getter = () => {
        if (cleanup) {
          pauseTracking()
          try {
            cleanup()
          } finally {
            resetTracking()
          }
        }
        const currentEffect = activeWatcher
        activeWatcher = effect
        try {
          return call
            ? call(source, WatchErrorCodes.WATCH_CALLBACK, [boundCleanup])
            : source(boundCleanup)
        } finally {
          activeWatcher = currentEffect
        }
      }
    }
  } else {
    getter = NOOP
  }

  if (cb && deep) {
    const baseGetter = getter
    const depth = deep === true ? Infinity : deep
    getter = () => traverse(baseGetter(), depth)
  }

  const scope = getCurrentScope()
  const watchHandle: WatchHandle = () => {
    effect.stop()
    if (scope && scope.active) {
      remove(scope.effects, effect)
    }
  }

  if (once && cb) {
    const _cb = cb
    cb = (...args) => {
      _cb(...args)
      watchHandle()
    }
  }

  let oldValue: any = isMultiSource
    ? new Array((source as []).length).fill(INITIAL_WATCHER_VALUE)
    : INITIAL_WATCHER_VALUE

  const job = (immediateFirstRun?: boolean) => {
    if (
      !(effect.flags & EffectFlags.ACTIVE) ||
      (!effect.dirty && !immediateFirstRun)
    ) {
      return
    }
    if (cb) {
      // watch(source, cb)
      const newValue = effect.run()
      if (
        deep ||
        forceTrigger ||
        (isMultiSource
          ? (newValue as any[]).some((v, i) => hasChanged(v, oldValue[i]))
          : hasChanged(newValue, oldValue))
      ) {
        // cleanup before running cb again
        if (cleanup) {
          cleanup()
        }
        const currentWatcher = activeWatcher
        activeWatcher = effect
        try {
          const args = [
            newValue,
            // pass undefined as the old value when it's changed for the first time
            oldValue === INITIAL_WATCHER_VALUE
              ? undefined
              : isMultiSource && oldValue[0] === INITIAL_WATCHER_VALUE
                ? []
                : oldValue,
            boundCleanup,
          ]
          call
            ? call(cb!, WatchErrorCodes.WATCH_CALLBACK, args)
            : // @ts-expect-error
              cb!(...args)
          oldValue = newValue
        } finally {
          activeWatcher = currentWatcher
        }
      }
    } else {
      // watchEffect
      effect.run()
    }
  }

  if (augmentJob) {
    augmentJob(job)
  }

  effect = new ReactiveEffect(getter)

  effect.scheduler = scheduler
    ? () => scheduler(job, false)
    : (job as EffectScheduler)

  boundCleanup = fn => onWatcherCleanup(fn, false, effect)

  cleanup = effect.onStop = () => {
    const cleanups = cleanupMap.get(effect)
    if (cleanups) {
      if (call) {
        call(cleanups, WatchErrorCodes.WATCH_CLEANUP)
      } else {
        for (const cleanup of cleanups) cleanup()
      }
      cleanupMap.delete(effect)
    }
  }

  // initial run
  if (cb) {
    if (immediate) {
      job(true)
    } else {
      oldValue = effect.run()
    }
  } else if (scheduler) {
    scheduler(job.bind(null, true), true)
  } else {
    effect.run()
  }

  watchHandle.pause = effect.pause.bind(effect)
  watchHandle.resume = effect.resume.bind(effect)
  watchHandle.stop = watchHandle

  return watchHandle
}
```

### `source`数据处理

根据`Vue3`官方文档，`source`可以是`ref、reactive、getter函数`或者多个数据源组成的数组，我们先来看watch函数对`source`参数的处理：

![image-20250320114416937](C:\Users\chenl\AppData\Roaming\Typora\typora-user-images\image-20250320114416937.png)

```ts
...
  if (isRef(source)) {
    getter = () => source.value
    forceTrigger = isShallow(source)
  } else if (isReactive(source)) {
    getter = () => reactiveGetter(source)
    forceTrigger = true
  } else if (isArray(source)) {
    isMultiSource = true
    forceTrigger = source.some(s => isReactive(s) || isShallow(s))
    getter = () =>
      source.map(s => {
        if (isRef(s)) {
          return s.value
        } else if (isReactive(s)) {
          return reactiveGetter(s)
        } else if (isFunction(s)) {
          return call ? call(s, WatchErrorCodes.WATCH_GETTER) : s()
        } else {}
      })
  } else if (isFunction(source)) {
    if (cb) {
      // getter with cb
      getter = call
        ? () => call(source, WatchErrorCodes.WATCH_GETTER)
        : (source as () => any)
    } else {
      // no cb -> simple effect
      getter = () => {
        if (cleanup) {
          pauseTracking()
          try {
            cleanup()
          } finally {
            resetTracking()
          }
        }
        const currentEffect = activeWatcher
        activeWatcher = effect
        try {
          return call
            ? call(source, WatchErrorCodes.WATCH_CALLBACK, [boundCleanup])
            : source(boundCleanup)
        } finally {
          activeWatcher = currentEffect
        }
      }
    }
  } else {
    getter = NOOP
  }
...
```

根据`source`数据类型进行以下处理，创建对应的`getter`函数

- `ref`：监听 `.value`
- `reactive`: 遍历对象，获取响应式属性
- `数组`：分别处理每个元素
- `函数`：如果有 `cb`，执行 `source()` 获取值，否则直接运行 `source()`，并支持 `onCleanup`（`watchEffect`）

再往下看，到了deep判断部分，我们看看deep逻辑做了什么？

### `deep`处理

**`watch`默认是浅监听，为什么`deep: true`能深度监听？**

```ts
  if (cb && deep) {
    const baseGetter = getter
    const depth = deep === true ? Infinity : deep
    getter = () => traverse(baseGetter(), depth)
  }
```

这里判断`cb && deep`则执行`traverse`去递归自身进行深层遍历，`traverse`函数就是一个判断不同数据类型进行递归遍历自身的函数。

可能会有细心的同学发现，上面的`source`数据处理中，`reactive`对象的处理使用了`reactiveGetter`函数

```js
  const reactiveGetter = (source: object) => {
    if (deep) return source
    if (isShallow(source) || deep === false || deep === 0)
      return traverse(source, 1)
    return traverse(source)
  }
```

在没传入`deep`时，手动执行`traverse`函数去遍历自身。如果是浅层reactive数据则遍历1次自身，非浅层reactive数据则深层递归自身。

**但让人觉得很奇怪的一点是，为什么传入`deep`时只需要直接`return source`，而在没有传入`deep`时需要手动去执行`traverse`函数去遍历自身，这两者有什么区别呢？**

带着疑问，我们接着往下看

```ts
... 
  const job = (immediateFirstRun?: boolean) => {
	...
  }

  // 创建监听值的副作用实例
  effect = new ReactiveEffect(getter)

  effect.scheduler = scheduler
    ? () => scheduler(job, false)
    : (job as EffectScheduler)
...
```

这里创建`effect`副作用实例，以`getter`作为回调，并使用`job`作为调度器。

`watch`的核心在于`job`，它决定了`cb`何时执行，我们来看看`job`是如何工作的。

### `job`函数

我们把`job`函数的代码简化一下

```ts
...
  const job = (immediateFirstRun?: boolean) => {
    if (cb) {
      // watch(source, cb)
      const newValue = effect.run()
      cb(newValue, oldValue)
      oldValue = newValue
    } else {
      // watchEffect
      effect.run()
    }
  }
...
```

这里判断`cb`是否存在，存在则执行`effect.run`，再去调用`cb`，`cb`不存在时直接执行`effect.run`，类似`watchEffect`的实现方式

熟悉响应式原理的小伙伴一看就知道了，`effect.run`本质就是执行`this.fn`

```ts
...
run(): T {
  // 设置当前 effect
  activeSub = this
  shouldTrack = true
  return this.fn() // ✅ 这里才是依赖收集的真正入口
}
...
```

这里简写了run代码，不熟悉的小伙伴移步：[Vue3源码解析之Ref、Effect](https://juejin.cn/post/7477424318438211611)

- **`shouldTrack = true`**：告诉 `Vue`**可以开始收集依赖**。

- **`activeSub = this`**：记录当前 `effect`，当响应式数据 `track()` 时，知道应该把谁作为依赖收集。

- **执行`this.fn()`**

  这个`fn()`其实就是`watchEffect(cb)`或`watch(source)`里的`getter`。

  `fn()`里如果访问了响应式数据，就会触发`track()`，从而收集依赖。

那么上面的问题是不是一目了然了，`source`为`reactive`对象时，`deep`为`true`时直接`return source`，在`effect.run`这里去收集**使用到**的属性。而`traverse`函数遍历自身，深层递归访问了所以属性，这里触发了`MutableReactiveHandler`类的`get`方法，`track()`了所有被访问到的属性。

> `MutableReactiveHandler类`不熟悉的移步：[手摸手带你阅读Vue3源码之Reactive 上](https://juejin.cn/post/7475607042527821864)

## 问题

还记得文章开始时我们提到的5个问题吗，到一步了我们看看解决了哪些

##### `watch`是如何监听响应式数据变化的

- 让`getter`作为`ReactiveEffect`的`fn`，这样`effect.run`执行时，`getter`会自动收集依赖
- `source`变化时，`Vue3` 响应式系统`trigger`触发`effect`执行`job`

##### `watch`默认是“浅监听”，`deep: true` 如何实现“深度监听”？

- `source`不为`reactive`对象时，调用`traverse`函数遍历`source`进行依赖收集
- `source`是`reactive`对象时，直接`return source`，在`effect.run`里进行依赖收集

##### `watch([refA, refB], cb)`监听多个`ref`，是如何分别获取`oldValue`和`newValue`的？

- 遍历`source`数组，对每个`ref`执行`getter()`，让它们收集依赖
- `cb(newValue, oldValue)`依次传入最新值和旧值

##### 为什么`job`（调度任务）是`watch`的核心？

- `job`控制`cb`何时执行
- 可配合传入`scheduler`进行优化，改变job执行时机

##### `watch(source, cb, { immediate: true })`为什么会立即执行一次 `cb`？

- watch方法后面初始化时判断了`immediate: true`立即执行一次`job(true)`

```ts
...
  // initial run
  if (cb) {
    if (immediate) {
      job(true)
    } else {
      oldValue = effect.run()
    }
  } else if (scheduler) {
    scheduler(job.bind(null, true), true)
  } else {
    effect.run()
  }
...
```

> 感谢阅读！欢迎`点赞`、`收藏`、`关注`，一键三连！！！

