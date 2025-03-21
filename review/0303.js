// 手写一个简单响应式原理思路(不考虑边界情况)：

// 1. 创建 `reactive`，返回一个 `Proxy` 处理器
// 2. 定义 `createReactiveObject` 方法，传参 `target`、`baseHandlers`
// 3. `baseHandlers` 里面定义 `has`、`get`、`set`、`delete` 基本方法
// 4. 通过 `track`、`trigger` 去实现发布订阅
// 5. 通过 `effect` 创建副作用函数，并使其能够在依赖发生变化时重新执行

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
