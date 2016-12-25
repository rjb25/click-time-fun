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
var drawState = {};
var myColor = '#'+Math.random().toString(16).substr(-6); 

function addDrawer(id, sendToId){
		if(sendToId){
    doTo([id], 'addDrawer', myId);
		}else{
		console.log('Drawer', id);
		drawState[id] = {clickX : [], clickY : [], clickDrag : [], colors : []};
		}
}

$('#canvas').mousedown(function(e){
  var mouseX = e.pageX - this.offsetLeft;
  var mouseY = e.pageY - this.offsetTop;
  paint = true;
  doTo(['all'], 'addPaint', myId, e.pageX - this.offsetLeft, e.pageY - this.offsetTop, false, myColor);
  doTo(['all'], 'redraw');
});

$('#canvas').mousemove(function(e){
  if(paint){
			doTo(['all'], 'addPaint', myId, e.pageX - this.offsetLeft, e.pageY - this.offsetTop, true, myColor);
			doTo(['all'], 'redraw');
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
$( "#clear" ).click(function(){doTo(['all'], 'deleteDrawing');});
var paint;
//This function stores the drawing data
//if you store with dragging true redraw will interpet the two click points as a line
//however if dragging is false redraw will interpret the x and y as a point
var authenticatedFuncs = {deleteDrawing : deleteDrawing, log : log, addPaint : addPaint, redraw : redraw, addDrawer : addDrawer};
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

function addPaint(id, x, y, dragging, color)
{
  drawState[id].clickX.push(x);
  drawState[id].clickY.push(y);
  drawState[id].clickDrag.push(dragging);
	drawState[id].colors.push(color);

}

//seperate function for clearing the canvas
function clearCanvas(){
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
}

function deleteDrawing(){
		for(var id in drawState){
  		drawState[id].clickX.length = 0;
  		drawState[id].clickY.length = 0;
  		drawState[id].clickDrag.length = 0;
			drawState[id].colors.length = 0;
		}
clearCanvas();
}
//array object called drawings of objects with their keys as unique keys containing their colors and strokes
//This is as close as one can get to a unique id without having to talk to other clients nor being able to have access to the server code.
function redraw(){
	clearCanvas();
  context.lineJoin = "round";
  context.lineWidth = 5;
	for(var id in drawState){		
  		colors = drawState[id].colors;
			clickX = drawState[id].clickX;
			clickY = drawState[id].clickY;
			clickDrag = drawState[id].clickDrag;
  for(var i=0; i < clickX.length; i++) {		
		context.strokeStyle = colors[i];
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
		//Makes the other users send their ids to my id.
		//Those ids are used to set my drawers list
    doTo(["others"], 'addDrawer', myId, 'To the given id');
		//Adds my id to drawers for other users, and myself.
		doTo(["all"], 'addDrawer', myId);
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
