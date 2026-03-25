---
layout: post_blog
title: "Gaussian Splats in Unity: A Deep Dive into VFX Graph Implementation"
---

I've been playing around with Gaussian splatting quite a lot, and recently wanted to look under the hood to see how the rendering process actually works.

After reading the original paper and studying sample implementations, I found that rendering is performed in the forward pass using the EWA (Elliptical Weighted Averaging) algorithm. This involves sorting each splat's centerpoint by its distance to the camera using radix sort, then tiling each sorted splat according to its covariance matrix, opacity, and spherical harmonics coefficients. Once sorted, splats are rendered in order of depth priority.

My goal with this implementation was different from standard approaches. My background working closely with VFX artists led me to seek a more flexible method of representing splats. I set off with the goal of implementing a particle fade-in effect while still keeping the level of fidelity seen in a full implementation.

My search began with the [Unity Gaussian Splatting](https://github.com/aras-p/UnityGaussianSplatting) repository by aras-p, which faithfully reproduced the original method using the EWA algorithm but didn't offer the flexibility I needed for custom effects. Later, I discovered keijiro's [SplatVFX](https://github.com/keijiro/SplatVFX), which worked well enough on the surface for my use case.

However, SplatVFX had two major limitations: it used a custom `.splat` format instead of conventional `.ply` files from standard exporters like LichtFeld Studio or PostShot, making file conversion tedious between different viewers. Furthermore, it lacked spherical harmonic support for view-direction-dependent coloring, significantly lowering visual fidelity.

Given these limitations, I decided to build my own personal implementation. Ultimately, I chose to stick with keijiro's approach of managing GPU memory allocation directly via `GraphicsBuffer` objects, while adding missing spherical harmonic coefficient support and working with the standard `.ply` format for better compatibility. I also developed a custom importer and VFX Graph simultaneously for cross-validation during development.

## Data Architecture & Import Strategy

The heart of the system is the `SplatData` class, which stores all information required to render a Gaussian splat while managing the allocation and freeing of `GraphicsBuffer` objects for VRAM storage. I deliberately followed keijiro's memory management approach but added structures for storing or managing each splat's spherical harmonic coefficients, since keijiro's implementation lacked them entirely. This became one of my first priorities early in development.

The `SplatImporter` class implements a Unity `ScriptedImporter`, which runs automatically when matching files are dragged into the Project window. I rewrote the importer to work with `.ply` files instead of keijiro's custom format because I wanted compatibility with most other Gaussian splatting software. The goal was twofold: add support for spherical harmonics and retain as much of the original data as possible from standard export pipelines.

Working with PLY files revealed several key characteristics that shaped my implementation decisions. The header section describes vertex count, data representation types, and schema layout in ASCII format. Data is typically stored entirely in `float`, though other types are technically possible. Binary data begins after the `end_header` line, making validation straightforward via byte divisibility checks. Each data point represents a complete splat with the following data:
   - Mean position
   - Rotation quaternion
   - Axis scaling values
   - RGB color values
   - Opacity value
   - Spherical harmonic coefficients (45 total representing 3rd degree)

Color encoding in PLY files stores values as `0.5f + color + SH_C0`, representing strength from `[0..1]`. Opacity conversion requires applying a sigmoid function to obtain equivalent alpha values in `[0..1]`, while scale transformation needs an exponential function for appropriate interpretation. A notable implementation detail: spherical harmonic coefficients are stored contiguously per channel rather than interleaved—`f_rest0` to `f_rest14` represent red channel coefficients, `f_rest15` to `f_rest29` represent green, and `f_rest30` to `f_rest44` represent blue.

My initial parser had a dictionary-based approach using string comparisons for data point naming and location mapping in the `SplatData` class. However, this proved problematic since string comparison is slow and cannot leverage Unity's Burst compiler for performance optimization. I needed numerical operations that could be compiled and Burst-compiled for GPU-bound workloads.

The solution came when I pivoted to an offset array approach with `NativeArray.ReinterpretLoad` to parse the byte data into the correct type. Reading individual data points could technically be achieved via unsafe pointers, but I wanted certainty that Unity features were definitely Burst compatible for maximum performance. Arrays initialized to 0s helped sidestep missing information issues, particularly for spherical harmonics fields sometimes not populated in all PLY exports from different authoring tools. The offset array mapping each data point to its byte address within a single vertex's data became central to the implementation, allowing safe access without sacrificing performance.

## VFX Graph Components

The VFX Graph implementation primarily retains the structure found in `SplatVFX`, but replaces Unity's default subgraph chains with several custom HLSL nodes that consolidate complex calculations into single, optimized operations.

The principal axes calculation defines the three "radii" defining each splat's ellipsoid volume. The `.ply` file stores each ellipsoid in terms of rotation quaternion and scaling factors, which must be applied together to derive the actual principal axes. While the original `SplatVFX` importer performs this during import, I chose instead to retain the original data and precalculate these values during initialization.  Runtime calculation was ultimately preferred because it allows greater flexibility with manipulating splat data and achieving special effects such as warping individual ellipsoids or rotating splats dynamically during runtime rather than just at import time.

For 3D ellipsoid rendering and camera projection, the geometry concept is straightforward: when projected onto the camera plane, ellipsoids render directly as ellipses. The challenge involves projecting each principal axis onto the camera plane and retrieving the two that contribute most to overall shape. The original implementation uses a complicated chain of VFX subgraphs for this projection work.

I rewrote all the calculations into custom HLSL code placed in a single Custom HLSL node instead, simplifying the calculation and removing extraneous function calls. The projection is achieved by using `InvertTRS` on the camera's transform. Consolidating these subgraphs improved code readability significantly while providing early exit conditions instead of performing every single comparison. While I'm uncertain if GPUs work identically to CPU processors in this regard, presumably this consolidation reduces reads and writes to the function call stack by performing all calculations within a single function.

The spherical harmonics calculations address how color values change based on viewing direction, informed by the relative position of object to camera. The implementation performed the exact same computations as found in the original Gaussian splatting paper, hardcoding the spherical harmonic multipliers directly into shader code.

Since values were stored contiguously per channel (red, green, blue) instead of interleaved in the `.ply` file, the import process reorders these such that they can be cast into `float3` format once loaded into graphics buffer. This enables parallelized computation per channel for better GPU utilization.

The rendering approach used a fixed texture strategy rather than calculating a 2D Gaussian directly in custom shader. This was intended to take advantage of instancing and avoid rewriting engine features like anti-aliasing and interpolation. The current implementation multiplies the final axes values by 64 to achieve the correct visual scaling.

I still don't have a concrete answer regarding why multiplying by 64 produces correct results, or if it relates to coordinate space normalization in the rendering pipeline. Additionally, the trade-off between the custom 2D Gaussian shader versus the texture-based approach needs empirical data. I would need to adapt the original shader to match my new VFX Graph implementation to measure performance benchmarks properly. The actual trade-offs between native Gaussian computation and texture approaches remain unclear beyond desktop vs. mobile generalizations.

## Development Challenges & Solutions

Working with `FileStream` and readers in C# presented an unexpected learning curve. I ran into issues initially thinking that running `StringReader.ReadLine` would move the stream's pointer past each line ending as expected. However, it instead moved forward by 1024 bytes because `StringReader` reads data into a buffer to minimize `FileStream` access frequency.

I only discovered this behavior after dealing with discrepancies in the expected binary section size versus the actual read positions during import testing. Once I figured this out, reading the rest of the file became straightforward. The resolution involved adjusting my parsing logic to account for buffered reads rather than assuming line-based pointer movement.

Another challenge involved reading individual data points. While unsafe pointers could technically achieve this goal, I wanted certainty that Unity features were Burst compatible for maximum performance. Arrays initialized to 0s helped sidestep missing information problems, particularly for spherical harmonics fields sometimes not populated in all PLY exports from different authoring tools.

## Future Considerations & Open Questions

Several implementation decisions and performance concerns warrant further investigation. The factor of 64 applied to final axes values still needs research—for understanding what causes this scaling requirement. Potential causes include texture coordinate normalization mismatch, different Gaussian width interpretation in rendering pipeline, or hardware-specific quantization artifacts.

The mobile implementation issues around texture-based approaches also need concrete data. Currently I only read this concern on an online forum without detailed explanation from authoritative sources. The actual performance penalties of texture versus native computation on different mobile architectures remain unclear to me.

Potential future enhancements include dynamic resolution rendering strategies and memory pool optimization for batch processing workflows. These improvements could significantly enhance both visual quality and performance characteristics.
