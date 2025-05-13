// 0219 10：41

// 类型判断 typeof无法判断复杂类型 Object.prototype.toString可判断复杂类型
const a = {}
console.log(typeof a, Object.prototype.toString(a))

// 组合继承
function Animal(name) {
  this.name = name
  this.colors = ['black', 'white']
}

Animal.prototype.getName = function () {
  return this.name
}

function Dog(name, age) {
  Animal.call(this, name)
  this.age = age
}

// Dog.prototype = new Animal()
// Dog.prototype.constructor = Dog

// 寄生组合式继承
Dog.prototype = Object.create(Animal.prototype)
Dog.prototype.curstructor = Dog

// 防抖
function debounce(func, wait) {
  let timer = null
  return function () {
    const arg = arguments
    let that = this
    clearTimeout(timer)
    timer = setTimeout(() => {
      func.call(that, ...arg)
    }, wait)
  }
}

// 节流 定时器
function throttle(func, wait) {
  let timer = null
  return function () {
    if (timer) return
    const arg = arguments
    let that = this
    timer = setTimeout(() => {
      func.call(that, ...arg)
      timer = null
    }, wait)
  }
}

// 节流 使用date
function throttle1(func, wait) {
  let lastTime = 0
  return function () {
    let now = +new Date()
    if (now - lastTime > wait) {
      func.apply(this, arguments)
      lastTime = now
    }
  }
}

// 实现函数柯里化
function add(a, b, c) {
  return a + b + c
}
add(1, 2, 3)
let addCurry = curry(add)
addCurry(1)(2)(3)

// 实现curry
function curry(fn) {
  const addC = (...args) => {
    if (args.length === fn.length) return fn(...args)
    return (...arg) => addC(...args, ...arg)
  }
  return addC
}
