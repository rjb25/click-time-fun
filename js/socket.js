//This document ready is here so that the canvas div is not gotten before it exists
$(document).ready(function(){
//This creates, sets up, and applies the canvas element to the page. Side note: It works
//with some of the IE versions
var canvasDiv = document.getElementById('canvasDiv');
canvas = document.createElement('canvas');
canvas.setAttribute('width', 500);
canvas.setAttribute('height', 500);
canvas.setAttribute('id', 'canvas');
canvasDiv.appendChild(canvas);
if(typeof G_vmlCanvasManager != 'undefined') {
			canvas = G_vmlCanvasManager.initElement(canvas);
}
context = canvas.getContext("2d");

$('#canvas').mousedown(function(e){
  var mouseX = e.pageX - this.offsetLeft;
  var mouseY = e.pageY - this.offsetTop;
  paint = true;
  addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop);
  redraw();
});

$('#canvas').mousemove(function(e){
  if(paint){
    addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, true);
    redraw();
  }
});

$('#canvas').mouseup(function(e){
	  paint = false;
});

$('#canvas').mouseleave(function(e){
		  paint = false;
});
//listener for clear button
//reason it is here and not in an onclick="deleteDrawing();" in the button html
//is because the deleteDrawing might not have been defined when the html is first read
//due to the deleteDrawing being 
//wrapped in a way that it is only called when page is loaded.
$( "#clear" ).click(deleteAllDrawings);

var clickX = new Array();
var clickY = new Array();
var clickDrag = new Array();
var paint;
//This function stores the drawing data
//if you store with dragging true redraw will interpet the two click points as a line
//however if dragging is false redraw will interpret the x and y as a point
function addClick(x, y, dragging)
{
  clickX.push(x);
  clickY.push(y);
  clickDrag.push(dragging);
}
//seperate function for clearing the canvas
function clearCanvas(){
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
}
function deleteAllDrawings(){
		deleteDrawing();
	socket.emit('message', 'deleteDrawing');
}

function deleteDrawing(){
clickX.length = 0;
clickY.length = 0;
clickDrag.length = 0;
clearCanvas();
}

function redraw(){
	clearCanvas();
  
  context.strokeStyle = "#df4b26";
  context.lineJoin = "round";
  context.lineWidth = 5;
			
  for(var i=0; i < clickX.length; i++) {		
    context.beginPath();
    if(clickDrag[i] && i){
      context.moveTo(clickX[i-1], clickY[i-1]);
     }else{
				 //the reason for -1 here in clickX[i] -1 is that without it there would be no line to draw.
				 //so basically instead of a point we are drawing a very small line
       context.moveTo(clickX[i]-1, clickY[i]);
     }
     context.lineTo(clickX[i], clickY[i]);
     context.closePath();
     context.stroke();
  }
}
var messaging = "heyo";
var base = 'http://clicktime.herokuapp.com:80/rooms/';
var roomName = 'Jason';    // Replace this with your own room name

var socket = io.connect(base + roomName);
/**
 * These are the events that the websocket server will emit
 *
 * When sending messages, make sure the type is set to 'message', or other clients won't receive your data
 * (e.g. socket.emit('message', { ... }); )
 */
socket.on('welcome', function () {
    // Connection is established, start using the socket
    socket.emit('message', 'i have arrived');
});

socket.on('message', function (data) {
    // The 'message' event is emitted whenever another client sends a message
    // Messages are automatically broadcasted to everyone in the room
		switch(data) {
				//could make allowed functions array
				case 'i have arrived':
	 			console.log('i have arrived');
				break;
				case 'deleteDrawing':
				deleteDrawing();
	//clearCanvas();
console.log(messaging);	
				break;
				default:
				console.log('Nonsense');
		}
});

socket.on('heartbeat', function () {
    // You can listen on this event to make sure your connection is receiving events correctly
    // The server will emit a heartbeat every 30 seconds to all connected clients
});

socket.on('error', function (err) {
    // Sometimes things go wrong!
    var type = err.type;    // This is the type of error that occurred
    var message = err.message;    // This is a friendly message that should describe the error
});
});//end: on page load
