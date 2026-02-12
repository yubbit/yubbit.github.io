---
layout: post_portfolio
title: "Verdant Stream"
teaser: /assets/portfolio/verdant-stream/teaser.png
unity_embed: /assets/posts/2024-07-12-showcase
excerpt: "Particle effects test using WebGPU."
---

<link rel="stylesheet" href="/assets/posts/2024-07-12-showcase/TemplateData/style.css">
<div id="unity-container">
  <div id="unity-canvas-container">
    <canvas id="unity-canvas" style="width: 100%; height: 75vh; pointer-events: none"></canvas>
  </div>
  <div id="unity-loading-bar">
    <div id="unity-logo"></div>
    <div id="unity-progress-bar-empty">
        <div id="unity-progress-bar-full"></div>
    </div>
  </div>
  <div id="unity-warning"> </div>
  <div id="unity-footer" {{ display_footer }}>
      <div id="unity-logo-title-footer" {{ display_footer }}></div>
      <div id="unity-fullscreen-button" {{ display_footer }}></div>
      <div id="unity-build-title" {{ display_footer }}></div>
  </div>
</div>
<script async src="/assets/posts/2024-07-12-showcase/script.js" charset="utf-8"></script>


Particle effects test using WebGPU.

An early prototype of a particle effect I made for an immersive exhibit. This
should run on any WebGPU-capable browser.

These effects were created using Unity's VFX graph, which makes use of compute
shaders. Unfortunately, WebGL doesn't support compute shaders. This particular
scene was created when WebGPU support was still in preview in Unity.
