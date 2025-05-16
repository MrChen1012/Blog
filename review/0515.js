const comments = [
  { id: 1, parent_id: null },
  { id: 2, parent_id: 1 },
  { id: 3, parent_id: 1 },
  { id: 4, parent_id: 2 },
  { id: 5, parent_id: 4 },
  { id: 6, parent_id: 5 },
  { id: 7, parent_id: 3 },
  { id: 8, parent_id: 7 }
]

// 平级结构转树状图
function arrToTree(arr) {
  const map = new Map()
  const result = []
  arr.forEach(item => {
    map.set(item.id, { ...item, children: [] })
  })

  arr.forEach(item => {
    const treeItem = map.get(item.id)
    if (item.parent_id === null) {
      result.push(treeItem)
    } else {
      const parent = map.get(item.parent_id)
      if (parent) parent.children.push(treeItem)
    }
  })

  return result
}
console.log(arrToTree(comments))
