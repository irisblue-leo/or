#!/bin/bash

echo "=========================================="
echo "测试邮箱验证功能"
echo "=========================================="

# 测试数据
TEST_EMAIL="test$(date +%s)@example.com"
TEST_PASSWORD="Test123456"

echo ""
echo "1. 测试用户注册..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"Test User\"}")

echo "注册响应: $REGISTER_RESPONSE"

# 提取 token
TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ 注册失败"
    exit 1
fi

echo "✓ 注册成功"
echo "Token: $TOKEN"

echo ""
echo "2. 测试获取用户信息..."
USER_INFO=$(curl -s http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN")

echo "用户信息: $USER_INFO"

echo ""
echo "3. 测试重新发送验证邮件..."
RESEND_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/resend-verification \
  -H "Authorization: Bearer $TOKEN")

echo "重发响应: $RESEND_RESPONSE"

echo ""
echo "=========================================="
echo "测试完成！"
echo "=========================================="
echo "测试邮箱: $TEST_EMAIL"
echo "请检查邮箱是否收到验证邮件"
echo "=========================================="
