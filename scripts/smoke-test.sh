#!/usr/bin/env bash
# 冒烟测试：注册两个临时用户 A、B，依次调用所有接口，打印状态码和响应。
# 用法：bash scripts/smoke-test.sh [base_url]     默认 http://localhost:3000
# 每次运行都会在数据库里留下两个测试用户（邮箱 smoke-*@example.test）。
set -u
BASE_URL="${1:-http://localhost:3000}"
BASE="$BASE_URL/api/todos"
JAR_A=$(mktemp); JAR_B=$(mktemp)
trap 'rm -f "$JAR_A" "$JAR_B"' EXIT

# Better Auth 会校验 Origin 头防 CSRF，curl 默认不带，这里补上
JSON=(-H "Content-Type: application/json" -H "Origin: $BASE_URL")

call() {
  local label="$1"; shift
  echo "=== $label"
  curl -s --noproxy '*' -w "\n[HTTP %{http_code}]\n" "$@"
  echo
}

# 注册并把 session cookie 存进 cookie jar；响应体里有 token，不打印
sign_up() {
  local jar="$1" name="$2"
  local email="smoke-$name-$(date +%s)-$RANDOM@example.test"
  local code
  code=$(curl -s --noproxy '*' -o /dev/null -w "%{http_code}" -c "$jar" "${JSON[@]}" \
    -X POST "$BASE_URL/api/auth/sign-up/email" \
    -d "{\"name\":\"$name\",\"email\":\"$email\",\"password\":\"smoke-password-123\"}")
  echo "=== 注册用户 $name ($email)"
  echo "[HTTP $code]"; echo
}

call "未登录访问列表 -> 401" "$BASE"
call "未登录新建 -> 401" -X POST "$BASE" "${JSON[@]}" -d '{"title":"x"}'

sign_up "$JAR_A" A
sign_up "$JAR_B" B
A=(-b "$JAR_A"); B=(-b "$JAR_B")

call "A 的列表（新用户，应为空）" "${A[@]}" "$BASE"

# 测试数据用英文：Windows 的 Git Bash 下 curl -d 传中文可能不是 UTF-8 编码
echo "=== A 新建"
CREATED=$(curl -s --noproxy '*' "${A[@]}" -X POST "$BASE" "${JSON[@]}" -d '{"title":"write smoke test"}')
echo "$CREATED"; echo
ID=$(echo "$CREATED" | sed -E 's/.*"id":"([^"]+)".*/\1/')
echo "新建的 id: $ID"; echo

call "A 关键词搜索" "${A[@]}" "$BASE?q=smoke"
call "A 查询单个" "${A[@]}" "$BASE/$ID"
call "A 部分更新" "${A[@]}" -X PATCH "$BASE/$ID" "${JSON[@]}" -d '{"completed":true}'
call "A 按状态过滤" "${A[@]}" "$BASE?completed=true"

call "B 的列表（看不到 A 的，应为空）" "${B[@]}" "$BASE"
call "B 查询 A 的 todo -> 404" "${B[@]}" "$BASE/$ID"
call "B 修改 A 的 todo -> 404" "${B[@]}" -X PATCH "$BASE/$ID" "${JSON[@]}" -d '{"title":"hacked"}'
call "B 删除 A 的 todo -> 404" "${B[@]}" -X DELETE "$BASE/$ID"
call "A 再查，确认没被 B 改动" "${A[@]}" "$BASE/$ID"

call "A 删除" "${A[@]}" -X DELETE "$BASE/$ID"
call "删除后再查 -> 404" "${A[@]}" "$BASE/$ID"

call "校验失败: 空 title -> 400" "${A[@]}" -X POST "$BASE" "${JSON[@]}" -d '{"title":"  "}'
call "校验失败: 非法 JSON -> 400" "${A[@]}" -X POST "$BASE" "${JSON[@]}" -d 'not json'
call "校验失败: 未知字段 -> 400" "${A[@]}" -X POST "$BASE" "${JSON[@]}" -d '{"title":"x","userId":"someone-else"}'
call "非法查询参数 -> 400" "${A[@]}" "$BASE?completed=maybe"
call "不支持的方法 -> 405" -X PUT "$BASE"
