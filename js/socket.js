//This document ready is here so that the canvas div is not gotten before it exists
$(function(){
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

var myId = Math.ceil(Math.random() * 10000) + "id" +Date.now();

$('#canvas').mousedown(function(e){
  var mouseX = e.pageX - this.offsetLeft;
  var mouseY = e.pageY - this.offsetTop;
  paint = true;
  doTo(['all'], 'draw', myColor, mouseX -1, mouseY, mouseX, mouseY);
	pastX = mouseX;
	pastY = mouseY;
});

$('#canvas').mousemove(function(e){
  var mouseX = e.pageX - this.offsetLeft;
  var mouseY = e.pageY - this.offsetTop;
  if(paint){
  doTo(['all'], 'draw', myColor, pastX, pastY, mouseX, mouseY);
  }
	pastX = mouseX;
	pastY = mouseY;
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
$( "#clear" ).click(function(){doTo(['all'], 'clearCanvas');});
var paint;
//This function stores the drawing data
//if you store with dragging true redraw will interpet the two click points as a line
//however if dragging is false redraw will interpret the x and y as a point
var authenticatedFuncs = {clearCanvas: clearCanvas, log : log, draw : draw};
function isForMe(target){
		if(target.includes("all")){
			return true;	
		}else if(target.includes(myId)){
				return true;
		}else{
				return false;
		}
}

function isAuthenticated(funcName){
		if(funcName in authenticatedFuncs){
				return true;
		}else{
				return false;
		}
}

function log(...params){
		if(console){
			console.log.apply(console, params);
		}
}

function doTo(who, func, ...params){
		if(isAuthenticated(func)){
		if(who.includes('all')){
					authenticatedFuncs[func].apply(null, params);
					socket.emit('message', {target: ['all'], func: func, params: params});
		}else if(who.includes('others')){
					socket.emit('message', {target: ['all'], func: func, params: params});
		}else{
					socket.emit('message', {target: who, func: func, params: params});
		}
		}else{
				console.log('You attempted to use an unauthenticated function.');
		}
}


//seperate function for clearing the canvas
function clearCanvas(){
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
}

	var myColor = '#'+Math.random().toString(16).substr(-6); 
	var pastX;
	var pastY;

//array object called drawings of objects with their keys as unique keys containing their colors and strokes
//This is as close as one can get to a unique id without having to talk to other clients nor being able to have access to the server code.
//using redraw with storing was getting performance issues, so I moved to a simple draw function
function draw(color, startX, startY, endX, endY){
  context.lineJoin = "round";
  context.lineWidth = 5;
		context.strokeStyle = color;
    context.beginPath();
    context.moveTo(startX, startY);
    context.lineTo(endX, endY);
    context.closePath();
    context.stroke();
}

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
		// Sends a console message to the other users in the room
    doTo(["others"], 'log','Another Drawer Has Joined');
});
   //Would have used 'function' type, but is not supported by provided server
socket.on('message', function (data) {
    // The 'message' event is emitted whenever another client sends a message
    // Messages are automatically broadcasted to everyone in the room
		if(isAuthenticated(data.func)){
				if(isForMe(data.target)){
					authenticatedFuncs[data.func].apply(null, data.params);
				}
		}else{
			console.log("A non authenticated function was sent to be executed");
		}

});

socket.on('heartbeat', function () {
    // You can listen on this event to make sure your connection is receiving events correctly
    // The server will emit a heartbeat every 30 seconds to all connected clients
});

socket.on('error', function (err) {
    // Sometimes things go wrong!
		var type = err.type;    // This is the type of error that occurred
		var message = err.message;
		console.log(type, message);
});
});//end: on page load
