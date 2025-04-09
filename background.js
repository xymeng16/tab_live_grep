// 创建居中窗口
function createCenterWindow() {
  console.log("Creating centered window");
  chrome.windows.getCurrent((currentWindow) => {
    const width = 600;
    const height = 700;

    chrome.windows.create({
      url: "popup.html",
      type: "popup",
      width: width,
      height: height,
      left: Math.round((currentWindow.width - width) / 2 + currentWindow.left),
      top: Math.round((currentWindow.height - height) / 2 + currentWindow.top),
      focused: true,
    });
  });
}

// 工具栏按钮点击事件
chrome.action.onClicked.addListener(createCenterWindow);

// 快捷键监听
chrome.commands.onCommand.addListener((command) => {
  if (command === "_execute_action") {
    createCenterWindow();
  }
});
