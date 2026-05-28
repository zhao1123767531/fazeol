# 法泽在线

法泽在线是一个法学在线学习平台原型，包含学生端、教师端和管理员端。

当前版本支持：

- 注册和登录
- 后端密码加密校验
- 课程、考试、课表、成绩、消息等动态数据
- 教师上传课程视频、PDF、试卷
- 学生上传答卷文件
- 视频在线播放和文件下载

## 本地启动

```bash
npm start
```

打开：

```text
http://localhost:3000
```

## 默认演示账号

```text
admin / admin
T001 / T001
S2024001 / S2024001
```

首次运行时，前端会把演示数据写入后端，后端会将密码转换为加密哈希保存。

## 数据和上传文件

运行时数据保存在：

```text
data/state.json
```

上传文件保存在：

```text
uploads/
```

这些目录已加入 `.gitignore`，不要提交真实账号、密码哈希、视频、试卷或学生答卷。

## Vercel 部署说明

这个本地版本使用服务器磁盘保存 `data/` 和 `uploads/`。如果部署到 Vercel，建议迁移为：

- 结构化数据：Vercel Postgres、Neon 或 Supabase
- 视频/PDF/答卷文件：Vercel Blob、S3、Cloudflare R2 或 Supabase Storage

Vercel 的 Serverless 环境不会长期保留本地文件夹，因此不能直接依赖 `data/` 和 `uploads/` 作为生产存储。
