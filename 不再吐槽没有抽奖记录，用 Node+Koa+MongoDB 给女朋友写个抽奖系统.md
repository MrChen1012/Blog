# 不再吐槽没有抽奖记录，用 Node+Koa+MongoDB 给女朋友写个抽奖系统

## 引言

“亲爱的，你的转盘里怎么没有我的名字？有没有考虑给我点奖品？？”—我每次看到女朋友吐槽没有抽奖记录的时候，都觉得这个问题必须解决。于是，我决定写一个 **Node.js + Koa + MongoDB** 的抽奖系统，不仅为她量身定制了个转盘，还让她每次抽奖时，都能看到自己“幸运”的奖品和抽奖记录，彻底打消她的吐槽。

## 技术栈

- **Node.js**：我们用它作为后端的 JavaScript 运行环境，它不仅高效，还能处理大量的请求，就像处理女朋友的抽奖请求一样快。
- **Koa**：这款框架灵活又简洁，完全可以轻松应对女朋友的“动态需求”——就算突然想要修改奖品，也没问题。
- **MongoDB**：作为数据库，它能轻松地存储每次抽奖的记录，就像收集女朋友每次的“愿望清单”。
- **Joi**：用它来校验数据，保证每次抽奖的数据都符合标准，不会让奖品乱了套。

## 项目结构

文件结构就像我的爱情一样有条理，清晰易懂：

```
src/
├── config/
│   └── db.js             # 数据库连接配置，连接到我的爱情数据库
├── controllers/
│   └── luckyRecordController.js  # 记录每次抽奖的神圣时刻
├── middleware/
│   └── errorHandler.js   # 错误处理，避免女朋友的吐槽
├── models/
│   └── LuckyRecord.js    # 抽奖记录模型，保留她的每一份幸运
├── routers/
│   └── luckyRecord.js    # 路由配置，指引她走向“奖品”
├── app.js                # Koa 应用入口，开启我们的抽奖人生
└── index.js              # 启动应用
.env                       # 环境变量配置，保持隐私
.gitignore
package.json
```

## 主要功能

1. **创建抽奖记录**：记录每次“幸运”的奖品，确保女朋友每次抽奖都不空手而归。
2. **查询抽奖记录**：查看所有抽奖记录，确保没有遗漏任何一份甜蜜。
3. **错误处理**：对于任何可能导致奖品缺失的情况，及时进行补救，避免出现“我就知道你不会给我抽到奖”的情形。

## 代码实现

### 1. **数据库连接配置**

在 `config/db.js` 文件中，我们通过 MongoDB 连接到一个充满“爱情”的数据库——她的幸运奖品将被保存在这里：

```js
import mongoose from 'mongoose';
import 'dotenv/config';

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected, love is in the air!');
    } catch (err) {
        console.error('Database connection error:', err);
        process.exit(1);
    }
}

export default connectDB;
```

### 2. **定义数据模型**

我们在 `models/LuckyRecord.js` 文件中定义了幸运记录的模型。每次抽奖，我们都记录她抽到的奖品，确保她的幸运有迹可循：

```js
import mongoose from 'mongoose';

const luckyRecordSchema = new mongoose.Schema({
    prizeId: {
        type: Number
    },
    prizeName: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('luckyRecord', luckyRecordSchema);
```

### 3. **业务逻辑（控制器）**

在 `controllers/luckyRecordController.js` 中，处理了两个业务逻辑：获取所有抽奖记录和创建新的抽奖记录（她每次抽奖时，我都得记录下来，不然哪有证明她“中奖了”？）：

```js
import LuckyRecord from '../models/LuckyRecord.js';

// 获取所有抽奖记录
export const getLuckyRecord = async ctx => {
    try {
        const record = await LuckyRecord.find().sort({ createdAt: -1 }).limit(100);
        ctx.body = {
            code: 10000,
            data: record,
            msg: '成功，继续中签！'
        };
    } catch (error) {
        ctx.body = {
            code: 500,
            data: [],
            msg: '服务器异常（但肯定不会影响抽奖哦）'
        };
    }
}

// 创建抽奖记录
export const createLuckyRecord = async ctx => {
    const { prizeId, prizeName } = ctx.request.body;
    const newRecord = await LuckyRecord.create({ prizeId, prizeName });
    ctx.status = 200;
    ctx.body = newRecord;
}
```

### 4. **数据校验**

在 `routers/luckyRecord.js` 中，我们用 **Joi** 进行数据校验，确保每次抽奖都有“标准”的奖品，不会让女朋友觉得“中奖”不靠谱：

```js
import Router from '@koa/router';
import * as luckyRecord from '../controllers/luckyRecordController.js';
import Joi from 'joi';

const router = new Router({ prefix: '/luckyRecord' });

// 数据校验中间件
const validateRecord = (ctx, next) => {
    const schema = Joi.object({
        prizeId: Joi.number().required(),
        prizeName: Joi.string().required()
    });

    const { error } = schema.validate(ctx.request.body);
    if (error) ctx.throw(400, error.details[0].message);
    return next();
};

router
    .get('/', luckyRecord.getLuckyRecord)
    .post('/add', validateRecord, luckyRecord.createLuckyRecord);

export default router;
```

### 5. **错误处理**

在 `middleware/errorHandler.js` 中，我们处理了错误。如果奖品不小心“丢失”了，系统会温柔地提示女朋友：

```js
export default async (ctx, next) => {
    try {
        await next();
    } catch (err) {
        ctx.status = err.status || 500;
        ctx.body = {
            error: {
                message: err.message,
                ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
            }
        };
    }
};
```

### 6. **Koa 应用入口**

在 `app.js` 中，我们将 Koa 应用配置好，连接数据库，设置中间件和路由，确保每次抽奖都不漏掉一个“奖品”：

```js
import Koa from 'koa';
import Cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';
import luckyRecordRouter from './routers/luckyRecord.js';
import connectDB from './config/db.js';
import errorHandler from './middleware/errorHandler.js';

const app = new Koa();

// 初始化数据库链接
connectDB();

// 中间件
app.use(errorHandler);
app.use(bodyParser());
app.use(Cors({ origin: '*' }));

// 路由
app.use(luckyRecordRouter.routes());
app.use(luckyRecordRouter.allowedMethods());

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://localhost:${PORT}`));
```

### 7. **启动应用**

最后，使用`babel`处理下import导入，在 `index.js` 中启动了应用：

```js
require('@babel/register')({
    presets: ['@babel/preset-env']
});

require('./app'); 
```

## 总结

我不仅解决了女朋友“没有抽奖记录”的问题，还实现了一个基于 **Koa + MongoDB** 的抽奖记录管理系统。每当她抽到“奖品”时，不仅能看到幸运的记录，还能看到所有历史抽奖记录，彻底避免了“我就知道你不会给我抽到奖”的尴尬！

### 未来改进

1. **增加抽奖活动类型**：可以扩展更多的奖品和抽奖活动，让女朋友体验更多“惊喜”。
2. **抽奖次数限制**：让她每次抽奖都能珍惜机会，避免无限制抽奖。
3. **更丰富的奖品展示**：每个奖品的展示方式可以更有趣，例如抽奖后显示奖品图片。

希望你能和我一起，创建出更多这样的“幸运记录”，也许下次，我能从她的笑容里看到我“中了大奖”的奖励！