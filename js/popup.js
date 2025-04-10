// 初始化变量
let allTabs = [];
let sortedTabs = []; // 新增：用于存储按时间排序的副本
let fuse;
let selectedIndex = -1;

// 初始化搜索功能
async function initSearch() {
  // 获取所有标签页并包含lastAccessed属性
  allTabs = await chrome.tabs.query({});

  // 创建时间排序副本（直接用于初始显示）
  sortedTabs = [...allTabs].sort((a, b) => b.lastAccessed - a.lastAccessed);

  // 初始化 Fuse.js（保持原始数据用于搜索）
  fuse = new Fuse(allTabs, {
    keys: [
      { name: "title", weight: 0.7 },
      { name: "url", weight: 0.3 },
    ],
    threshold: 0.4,
    includeMatches: true,
    ignoreLocation: true,
    minMatchCharLength: 2,
    shouldSort: true,
    sortFn: (a, b) => {
      if (a.score !== b.score) {
        return a.score - b.score;
      } else {
        return b.item.lastAccessed - a.item.lastAccessed;
      }
    },
  });

  // 监听输入变化
  const searchInput = document.getElementById("search-input");
  searchInput.addEventListener("input", handleSearch);
  searchInput.addEventListener("keydown", handleKeyDown);

  // 初始显示按时间排序的标签页
  displayResults(sortedTabs.map((tab) => ({ item: tab })));
}

// 处理搜索逻辑（新增时间排序处理）
function handleSearch(e) {
  const query = e.target.value.trim();
  selectedIndex = -1;

  if (query === "") {
    // 查询为空时直接显示时间排序结果
    displayResults(sortedTabs.map((tab) => ({ item: tab })));
    return;
  }

  // 执行搜索并按规则排序
  const results = fuse.search(query);
  displayResults(results);
}

// 显示结果
function displayResults(results) {
  const container = document.getElementById("results-container");

  if (results.length === 0) {
    container.innerHTML = '<div class="no-results">没有找到匹配的标签页</div>';
    return;
  }

  let html = "";

  results.forEach((result, index) => {
    const tab = result.item;
    const isActive = index === selectedIndex;

    // 获取匹配的高亮部分
    const titleHighlight = highlightText(
      tab.title,
      result.matches?.find((m) => m.key === "title"),
    );
    const urlHighlight = highlightText(
      tab.url,
      result.matches?.find((m) => m.key === "url"),
    );
    const faviconUrl =
      tab.favIconUrl ||
      chrome.runtime.getURL(`chrome://favicon/${encodeURIComponent(tab.url)}`);

    html += `
      <div class="tab-item ${isActive ? "active" : ""}" data-tab-id="${tab.id}" data-index="${index}">
        <img class="favicon" src="${faviconUrl}">
        <div class="tab-content">
          <div class="tab-title">${titleHighlight}</div>
          <div class="tab-url">${urlHighlight}</div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  // 添加点击事件
  document.querySelectorAll(".tab-item").forEach((item) => {
    item.addEventListener("click", () => {
      const tabId = parseInt(item.getAttribute("data-tab-id"));
      switchToTab(tabId);
    });
  });
}

// 高亮匹配文本
function highlightText(text, matches) {
  if (!text) return "";
  if (!matches || !matches.indices || matches.indices.length === 0) {
    return text;
  }

  const textChars = [...text];
  const highlightMap = new Array(text.length).fill(false);

  // 标记需要高亮的位置
  matches.indices.forEach(([start, end]) => {
    for (let i = start; i <= end; i++) {
      if (i < text.length) highlightMap[i] = true;
    }
  });

  // 构建高亮结果
  let result = "";
  let inHighlight = false;

  textChars.forEach((char, index) => {
    if (highlightMap[index] && !inHighlight) {
      result += '<span class="highlight">';
      inHighlight = true;
    } else if (!highlightMap[index] && inHighlight) {
      result += "</span>";
      inHighlight = false;
    }
    result += char;
  });

  if (inHighlight) {
    result += "</span>";
  }

  return result;
}

// 处理键盘导航
function handleKeyDown(e) {
  const results = document.querySelectorAll(".tab-item");
  if (results.length === 0) return;

  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      selectedIndex = (selectedIndex + 1) % results.length;
      updateSelection();
      break;

    case "ArrowUp":
      e.preventDefault();
      selectedIndex = (selectedIndex - 1 + results.length) % results.length;
      updateSelection();
      break;

    case "Enter":
      if (selectedIndex >= 0) {
        const tabId = parseInt(
          results[selectedIndex].getAttribute("data-tab-id"),
        );
        switchToTab(tabId);
      }
      break;

    case "Escape":
      window.close();
      break;
  }
}

// 更新选中项样式
function updateSelection() {
  const items = document.querySelectorAll(".tab-item");
  items.forEach((item, index) => {
    if (index === selectedIndex) {
      item.classList.add("active");
      item.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } else {
      item.classList.remove("active");
    }
  });
}

// 切换到指定标签页
function switchToTab(tabId) {
  chrome.tabs.update(tabId, { active: true });
  window.close();
}

// 初始化
document.addEventListener("DOMContentLoaded", initSearch);
