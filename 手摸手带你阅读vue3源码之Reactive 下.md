# 手摸手教你如何阅读vue3源码-reactive



## 前言

你是否曾想过，Vue3 中的 `reactive` 究竟是如何在幕后管理数据和视图更新的？本文将带你深入挖掘 Vue3 响应式系统的精髓，从源码中解开 `reactive` 的工作原理，帮助你在实际开发中更好地运用这一强大的功能。

##### 学习 `reactive` 源码，你可以获得以下技能和知识：

1. **深入理解 JavaScript 中的 `Proxy` 和 `Reflect`**，掌握它们的使用方法及优势。
2. **掌握响应式系统的依赖追踪与视图更新**，即 **发布订阅模式**。
3. **处理深度嵌套对象**，并理解如何支持浅响应和深响应模式。
4. **性能优化技巧**，如何高效管理依赖和更新。

**上期文章**讲解了创建 `reactive` 对象以及修改时用到的方法和类，本期我们将深入 `MutableReactiveHandler` 类中的一些小方法。

### 1.追踪到 `packages/reactivity/src/dep.ts` 文件

该文件包含了 Vue 3 响应式系统的核心部分，主要负责依赖收集与触发机制。它实现了 **发布订阅模式**，通过 `Dep` 和 `链接` 类来管理数据与视图的更新关系。下面逐步讲解文件中的关键部分和它们在发布订阅模式中的作用。

### 2.`链接` 类解析

```js
export class Link {
  version: number
  nextDep?: Link
  prevDep?: Link
  nextSub?: Link
  prevSub?: Link
  prevActiveLink?: Link

  constructor(public sub: Subscriber, public dep: Dep) {
    this.version = dep.version
    this.nextDep =
      this.prevDep =
      this.nextSub =
      this.prevSub =
      this.prevActiveLink =
        undefined
  }
}

```

- `链接` 类表示一个 **订阅者**（`sub`）与一个 **依赖**（`dep`）之间的关联。
- `version`：记录依赖的版本号，在每次依赖变更时更新，用于确保只在数据发生变化时才触发视图更新。
- `nextDep` 和 `prevDep`：在 `Dep` 类中形成一个 **双向链表**，用于跟踪订阅者的依赖关系。
- `nextSub` 和 `prevSub`：在订阅者（`Effect`）之间形成双向链表，方便管理每个订阅者的依赖关系。

**总结**：`链接` 是 `Dep`（依赖）和 `Effect`（订阅者）之间的 **桥梁**，它维护着 **依赖和订阅者的关系**，并通过链表连接。

### 3.`Dep` 类解析

```js
export class Dep {
  version = 0  // 依赖版本，数据变化时增加
  activeLink?: Link = undefined  // 当前激活的 Link
  subs?: Link = undefined  // 订阅者链表
  subsHead?: Link  // 订阅者链表头部（用于开发调试时）
  map?: KeyToDepMap = undefined  // 依赖的 map，用于对象属性
  key?: unknown = undefined  // 当前依赖的 key（属性名）
  sc: number = 0  // 订阅者计数

  constructor(public computed?: ComputedRefImpl | undefined) {
    if (__DEV__) {
      this.subsHead = undefined  // 仅开发环境初始化
    }
  }

  track(debugInfo?: DebuggerEventExtraInfo): Link | undefined {
    if (!activeSub || !shouldTrack || activeSub === this.computed) {
      return
    }

    let link = this.activeLink
    if (link === undefined || link.sub !== activeSub) {
      link = this.activeLink = new Link(activeSub, this)

      // 将 link 添加到当前 activeEffect 的依赖链表尾部
      if (!activeSub.deps) {
        activeSub.deps = activeSub.depsTail = link
      } else {
        link.prevDep = activeSub.depsTail
        activeSub.depsTail!.nextDep = link
        activeSub.depsTail = link
      }

      addSub(link)  // 将 link 添加到 dep 的订阅者链表中
    } else if (link.version === -1) {
      link.version = this.version

      // 如果 link 已经存在，调整它在链表中的位置（确保依赖访问顺序）
      if (link.nextDep) {
        const next = link.nextDep
        next.prevDep = link.prevDep
        if (link.prevDep) {
          link.prevDep.nextDep = next
        }

        link.prevDep = activeSub.depsTail
        link.nextDep = undefined
        activeSub.depsTail!.nextDep = link
        activeSub.depsTail = link

        if (activeSub.deps === link) {
          activeSub.deps = next
        }
      }
    }

    // 在开发模式下，调用 track 钩子
    if (__DEV__ && activeSub.onTrack) {
      activeSub.onTrack(extend({ effect: activeSub }, debugInfo))
    }

    return link
  }

  trigger(debugInfo?: DebuggerEventExtraInfo): void {
    this.version++  // 增加版本号
    globalVersion++  // 增加全局版本号
    this.notify(debugInfo)  // 通知所有订阅者
  }

  notify(debugInfo?: DebuggerEventExtraInfo): void {
    startBatch()  // 批量更新开始
    try {
      if (__DEV__) {
        // 反向通知所有订阅者
        for (let head = this.subsHead; head; head = head.nextSub) {
          if (head.sub.onTrigger && !(head.sub.flags & EffectFlags.NOTIFIED)) {
            head.sub.onTrigger(extend({ effect: head.sub }, debugInfo))
          }
        }
      }

      // 通知所有订阅者更新
      for (let link = this.subs; link; link = link.prevSub) {
        if (link.sub.notify()) {
          // 如果是计算属性，通知它的依赖更新
          (link.sub as ComputedRefImpl).dep.notify()
        }
      }
    } finally {
      endBatch()  // 批量更新结束
    }
  }
}

```

- `Dep` 代表数据的依赖管理类，维护了对某个响应式数据属性的所有订阅者（`Effect`）。
- `track()`：收集依赖，建立 `Dep` 与 `Effect` 之间的关联。
- `trigger()`：当数据发生变化时，调用 `trigger()` 更新所有订阅者。
- `notify()`：通知订阅者执行更新操作，例如重新渲染。

### 4.`addSub` 函数

```js
function addSub(link: Link) {
  link.dep.sc++  // 增加订阅者计数
  if (link.sub.flags & EffectFlags.TRACKING) {
    const computed = link.dep.computed
    if (computed && !link.dep.subs) {
      computed.flags |= EffectFlags.TRACKING | EffectFlags.DIRTY
      // 如果是计算属性，递归添加其依赖
      for (let l = computed.deps; l; l = l.nextDep) {
        addSub(l)
      }
    }

    const currentTail = link.dep.subs
    if (currentTail !== link) {
      link.prevSub = currentTail
      if (currentTail) currentTail.nextSub = link
    }

    if (__DEV__ && link.dep.subsHead === undefined) {
      link.dep.subsHead = link
    }

    link.dep.subs = link  // 将订阅者添加到依赖的订阅链表
  }
}

```

- 将 `链接` 添加到 `Dep` 的订阅者链表中。
- 计算属性（`computed`）在首次订阅时需要递归订阅其所有依赖。
- 维护双向链表，确保订阅者可以在依赖发生变化时被通知。

### 5.`track` 和 `trigger` 结合：发布订阅模式

```js
export function track(target: object, type: TrackOpTypes, key: unknown): void {
  if (shouldTrack && activeSub) {
    let depsMap = targetMap.get(target)
    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()))  // 初始化 target 的 depsMap
    }
    let dep = depsMap.get(key)
    if (!dep) {
      depsMap.set(key, (dep = new Dep()))  // 初始化 dep
      dep.map = depsMap
      dep.key = key
    }
    dep.track()  // 记录依赖
  }
}

export function trigger(
  target: object,
  type: TriggerOpTypes,
  key?: unknown,
  newValue?: unknown,
  oldValue?: unknown,
  oldTarget?: Map<unknown, unknown> | Set<unknown>,
): void {
  const depsMap = targetMap.get(target)
  if (!depsMap) {
    globalVersion++  // 如果没有找到依赖，增加全局版本号
    return
  }

  const run = (dep: Dep | undefined) => {
    if (dep) {
      dep.trigger()  // 触发依赖更新
    }
  }

  startBatch()  // 批量更新开始

  if (type === TriggerOpTypes.CLEAR) {
    // 如果是清除操作，通知所有依赖更新
    depsMap.forEach(run)
  } else {
    const targetIsArray = isArray(target)
    const isArrayIndex = targetIsArray && isIntegerKey(key)

    if (targetIsArray && key === 'length') {
      const newLength = Number(newValue)
      depsMap.forEach((dep, key) => {
        // 数组长度变化时，通知所有依赖更新
        if (key === 'length' || key === ARRAY_ITERATE_KEY || key >= newLength) {
          run(dep)
        }
      })
    } else {
      // 根据不同类型的操作通知相关依赖
      if (key !== void 0 || depsMap.has(void 0)) {
        run(depsMap.get(key))
      }

      if (isArrayIndex) {
        run(depsMap.get(ARRAY_ITERATE_KEY))
      }
    }
  }

  endBatch()  // 批量更新结束
}

```

- `track()`：用于记录数据的访问，建立 `target`（目标对象）到 `Dep`（依赖）之间的关系，确保数据变化时能够触发更新。
- `trigger()`：当数据变化时，触发所有相关的订阅者（`Effect`）更新。

### 除了发布订阅核心方法外，前面的MutableReactiveHandler类还用到了toRaw以及Reflect，我们也看来看看其作用

### 6.toRaw函数 返回响应式对象原始值

```js
export function toRaw<T>(observed: T): T {
  const raw = observed && (observed as Target)[ReactiveFlags.RAW]
  return raw ? toRaw(raw) : observed
}
```

`toRaw<T>(observed: T): T`：

- 这是一个泛型函数，接受一个 `observed` 参数，它是一个响应式对象

`const raw = observed && (observed as Target)[ReactiveFlags.RAW]`：

- 首先检查 `observed` 是否存在
- 然后通过类型断言 `(observed as Target)` 将 `observed` 强制转换为 `Target` 类型，这个类型是 Vue 3 响应式系统中定义的原始数据类型。
- `[ReactiveFlags.RAW]` 是 Vue 3 中定义的一个常量，它用来标记响应式对象的原始数据。每个响应式对象都在其内部存储了一个标记为 `RAW` 的属性，指向该对象的原始数据。

`return raw ? toRaw(raw) : observed`：

- 如果 `raw` 存在，说明 `observed` 是一个响应式对象，`raw` 是它对应的原始对象。此时会递归调用 `toRaw(raw)`，继续向上解开代理，直到找到原始对象为止。
- 如果 `raw` 不存在，说明 `observed` 本身就是原始对象，直接返回它。

### 7.为什么 `Proxy` 中使用 `Reflect`

首先需要先了解`Reflect`如何使用，传送门：[Reflect](https://link.juejin.cn/?target=https%3A%2F%2Fdeveloper.mozilla.org%2Fzh-CN%2Fdocs%2FWeb%2FJavaScript%2FReference%2FGlobal_Objects%2FReflect)

**`Reflect` 和 `Proxy` 的关系**

- **`Proxy`** 用于拦截对象操作，允许你定义自定义的行为来替代默认的操作（如 `get`、`set` 等）。
- **`Reflect`** 提供了与 `Proxy` 方法对应的操作方法，允许你在 `Proxy` 中执行默认的目标对象操作，并确保这些操作的一致性和可靠性。

`Proxy` 经常用来拦截对象的操作（例如 `get`、`set`）。为了确保 `Proxy` 的拦截行为与原生 JavaScript 对象的行为一致，Vue 会在 `Proxy` 的 `handler` 方法中调用 `Reflect` 方法来执行实际的对象操作。

例如：

```js
const handler = {
  get(target, prop, receiver) {
    // 通过 Reflect.get 调用目标对象的 get 方法
    return Reflect.get(...arguments);
  },
  set(target, prop, value, receiver) {
    // 通过 Reflect.set 调用目标对象的 set 方法
    return Reflect.set(...arguments);
  }
};
```

**总结**

- **`Proxy`** 是用来拦截和定制对象操作的，而 **`Reflect`** 是用来执行目标对象的原生操作的。
- `Proxy` 和 `Reflect` 提供了相互补充的功能，`Proxy` 用来拦截和定制行为，而 `Reflect` 用来执行实际的操作。
- `Proxy` 用于实现响应式对象的拦截，而 `Reflect` 用来确保目标对象的操作一致性和可靠性。



## 断点调试（超详细图解）

### 创建`reactive`对象

1.从创建`reactive`对象开始

![image-20250227104242439](https://github.com/user-attachments/assets/b6442f9c-1e88-4a12-86db-c29bb902767f)


2.进入`reactive`方法里，可以看到我们的target已经赋值了原始对象

![image-20250227104436499](https://github.com/user-attachments/assets/c30eb70c-9d1f-4791-84ae-40a71fe9b7f7)


3.判断完对象为可读后，进入到`createReactiveObject`方法，我们看看此时的参数赋值了什么

![image-20250227104628108](https://github.com/user-attachments/assets/c94261b8-d8b7-45aa-a687-d16a212fc1e1)


4.判断`target`为正常对象且此时还不是`Proxy`对象时，进入到`getTargetType`方法，进行类型判断

![image-20250227104917876](https://github.com/user-attachments/assets/15f8bb3c-1bca-4439-ad81-990ef5c87fc7)


5.经过了对象判断，进入到`targetTypeMap`方法，判断为普通对象类型，输出`TargetType.COMMON`

![image-20250227105124330](https://github.com/user-attachments/assets/9524fd49-a654-453f-8d9e-20020ad32edd)


6.判断对象是否已经存在对应的`Proxy`了，有的话则返回

![image-20250227105341329](https://github.com/user-attachments/assets/8a1b5dc1-cd4c-48bd-8944-4b6c27a69a3a)


7.经过重重判断后，终于创建成功了新的`Proxy`实例，并将新的`Proxy`缓存到`proxyMap`

![image-20250227105656222](https://github.com/user-attachments/assets/cd1d374c-2b17-4675-a62c-0d905ba61cf4)


### 改变`reactive`对象

1.从修改`reactive`对象开始

![image-20250227110022083](https://github.com/user-attachments/assets/a2a6c2f8-fb84-426a-8ac6-a002d06cefd0)


2.进入到`MutableReactiveHandler`类中，先看参数赋值，这一步获取当前属性的旧值

`MutableReactiveHandler`类上面文章详讲过，不了解的前往：[手摸手带你阅读Vue3源码之Reactive 上](https://juejin.cn/post/7475607042527821864)

![image-20250227110249466](https://github.com/user-attachments/assets/db912faa-6f72-400f-be75-98933daafb3d)


3.进入**非浅响应**判断，先获取旧值是否只读

![image-20250227111144129](https://github.com/user-attachments/assets/7e6c8df1-ef3e-4a89-9d4a-70ed0d61d36e)


4.进入**新值和旧值都不是浅层响应和只读**的判断，并且把旧值跟新值的原始值存起来

![image-20250227111304304](https://github.com/user-attachments/assets/5ee47a5b-7124-4ab2-af24-22632832f3a9)


![image-20250227111424039](https://github.com/user-attachments/assets/56ce8df3-2d37-4b4c-a2bf-425b9d2136fc)


5.下个判断为**如果旧值是 ref 类型而新值不是 ref**，不符合条件，跳过到下一步

6.判断目标对象是否已经存在该属性

![image-20250227112229870](https://github.com/user-attachments/assets/72403087-f3e3-480f-ad7e-caffa3473e8f)


7.使用 Reflect.set 执行属性赋值

![image-20250227112332922](https://github.com/user-attachments/assets/4a68b020-d747-49c7-b189-532c137505b2)


8.进入下一个判断**如果目标对象没有被代理（即没有包装成 Proxy）**

![image-20250227112441454](https://github.com/user-attachments/assets/19b48cfb-2ec1-47ac-bf5f-626acc4bf329)


9.已有属性值，并且属性值发生变化，触发 SET 操作

![image-20250227112737860](https://github.com/user-attachments/assets/e48925cd-1ef2-4985-83d8-6802ba859129)


10.进入到`trigger`函数中，先看传参值，这一步从从全局 `targetMap` 获取当前 `target` 对象的 `depsMap`

![image-20250227112909479](https://github.com/user-attachments/assets/1ef43d2c-03be-4777-87ec-1a3dd2fe6c70)


11.`target` 没有被追踪过，直接返回，增加全局版本号

![image-20250227113510191](https://github.com/user-attachments/assets/6640bc44-1a6f-4af0-82d9-b24c8d9db92b)


12.return出`trigger`函数，回到`MutableReactiveHandler`类的`set`方法，返回`true`修改完毕

![image-20250227113651159](https://github.com/user-attachments/assets/cccbce23-f109-4d41-9622-e5e48c150305)


### 总结

- `reactive` 函数实际上调用了 `createReactiveObject` 方法。
- `createReactiveObject` 负责创建一个 `proxy` 实例，并为代理对象添加 `getter` 和 `setter` 行为，这些行为是在 `mutableHandlers` 对象中定义的。
- 在改变属性时，会触发`MutableReactiveHandler`中的`set`方法
- 当新值被设置时，`set` 方法会触发 `trigger` 函数，进而触发依赖的更新
- 在 `trigger` 中，从 `targetMap` 中根据目标对象和属性名（`key`）获取对应的副作用函数，然后执行该函数，从而完成依赖的触发。
- 在 `trigger` 中，从 `targetMap` 中根据目标对象和属性名（`key`）获取对应的副作用函数，然后执行该函数，从而完成依赖的触发。
- `reactive` 的不足之处：首先，解构后的对象不再具备响应性；其次，`reactive` 只支持对象类型的响应式，不支持基本数据类型。

