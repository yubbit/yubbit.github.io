---
layout: post_portfolio
title: "Roma Street Parkland 3D Scan"
teaser: /assets/portfolio/roma-street-parkland/teaser.jpg
excerpt: "A 3D scan of Roma Street Parkland in Brisbane, Australia."
---

<iframe id="viewer" width="100%" allow="fullscreen; xr-spatial-tracking" src="https://superspl.at/s?id=86ae2808"></iframe>
<script>
    window.addEventListener('load', function() {
        initializeV();
        function initializeV(){
            var vh = window.innerHeight/100;
            var iframe = document.getElementById('viewer');
            iframe.style.height = 75*vh+'px';
            // iframe.style.pointerEvents = 'none';
        }
        window.addEventListener('resize',function(){
              initializeV();
        });
    });
</script>

A 3D scan of Roma Street Parkland in Brisbane, Australia.

This was taken with a Google Pixel 6A. The initial reconstruction was done in
RealityCapture (now RealityScan), and the Gaussian splat was generated using
Nerfstudio using `splatfacto-big`.

The initial reconstruction ran into some issues with loop closure, so I had to
manually stitch parts of the scene by manually defining control points.
