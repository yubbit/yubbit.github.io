---
layout: posts
title: SuGaR Notes
sitemap: false
hide_last_modified: true
excerpt_separator: <!--more-->
# header:
#     overlay_color: rgba(255, 0, 0, 0.5)
#   teaser: assets/images/bio-photo.jpg
#   overlay_image: assets/images/bio-photo.jpg
---

I was looking into ways to convert some videos I took during my travels to 3D
scenes, and had previously heard of two methods: Gaussian splatting, and a
library by Nvidia called Neuralangelo. For Gaussian splatting, I'd read that
a library called [nerfstudio](https://docs.nerf.studio/index.html) had its own
implementation of it, but I also wanted to see if I could find a method that
generated a mesh that I could view in virtual reality. <!--more--> 

I tried Neuralangelo, and I found the results lacking, so I looked it up on
Google Scholar, and searched for recent papers that cited it and sorted them
by relevance and found a technique called 
[SuGaR (Surface-Aligned Gaussian Splatting for Efficient 3D Mesh Reconstruction and High-Quality Mesh Rendering)](https://github.com/Anttwo/SuGaR).

## Creating a Dockerfile

I'm usually one to containerize any software I use for development, especially
when I'm just running through different papers and want an easy way to delete
libraries as I evaluate them. Doing that with SuGaR wasn't particularly
difficult, but some of its dependencies had specific requirements that I
couldn't get off of a base `miniconda` image.

SuGaR's Github page gives instructions for getting a `conda` environment set
up:

```bash
conda create --name sugar -y python=3.9
conda activate sugar
conda install pytorch==2.0.1 torchvision==0.15.2 torchaudio==2.0.2 pytorch-cuda=11.8 -c pytorch -c nvidia
conda install -c fvcore -c iopath -c conda-forge fvcore iopath
conda install pytorch3d==0.7.4 -c pytorch3d
conda install -c plotly plotly
conda install -c conda-forge rich
conda install -c conda-forge plyfile==0.8.1
conda install -c conda-forge jupyterlab
conda install -c conda-forge nodejs
conda install -c conda-forge ipywidgets
pip install open3d
pip install --upgrade PyMCubes
```

I attempted to install this using a `miniconda` image, but soon realized that
you needed to generate a COLMAP dataset for processing first. I checked the
issues page to see if anybody had the full process involved for taking a video
and outputting a usable file and found [this issue](https://github.com/Anttwo/SuGaR/issues/78).
To run it though, I needed COLMAP on my system. Thankfully, it can be found
in `conda`.

```bash
conda install -c conda-forge colmap
```

Next, I needed to install some of SuGaR's dependencies, that is:

```bash
pip install -e gaussian_splatting/submodules/diff-gaussian-rasterization/
pip install -e gaussian_splatting/submodules/simple-knn
pip install git+https://github.com/NVlabs/nvdiffrast.git
```

These depend on having `gcc` and `ninja` available on your system, as well as
precisely `cuda 11.8`, so i installed those using `conda` as well before
running `pip install` on those submodules:

```bash
RUN conda install -c conda-forge gxx==11.2.0 ninja
ENV TORCH_CUDA_ARCH_LIST="8.0;8.6"
RUN conda install cuda-toolkit==11.8.0 -c nvidia/label/cuda-11.8.0
```

With all that done, I winded up with the following Dockerfile:

```Dockerfile
FROM continuumio/miniconda3 AS base

RUN apt-get update && \
    apt-get install -y \
        curl \
        git

ADD . /home/user/SuGaR
WORKDIR /home/user/SuGaR
RUN conda create --name sugar -y python=3.9

# Activate the created conda environment
SHELL ["conda", "run", "-n", "sugar", "/bin/bash", "-c"]
RUN conda install "numpy<2"
RUN conda install -c pytorch -c nvidia pytorch==2.0.1 torchvision==0.15.2 torchaudio==2.0.2 pytorch-cuda=11.8
RUN conda install -c conda-forge colmap
RUN conda install -c fvcore -c iopath -c conda-forge fvcore iopath
RUN conda install -c pytorch3d pytorch3d==0.7.4
RUN conda install -c plotly plotly
RUN conda install -c conda-forge rich
RUN conda install -c conda-forge plyfile==0.8.1
RUN conda install -c conda-forge jupyterlab
RUN conda install -c conda-forge nodejs
RUN conda install -c conda-forge ipywidgets
RUN pip install open3d
RUN pip install --upgrade PyMCubes

FROM base as builder

SHELL ["conda", "run", "-n", "sugar", "/bin/bash", "-c"]
RUN conda install -c conda-forge gxx==11.2.0 ninja
ENV TORCH_CUDA_ARCH_LIST="8.0;8.6"
RUN conda install cuda-toolkit==11.8.0 -c nvidia/label/cuda-11.8.0

RUN pip install -e gaussian_splatting/submodules/diff-gaussian-rasterization/
RUN pip install -e gaussian_splatting/submodules/simple-knn
RUN pip install git+https://github.com/NVlabs/nvdiffrast.git

FROM base

RUN apt-get update && apt-get install -y libgl1-mesa-glx

SHELL ["conda", "run", "-n", "sugar", "/bin/bash", "-c"]
COPY --from=builder /home/user/SuGaR/gaussian_splatting/submodules /home/user/SuGaR/gaussian_splatting/submodules/
COPY --from=builder /opt/conda/envs/sugar/lib/python3.9/site-packages /opt/conda/envs/sugar/lib/python3.9/site-packages/

RUN conda clean -afy

RUN echo "source activate base && conda activate sugar" >> ~/.bashrc
```

Notably, I compiled COLMAP in a different image and copied the executables
over to the output image. I tried compiling it from scratch using only the
architecture's running on the host machine, but it didn't result in the image
being any smaller and using the one in `conda` was much simpler. I also tried
using one of Nvidia's base CUDA images, but again, this didn't result in any
improvement in terms of the size of the image and took far longer to compile,
so I scrapped that and just went with running a `conda` environment inside
the Docker container.

## Running SuGaR

Running SuGaR is straightforward enough using the results from 
[here](https://github.com/Anttwo/SuGaR/issues/78).

You can preprocess the data by running:

```bash
ffmpeg -i myvideo.mp4 -r 1.0 data/\<project_name\>/input/%004d.jpg
```

Then run

```bash
python gaussian_splatting/convert.py -s data/\<project_name\>
```

That generates the COLMAP formatted folder that you can use as input for
SuGaR's main script:

```bash
python train_full_pipeline.py -s /home/user/sugar/data/\<project_name\> -r "sdf" --low_poly True --export_obj True --refinement_time "short"
```

You can see the details of what those parameters do on the project's Github
page.

Finally, a script I found useful was one that generates a refined mesh after
you've already trained the model on your dataset. Just replace the path to the
model file accordingly.

```bash
python extract_refined_mesh_with_texture.py -s data/\<project_name\> -c output/vanilla_gs/\<project_name\> -m output/refined/\<project_name\>/sugarfine_3Dgs7000_sdfestim02_sdfnorm02_level03_decim200000_normalconsistency01_gaussperface6/2000.pt
```
