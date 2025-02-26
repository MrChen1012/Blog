# 手摸手教你如何阅读vue3源码-reactive



### 前言

你是否曾想过，Vue3 中的 `reactive` 究竟是如何在幕后管理数据和视图更新的？本文将带你深入挖掘 Vue3 响应式系统的精髓，从源码中解开 `reactive` 的工作原理，帮助你在实际开发中更好地运用这一强大的功能。

学习 `reactive` 源码，你可以获得以下技能和知识：

1. 深入理解 JavaScript 中的 `Proxy` 和 `Reflect`，掌握它们的使用和优势。
2. 学会如何在响应式系统中追踪依赖，触发视图更新，实现 **发布订阅模式**。
3. 了解 Vue 如何处理深度嵌套的对象，并支持浅响应和深响应模式。
4. 学到性能优化的技巧，如何高效地管理依赖和更新。

### 基础步骤

##### 1. 拉取 Vue3 最新源码并运行

首先，拉取 Vue3 的源码并安装依赖：

```js
git clone git@github.com:vuejs/core.git

// 安装依赖
pnpm install
// 运行 运行完成后会有提示
// built: packages\vue\dist\vue.global.js
pnpm run dev
```

##### 2. 在源码目录 `packages/reactivity` 下创建 Demo

在源码目录下创建一个简单的 HTML 页面，引入 `vue.global.js`，并测试 `reactive`。

```html
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
        const { reactive } = Vue

        const obj = reactive({
            name: 'JiangJiang'
        })

        setTimeout(() => {
            obj.name = '帅哥-JiangJiang'
        }, 2000)
    </script>
</body>

</html>
```

##### 3. 断点创建`reactive`对象位置以及改变值的位置，快速过一遍，看看用到了源码中的哪些方法


![image-20250226162340745](https://github.com/user-attachments/assets/b2b9d295-92ea-466f-b2be-dd5cef6b9a4f)

![image-20250226162522948](https://github.com/user-attachments/assets/5dfe4ce4-cc98-4d8d-96d2-638797da5f25)


### 核心方法、类

#### 下面是创建 `reactive` 对象以及修改时所用到的关键方法和类，我们逐个解析，先了解完用到的方法，再去进行断点调试加深了解

#### 1.reactive创建对象阶段

```js
// packages\reactivity\src\reactive.ts

export function reactive<T extends object>(target: T): Reactive<T>
export function reactive(target: object) {
  // if trying to observe a readonly proxy, return the readonly version.
  if (isReadonly(target)) {
    return target
  }
  return createReactiveObject(
    target,
    false,
    mutableHandlers,
    mutableCollectionHandlers,
    reactiveMap,
  )
}
```

- 这里定义了reactive方法，先判断 target 是否为只读，只读属性则直接返回
- 否则return调用`createReactiveObject`方法

#### 2.createReactiveObject函数

```js
function createReactiveObject(
  target: Target,  // 目标对象
  isReadonly: boolean,  // 是否是只读模式
  baseHandlers: ProxyHandler<any>,  // 基础对象的 Proxy 处理器
  collectionHandlers: ProxyHandler<any>,  // 集合类型的 Proxy 处理器 如 Map、Set、WeakMap
  proxyMap: WeakMap<Target, any>  // 存储 Proxy 对象的 Map，防止重复创建
) {
  // 1. 如果目标不是对象，则直接返回原值
  if (!isObject(target)) {
    if (__DEV__) {
      warn(
        `value cannot be made ${isReadonly ? 'readonly' : 'reactive'}: ${String(
          target,
        )}`  
      )
    }
    return target  
  }

  // 2. 如果目标已经是 Proxy 对象，直接返回
  if (
    target[ReactiveFlags.RAW] &&  
    !(isReadonly && target[ReactiveFlags.IS_REACTIVE])  
  ) {
    return target  
  }

  // 3. 判断目标对象类型
  const targetType = getTargetType(target)  // 获取目标对象的类型（普通对象或集合）
  if (targetType === TargetType.INVALID) {  // 如果是无效类型（如函数或原始类型），直接返回
    return target
  }

  // 4. 如果目标对象已经有对应的 Proxy，直接返回现有的 Proxy
  const existingProxy = proxyMap.get(target)  
  if (existingProxy) {
    return existingProxy  
  }

  // 5. 创建新的 Proxy 实例
  const proxy = new Proxy(
    target,  
    targetType === TargetType.COLLECTION ? collectionHandlers : baseHandlers  // 根据对象类型选择不同的 Proxy 处理器
  )

  // 6. 将新的 Proxy 缓存到 proxyMap
  proxyMap.set(target, proxy)  

  return proxy  
}
```

##### createReactiveObject函数的主要目的是：

- **检查目标对象是否有效**：只有对象可以变成响应式，如果传入的是非对象类型的值（比如原始值），函数会返回原值。
- **避免重复创建响应式对象**：如果目标对象已经是一个 `Proxy`，则直接返回它。
- **为目标对象创建 `Proxy`**：根据不同的目标类型（普通对象或集合对象），为其创建一个新的 `Proxy` 实例。

#### 3.小讲下createReactiveObject函数中const targetType = getTargetType(target)

```js
function getTargetType(value: Target) {
  return value[ReactiveFlags.SKIP] || !Object.isExtensible(value)
    ? TargetType.INVALID
    : targetTypeMap(toRawType(value))
}

function targetTypeMap(rawType: string) {
  switch (rawType) {
    case 'Object':
    case 'Array':
      return TargetType.COMMON
    case 'Map':
    case 'Set':
    case 'WeakMap':
    case 'WeakSet':
      return TargetType.COLLECTION
    default:
      return TargetType.INVALID
  }
}
```

- 这段代码主要用于确定目标对象的类型，并通过不同类型的判断返回相应的类型标识。它通过 `getTargetType` 函数来获取目标对象的类型，然后根据类型返回不同的响应式处理方式。
- 在创建`Proxy `实例时，会根据targetType的值去决定创建的是基础对象的 Proxy 处理器还是集合类型的 Proxy 处理器

#### 5.再去回顾下reactive方法

```js
export function reactive(target: object) {
  // if trying to observe a readonly proxy, return the readonly version.
  if (isReadonly(target)) {
    return target
  }
  return createReactiveObject(
    target,
    false,
    mutableHandlers,
    mutableCollectionHandlers,
    reactiveMap,
  )
}
```

##### 在调用createReactiveObject时进行了传参，因为我们定义的对象是普通对象，基于createReactiveObject函数里的创建proxy场景，可发现最终创建Proxy对象的处理器是mutableHandlers

```js
  const proxy = new Proxy(
    target,  
    // 根据对象类型选择不同的 Proxy 处理器
    targetType === TargetType.COLLECTION ? collectionHandlers : baseHandlers
  )
```

#### 6.mutableHandlers方法

这时候文件来到了`baseHandlers.ts`，根据源码我们可以发现`mutableHandlers`方法返回了`MutableReactiveHandler`类的一个实例

```js
// packages\reactivity\src\baseHandlers.ts

// 创建了个MutableReactiveHandler示例
export const mutableHandlers: ProxyHandler<object> =
  /*@__PURE__*/ new MutableReactiveHandler()
```

#### 7.MutableReactiveHandler类

```js

class MutableReactiveHandler extends BaseReactiveHandler {
  constructor(isShallow = false) {
    super(false, isShallow)
  }

  set(
    target: Record<string | symbol, unknown>,
    key: string | symbol,
    value: unknown,
    receiver: object,
  ): boolean {
    let oldValue = target[key]
    if (!this._isShallow) {
      const isOldValueReadonly = isReadonly(oldValue)
      if (!isShallow(value) && !isReadonly(value)) {
        oldValue = toRaw(oldValue)
        value = toRaw(value)
      }
      if (!isArray(target) && isRef(oldValue) && !isRef(value)) {
        if (isOldValueReadonly) {
          return false
        } else {
          oldValue.value = value
          return true
        }
      }
    } else {
      // in shallow mode, objects are set as-is regardless of reactive or not
    }

    const hadKey =
      isArray(target) && isIntegerKey(key)
        ? Number(key) < target.length
        : hasOwn(target, key)
    const result = Reflect.set(
      target,
      key,
      value,
      isRef(target) ? target : receiver,
    )
    // don't trigger if target is something up in the prototype chain of original
    if (target === toRaw(receiver)) {
      if (!hadKey) {
        trigger(target, TriggerOpTypes.ADD, key, value)
      } else if (hasChanged(value, oldValue)) {
        trigger(target, TriggerOpTypes.SET, key, value, oldValue)
      }
    }
    return result
  }

  deleteProperty(
    target: Record<string | symbol, unknown>,
    key: string | symbol,
  ): boolean {
    const hadKey = hasOwn(target, key)
    const oldValue = target[key]
    const result = Reflect.deleteProperty(target, key)
    if (result && hadKey) {
      trigger(target, TriggerOpTypes.DELETE, key, undefined, oldValue)
    }
    return result
  }

  has(target: Record<string | symbol, unknown>, key: string | symbol): boolean {
    const result = Reflect.has(target, key)
    if (!isSymbol(key) || !builtInSymbols.has(key)) {
      track(target, TrackOpTypes.HAS, key)
    }
    return result
  }

  ownKeys(target: Record<string | symbol, unknown>): (string | symbol)[] {
    track(
      target,
      TrackOpTypes.ITERATE,
      isArray(target) ? 'length' : ITERATE_KEY,
    )
    return Reflect.ownKeys(target)
  }
}
```

##### 下面对里面的各个方法进行详解

#### 8.`set` 方法

```js
set(
  target: Record<string | symbol, unknown>,  // 目标对象
  key: string | symbol,                      // 目标属性
  value: unknown,                            // 新的属性值
  receiver: object,                          // 接收者对象（通常是 Proxy）
): boolean {
  let oldValue = target[key]  // 获取当前属性的旧值

  if (!this._isShallow) {  // 如果不是浅响应，进行深层响应的处理
    const isOldValueReadonly = isReadonly(oldValue)  // 判断旧值是否是只读的

    if (!isShallow(value) && !isReadonly(value)) {  // 如果新值和旧值都不是浅层响应和只读
      oldValue = toRaw(oldValue) 
      value = toRaw(value) 
    }

    if (!isArray(target) && isRef(oldValue) && !isRef(value)) {  // 如果旧值是 ref 类型而新值不是 ref
      if (isOldValueReadonly) {  // 如果旧值是只读的，直接返回 false
        return false
      } else {
        oldValue.value = value  // 更新 ref 的值
        return true
      }
    }
  }

  // 判断目标对象是否已经存在该属性
  const hadKey = 
    isArray(target) && isIntegerKey(key)  // 如果是数组且 key 是有效索引
      ? Number(key) < target.length       // 判断索引是否小于数组的长度
      : hasOwn(target, key)  // 检查该属性是否存在于目标对象上

  // 使用 Reflect.set 执行属性赋值
  const result = Reflect.set(
    target,
    key,
    value,
    isRef(target) ? target : receiver,  // 如果目标对象是 ref，则传入目标对象，否则传入接收者
  )

  // 如果目标对象没有被代理（即没有包装成 Proxy）
  if (target === toRaw(receiver)) {
    if (!hadKey) {
      // 如果属性是新增的，触发 ADD 操作
      trigger(target, TriggerOpTypes.ADD, key, value)
    } else if (hasChanged(value, oldValue)) {
      // 如果属性值发生变化，触发 SET 操作
      trigger(target, TriggerOpTypes.SET, key, value, oldValue)
    }
  }
  return result
}
```

拦截对象的属性修改操作，这个方法处理了深响应和浅响应的逻辑，确保在修改对象属性时能够更新视图。

#### 9.`deleteProperty` 方法

```js
deleteProperty(
  target: Record<string | symbol, unknown>,  // 目标对象
  key: string | symbol,                      // 要删除的属性
): boolean {
  const hadKey = hasOwn(target, key)  // 检查目标对象是否包含该属性
  const oldValue = target[key]       // 获取删除前的旧值
  const result = Reflect.deleteProperty(target, key)  // 执行删除操作

  if (result && hadKey) {
    // 如果删除操作成功且属性确实存在
    trigger(target, TriggerOpTypes.DELETE, key, undefined, oldValue)
  }
  return result
}
```

拦截对象属性的删除操作。当某个属性被删除时，需要进行依赖更新。

#### 10.`has` 方法

```js
has(target: Record<string | symbol, unknown>, key: string | symbol): boolean {
  const result = Reflect.has(target, key)  // 判断目标对象是否包含该属性
  if (!isSymbol(key) || !builtInSymbols.has(key)) {
    // 如果 key 不是内建的 Symbol，则进行依赖追踪
    track(target, TrackOpTypes.HAS, key) 
  }
  return result  // 返回 Reflect.has 的结果
}
```

拦截对象的 `has` 操作（如 `key in target`）。在检查目标对象是否包含某个属性时，进行依赖追踪。

#### 11.`ownKeys` 方法

```js
ownKeys(target: Record<string | symbol, unknown>): (string | symbol)[] {
  track(
    target,
    TrackOpTypes.ITERATE,
    isArray(target) ? 'length' : ITERATE_KEY,  // 如果是数组，则跟踪 'length'，否则跟踪 ITERATE_KEY
  )
  return Reflect.ownKeys(target)  // 获取目标对象的所有属性键
}
```

拦截对象的 `ownKeys` 操作（如 `Object.keys(target)`）。当获取对象的属性键时，进行依赖追踪。

### 总结与思考

通过上述代码，我们了解了 Vue3 如何通过 `Proxy` 和 `Reflect` 实现响应式数据的追踪与更新。`reactive` 方法通过创建代理对象，能够监听对象属性的变化，并自动触发视图更新。

下篇文章我们将对MutableReactiveHandler类所用到的toRaw、track、trigger方法进行讲解，捋清vue3发布订阅模式的思路，以及正式在浏览器中断点调试创建`reactive`对象位置以及改变值的流程
