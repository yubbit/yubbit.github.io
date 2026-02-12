var buildUrl = "/assets/posts/2024-07-18-leap-sdk-in-webxr/Build";
var loaderUrl = buildUrl + "/WebXR-Leap.loader.js";
var config = {
dataUrl: buildUrl + "/WebXR-Leap.data.unityweb",
frameworkUrl: buildUrl + "/WebXR-Leap.framework.js.unityweb",
codeUrl: buildUrl + "/WebXR-Leap.wasm.unityweb",
streamingAssetsUrl: "StreamingAssets",
companyName: "rsfor",
productName: "LeapSDK-WebXR",
productVersion: "0.0.1",
};

var container = document.querySelector("#unity-container");
var canvas = document.querySelector("#unity-canvas");
var canvasContainer = document.querySelector("#unity-canvas-container");
var loadingBar = document.querySelector("#unity-loading-bar");
var progressBarFull = document.querySelector("#unity-progress-bar-full");
var fullscreenButton = document.querySelector("#unity-fullscreen-button");
var unityInstance = null;

canvasContainer.style.width = "100%";
canvasContainer.style.height = canvas.style.width / 16.0 * 9.0;
loadingBar.style.display = "block";

var script = document.createElement("script");
script.src = loaderUrl;
script.onload = () => {
createUnityInstance(canvas, config, (progress) => {
    progressBarFull.style.width = 100 * progress + "%";
}).then((instance) => {
    unityInstance = instance;
    loadingBar.style.display = "none";
    if (fullscreenButton)
    {
    fullscreenButton.onclick = () => {
        unityInstance.SetFullscreen(1);
    };
    }
}).catch((message) => {
    alert(message);
});
};
document.body.appendChild(script);

let enterARButton = document.getElementById('enterar');
let enterVRButton = document.getElementById('entervr');

document.addEventListener('onARSupportedCheck', function (event) {
enterARButton.disabled = !event.detail.supported;
}, false);
document.addEventListener('onVRSupportedCheck', function (event) {
enterVRButton.disabled = !event.detail.supported;
}, false);

enterARButton.addEventListener('click', function (event) {
unityInstance.Module.WebXR.toggleAR();
}, false);
enterVRButton.addEventListener('click', function (event) {
unityInstance.Module.WebXR.toggleVR();
}, false);