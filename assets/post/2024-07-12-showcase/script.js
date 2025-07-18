var canvas = document.querySelector("#unity-canvas");

function unityShowBanner(msg, type) {
var warningBanner = document.querySelector("#unity-warning");
function updateBannerVisibility() {
    warningBanner.style.display = warningBanner.children.length ? 'block' : 'none';
}
var div = document.createElement('div');
div.innerHTML = msg;
warningBanner.appendChild(div);
if (type == 'error') div.style = 'background: red; padding: 10px;';
else {
    if (type == 'warning') div.style = 'background: yellow; padding: 10px;';
    setTimeout(function() {
    warningBanner.removeChild(div);
    updateBannerVisibility();
    }, 5000);
}
updateBannerVisibility();
}

var buildUrl = "/assets/post/2024-07-12-showcase/Build";
var loaderUrl = buildUrl + "/Builds.loader.js";
var config = {
arguments: [],
dataUrl: buildUrl + "/Builds.data.unityweb",
frameworkUrl: buildUrl + "/Builds.framework.js.unityweb",
codeUrl: buildUrl + "/Builds.wasm.unityweb",
streamingAssetsUrl: "StreamingAssets",
companyName: "rsfor",
productName: "TestWebGPU",
productVersion: "0.0.1-WebGPU",
showBanner: unityShowBanner,
};

canvas.style.width = "100%";
canvas.style.height = canvas.style.width / 16.0 * 9.0;

document.querySelector("#unity-loading-bar").style.display = "block";

var script = document.createElement("script");
script.src = loaderUrl;
script.onload = () => {
createUnityInstance(canvas, config, (progress) => {
    document.querySelector("#unity-progress-bar-full").style.width = 100 * progress + "%";
        }).then((unityInstance) => {
        document.querySelector("#unity-loading-bar").style.display = "none";
        document.querySelector("#unity-fullscreen-button").onclick = () => {
            unityInstance.SetFullscreen(1);
        };

        }).catch((message) => {
        alert(message);
        });
    };

document.body.appendChild(script);