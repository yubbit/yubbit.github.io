---
layout: post
title: Bookmarks
sitemap: false
hide_last_modified: true
excerpt_separator: <!--more-->
---

A compilation of reference sites.

<!--more-->

* 
{:toc}

## Unity

| Link | Description |
|:----:|:-----------:|
| [WebXR Export](https://github.com/De-Panther/unity-webxr-export) | A Unity package for creating WebXR apps, which run on the browser on phone or on headset |
| [Using Git for Unity Projects](https://hextantstudios.com/unity-using-git/)| A guide to configuring a Unity project for Git. Provides a sample `.gitignore` and `gitattributes`, and sets up UnityYAMLMerge as the difftool for this project |
| [Unity Style Guide](https://github.com/justinwasilenko/Unity-Style-Guide)| A good baseline for setting up naming conventions and directory structures for Unity projects |
| [Gaffer On Games](https://gafferongames.com/)| Very detailed reading materials for networking for videogames |
| [Catlike Coding](https://catlikecoding.com/unity/tutorials/) | Unity tutorials covering things like custom render pipelines, compute shaders, the job system, and other cool and nifty things |
{:.stretch-table}

## Shaders and Graphics

| Link | Description |
|:----:|:-----------:|
| [Unity Shaders Bible](https://www.jettelly.com/store/books/the-unity-shaders-bible/) | A very detailed resource and cookbook for Unity shaders. Includes cool effects such as [this](https://www.reddit.com/r/Unity3D/comments/185pqtb/heres_a_stepbystep_tutorial_on_these_3d_bubbles/) |
| [Unity5 Effects](https://github.com/i-saint/Unity5Effects)| Sample HLSL shaders for Unity 5. Largely outdated, but good for idea generation |
| [Genshin Impact Character Shader Breakdown](https://www.artstation.com/artwork/wJZ4Gg) | A shader replicating the Genshin Impact toon shaders in URP |
| [Genshin Impact Character Models](https://docs.google.com/spreadsheets/d/1lrE5EGtuDsrwRJNSHIEN9hsGggxzLHmDV5rwuHkmndQ/edit?gid=0#gid=0) | Links to the official Genshin Impact character models |
| [SplatVFX](https://github.com/keijiro/SplatVFX) | A sample project by keijiro that implements 3D Gaussian Splatting in Unity using the VFX Graph |
{:.stretch-table}

## 3D Scanning, SLAM, and Photogrammetry

| Link | Description |
|:----:|:-----------:|
| [The Ultimate Guide to 3D Scanning](https://www.youtube.com/watch?v=U67RJG6DJ_8)| The full 3D scanning workflow for working with [RealityCapture](https://www.capturingreality.com/) |
| [Neuralangelo](https://github.com/nvlabs/neuralangelo) | A library and its associated pipeline for generating 3D models from collections of images using Neural Surface Reconstruction. Relatively slow, but it's free, uses the GPU, and offers the most detailed baseline, particularly for more dynamic scenes |
| [Gaussian Splatting](https://github.com/graphdeco-inria/gaussian-splatting) | A technique for generating a 3D representation of a scene from images by essentially using a point cloud of Gaussians. Memory intensive, but incredible results |
| [Introduction to 3D Gaussian Splatting](https://huggingface.co/blog/gaussian-splatting) | An explainer for Guassian Splatting |
| [Neural Radiance Fields NeRF in 100 lines of PyTorch code](https://www.youtube.com/watch?v=Q1zqf5tfeJw) | A great video for learning how Neural Radiance Fields work |
{:.stretch-table}

## Web Design

| Link | Description |
|:----:|:-----------:|
| [Microsoft Sway](https://sway.cloud.microsoft/) | Tools for building better presentations |
| [Canva](https://www.canva.com/website-builder/) | A website builder |
| [Cursor](https://www.cursor.com/) | An AI coding tool. Placed in this section since I'm not particularly interested in learning web front-end |
| [Maskable.app](https://maskable.app/editor) | A utility for generating icons that conform to web standards |
{:.stretch-table}

## Artificial Intelligence

| Link | Description |
|:----:|:-----------:|
| [Interactive Tools for machine learning, deep learning, and math](https://github.com/Machine-Learning-Tokyo/Interactive_Tools) | A collection of interactive visual resources to help learn concepts in machine learning, including concepts beyond the basics |
| [Large Language Models Course](https://github.com/peremartra/Large-Language-Model-Notebooks-Course) | Learning materials for learning LLMs |
| [Large Language Model Course](https://github.com/mlabonne/llm-course) | Another course for learning LLMs. Includes notes on quantization |
| [Supervision](https://github.com/roboflow/supervision) | A very comprehensive set of tools for all kinds of computer vision tasks |
| [Segment Anything Model 2 (SAM 2)](https://github.com/facebookresearch/segment-anything-2) | A segmentation model that essentially works like the magic wand tool but better |
| [gpt4all](https://www.nomic.ai/gpt4all) | A simple toolkit for running LLMs locally |
| [Small Large Language Models](https://rvandernoort.github.io/SmallLLMs/) | A list of relatively small LLMs that can be deployed locally |
| [Exo](https://github.com/exo-explore/exo) | A tool for running AI clusters at home with ordinary devices |
| [coqui TTS](https://github.com/coqui-ai/TTS)| A text-to-speech library that implements several models and comes with utilities for training your own |
| [S3PRL](https://github.com/s3prl/s3prl)| A speech-to-text library with several upstream models available and utilities included |
| [VALL-E X](https://github.com/Plachtaa/VALL-E-X) | A text-to-speech library that makes it easy to clone your voice |
| [Optuna](https://github.com/optuna/optuna)| A hyperparameter optimization framework for training models |
{:.stretch-table}

## Programming

| Link | Description |
|:----:|:-----------:|
| [Awesome-Selfhosted](https://github.com/awesome-selfhosted/awesome-selfhosted) | A large list of free applications for self-hosting various services |
| [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) | A convention for tagging commits |
| [Fourier Drawing](https://pypi.org/project/fourier-drawing/)| A Python library that can generate drawings by converting sequences of points into a Fourier series. Based on [Mathologer's video](https://www.youtube.com/watch?v=qS4H6PEcCCA) |

{:.stretch-table}

## `ffmpeg` and Related Utilities

| Link | Description |
|:----:|:-----------:|
| [`ffmpeg` commandline crossfade-looped video](https://gist.github.com/coderofsalvation/8dd3cafd0d21d1fa6dd9cb0de8e58628) | A bash script using `ffmpeg` for creating a video that loops on itself by fading between the beginning and end of the video |
| [`.ts` or `.m3u8` download methods](https://stackoverflow.com/questions/22188332/download-content-video-from-video-stream-with-a-path-of-ts-or-m3u8-file-throug)| Methods for downloading livestreams |
| [Download and decrypt AES-128 .m3u8 playlists](https://idof.medium.com/download-and-decrypt-aes-128-m3u8-playlists-495c12d6543a)| Uses `ffmpeg` to retrieve `.m3u8` streams instead of VLC |
{:.stretch-table}

## Memes

| Link | Description |
|:----:|:-----------:|
| [Irasutoya 「いらすとや」](https://www.irasutoya.com/)| Royalty-free Japanese clip art illustrations |
| [Anime Girls Holding Programming Books GitHub](https://github.com/cat-milk/Anime-Girls-Holding-Programming-Books)| Pictures of anime girls holding programming books |
| [Link](.)| Description |
{:.stretch-table}
