# Grok Bot 最新实用教学

一个纯静态中文站点，用来收集整理 X（Twitter）上关于 Grok Bot（桌面 AI 助理）的使用教程、技巧和玩法。

页面从 `data/tutorials.json` 读取全部条目。以后加内容，只改这个文件，不用改 HTML、CSS 或 JS。站点使用相对路径，没有构建步骤，可以从仓库根目录直接放到 GitHub Pages、Vercel 或其他静态托管上。

## 本地预览

在仓库根目录启动静态服务器：

```bash
python3 -m http.server 8742
```

然后在浏览器打开 [http://127.0.0.1:8742](http://127.0.0.1:8742)。

Windows 上如果没有 `python3` 命令，可以用：

```bash
py -m http.server 8742
```

也可以用其他静态服务器，例如 `npx serve`。请从仓库根目录提供文件，这样 `index.html`、`css/`、`js/`、`data/` 的相对路径才能对上。用文件协议直接打开 `index.html` 时，浏览器读不到 JSON，列表不会出现。

## 数据文件

路径：`data/tutorials.json`

文件是一个数组，每条教程是一个对象。页面按 `collectedAt` 从新到旧排列；收录日期相同时，保持它们在文件里的先后顺序。

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | 是 | 简短中文标题 |
| `summary` | 是 | 一两句中文摘要 |
| `author` | 是 | X 用户名，不带 `@` |
| `authorName` | 否 | 作者显示名。有的话，卡片上会写成「显示名 @用户名」 |
| `url` | 是 | 原帖链接，形如 `https://x.com/用户名/status/帖子id` |
| `publishedAt` | 是 | 发布日期，`YYYY-MM-DD` |
| `tags` | 是 | 字符串数组。一条可以有多个标签，新标签会自动出现在筛选条里 |
| `engagement` | 否 | 热度。没有就写 `null`。有数据时写成 `{ "likes": 12, "reposts": 3, "views": 400 }`，三个数字都可以只填其中几个 |
| `collectedAt` | 是 | 收录日期，`YYYY-MM-DD` |
| `note` | 否 | 需要在卡片上提醒读者的话。页面会醒目显示成「注：」加上这段文字 |

`engagement` 里的三个键分别是点赞、转发、浏览。值为 `null`、省略整个字段，或三个数字都空着，卡片上都不显示热度。

## 新增一条教程

1. 打开 `data/tutorials.json`。
2. 在数组里追加一个对象。注意上一条末尾要有逗号，整个文件仍是合法 JSON。
3. 保存后刷新浏览器。筛选条、搜索和排序都会把新条目算进去，不用改页面代码。

可以复制下面这条再改。链接里的 `EXAMPLE` 是模板占位，收录真实帖子时换成该帖的用户名和帖子 id。

```json
{
  "title": "这里写简短中文标题",
  "summary": "一两句中文摘要，说明这条教程在讲什么。",
  "author": "example_user",
  "authorName": "可选的显示名",
  "url": "https://x.com/example_user/status/EXAMPLE",
  "publishedAt": "2026-11-16",
  "tags": ["技巧", "入门"],
  "engagement": null,
  "collectedAt": "2026-11-16",
  "note": "可选。页面会显示成「注：」加上这段话"
}
```

有热度数据时，把 `engagement` 写成：

```json
"engagement": {
  "likes": 120,
  "reposts": 18,
  "views": 5600
}
```

不需要提醒读者时，删掉 `note` 字段即可。

## 部署

### GitHub Pages

站点从仓库 [zoujiake66/Grok-Bot](https://github.com/zoujiake66/Grok-Bot) 的 `main` 分支根目录发布，不需要构建命令。

发布地址：[https://zoujiake66.github.io/Grok-Bot/](https://zoujiake66.github.io/Grok-Bot/)

1. 把仓库推到 GitHub 的 `main`。
2. 打开仓库的 **Settings → Pages**。
3. 在 **Build and deployment** 里，Source 选 **Deploy from a branch**。
4. Branch 选 **`main`**，Folder 选 **`/ (root)`**，不要选 `/docs`。
5. 保存后等待发布完成，再打开上面的地址。

根目录的 `.nojekyll` 会让 Pages 按原样放出这些文件，不去跑 Jekyll。样式、脚本、图标和教程数据都是相对路径：

- `css/style.css`
- `js/app.js`
- `data/tutorials.json`
- `favicon.svg`

页面在 `https://zoujiake66.github.io/Grok-Bot/` 下打开时，这些地址会落到同一子路径里，例如 `https://zoujiake66.github.io/Grok-Bot/data/tutorials.json`，不会跑到用户主页的根目录。GitHub Pages 会把不带结尾斜杠的 `/Grok-Bot` 转到 `/Grok-Bot/`，相对路径因此能对上。

更新教程时，改完 `data/tutorials.json` 再推上去，等 Pages 重新发布后刷新即可。如果还是旧列表，强制刷新一次。

### Vercel

把仓库导入 Vercel。Framework Preset 选 Other，Build Command 留空，Output Directory 用仓库根目录（`.`）。不需要安装依赖。

### 其他静态托管

把仓库根目录当作网站根目录上传或指向即可。需要能直接访问 `index.html` 和 `data/tutorials.json`。
