---
layout: post
title: Demonstrating Leap SDK's Hand Physics in WebXR
sitemap: false
hide_last_modified: true
excerpt_separator: <!--more-->
---

This is a quick feature demo showing hand physics working in WebXR. To run
this, simply open it in the Meta Quest browser.

<!--more-->

<link rel="stylesheet" href="/assets/2024-07-18-leap-sdk-in-webxr/TemplateData/style.css">
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
<div id="unity-footer">
<div id="unity-webgl-logo"></div>
<button id="entervr" value="Enter VR" disabled>VR</button>
<button id="enterar" value="Enter AR" disabled>AR</button>
<div id="unity-webxr-link">Using <a href="https://github.com/De-Panther/unity-webxr-export" target="_blank" title="WebXR Export">WebXR Export</a></div>
<div id="unity-build-title">WebXR-Leap</div>
</div>
</div>
<script async src="/assets/2024-07-18-leap-sdk-in-webxr/script.js" charset="utf-8"></script>
<br>

This makes use of [De-Panther's WebXR Export](https://github.com/De-Panther/unity-webxr-export)
and the [Ultraleap Unity Plugin](https://docs.ultraleap.com/xr-and-tabletop/xr/unity/index.html),
which both come with their own set of samples which are generally more stable
than this.

Getting this to work was really finnicky and I'm having some trouble
reproducing the initial environment, but having this as a base project could
serve as a template for other things I'd like to do in the future.

Some things to note are that WebXR only works when accessing a web page with
`https://...`, which initially tripped me up when attempting to test it with
Github pages. Its performance overall is also pretty sluggish, particularly
in the hand physics scene, which is something that I'll need to look into
going forward.
