// 0220 js学习

// 手动实现一个call
/**
 * 思路：
 * this调用 this指调用对象
 * 传入一个或多个参数 不传参时为window
 * 改变this指向后调用fn
 * */

Function.prototype.myCall = function (context, ...args) {
    // 可能不传参，不传时为window
    context = context || window
    let fn = Symbol('fn')
    context[fn] = this
    const result = context[fn](...args)
    delete context[fn]
    return result
}

// 手动实现一个apply 思路跟call基本一致 传参为数组
Function.prototype.myApply = function (context, args = []) {
    context = context || globalThis
    const fn = Symbol('fn')
    context[fn] = this

    const result = context[fn](...args)
    delete context[fn]
    return result
}

// 手动实现一个bind 返回值为函数 调用时才生效 传参跟之前call apply一致
Function.prototype.myBind = function (context, ...args) {
    const that = this

    const fnC = function (...argsC) {
        return that.apply(this instanceof fnC ? this : context, [...args, ...argsC])
    }

    fnC.prototype = Object.create(this.prototype)
    return fnC
}

// 手动实现new关键词
/**
 * 1 创建一个空对象
 * 2 空对象的原型指向构造函数的原型
 * 3 执行构造函数 并this指向空对象
 * 4 如果构造函数没有返回值 则返回空对象
 */

function myNew(constructor, ...args) {
    const obj = {}
    obj.__proto__ = constructor.prototype
    const result = constructor.apply(obj, args)

    return result instanceof Object ? result : obj
}

// 实现一个promise
/**
 * 1 then需要支持链式调用 返回一个新的promise
 * 2 promise 三个状态 pending fulfilled rejected 状态不可逆 单向
 * 3 promise 使用时需要new出来，说明它是一个构造函数
 * 4 promise 接受一个函数，且在new Promise() 时立即执行
 */

class NewPromise {
    // 根据Promise/A+规范 定义状态值
    static PENDING = '待定'
    static FULFILLED = '解决'
    static REJECT = '拒绝'
    constructor(fn) {
        this.result = null // 定义结果值
        this.status = NewPromise.PENDING // 定义初始状态
        // 创建成功/失败数组存储成功/失败回调
        this.resolveCallback = []
        this.rejectCallback = []
        fn(this.resolve, this.reject) // new后立即调用 传入方法执行
    }
    // 定义成功方法
    resolve = result => {
        // 添加定时器，确保resolve是在事件循环末尾执行
        setTimeout(() => {
            // 状态单向不可逆，所以只有PENDING状态才能继续执行代码
            if (this.status !== NewPromise.PENDING) return
            this.status = NewPromise.FULFILLED
            this.result = result
            this.resolveCallback.forEach(callback => {
                callback(result)
            })
        })
    }
    // 定义失败方法
    reject = result => {
        setTimeout(() => {
            if (this.status !== NewPromise.PENDING) return
            this.status = NewPromise.REJECT
            this.result = result
            this.rejectCallback.forEach(callback => {
                callback(result)
            })
        })
    }
    // 定义then方法,then方法还需要返回个promise对象
    then = (onResolve, onReject) => {
        // 根据规范，如果then的参数不是function，则我们需要忽略它, 让链式调用继续往下执行
        typeof onResolve !== 'function' ? (onResolve = value => value) : null
        typeof onReject !== 'function'
            ? (onReject = reason => {
                  throw new Error(reason instanceof Error ? reason.message : reason)
              })
            : null

        return new NewPromise((resolve, reject) => {
            // 处理下成功 失败回调
            const resolveFn = res => {
                try {
                    const x = onResolve(res)
                    x instanceof NewPromise ? x.then(resolve, reject) : resolve(x)
                } catch (error) {
                    reject(error)
                }
            }
            const rejectFn = err => {
                try {
                    const x = onReject(err)
                    x instanceof NewPromise ? x.then(resolve, reject) : resolve(x)
                } catch (error) {
                    reject(error)
                }
            }

            // 根据状态使用对应方法
            switch (this.status) {
                // 添加PEDDING状态处理 把成功失败回调添加进列表
                case NewPromise.PENDING:
                    this.resolveCallback.push(resolveFn)
                    this.rejectCallback.push(rejectFn)
                    break

                case NewPromise.FULFILLED:
                    setTimeout(() => {
                        onResolve()
                    })
                    break

                case NewPromise.REJECT:
                    setTimeout(() => {
                        onReject()
                    })
                    break
            }
        })
    }
}

// 手动实现一个深拷贝 使用weakmap去进行数据修改
function deepClone(obj, map = new WeakMap()) {
    if (typeof obj !== 'object') return obj

    if (map.has(obj)) return map.get(obj)

    const isArray = Array.isArray(obj) || Object.prototype.toString(obj) === '[object Array]'

    const result = isArray ? [] : {}

    map.set(obj, result)

    const iteratorArray = isArray ? obj : Object.keys(obj)

    iteratorArray.forEach((val, key) => {
        if (!isArray) key = val
        result[key] = deepClone(obj[key], map)
    })

    return result
}
