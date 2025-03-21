// 1类型推导与类型注解
const foo: number = 42;
let bar: string = "Hello";

// 2类型别名与接口
type Car = {
    make: string;
    model: string;
    year: number;
}

type Vehicle = {
    make: string;
    model: string;
};

const myCar: Car = {
    make: "Toyota",
    model: "Camry",
    year: 2020
};

// 将 `Car` 类型修改成 `Vehicle` 类型，编写 `getVehicleInfo` 函数，返回 `${make} ${model}`。
function getVehicleInfo(construtor: Vehicle) {
    const { make, model } = construtor
    return `${make} ${model}`
}
getVehicleInfo(myCar)

// 3联合类型
// 创建一个函数 `getValueType`，接受 `string | number` 类型的参数，
// 如果是字符串，返回 `"This is a string"`；如果是数字，返回 `"This is a number"`。
function getValueType(input: string | number): string {
    if (typeof input === 'string') return "This is a string"
    return "This is a number"
}

// 4类型守卫
function isString(input: string | number): boolean {
    return typeof input === 'string' ? true : false
}

// 5泛型函数
// 创建一个泛型函数 `concatArray`，接受一个类型为 `T[]` 的数组和一个元素 `T`，
// 返回一个新的数组，包含数组元素和新传入的元素。
function concatArray<T>(arr: T[], key: T): T[] {
    return arr.concat([key])
}

// 6泛型接口
interface Pair<T, U> {
    first: T;
    second: U;
}

// 创建一个 `Pair` 对象 `numberStringPair`，其 `first` 为数字，`second` 为字符串
const numberStringPair: Pair<number, string> = {
    first: 18,
    second: 'pair'
}

// 7条件类型
// 实现一个条件类型 `IsArray<T>`，判断类型 `T` 是否为数组类型，如果是返回 `"yes"`，否则返回 `"no"`。

type IsArray<T> = T extends any[] ? 'yes' : 'no'

// 测试条件类型：
type Test1 = IsArray<string[]>;  // 结果应为 "yes"
type Test2 = IsArray<number>;    // 结果应为 "no"

// 8函数重载
// 创建一个函数 `sum`，它可以接受两个数字并返回它们的和；
// 如果接受两个字符串，则连接它们；
// 如果一个是数字，一个是字符串，则返回字符串 "Invalid".
function sum(a: number, b: number): number
function sum(a: string, b: string): string
function sum(a: number, b: string): string
function sum(a: string, b: number): string
function sum(a: string | number, b: string | number): string | number {
    if (typeof a === 'string' && typeof b === 'string') {
        return a + b
    } else if (typeof a === 'number' && typeof b === 'number') {
        return a + b
    } else {
        return 'Invalid'
    }
}

// 9装饰器
// 创建一个装饰器 `LogClass`，它会在类的实例化时打印 `Class created`。
function LogClass(constructor: Function) {
    console.log(`Class created`);
}

@LogClass
class Person {
    constructor(public name: string) { }
}

// 10类型断言
const inputElement = document.querySelector('#input') as HTMLInputElement

// 使用 `inputElement` 来获取值，并打印出来
console.log(inputElement.value);