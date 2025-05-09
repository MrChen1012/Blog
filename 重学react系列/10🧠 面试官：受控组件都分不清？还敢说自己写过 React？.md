# 🧠 面试官：受控组件都分不清？还敢说自己写过 React？

> 面试官冷冷一笑，盯着我手里的简历。
>
> “你说你写过 React 项目？”
> “是的。”
>
> “那……受控组件和非受控组件，讲讲。”
>
> 我心头一震，表面淡定地微笑，脑子却飞快回想起那些我曾无数次敲下的 `value`、`onChange`、`ref.current`……
>
> 这一刻我明白了，**所谓基本功，不是会用，而是理解为什么用。**

## 🎯 什么是受控组件

**一句话理解：**

> **受控组件 = React 用 state 完全掌控输入元素的值。**

在受控组件中，表单元素 `input、textarea、select` 等标签的值，全部来源于 `state`。

用户每输入一次，就会触发 `onChange`，更新 `state`，React 再根据新的 `state` 重新渲染输入框的 `value`。

可以把它想象成 Vue 的双向数据绑定（`v-model`）。

**举个简单栗子：**

```ts
import { useState } from 'react';

function ControlledInput() {
  const [text, setText] = useState('');

  return (
    <input
      value={text}
      onChange={(e) => setText(e.target.value)}
    />
  );
}
```

这里的流程是：

1. 用户在输入框中输入内容。
2. `onChange` 事件触发，更新 `state`。
3. 组件重新渲染，把新的 `state` 作为 `value` 绑定到 `input` 上。

用户的每一个输入都会触发 `onChange`，然后通过代码去设置 `value`。

![ainimation1](C:\cgj\1code\我的\面试\1博客\img\受控组件和非受控组件\ainimation1.gif)

**整个流程图如下：**

![img1](C:\cgj\1code\我的\面试\1博客\img\受控组件和非受控组件\img1.png)

## 🔥什么是非受控组件？（ref的世界）

**一句话理解：**

> **非受控组件 = 表单元素自己掌管自己的值，React 只是旁观者。**

在非受控组件中，我们不通过 `state` 去管理输入的值，而是直接通过 `ref` 获取 DOM 元素，去读/写值。

**举个简单栗子：**

```ts
import { useRef } from "react";

export default function UncontrolledInput() {
  const inputRef = useRef();

  const handleClick = () => {
    console.log("打印输入：", inputRef.current.value);
  };

  return (
    <>
      <input ref={inputRef} />
      <button onClick={handleClick}>打印输入</button>
    </>
  );
}
```

这里的流程是：

1. React 把 `inputRef` 绑定到 `input` 上。
2. 用户在输入框中输入内容。
3. React 通过 `ref`，只在按钮点击时才去读取。

![ainimation2](C:\cgj\1code\我的\面试\1博客\img\受控组件和非受控组件\ainimation2.gif)

**整个流程图如下：**

![img2](C:\cgj\1code\我的\面试\1博客\img\受控组件和非受控组件\img2.png)

> 非受控组件的特点是：**更接近原生 HTML 行为**，使用起来简单粗暴。

非受控组件可以通过 `defaultValue` 去设置初始值，但是注意不能直接设置 `value`，设置 `value` 需要搭配 `onChange` 或 `readOnly` 去使用。

> 如果既设置了 `value` 又没有 `onChange`，React 会认为这是一个只读组件，会报警告。

![image-20250427173637764](C:\Users\chenl\AppData\Roaming\Typora\typora-user-images\image-20250427173637764.png)

------

## ⚔️ 受控组件 VS 非受控组件

很多人分不清这俩，其实只要记住下面这张表格就行：

|            | 受控组件                   | 非受控组件                           |
| ---------- | -------------------------- | ------------------------------------ |
| 数据管理   | React state 管控           | DOM 自己管理                         |
| 读取方式   | 直接用 state               | 通过 ref                             |
| 联动、校验 | 非常方便                   | 需要手动处理                         |
| 性能表现   | 频繁触发渲染，大表单需优化 | 性能好，特别是大量字段               |
| 典型场景   | 登录表单、搜索框、动态表单 | 文件上传、富文本编辑器、兼容第三方库 |

虽然 **非受控组件** 简单、直接，但是真正的业务开发中，更推荐使用 **受控组件**。

### **为什么呢？**

### 更好的数据管理

所有表单输入都绑定到 React 的 state，方便做各种统一处理，比如：

- 实时表单校验
- 表单间联动控制，例如勾选A，B自动禁用
- 批量操作

### 更好的调试和维护

因为数据都在 React 中，不管是打印日志还是定位 bug，都比非受控组件要清晰得多。

## 🛠️ 受控组件最佳用法（实战环节）

在日常开发中，我们经常需要在 **受控组件** 里增加额外逻辑，比如：

- 输入框实时校验
- 输入节流/防抖处理
- 表单联动
- 自动格式化输入内容

**下面我们进入一个实战栗子：**

### 1. 创建个基础结构

首先我们创建包含用户名、密码、确认密码、手机号的表单组件，使用 `useState` 管理数据。

```ts
import { useState } from "react";
import { debounce } from "lodash";

export default function SimpleForm() {
  // 状态初始化
  const [form, setForm] = useState({
    username: "",
    phone: "",
    password: "",
    confirmPwd: "",
  });

  const [errors, setErrors] = useState({
    username: "",
    phone: "",
    password: "",
  });

  return <div className="form">{/* 表单输入项将在此添加 */}</div>;
}

```

这里我们创建了个 `errors`，校验格式不对时直接弹出报错信息。

### 2. 统一校验数据

对 `formData` 进行数据校验，定义各校验方法名。

```ts
const handleInputChange = (field) => (e) => {
  const value = e.target.value;
  
  // 更新基础数据
  setForm(prev => ({
    ...prev,
    [field]: value
  }));

  // 触发字段专项处理
  switch(field) {
    case 'username': 
      validateUsername(value);
      break;
    case 'phone':
      validatePhone(value);
      break;
    case 'password':
    case 'confirmPwd':
      validatePassword();
      break;
  }
};
```

### 3. 实现各校验函数

创建对应数据的校验函数：

```ts
const validateUsername = debounce((value) => {
  const isValid = /^[a-zA-Z0-9]{4,8}$/.test(value);
  setErrors(prev => ({
    ...prev,
    username: isValid ? '' : '4-8位字母或数字'
  }));
}, 500);

const validatePhone = (value) => {
  const isValid = /^1[3-9]\d{9}$/.test(value.replace(/-/g, ''));
  setErrors(prev => ({
    ...prev,
    phone: isValid ? '' : '无效手机号'
  }));
};

const validatePassword = () => {
  const isValid = form.password === form.confirmPwd;
  setErrors(prev => ({
    ...prev,
    password: isValid ? '' : '密码不一致'
  }));
};
```

这里我们举例说明，只作了最简单的校验：

- `username`：4-8位字母或数字 + 防抖
- `phone`： 正则 `/^1[3-9]\d{9}$/`
- `password`：只去校验两次输入是否一致

### 4. 表单结构

再去补充一下表单结构，输入框 + 简单报错信息：

```ts
return (
  <div className="form">
    {/* 用户名输入 */}
    <div className="input-group">
      <label>用户名</label>
      <input
        value={form.username}
        onChange={handleInputChange('username')}
      />
      {errors.username && <div className="error">{errors.username}</div>}
    </div>

    {/* 手机号输入 */}
    <div className="input-group">
      <label>手机号</label>
      <input
        value={form.phone}
        onChange={handleInputChange('phone')}
      />
      {errors.phone && <div className="error">{errors.phone}</div>}
    </div>

    {/* 密码输入 */}
    <div className="input-group">
      <label>密码</label>
      <input
        type="password"
        value={form.password}
        onChange={handleInputChange('password')}
      />
    </div>

    {/* 确认密码 */}
    <div className="input-group">
      <label>确认密码</label>
      <input
        type="password"
        value={form.confirmPwd}
        onChange={handleInputChange('confirmPwd')}
      />
      {errors.password && <div className="error">{errors.password}</div>}
    </div>
  </div>
);
```

我们看下页面：

![ainimation3](C:\cgj\1code\我的\面试\1博客\img\受控组件和非受控组件\ainimation3.gif)

到这里我们就完成了一个完整的受控组件案例，案例中的场景有：

- 输入框实时校验
- 输入节流/防抖处理
- 表单联动

**完整代码如下：**

```ts
import { useState } from "react";
import { debounce } from "lodash";

export default function SimpleForm() {
  // 状态初始化
  const [form, setForm] = useState({
    username: "",
    phone: "",
    password: "",
    confirmPwd: "",
  });

  const [errors, setErrors] = useState({
    username: "",
    phone: "",
    password: "",
  });

  const handleInputChange = (field) => (e) => {
    const value = e.target.value;

    // 更新基础数据
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    // 触发字段专项处理
    switch (field) {
      case "username":
        validateUsername(value);
        break;
      case "phone":
        validatePhone(value);
        break;
      case "password":
      case "confirmPwd":
        validatePassword();
        break;
    }
  };

  const validateUsername = debounce((value) => {
    const isValid = /^[a-zA-Z0-9]{4,8}$/.test(value);
    setErrors((prev) => ({
      ...prev,
      username: isValid ? "" : "4-8位字母或数字",
    }));
  }, 500);

  const validatePhone = (value) => {
    const isValid = /^1[3-9]\d{9}$/.test(value.replace(/-/g, ""));
    setErrors((prev) => ({
      ...prev,
      phone: isValid ? "" : "无效手机号",
    }));
  };

  const validatePassword = () => {
    const isValid = form.password === form.confirmPwd;
    setErrors((prev) => ({
      ...prev,
      password: isValid ? "" : "密码不一致",
    }));
  };

  return (
    <div className="form">
      {/* 用户名输入 */}
      <div className="input-group">
        <label>用户名</label>
        <input value={form.username} onChange={handleInputChange("username")} />
        {errors.username && <div className="error">{errors.username}</div>}
      </div>

      {/* 手机号输入 */}
      <div className="input-group">
        <label>手机号</label>
        <input value={form.phone} onChange={handleInputChange("phone")} />
        {errors.phone && <div className="error">{errors.phone}</div>}
      </div>

      {/* 密码输入 */}
      <div className="input-group">
        <label>密码</label>
        <input
          type="password"
          value={form.password}
          onChange={handleInputChange("password")}
        />
      </div>

      {/* 确认密码 */}
      <div className="input-group">
        <label>确认密码</label>
        <input
          type="password"
          value={form.confirmPwd}
          onChange={handleInputChange("confirmPwd")}
        />
        {errors.password && <div className="error">{errors.password}</div>}
      </div>
    </div>
  );
}
```

## ⚔️ 受控 + 非受控混合使用

实际开发中，也有需要两者结合的情况，比如：

- 文件上传
- 富文本编辑器
- 集成老旧第三方库

这种时候，**表单字段可以受控，但文件上传部分用非受控 ref 来拿原生数据。**

**举个栗子：**

```ts
function UploadForm() {
  const [title, setTitle] = useState('');
  const fileInputRef = useRef();

  const handleSubmit = () => {
    const file = fileInputRef.current.files[0];
    console.log('Title:', title);
    console.log('File:', file);
  };

  return (
    <>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="标题" />
      <input type="file" ref={fileInputRef} />
      <button onClick={handleSubmit}>提交</button>
    </>
  );
}
```

------



## 🧩 小结

- 受控组件 = React 完全掌控输入，数据集中统一管理。
- 非受控组件 = 表单自己管理，React 只旁观。
- 真实项目中，优先选择受控组件，方便联动校验、提升维护效率。

如果你觉得这篇文章对你有帮助，欢迎点赞 👍、收藏 ⭐、评论 💬 让我知道你在看！
后续我也会持续输出更多 **高性能 React 实战技巧**，敬请期待！❤️