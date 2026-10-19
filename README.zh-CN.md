# WeryAI Image Toolkit

免费、在浏览器中处理图片的工具站。无需账号，不上传图片。

**[在线压缩图片 →](https://weryaiexpertteam.github.io/browser-image-toolkit/)** · [全部工具](https://weryaiexpertteam.github.io/browser-image-toolkit/tools.html) · [Chrome 插件](extension/) · [English](README.md)

![图片压缩](screenshots/00-compressor-home.jpg)

## 图片压缩（首页 + Chrome 插件）

- 拖入、选择或粘贴 JPG、PNG、WebP、HEIC，一张或几百张都行，放进来就开始压缩。
- 三档：高画质 / 均衡 / 最小体积；还可以指定输出格式、最长边和目标体积（KB）。
- **智能格式：**PNG 会同时尝试 WebP 和 JPEG，取最小的；透明背景会保留。
- **不会变大：**如果重新编码反而更大，就保留原图，标为“Already optimized”。
- 多线程并行处理，可以单张下载或打包 ZIP。
- 同一套引擎也做成了 Chrome 插件，在网页图片上右键即可压缩，见 [extension/README.md](extension/README.md)。

## 其他工具（[tools.html](https://weryaiexpertteam.github.io/browser-image-toolkit/tools.html)）

- **拼贴排版：**网格、横向或竖向拼接，编号和文件名标签，编号 ZIP 导出。
- **网格裁剪：**按行列切片，自定义偏移和单片尺寸，打包下载。
- **滑动对比视频：**两张图片滑动对比，自定义缓动和分隔线，导出 WebM。
- **封面制作：**组合背景、可拖拽浮层、箭头和文字，导出 JPG。
- **去背景入口：**跳转到 WeryAI 的独立在线服务；不会自动传递已选图片。

压缩首页为英文；其他工具页右上角可以切换中英文。建议使用较新桌面版 Chrome 或 Edge；WebM、Canvas 和 HEIC 的支持取决于浏览器和文件类型。

## 隐私

五个本地编辑工具中的图片留在浏览器内。工具站没有图片上传接口、分析追踪或账号要求；关闭页面后不保留图片，仅在本机保存语言和上次使用工具的偏好。

JSZip 随仓库提供。第一次导入 HEIC/HEIF 时，会从 jsDelivr 下载固定版本 heic2any 0.0.4 的**解码代码**，不会上传图片。因此 HEIC 转换需要网络，且可能无法处理所有 HEIC 变体；其他工具无需下载远程库。

WeryAI 外部链接会打开独立网站，有各自的隐私条款、账号要求和定价。是否在那里上传图片由你决定。

## 本地运行

下载或克隆仓库后，直接打开 **index.html**。无需构建或 API 密钥。如果浏览器限制 `file://` 的 Worker，可在此目录运行：

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

然后打开 `http://127.0.0.1:8000/`。大批量图片、大画布和视频录制受设备内存限制；目标体积为近似值，部分输出可能比原图更大。

## 更多 AI 工具

- [WeryAI 创意 AI 工具](https://www.wery.ai/?utm_source=github)
- [Zeny — AI 图片增强](https://www.wery.ai/en/@Zeny-Design-AI-Expert-Workspace/ai-photo-enhancer?utm_source=github)
- [Zeny — AI 图片去背景](https://www.wery.ai/en/@Zeny-Design-AI-Expert-Workspace/ai-background-remover?utm_source=github)

## 协议

本项目代码使用 [MIT 协议](LICENSE)，版权所有 WeryAI Limited。第三方依赖保留各自协议，详见 [第三方说明](THIRD_PARTY_NOTICES.md)，其中包括 HEIC 底层解码器的 LGPL 组件。
