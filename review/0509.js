// 手撸一个Promise
class MyPromise {
  static PENDING = 'pending'
  static FULFILLED = 'fulfilled'
  static REJECTED = 'rejected'
  constructor(executor) {
    this.state = MyPromise.PENDING // 初始状态
    this.value = null // 成功值
    this.reason = null // 失败原因

    // 成功和失败的回调队列
    this.onFulfilledCallbacks = []
    this.onRejectedCallbacks = []

    try {
      executor(this.resolve, this.reject)
    } catch (error) {
      this.reject(error)
    }
  }

  resolve = value => {
    if (this.state !== MyPromise.PENDING) return
    this.state = MyPromise.FULFILLED
    this.value = value
    this.onFulfilledCallbacks.forEach(fn => fn())
  }

  reject = reason => {
    if (this.state !== MyPromise.PENDING) return
    this.state = MyPromise.REJECTED
    this.reason = reason
    this.onRejectedCallbacks.forEach(fn => fn())
  }

  then = (onFulfilled, onRejected) => {
    return new MyPromise((resolve, reject) => {
      const fulfilledTask = () => {
        setTimeout(() => {
          try {
            const result = onFulfilled(this.value)
            resolve(result)
          } catch (error) {
            reject(error)
          }
        })
      }

      const rejectedTask = () => {
        setTimeout(() => {
          try {
            const result = onRejected(this.reason)
            resolve(result)
          } catch (error) {
            reject(error)
          }
        })
      }

      switch (this.state) {
        case MyPromise.FULFILLED:
          fulfilledTask(this.value)
          break
        case MyPromise.REJECTED:
          rejectedTask(this.reason)
          break
        case MyPromise.PENDING:
          this.onFulfilledCallbacks.push(fulfilledTask)
          this.onRejectedCallbacks.push(rejectedTask)
          break

        default:
          break
      }
    })
  }

  catch = onRejected => {
    return this.then(null, onRejected)
  }

  finally = callback => {
    return this.then(
      value => {
        return MyPromise.resolve(callback).then(() => value)
      },
      reason => {
        return MyPromise.resolve(callback).then(() => {
          throw reason
        })
      }
    )
  }
}
new MyPromise((resolve, reject) => {
  reject('出错了')
}).catch(err => {
  console.log('捕获错误:', err)
})
