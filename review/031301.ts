// 1修复类型错误
function sum(a: number, b: number): number {
    return a + b;
}
// const result: string = sum(1, 2); // 这里报错，如何修复？
const result: number = sum(1, 2)

// 2定义接口
interface User {
    name: string,
    age?: number,
    isAdmin: boolean
}

// 3联合类型与类型守卫
function printId(id: string | number): string {
    if (typeof id === 'string') return 'ID:' + id
    else return 'ID:#' + id
}

// 4泛型函数
function getFirstElement<T>(arr: T[]): T | null {
    if (arr.length) return arr[0]
    return null
}

// 5类型推断
let x = 10;
x = "hello"; // 会报错，因为一开始赋值为number 10，ts推断类型为number

// 6类型别名与字面量类型
type Direction = "up" | "down" | "left" | "right"

// 7映射类型
type ReadonlyPerson<T> = {
    readonly [k in keyof T]: T[k]
}

// 8函数重载
function greet(input: string): string;
function greet(input: number): string;
function greet(input: string | number): string {
    if (typeof input === "string") {
        return `Hello, ${input}!`;
    } else {
        return input < 12 ? "Good morning!" : "Good afternoon!";
    }
}

// 9实际应用：API 响应类型
type ApiResponse<T> =
    | { success: true; data: T }
    | { success: false; error: string };

// 10挑战题（可选）
function mergeObjects<T, U>(a: T, b: U): T & U {
    return { ...a, ...b };
}
const obj = mergeObjects({ name: "Alice" }, { age: 30 });
console.log(obj.age);