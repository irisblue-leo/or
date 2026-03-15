# 数据库同步脚本使用说明

> 用于将本地的数据库更改同步到线上环境

## 📋 包含的更改

### 1. User 表新增字段
- `preferredAggregator` - 用户选择的聚合器（default/openrouter/302ai）
- `enableSmartModel` - 是否启用智能模型选择

### 2. 新增 302.ai 上游提供商
- 名称：302.ai
- API URL：https://api.302.ai/v1
- 优先级：10

### 3. 新增 5 个 302.ai 模型
- GPT-4o (302.ai)
- Claude 3.5 Sonnet (302.ai)
- DeepSeek Chat (302.ai)
- Qwen Max (302.ai)
- GLM-4 (302.ai)

---

## 🚀 使用方法

### 方法 1：使用 SQL 文件（推荐）

```bash
# 在线上服务器执行
psql $DATABASE_URL -f sync-database.sql
```

或者指定数据库连接：

```bash
psql "postgresql://user:password@host:5432/database" -f sync-database.sql
```

### 方法 2：使用 Shell 脚本

```bash
# 设置环境变量
export DATABASE_URL="postgresql://user:password@host:5432/database"

# 执行脚本
chmod +x sync-database.sh
./sync-database.sh
```

### 方法 3：通过 SSH 远程执行

```bash
# 上传 SQL 文件到服务器
scp sync-database.sql user@server:/tmp/

# SSH 登录并执行
ssh user@server
cd /tmp
psql $DATABASE_URL -f sync-database.sql
```

---

## ⚠️ 注意事项

### 1. 备份数据库
在执行同步前，建议先备份数据库：

```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. 检查环境变量
确保 `DATABASE_URL` 环境变量已正确设置：

```bash
echo $DATABASE_URL
```

### 3. 测试连接
先测试数据库连接是否正常：

```bash
psql $DATABASE_URL -c "SELECT version();"
```

### 4. 幂等性
脚本是幂等的，可以多次执行而不会出错：
- 字段已存在时会跳过
- 提供商已存在时会更新
- 模型已存在时会更新

---

## 📊 验证结果

执行完成后，脚本会自动显示：

1. **上游提供商列表**
   ```
   name    | slug       | active | priority
   --------|------------|--------|----------
   主线路  | main       | t      | 10
   302.ai  | 302ai      | t      | 10
   OpenRouter | openrouter | t   | 5
   ```

2. **302.ai 模型列表**
   ```
   name                       | provider  | upstreamModelId
   ---------------------------|-----------|---------------------------
   GPT-4o (302.ai)            | openai    | gpt-4o
   Claude 3.5 Sonnet (302.ai) | anthropic | claude-3-5-sonnet-20240620
   DeepSeek Chat (302.ai)     | deepseek  | deepseek-chat
   Qwen Max (302.ai)          | qwen      | qwen-max
   GLM-4 (302.ai)             | zhipu     | glm-4-0520
   ```

3. **User 表新增字段**
   ```
   column_name         | data_type | column_default
   --------------------|-----------|----------------
   preferredAggregator | text      | 'default'
   enableSmartModel    | boolean   | false
   ```

---

## 🔧 故障排除

### 问题 1：连接失败
```
psql: error: connection to server failed
```

**解决方案**：
- 检查 DATABASE_URL 是否正确
- 检查网络连接
- 检查防火墙设置

### 问题 2：权限不足
```
ERROR: permission denied for table "User"
```

**解决方案**：
- 确保数据库用户有 ALTER TABLE 权限
- 使用管理员账号执行

### 问题 3：字段已存在
```
ERROR: column "preferredAggregator" of relation "User" already exists
```

**解决方案**：
- 这是正常的，脚本会自动跳过
- 或者字段已经同步过了

---

## 📝 执行日志示例

```
✅ Added preferredAggregator column
✅ Added enableSmartModel column
INSERT 0 1
✅ 5 models added/updated for 302.ai

==========================================
验证数据
==========================================

上游提供商列表：
    name    |    slug    | active | priority |           apiUrl           
------------+------------+--------+----------+----------------------------
 主线路     | main       | t      |       10 | https://hone.vvvv.ee/v1
 302.ai     | 302ai      | t      |       10 | https://api.302.ai/v1
 OpenRouter | openrouter | t      |        5 | https://openrouter.ai/api/

302.ai 模型列表：
            name            | provider  |      upstreamModelId       | active 
----------------------------+-----------+----------------------------+--------
 GPT-4o (302.ai)            | openai    | gpt-4o                     | t
 Claude 3.5 Sonnet (302.ai) | anthropic | claude-3-5-sonnet-20240620 | t
 DeepSeek Chat (302.ai)     | deepseek  | deepseek-chat              | t
 Qwen Max (302.ai)          | qwen      | qwen-max                   | t
 GLM-4 (302.ai)             | zhipu     | glm-4-0520                 | t

User 表新增字段：
   column_name      | data_type | column_default 
--------------------+-----------+----------------
 preferredAggregator| text      | 'default'
 enableSmartModel   | boolean   | false

==========================================
✅ 数据库同步完成！
==========================================
```

---

## 🔄 回滚方案

如果需要回滚更改：

```sql
-- 删除 User 表字段
ALTER TABLE "User" DROP COLUMN IF EXISTS "preferredAggregator";
ALTER TABLE "User" DROP COLUMN IF EXISTS "enableSmartModel";

-- 删除 302.ai 模型
DELETE FROM "Model" WHERE "upstreamProvider" = '302ai';

-- 删除 302.ai 提供商
DELETE FROM "UpstreamProvider" WHERE slug = '302ai';
```

---

## 📞 支持

如果遇到问题，请联系：
- 王二（产品经理）
- 项目路径：/Users/shodan/project/openclaw-relay

---

**创建时间**: 2026-03-15  
**版本**: 1.0  
**适用环境**: 生产环境 / 测试环境
