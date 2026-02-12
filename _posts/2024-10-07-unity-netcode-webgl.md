---
layout: post_blog
title: Unity Netcode for GameObjects with WebGL
sitemap: false
hide_last_modified: true
excerpt_separator: <!--more-->
---

While playing around with WebXR, I thought it would be cool if you could have
multiple people viewing the same space at the same time. I figured that there
would be two ways of doing that.

The first would be to have each device somehow able to locate and track other
devices using its own camera in its own local network. <!--more-->  Unfortunately, that
makes very big assumptions about the type and power of devices that would be
used to run the app, which would defeat the purpose of having a 
one-size-fits-all solution with WebXR.

The second method would be to have each device share its data in a multiplayer
session, while using an AprilTag or some other method of setting a shared
spatial anchor between each individual client. Compared to the first method,
this has the combined benefits of being much more modular, both in terms of
devices and in terms of implementations of shared assets and anchors.

## Setting up Netcode for GameObjects

Setting up the initial environment is simple enough. I followed 
[Unity's Official Documentation](https://docs-multiplayer.unity3d.com/netcode/current/tutorials/get-started-ngo/) 
and was able to get something simple up and running real quick. 

Do note that the initial tutorial only covers the client-server multiplayer
setup. That is, a server is spun up, usually as a simulated Unity runtime,
which clients can then connect to. The Netcode for GameObjects library
abstracts most syncing procedures away using NetworkObjects, while the
NetworkManager simplifies setting up the server's configuration.

This style of server requires a couple of things though. Assuming that this is
hosted by another client, then they'd need to connect to some sort of external
server that uses NAT punchthrough to allow users to connect to each other.
Since that's extremely involved, especially for a toy example like this, I
decided to explore other options.


## Distributed Authority Network Topology

Unity thankfully provides a solution to getting around these problems by
providing relay servers and a lobby system through Unity Cloud. Since for
this toy project, I wasn't particularly concerned about anticheat, I
decided to use a distributed authority topology, rather than a client-host
or server hosted solution.

The distributed authority topology basically implements everything that I
talked about in the previous paragraph. It has one caveat in that sessions
are hosted client-side, meaning things like input verification become much
more difficult for cases such as anticheat compared to self-hosted solutions.
On the other hand, it provides a ready made solution to allow clients to
connect to Unity's central service for the initial sync and eventual transfer
of data regarding client states.

The official guide for setting it up can be found [here](https://docs-multiplayer.unity3d.com/netcode/current/terms-concepts/distributed-authority/).
Note that Unity charges for connections beyond a certain limit, either in
terms of bandwidth consumption or concurrent users. You can check the [Unity Cloud website](https://cloud.unity.com/) for your current usage.

Implementation wise, the documentation doesn't state that you need to use
a DistributedAuthorityTransport, rather than a Unity Transport component in 
the Network Manager game object. Specific to WebGL, a few other things need to
be done. WebGL does not support Unity Transport over UDP and requires you to
use Web Sockets, which can be activated in the DistributedAuthorityTransport
component. 

Secondly, the guide uses the Unity Multiplayer Services Package.
As of version `1.0.0-pre.1`, the package has the use of DTLS (datagram TLS)
hardcoded into all of its connection methods. Instead, we want to use WSS
(secure WebSocket), since `DTLS` is not supported in WebGL as of Unity 
6000.0.9f1. Some light documentation on that can be found [here](https://docs.unity.com/ugs/manual/relay/manual/networking).

To fix that issue, I went with the hacky solution of modifying the package
files directly, which is not at all best practice, but proved significantly
easier than rewriting large sections of the Multiplayer utilities library.
The file found in `Runtime/Multiplayer/Modules/Connection/ConnectionModule.cs`
controls the initial network configuration in any calls to `DaHandler.GetRelaySeverData`.
Simply change the value from `MPConstants.DTLS` to the string `"wss"`.

Additionally, WebGL does not allow users to use multithreaded async. One
particular section of code does that in the Multiplayer library, when
waiting for a join code after establishing a lobby. Check the file
`Runtime/DistributedAuthority/ErrorMitigation/RetryPolicy.cs`, and look for
references to `Task.Delay`, and replace these with the equivalent
`UnityEngine.Awaitable.WaitForSecondsAsync(delayTime)`.

With all that done, I was able to get a simple multiplayer demo working,
linked [here](https://rsfor.ddns.net/files/UnityNetcodeSample/).

## Next Steps

Now that I have a simple demo working in WebGL, I can begin working this into
my WebXR app to get multiplayer sessions working.

One big weakness of this implementation is that it requires Unity Cloud to
work. I could look into using other multiplayer implementations like Proton,
or preferably [Promul](https://github.com/jacksonrakena/promul), which work
well with Unity libraries but would potentially allow me to self-host the
central service as well.
