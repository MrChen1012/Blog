# 🔥 Promise / async 都看过无数遍了，你真的能写出来吗？

> 📌 本文是《前端打怪笔记》系列第 2 篇，适合用于：**面试复习 / 代码输出 / 系统掌握异步机制**。
>
> 从实际异步问题出发，带你理解 `Promise` 的设计思想，并**手写一个支持链式调用的 Promise 类**，真正吃透异步原理。

## ✅ 看了无数次，还是写不出来？

虽然我们平时经常使用 `Promise` 和 `async/await`，但是很多小伙伴还停留在 **能用**，但并没有真正 **理解**。

你是否也遇到过这些问题？

- 明知道 `await` 是语法糖，却说不清它背后做了什么
- `Promise.all` 和 `Promise.race` 会用，但场景傻傻分不清
- 面试让你手写 `Promise`，脑子一片空白，只能干瞪眼……

这篇文章手把手从原理开始，带你一步一步去实现出来。

------



## 🧠 Promise 到底解决了什么问题？

在 `Promise` 出现前，我们用回调来处理异步，但是一旦回调逻辑变多变复杂，就很容易出现 **回调地狱** 的情况。

```ts
fetchUserData(userId, (userData) => {
  fetchUserPosts(userData.id, (posts) => {
    fetchPostComments(posts[0].id, (comments) => {
      fetchCommentLikes(comments[0].id, (likes) => {
        // 更多嵌套...
        console.log("最终结果:", likes);
      }, handleError);
    }, handleError);
  }, handleError);
}, handleError);
```

**问题表现**：

- 代码横向扩展，难以阅读和维护。
- 错误处理复杂，每个回调都需要单独处理错误。
- 逻辑分割，难以复用和调试。

**`Promise` 的出现带来了：**

- **扁平化代码结构：**通过链式调用代替嵌套回调（`.then()`）
- **统一处理异常：**单个 `catch` 捕获所有异步操作出现的错误
- **明确状态管理：**Promise 有三种状态（pending、fulfilled、rejected），状态一旦改变就会固定，避免回调重复执行。

我们使用 `Promise` 改写上面代码：

```ts
fetchUserData(userId)
  .then((userData) => fetchUserPosts(userData.id))
  .then((posts) => fetchPostComments(posts[0].id))
  .then((comments) => fetchCommentLikes(comments[0].id))
  .then((likes) => {
    console.log("最终结果:", likes);
  })
  .catch((error) => {
    console.error("任意一步出错:", error); // 统一错误处理
  });
```

代码可读性明显增强了很多，仅需一个 `catch` 捕获异步错误。

## ✍️ 举个栗子讲透 Promise 的执行机制

```ts
console.log('start');
new Promise((resolve) => {
  console.log('promise executor');
  resolve();
}).then(() => {
  console.log('then1');
}).then(() => {
  console.log('then2');
});
console.log('end');
```

**输出顺序：**`start → promise executor → end → then1 → then2`

**拆解过程：**

- `new Promise()` 先执行同步代码 `console.log('promise executor')`
- `.then()` 注册微任务，加入微任务队列
- 主线程完成后，执行微任务队列

了解完了 `Promise`，我们在看看 `async/await`。

## 📘 async/await 究竟做了什么？

`async/await` 是 ES2017 引入的 JavaScript 语法糖，它基于 **Promise** 实现，旨在**以同步代码的形式编写异步逻辑**，避免 Promise 链式调用带来的复杂性。

它的核心处理机制包括以下几个方面：

**1. 自动包装 Promise**

**`async` 函数**：返回值会自动被包装为 Promise，无论返回的是普通值还是已有的 Promise。

```ts
async function fetchData() {
  return "Hello"; // 等价于 return Promise.resolve("Hello");
}

// 调用 async 函数，得到 Promise
fetchData().then((result) => console.log(result)); // 输出: "Hello"
```

**2. `await` 暂停执行并自动解析 Promise**

`await` 会暂停当前函数的执行，并将后面的逻辑放入微任务队列。

```ts
async function fn() {
  console.log('1');
  await Promise.resolve();
  console.log('2');
}

// 等价于
function fn() {
  console.log('1');
  Promise.resolve().then(() => {
    console.log('2');
  });
}
```

**3. 同步风格的错误处理**

- 在 `async` 函数内部，推荐使用 `try/catch` 捕获 `await` 后面的 Promise 拒绝，代码更直观；
- 若直接调用 `async` 函数（返回 Promise），仍可通过 `.catch()` 处理错误。

**4. 串行执行简化**

顺序执行多个异步操作，无需手动链式调用，代码更接近同步写法。

```ts
async function fetchAll() {
  const user = await fetchUser(); // 先获取用户
  const posts = await fetchPosts(user.id); // 再获取用户的帖子
  return { user, posts };
}

// 等价于 Promise 链式写法：
function fetchAll() {
  return fetchUser()
    .then((user) => fetchPosts(user.id))
    .then((posts) => ({ user, posts }));
}
```

## 🛠 面试官：你说你懂 Promise？那就手写一个吧！

下面我们来一步步实现一个自己的 `MyPromise`，支持链式调用、错误捕获、finally 等核心功能。

### 1. 创建 Promise 类和状态管理

```ts
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
  }
}
```

这里实现了：

- 定义 `PENDING、FULFILLED、REJECTED` 状态
- 定义一些初始值，成功、失败回调队列

### 2. 实现 resolve / reject 函数和状态变更

```ts
// 手撸一个Promise
class MyPromise {
  ...
  constructor(executor) {
    ...
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
}
```

- 创建了 `resolve、reject` 函数，注意状态只能从 `pending → fulfilled/rejected`，所以在里面加上了 `if (this.state !== PENDING) return` 处理。
- 立即执行 `executor(this.resolve, this.reject)`。

### 3. 实现 then 方法

```ts
  then = (onFulfilled, onRejected) => {
    switch (this.state) {
      case MyPromise.FULFILLED:
        onFulfilled(this.value)
        break
      case MyPromise.REJECTED:
        onRejected(this.reason)
        break
      case MyPromise.PENDING:
        this.onFulfilledCallbacks.push(() => onFulfilled(this.value))
        this.onRejectedCallbacks.push(() => onRejected(this.reason))
        break

      default:
        break
    }
  }
```

根据状态作不同处理：

- **FULFILLED：**执行成功回调
- **REJECTED：**执行失败回调
- **PENDING：**把成功、失败回调添加到对应任务列表

实现到这里，`Promise` 的一些基础方法慢慢完善了，但是别忘了，`then` 方法还支持链式调用

### 4. 让 `then` 支持链式调用

```ts
  then = (onFulfilled, onRejected) => {
    return new MyPromise((resolve, reject) => {
      const fulfilledTask = () => {
        try {
          const result = onFulfilled(this.value)
          resolve(result)
        } catch (error) {
          reject(error)
        }
      }

      const rejectedTask = () => {
        try {
          const result = onRejected(this.reason)
          resolve(result)
        } catch (error) {
          reject(error)
        }
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
```

链式调用的本质就是返回一个新的 `Promise`，这里实现了：

- `.then()` 默认返回一个新的 `Promise`
- 创建 `fulfilledTask、rejectedTask`，对前一次的 `Promise` 结果进行处理
- 再更替不同状态下的处理方法

到这里我们还差一步就实现了完整的 `.then()` 方法，那就是 **模拟微任务**。

### 5. 微任务模拟

我们可以使用 `queueMicrotask` 或者 `setTimeout` 进行模拟，我们调整一下代码：

```ts
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
```

### 6. 测试一下

```ts
const p = new MyPromise((resolve, reject) => {
  setTimeout(() => {
    resolve('成功了');
  }, 1000);
});

p.then(res => {
  console.log('第一次 then:', res);
  return '第二次值';
}).then(res2 => {
  console.log('第二次 then:', res2);
});
```

执行结果：

`第一次 then: 成功了 → 第二次 then: 第二次值`

> 实现了基本功能，我们再去扩展下。

### 7. 实现 `catch`

```ts
  catch = onRejected => {
    return this.then(null, onRejected)
  }
```

`catch` 本质是 `then(null, onRejected)` 的语法糖。

### 8. 实现 `finally`

`finally` 无论成功还是失败都会执行，并且 **不会改变原有的值或错误**。

```ts
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
```

**完整代码：**[Github - Promise.js](https://github.com/MrChen1012/React-Demo/blob/master/Promise.js)

## ❓ Promise.all、race、any 有哪些区别？

| 方法   | 作用               | 失败时行为               |
| ------ | ------------------ | ------------------------ |
| `all`  | 所有都成功才成功   | 任意一个失败就失败       |
| `race` | 谁先有结果就返回   | 谁先 reject 就失败       |
| `any`  | 任意一个成功就成功 | 全部失败才失败（ES2021） |

## 💬 面试时怎么回答？

> ❓ 面试官：“你能解释下什么是 Promise 吗？”

你可以这样答：

- `Promise` 是为了解决回调地狱问题的异步控制机制。
- 它有 3 种状态，初始是 `pending`，调用 `resolve` 后变为 `fulfilled`。
- `then` 方法返回一个新的 Promise，支持链式调用。
- `async/await` 是基于 `Promise` 的语法糖，底层实现等价于 `.then`。
- `await` 会暂停函数执行，后续逻辑放入微任务。

> 再给面试官表演个手写 Promise，面试还不是手拿把掐。😘

------



## 🧭 本文总结

- ✅ `Promise` 是对回调的抽象，避免回调地狱
- ✅ `then` 是异步执行的微任务，可链式调用
- ✅ `async` 返回一个 Promise，`await` 会拆为 `.then()` 微任务
- ✅ 理解 async = 拆解执行栈 + 输出顺序
- ✅ 面试建议结合代码 + 状态变化 + 微任务讲解
- ✅ 手写 Promise 是进阶理解的必经之路

如果你觉得这篇文章对你有帮助，欢迎点赞 👍、收藏 ⭐、评论 💬 让我知道你在看！
后续我也会持续输出更多 **前端打怪笔记系列文章**，敬请期待！❤️