---
layout: post_blog
title: Troubleshooting VNC Connectivity on Linux on Nintendo Switch  
---

I recently set off on an experiment to run Linux on my Nintendo Switch. At the
time, the only releases available for Ubuntu 24.04 were KDE and Unity, due to a
bug with the GNOME environment. I decided to go with the Unity desktop 
environment. 

## The Problem  
After enabling the "Remote Sharing" feature in Ubuntu, I attempted to connect to
the VNC server using TightVNC Viewer on Windows. Initially, I encountered an
error that said "Error in TightVNC Viewer: No security types supported. Server
sent security types, but we do not support any of these."

I initially suspected misconfigured ports, so I ran `netstat -lntu` to verify 
that port **5900 (TCP)** was open. A `telnet switch 5900` test also returned a 
successful response, indicating the server was reachable. 

## The Solution  
I stumbled upon [this](https://askubuntu.com/questions/408365/gnome-3-10-sharing-desktop-how-to-configure-the-security-type-for-vnc)
page, where I discovered that Vino (Ubuntu’s VNC server) enforces encryption 
by default, which many VNC viewers, including TightVNC, do not support. To 
resolve this, I disabled the encryption requirement using the `dconf` tool:  

```bash
dconf write /org/gnome/desktop/remote-access/require-encryption false
```  

Alternatively, you can use the `dconf-editor` GUI to toggle this setting. After 
applying this change, my VNC connection worked as expected.  
