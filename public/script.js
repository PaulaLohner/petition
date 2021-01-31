const canvas = document.querySelector("#sign");
const ctx = canvas.getContext("2d");
const canvasCheck = document.querySelector("#canvasCheck");
const canvasValue = document.querySelector("#canvasValue");
const submit = document.querySelector("#submit");

ctx.lineJoin = "round";
ctx.lineCap = "round";
ctx.lineWidth = 3;
ctx.strokeStyle = "#000000";

let isDrawing = false;
let lastX = 0;
let lastY = 0;

function sign(e) {
    // stop the function if they are not mouse down
    if (!isDrawing) return;
    // listen for mouse move event
    console.log(e);
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    [lastX, lastY] = [e.offsetX, e.offsetY];
}

canvas.addEventListener("mousedown", (e) => {
    isDrawing = true;
    canvasCheck.value = true;
    [lastX, lastY] = [e.offsetX, e.offsetY];
});

canvas.addEventListener("mousemove", sign);
canvas.addEventListener("mouseup", () => (isDrawing = false));
canvas.addEventListener("mouseout", () => (isDrawing = false));

submit.addEventListener("mousedown", () => {
    canvasValue.value = canvas.toDataURL();
});
