#!/usr/bin/env bash
# 冒烟测试：依次调用所有接口，打印状态码和响应。
# 用法：先 npm run dev，再 bash scripts/smoke-test.sh [base_url]
set -u
BASE="${1:-http://localhost:3000}/api/todos"

call() {
  local label="$1"; shift
  echo "=== $label"
  curl -s --noproxy '*' -w "\n[HTTP %{http_code}]\n" "$@"
  echo
}

call "列表" "$BASE"
# 测试数据用英文：Windows 的 Git Bash 下 curl -d 传中文可能不是 UTF-8 编码
echo "=== 新建"
CREATED=$(curl -s --noproxy '*' -X POST "$BASE" -H "Content-Type: application/json" -d '{"title":"write smoke test"}')
echo "$CREATED"; echo
ID=$(echo "$CREATED" | sed -E 's/.*"id":"([^"]+)".*/\1/')
echo "新建的 id: $ID"; echo
call "关键词搜索" "$BASE?q=smoke"

call "查询单个" "$BASE/$ID"
call "部分更新" -X PATCH "$BASE/$ID" -H "Content-Type: application/json" -d '{"completed":true}'
call "按状态过滤" "$BASE?completed=true"
call "删除" -X DELETE "$BASE/$ID"
call "删除后再查 -> 404" "$BASE/$ID"

call "校验失败: 空 title -> 400" -X POST "$BASE" -H "Content-Type: application/json" -d '{"title":"  "}'
call "校验失败: 非法 JSON -> 400" -X POST "$BASE" -H "Content-Type: application/json" -d 'not json'
call "校验失败: 未知字段 -> 400" -X PATCH "$BASE/whatever" -H "Content-Type: application/json" -d '{"foo":1}'
call "非法查询参数 -> 400" "$BASE?completed=maybe"
call "不支持的方法 -> 405" -X PUT "$BASE"
