interface Area {
    id: number
    parent_id: number
    name: string
}

let arr: Area[] = [
    { "id": 1, "parent_id": 0, "name": "Atar" },
    { "id": 2, "parent_id": 0, "name": "Lier" },
    { "id": 3, "parent_id": 0, "name": "广东省" },
    { "id": 11, "parent_id": 1, "name": "顺义区" },
    { "id": 12, "parent_id": 1, "name": "朝阳区" },
    { "id": 13, "parent_id": 1, "name": "lili" },
    { "id": 21, "parent_id": 2, "name": "sdfsd" },
    { "id": 22, "parent_id": 2, "name": "X" },
    { "id": 24, "parent_id": 2, "name": "(iLX" },
    { "id": 241, "parent_id": 24, "name": "田林街道" },
    { "id": 242, "parent_id": 24, "name": "漕河泾街道" },
    { "id": 2421, "parent_id": 242, "name": "上海科技绿洲" },
    { "id": 2422, "parent_id": 242, "name": "漕河泾开发区" },
    { "id": 31, "parent_id": 3, "name": "~Ni" },
    { "id": 32, "parent_id": 3, "name": "it" },
    { "id": 33, "parent_id": 3, "name": "I" }
];

