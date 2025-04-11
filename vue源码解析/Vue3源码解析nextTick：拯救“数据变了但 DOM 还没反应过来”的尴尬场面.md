# Vue3源码解析之nextTick：拯救“数据变了但 DOM 还没反应过来”的尴尬场面



## 前言

在这篇文章中，我们将深入剖析 Vue3 中的一个重要工具——`nextTick`。你可能已经在项目中多次使用过它，但是否真正理解它的工作原理？它是如何在异步更新 DOM 的过程中发挥作用的？它是如何与 Vue3 的响应式系统配合工作的？这些问题的答案，正是我们今天要揭开的谜底。

通过这篇文章，你将不仅仅了解 `nextTick` 的基础用法，更会深入理解它的工作原理、底层实现以及应用场景。无论你是 Vue3 的初学者，还是已经有一定经验的开发者，都能从中获益，提升自己对 Vue3 内部机制的理解，并在开发中更加得心应手。

本文参考源码版本为`"version": "3.5.13"`



## 一个栗子

#### **场景描述**

想象你是一个餐厅老板，刚刚雇了一个 AI 机器人服务员（Vue）。你告诉它：“上菜！” 它会先把所有新订单（数据变化）记下来，然后等一会儿（批量更新），再一次性端上来（DOM 更新）。

然而，有个催单的老顾客（你自己），每次都在点完菜（数据更新）后，立刻扭头问：“菜好了吗？”（访问 DOM）。

机器人一脸懵逼：“老板，你能不能等我把菜端上来再看？” 🤖

于是你决定让老顾客等一会儿 (nextTick)，确保菜真的上桌了（DOM 更新完成）后再看。

```js
<template>
  <div>
    <p ref="msgRef">当前消息：{{ message }}</p>
    <button @click="updateMessage">更新消息</button>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'

const message = ref('Hello, Vue3!')
const msgRef = ref(null)

const updateMessage = () => {
  message.value = 'Vue3 太好玩了！'

  console.log('立刻查看 DOM：', msgRef.value.textContent) // 旧的 "Hello, Vue3!"

  nextTick(() => {
    console.log('等 Vue 更新完后查看 DOM：', msgRef.value.textContent) // 新的 "Vue3 太好玩了！"
  })
}
</script>

```

####  `nextTick` 的原理（简单易懂版）

Vue 是个懒人，它不会数据一变就立刻更新 DOM，而是会先等一会儿，看看有没有其他变化（批量更新，避免性能浪费）。

1. 你点击按钮，`message.value` 变了，Vue 说：“好嘞，我记下了！”（触发响应式更新）。
2. 但 Vue 不会马上更新 DOM，而是先看看还有没有别的变化，再一起更新（批量处理）。
3. 此时 DOM 还是旧的，如果你立刻 `console.log(msgRef.value.textContent)`，你会发现它还是老样子。
4. 使用 `nextTick`：Vue 说：“你要等我改完再看？好嘞，等我忙完你就能看到最新的了。”
5. `nextTick` 的回调函数会在 Vue 完成 DOM 更新后执行，此时获取的 `msgRef.value.textContent` 就是最新的！



## 深入`nextTick`

Vue3官网文档描述：

**`nextTick`**：等待下一次 DOM 更新刷新的工具方法。

当你在 Vue 中更改响应式状态时，最终的 DOM 更新并不是同步生效的，而是由 Vue 将它们缓存在一个队列中，直到下一个“tick”才一起执行。这样是为了确保每个组件无论发生多少状态改变，都仅执行一次更新。

下面让我们走进源码，看看`nextTick`是怎样实现的

###  `nextTick`函数

参考源码`packages\runtime-core\src\scheduler.ts`

```js
const resolvedPromise = /*@__PURE__*/ Promise.resolve() as Promise<any>
let currentFlushPromise: Promise<void> | null = null

// 好简单的实现方案，fn放在Promise.then执行
export function nextTick<T = void, R = void>(
  this: T,
  fn?: (this: T) => R,
): Promise<Awaited<R>> {
  // 没那么简单，从currentFlushPromise下手
  const p = currentFlushPromise || resolvedPromise
  return fn ? p.then(this ? fn.bind(this) : fn) : p
}
```

我们可以看到源码的实现非常的简单，`currentFlushPromise`跟`resolvedPromise`都是一个`Promise`，`nextTick`只是把传入的`fn`放在`.then`微任务里去执行，达到一个异步执行的效果。

这就完事了？当然没这么简单！

让我们追踪一下`currentFlushPromise`的赋值，可以追踪出下列几个方法

```js
queueJob -> queueFlush -> flushJobs
```

下面我们一个个来看它们都干了些啥

### `queueJob`函数

```js
const queue: SchedulerJob[] = []

// 插入任务队列
export function queueJob(job: SchedulerJob): void {
  // 不为QUEUED，未进入队列
  if (!(job.flags! & SchedulerJobFlags.QUEUED)) {
    const jobId = getId(job) // 获取任务id
    const lastJob = queue[queue.length - 1] // 获取队列里的最后一个任务
    if (
      !lastJob || // 当前tick任务队列为空
      // fast path when the job id is larger than the tail
      // 当前任务id大于队列中最后一个任务的id，直接尾部插入队列
      (!(job.flags! & SchedulerJobFlags.PRE) && jobId >= getId(lastJob))
    ) {
      queue.push(job)
    } else {
      // 否则在对应大小位置插入
      queue.splice(findInsertionIndex(jobId), 0, job)
    }

    job.flags! |= SchedulerJobFlags.QUEUED

    queueFlush()
  }
}
```

从源码里可以看到，`queueJob` 就是维护了一个 `queue` 队列，目的是向 `queue` 队列中添加插入 `job` 对象，`job` 一般是指一个包含要执行的操作的任务对象，`job` 内部通常包含了类似 `effect.run` 这样需要执行的回调函数。

需要注意的是任务插入队列中是进行了`id`排序插入的，并且会对其状态进行`job.flags`判断

这里的id排序使用了二分查找，可以学习下它的思想

```js
// 传入id基于任务队列的任务id比较进行插入
function findInsertionIndex(id: number) {
  let start = flushIndex + 1
  let end = queue.length

  // 二分查找
  while (start < end) {
    // (start + end) >>> 1等价 Math.floor((start + end) / 2)
    const middle = (start + end) >>> 1
    const middleJob = queue[middle]
    const middleJobId = getId(middleJob)
    if (
      middleJobId < id ||
      // middleJobId === id时，PRE状态的值优先级更高，id需要插入更右侧
      (middleJobId === id && middleJob.flags! & SchedulerJobFlags.PRE)
    ) {
      start = middle + 1
    } else {
      end = middle
    }
  }

  return start
}
```

### `queueFlush`函数

当前没有正在进行的微任务队列，则把`flushJobs`推入微任务队列执行

```js
let currentFlushPromise: Promise<void> | null = null

function queueFlush() {
  if (!currentFlushPromise) {
    // 把flushJobs推入微任务队列执行
    currentFlushPromise = resolvedPromise.then(flushJobs)
  }
}
```

### `flushJobs`函数

看到这里，可以看出`Vue3`抛弃了之前`Vue2`的异步方案，只保留了Promise

`Vue2`：`Promise > MutationObserver > setImmediate > setTimeout`

`Vue3`通过`flushJobs`进行异步更新

- 遍历执行队列任务
- 执行完毕后重置队列
- 执行`postFlush`任务
- 如果还存在`queue`或`postFlush`任务就递归进行执行

```js
function flushJobs(seen?: CountMap) {
  if (__DEV__) {	// 忽略DEV场景判断
    seen = seen || new Map()
  }

  // conditional usage of checkRecursiveUpdate must be determined out of
  // try ... catch block since Rollup by default de-optimizes treeshaking
  // inside try-catch. This can leave all warning code unshaked. Although
  // they would get eventually shaken by a minifier like terser, some minifiers
  // would fail to do that (e.g. https://github.com/evanw/esbuild/issues/1610)
  const check = __DEV__
    ? (job: SchedulerJob) => checkRecursiveUpdates(seen!, job)
    : NOOP

  try {
    // 遍历queue执行队列内任务
    for (flushIndex = 0; flushIndex < queue.length; flushIndex++) {
      const job = queue[flushIndex]
      // 任务存在且未被销毁(不为DISPOSED)，继续执行
      if (job && !(job.flags! & SchedulerJobFlags.DISPOSED)) {
        if (__DEV__ && check(job)) {
          continue
        }
        // ALLOW_RECURSE允许递归
        if (job.flags! & SchedulerJobFlags.ALLOW_RECURSE) {
          // ~是指0001 -> 1110，这里指销毁QUEUED状态
          job.flags! &= ~SchedulerJobFlags.QUEUED
        }
        // 执行job
        callWithErrorHandling(
          job,
          job.i,
          job.i ? ErrorCodes.COMPONENT_UPDATE : ErrorCodes.SCHEDULER,
        )
        // 不允许递归的job在这里销毁QUEUED状态
        if (!(job.flags! & SchedulerJobFlags.ALLOW_RECURSE)) {
          job.flags! &= ~SchedulerJobFlags.QUEUED
        }
      }
    }
  } finally {
    // If there was an error we still need to clear the QUEUED flags
    for (; flushIndex < queue.length; flushIndex++) {
      const job = queue[flushIndex]
      if (job) {
        job.flags! &= ~SchedulerJobFlags.QUEUED
      }
    }
    // 任务执行完成后，重置相关变量
    flushIndex = -1
    queue.length = 0

    // postFlush任务执行，流程跟queue任务差不多
    flushPostFlushCbs(seen)

    currentFlushPromise = null
    // 如果存在未完成的queue任务或者postFlush任务，则继续执行flushJobs
    if (queue.length || pendingPostFlushCbs.length) {
      flushJobs(seen)
    }
  }
}
```

### `baseCreateRenderer`函数

最后，让我们看下`queueJob`函数的调用位置，追踪到`packages\runtime-core\src\renderer.ts`

```js
js 代码解读复制代码function baseCreateRenderer(
  options: RendererOptions,
  createHydrationFns?: typeof createHydrationFunctions,
): any {
  ...
  const setupRenderEffect: SetupRenderEffectFn = (...)=>{
  ...
    const update = (instance.update = effect.run.bind(effect))
    const job: SchedulerJob = (instance.job = effect.runIfDirty.bind(effect))
    job.i = instance
    job.id = instance.uid
    effect.scheduler = () => queueJob(job)
    ...
  }
  ...
}
```

看到这里是不是就清晰明了了，`queueJob`被赋值到`effect`的调度器，响应式对象发生改变后，执行`effect.run`，`trigger`触发副作用，如果存在`scheduler`则执行，并传入`effect`，这里的具体原理参考上篇文章：[Vue3源码解析之Ref、Effect](https://juejin.cn/post/7477424318438211611)



