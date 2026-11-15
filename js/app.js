const listEl = document.querySelector("#list");
const statusEl = document.querySelector("#status");
const tagsEl = document.querySelector("#tags");
const resultEl = document.querySelector("#result-line");
const statEl = document.querySelector("#collected-stat");
const searchEl = document.querySelector("#search");
const toolbarEl = document.querySelector(".toolbar");

const state = {
  items: [],
  tag: "all",
  query: "",
};

searchEl.addEventListener("input", () => {
  state.query = searchEl.value;
  renderList();
});

init();

async function init() {
  if (location.protocol === "file:") {
    statEl.textContent = "未能读取";
    showStatus("请在仓库根目录启动静态服务器，再用浏览器打开。这样页面才能读取 data/tutorials.json。", "error");
    return;
  }

  try {
    const response = await fetch("data/tutorials.json", { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(String(response.status));
    }
    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error("not-array");
    }
    state.items = data;
    statEl.textContent = `已收录 ${data.length} 条`;
    renderTags();
    renderList();
  } catch (error) {
    statEl.textContent = "未能读取";
    showStatus("教程列表没有加载出来。请确认打开的是站点根目录，并且 data/tutorials.json 可以访问。", "error");
  }
}

function ordered(items) {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const byCollected = String(b.item.collectedAt || "").localeCompare(String(a.item.collectedAt || ""));
      if (byCollected) return byCollected;
      return a.index - b.index;
    })
    .map(({ item }) => item);
}

function normalize(value) {
  return String(value || "").toLowerCase().replaceAll("@", "");
}

function haystack(item) {
  const tags = Array.isArray(item.tags) ? item.tags : [];
  return normalize([item.title, item.summary, item.author, item.authorName, item.note, ...tags].filter(Boolean).join("\n"));
}

function filtered() {
  const query = normalize(state.query.trim());
  return ordered(state.items).filter((item) => {
    const tags = Array.isArray(item.tags) ? item.tags : [];
    if (state.tag !== "all" && !tags.includes(state.tag)) return false;
    if (!query) return true;
    return haystack(item).includes(query);
  });
}

function renderTags() {
  const counts = new Map();
  const tags = [];
  for (const item of state.items) {
    for (const tag of item.tags || []) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
      if (!tags.includes(tag)) tags.push(tag);
    }
  }
  tagsEl.replaceChildren(
    chip("全部", "all", state.items.length),
    ...tags.map((tag) => chip(tag, tag, counts.get(tag) || 0)),
  );
}

function chip(label, tag, count) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "chip";
  if (state.tag === tag) button.classList.add("is-active");
  button.setAttribute("aria-pressed", String(state.tag === tag));
  const name = document.createElement("span");
  name.textContent = label;
  const num = document.createElement("span");
  num.className = "count";
  num.textContent = String(count);
  button.append(name, num);
  button.addEventListener("click", () => {
    const next = state.tag === tag && tag !== "all" ? "all" : tag;
    setTag(next, false);
  });
  return button;
}

function setTag(tag, scroll) {
  state.tag = tag;
  renderTags();
  renderList();
  if (scroll) {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    toolbarEl.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }
}

function renderList() {
  const items = filtered();
  resultEl.replaceChildren();
  const summary = document.createElement("span");
  summary.textContent = resultText(items.length);
  resultEl.append(summary);
  if (state.tag !== "all" || state.query.trim()) {
    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "text-button";
    clear.textContent = "清除筛选";
    clear.addEventListener("click", () => {
      state.tag = "all";
      state.query = "";
      searchEl.value = "";
      renderTags();
      renderList();
      searchEl.focus();
    });
    resultEl.append(clear);
  }

  if (!state.items.length) {
    listEl.replaceChildren();
    listEl.hidden = true;
    showStatus("还没有收录教程。往 data/tutorials.json 追加一条后再刷新。", "empty");
    return;
  }

  if (!items.length) {
    listEl.replaceChildren();
    listEl.hidden = true;
    showStatus("没有匹配的教程。换个关键词，或清除筛选后再看。", "empty");
    return;
  }

  statusEl.hidden = true;
  listEl.hidden = false;
  listEl.replaceChildren(...items.map(renderCard));
}

function resultText(count) {
  const bits = [`当前显示 ${count} 条`];
  if (state.tag !== "all") bits.push(`标签「${state.tag}」`);
  const query = state.query.trim();
  if (query) bits.push(`搜索「${query}」`);
  if (state.tag === "all" && !query) bits.push("按收录时间倒序");
  return bits.join(" · ");
}

function renderCard(item) {
  const card = document.createElement("article");
  card.className = "card";
  const note = typeof item.note === "string" ? item.note.trim() : "";
  if (note) card.classList.add("has-note");

  card.append(renderTagList(item.tags), renderTitle(item), renderSummary(item.summary));
  if (note) {
    const noteEl = document.createElement("p");
    noteEl.className = "note";
    noteEl.textContent = formatNote(note);
    card.append(noteEl);
  }

  const foot = document.createElement("div");
  foot.className = "card-foot";
  const meta = document.createElement("div");
  meta.className = "meta";
  meta.append(renderAuthor(item), renderDates(item));
  const stats = renderEngagement(item.engagement);
  if (stats) meta.append(stats);
  foot.append(meta, renderPostLink(item.url));
  card.append(foot);
  return card;
}

function renderTagList(tags) {
  const list = document.createElement("ul");
  list.className = "card-tags";
  for (const tag of tags || []) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = tag;
    button.setAttribute("aria-label", `只看「${tag}」`);
    button.addEventListener("click", () => setTag(tag, true));
    item.append(button);
    list.append(item);
  }
  return list;
}

function renderTitle(item) {
  const heading = document.createElement("h2");
  heading.className = "card-title";
  const url = safeUrl(item.url);
  const title = item.title || "（无标题）";
  if (!url) {
    heading.textContent = title;
    return heading;
  }
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = title;
  heading.append(link);
  return heading;
}

function renderSummary(summary) {
  const paragraph = document.createElement("p");
  paragraph.className = "summary";
  paragraph.textContent = summary || "";
  return paragraph;
}

function renderAuthor(item) {
  if (!item.author) {
    const span = document.createElement("span");
    span.className = "author";
    span.textContent = item.authorName || "未知作者";
    return span;
  }
  const link = document.createElement("a");
  link.className = "author";
  link.href = `https://x.com/${encodeURIComponent(item.author)}`;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  const handle = `@${item.author}`;
  if (item.authorName) {
    const name = document.createElement("span");
    name.className = "author-name";
    name.textContent = item.authorName;
    const id = document.createElement("span");
    id.className = "author-handle";
    id.textContent = handle;
    link.append(name, id);
  } else {
    link.textContent = handle;
  }
  return link;
}

function renderDates(item) {
  const line = document.createElement("p");
  line.className = "dates";
  const bits = [];
  if (item.publishedAt) bits.push(`${formatDate(item.publishedAt)}发布`);
  if (item.collectedAt) bits.push(`${formatDate(item.collectedAt)}收录`);
  line.textContent = bits.join(" · ");
  return line;
}

function renderEngagement(engagement) {
  if (!engagement || typeof engagement !== "object") return null;
  const parts = [
    ["likes", "点赞"],
    ["reposts", "转发"],
    ["views", "浏览"],
  ].flatMap(([key, label]) => (
    Number.isFinite(engagement[key]) ? [`${Number(engagement[key]).toLocaleString("zh-CN")} ${label}`] : []
  ));
  if (!parts.length) return null;
  const line = document.createElement("p");
  line.className = "engagement";
  line.textContent = parts.join(" · ");
  return line;
}

function renderPostLink(url) {
  const href = safeUrl(url);
  if (!href) {
    const span = document.createElement("span");
    span.className = "post-link";
    span.textContent = "原帖链接缺失";
    return span;
  }
  const link = document.createElement("a");
  link.className = "post-link";
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "查看原帖";
  const hint = document.createElement("span");
  hint.className = "sr-only";
  hint.textContent = "（在新标签页打开）";
  link.append(hint);
  return link;
}

function formatNote(note) {
  if (note.startsWith("注：")) return note;
  if (note.startsWith("注:")) return `注：${note.slice(2)}`;
  return `注：${note}`;
}

function formatDate(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso));
  if (!match) return String(iso || "");
  return `${match[1]}年${Number(match[2])}月${Number(match[3])}日`;
}

function safeUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") return parsed.href;
  } catch (error) {
    return "";
  }
  return "";
}

function showStatus(message, kind) {
  statusEl.hidden = false;
  statusEl.textContent = message;
  statusEl.className = kind === "error" ? "status status-error" : "status";
}
