// 1类型推导
// const name = "Alice"; // name 变量的类型是什么？ string
// const age = 25; // age 变量的类型是什么？ number
// const isStudent = true; // isStudent 变量的类型是什么？ boolean

// 2类型注解
// 请给 person 变量添加适当的 TypeScript 类型：
interface Person {
    name: string
    age: number
    isStudent: boolean
}
const person: Person = {
    name: "Tom",
    age: 30,
    isStudent: false
};

// 3联合类型 实现一个 接受数字或字符串 作为参数的 printId 函数：
function printId(id: string | number): void {
    if (typeof id === 'number') console.log(id)
    else console.log('ID: ' + id);
}

// 4类型守卫 补全 getLength 方法，使其能够正确处理 数组 和 字符串：
function getLength<T extends string | any[]>(input: T): number {
    return input.length;
}

// 5类型别名
// 定义 User1 类型（包含 id: number, name: string, age: number）
type User1 = {
    id: number
    name: string
    age: number
};

// getUserInfo 函数：接收 User 类型的参数，返回字符串 "{name} is {age} years old."
function getUserInfo(user: User1): string {
    return `${user.name} is ${user.age} years old.`;
}

// 6类型断言 已知 document.getElementById("app") 可能返回 null，如何避免 null 相关的错误？
const app = document.getElementById("app");
// 让 app 直接使用 classList.add("active")，但不能报错！
(app as HTMLElement).classList.add("active");

// 7泛型函数 请定义一个泛型函数 wrapInArray，让它能够：
function wrapInArray<T>(data: T): T[] {
    return [data]
}
console.log(wrapInArray(5));       // 输出: [5]
console.log(wrapInArray("hello")); // 输出: ["hello"]

// 8泛型接口
interface Box<T> {
    value: T
}
const numberBox: Box<number> = { value: 42 };
const stringBox: Box<string> = { value: "Hello" };

// 9条件类型 请实现一个 条件类型 IsString<T>，如果 T 是 string，返回 "yes"，否则返回 "no"：
type IsString<T> = T extends string ? 'yes' : 'no'
type Test1 = IsString<string>;  // "yes"
type Test2 = IsString<number>;  // "no"

// 10函数重载
function formatInput(input: string): string
function formatInput(input: number): string
function formatInput(input: string | number): string {
    if (typeof input === 'string') return input.toUpperCase();
    return 'Number: ' + input
}
