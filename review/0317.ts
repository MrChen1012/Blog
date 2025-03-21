// 1类型推导
const x: number = 10;
let y: string = x + "hello";

// 2类型别名
type User = {
    id: number
    name: string
    isAdmin: boolean
}

const user: User = {
    id: 1,
    name: 'JiangJiang',
    isAdmin: true
}

// 3 联合类型
function printId(id: string | number): string | number {
    if (typeof id === 'string') return 'ID:' + id
    return id
}

// 4类型守卫
function getLength(input: string | any[]): number {
    return input.length
}
console.log(getLength("hello")); // 输出 5
console.log(getLength([1, 2, 3])); // 输出 3

// 5泛型
function wrapInArray<T>(val: T): T[] {
    return [val]
}

console.log(wrapInArray(5)); // 输出 [5]
console.log(wrapInArray("hello")); // 输出 ["hello"]

// 6泛型接口
interface Box<T> {
    value: T
}

const numberBox: Box<number> = {
    value: 42
}

const stringBox: Box<string> = {
    value: 'Hello'
}

// 7条件类型
type IsString<T> = T extends string ? 'yes' : 'no'
type Test1 = IsString<string>;  // 结果应该是 "yes"
type Test2 = IsString<number>;  // 结果应该是 "no"

// 8函数重载
function formatInput(input: string): string
function formatInput(input: number): string
function formatInput(input: string | number): string {
    if (typeof input === 'string') return input.slice(0, 1).toUpperCase() + input.slice(1);
    return 'Number: ' + input
}

// 9装饰器
function LogMethod() {
    return (target, method, descriptor) => {
        const originalMethodImpl = descriptor.value!;
        descriptor.value = async function (...args: unknown[]) {
            console.log(`调用 sayHello 方法，参数: ["${args}"]`);
            return await originalMethodImpl.apply(this, args); // 执行原本的逻辑
        };
    }
}

class User1 {
    @LogMethod
    sayHello(name: string) {
        return `Hello, ${name}!`;
    }
}
const u = new User1();
u.sayHello("Tom");
// 期待输出：
// 调用 sayHello 方法，参数: ["Tom"]
// Hello, Tom!

// 10复杂类型转换
type TupleToObject<T extends readonly (string | number)[]> = {
    [key in T[number]]: key
}
type Test = TupleToObject<["a", "b", "c"]>;
// 结果应该是 { a: "a", b: "b", c: "c" }
