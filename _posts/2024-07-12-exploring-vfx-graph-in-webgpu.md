---
layout: post_blog
title: Exploring VFX Graph in WebGPU
sitemap: false
hide_last_modified: true
excerpt_separator: <!--more-->
---

This is a simple feature demo that shows Unity running VFX Graph in-browser 
with its experimental WebGPU renderer.

<!--more-->

<link rel="stylesheet" href="/assets/posts/2024-07-12-showcase/TemplateData/style.css">
<div id="unity-container">
<div id="unity-canvas-container">
<canvas id="unity-canvas" style="width: 100%; height: 100%;"></canvas>
</div>
<div id="unity-loading-bar">
<div id="unity-logo"></div>
<div id="unity-progress-bar-empty">
    <div id="unity-progress-bar-full"></div>
</div>
</div>
<div id="unity-warning"> </div>
    <div id="unity-footer">
    <div id="unity-logo-title-footer"></div>
    <div id="unity-fullscreen-button"></div>
    <div id="unity-build-title"></div>
</div>
</div>
<script async src="/assets/posts/2024-07-12-showcase/script.js" charset="utf-8"></script>
<br>

Previously, to get a Unity game running on canvas, you'd need to use the WebGL
graphics API which didn't support compute shaders, which VFX Graph needs to
run. However, WebGPU *does* support compute shaders. 

As of `Unity 6000.0.9f1`, You just need to insert the following line to the 
`ProjectSettings/ProjectSettings.asset` file:

```
  ...
  webGLMemoryGeom...
  webGLEnableWebGPU: 1
  webGLPowerPrefe...
  ...
```

Then just select it in the `Project Settings/Player` settings window:

![webgpu-setting](/assets/posts/2024-07-12-showcase/webgpu-setting.png)

Unfortunately, it doesn't seem like WebXR in WebGPU is supported yet, so
this can't be used in XR applications. In those cases, it'd still be
preferable to run the app natively with the Vulkan graphics API.

*Added 2024-07-15:* Unfortunately as of `Unity 6000.0.9f1` it doesn't seem
like rendering particle strips is supported yet either. There may also be
some problems with running GPU events nested more than two deep.
