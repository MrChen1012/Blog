// 复习之前手写js源码内容

// 数据类型判断
function typeOf(obj) {
    return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase()
}

// 寄生组合式继承
function Parent() {
    this.name = 'parent'
}
Parent.prototype.skill = function () {
    return '开发'
}

function Child() {
    this.age = 18
    Parent.call(this)
}

Child.prototype = Object.create(Parent.prototype)
Child.prototype.constructor = Child

const child = new Child()

// 实现数组扁平化
function flatten(arr) {
    return arr.reduce((result, item, index) => {
        return result.concat(Array.isArray(item) ? flatten(item) : item)
    }, [])
}

// 深拷贝 只考虑普通对象不考虑系统对象
function deepClone(obj, map = new WeakMap()) {
    if (typeof obj !== 'object') return obj

    if (map.has(obj)) return map.get(obj)

    const result = Array.isArray(obj) ? [] : {}

    map.set(obj, result)

    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            result[key] = Array.isArray(obj[key]) ? deepClone(obj[key]) : obj[key]
        }
    }

    return result
}

// 发布订阅模式  订阅方法  发布方法  解除方法
class EventMitter {
    constructor() {
        this.task = {}
    }

    on(key, fn) {
        if (!this.task[key]) this.task[key] = []
        this.task[key].push(fn)
    }

    off(key) {
        delete this.task[key]
    }

    emit(key, ...arg) {
        if (!this.task[key]) return
        this.task[key].forEach(fn => fn(...arg))
    }
}

// 防抖
function debounce(fn, timer) {
    let time = null
    return function (...args) {
        const that = this
        clearTimeout(time)
        time = setTimeout(() => {
            fn.apply(that, args)
        }, timer)
    }
}

// 节流 一段时间执行一次
function throttle(fn, time) {
    let lastTime = +new Date()
    return function (...args) {
        const now = +new Date()
        if (now - lastTime >= time) {
            fn.apply(this, args)
        }
    }
}

// 函数柯里化 实现curry函数
function add(a, b, c) {
    return a + b + c
}
add(1, 2, 3)
let addCurry = curry(add)
addCurry(1)(2)(3)

// curry 柯里化
function curry(fn) {
    function curryChild(...args) {
        if (args.length >= fn.length) {
            return fn(...args)
        } else {
            return (...arg) => curryChild(...args, ...arg)
        }
    }

    return curryChild
}

// 实现forEach
/**
 * 原理 循环
 * 参数有2个
 * 需要改变this保持上下文
 */
Array.prototype.myForEach = function (fn, thisArg) {
    const len = this.length >>> 0
    let k = 0
    while (k < len) {
        if (k in this) {
            fn.call(thisArg, this[k], k, this)
        }
        k++
    }
}

// 手动实现call
Function.prototype.myCall = function (context, args) {
    context = context || globalThis
    const fn = Symbol('fn')
    context[fn] = this

    const result = context[fn](...args)

    delete context[fn]

    return result
}
