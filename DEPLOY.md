# MustLoop 公网部署说明

## 当前定位

这个版本已经支持：

- 通过 Node 服务对外提供网页
- 多设备访问同一台服务器时共享任务、私聊、通知等数据
- 数据持久化到服务器磁盘文件 `data/store.json`
- 通过 Docker 或直接运行 Node 进行部署

这个版本目前更适合：

- 课程演示
- 校内小范围测试
- 单机单实例部署

这个版本目前还不适合直接作为正式生产平台开放给真实陌生用户注册，原因是：

- 业务权限仍主要在前端，服务端尚未做到严格鉴权和逐接口权限校验
- 当前共享状态接口会返回整份业务数据，后续若做正式生产，需要改成按用户权限下发数据
- 账号密码仍是演示版结构，未做正式生产级的加密与会话体系

如果你的目标是“先能公网访问、先能同步使用”，当前版本已经可以上线。
如果你的目标是“正式生产可长期运营”，下一阶段必须继续做后端权限重构。

## 方式一：直接在云服务器部署

适合：

- 你有 Linux 云服务器
- 你准备自己配域名、HTTPS、反向代理

步骤：

1. 安装 Node.js 20 或更高版本
2. 上传整个项目目录
3. 进入项目目录后启动：

```bash
node server.js
```

或：

```bash
npm start
```

默认监听：

- `HOST=0.0.0.0`
- `PORT=3000`

可选环境变量：

- `PORT`：服务端口
- `HOST`：监听地址
- `DATA_DIR`：数据目录
- `STORE_FILE`：数据文件完整路径
- `BODY_LIMIT_BYTES`：接口最大请求体大小

示例：

```bash
HOST=0.0.0.0 PORT=3000 DATA_DIR=/opt/mustloop-data node server.js
```

## 方式二：Docker 部署

构建镜像：

```bash
docker build -t mustloop:latest .
```

运行容器：

```bash
docker run -d \
  --name mustloop \
  -p 3000:3000 \
  -v /opt/mustloop-data:/app/data \
  -e PORT=3000 \
  mustloop:latest
```

说明：

- `-v /opt/mustloop-data:/app/data` 很重要
- 不挂载持久化目录的话，容器重建后数据会丢失

## 方式三：部署到支持 Docker 的平台

适合：

- Railway
- Render
- Fly.io
- Zeabur
- 其他支持 Docker 的平台

建议：

1. 直接使用仓库里的 `Dockerfile`
2. 设置持久化磁盘并挂到 `/app/data`
3. 平台端口使用环境变量 `PORT`
4. 健康检查路径填 `/api/health`

## 域名与 HTTPS

推荐在 Node 服务前面加一层反向代理，比如：

- Nginx
- Caddy
- Cloudflare Tunnel

建议至少做到：

1. 域名解析到服务器
2. HTTPS 证书启用
3. 反向代理到 `127.0.0.1:3000`

Nginx 示例：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 启动后验证

浏览器访问：

- `http://你的服务器IP:3000/`

健康检查：

- `http://你的服务器IP:3000/api/health`

如果返回 JSON，说明服务端正常运行。

## 数据文件

服务端数据默认保存在：

```text
data/store.json
```

公网部署时建议：

1. 定期备份这个文件
2. 不要把运行中的数据文件直接提交到仓库
3. 迁移服务器时一并迁移这个文件

## 下一阶段建议

如果你要把它升级成真正正式可运营的网站，下一步建议按这个顺序继续做：

1. 登录、注册改成服务端鉴权
2. 密码改成哈希存储
3. 聊天、通知、任务等接口改成按用户权限读取
4. 从 `store.json` 升级到数据库
5. 聊天改成 WebSocket 实时推送
6. 管理员能力和风控能力转到后端
