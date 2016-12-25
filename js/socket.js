//This document ready is here so that the canvas div is not accessed before it exists
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
context = canvas.getContext('2d');
//GLOBALS
//This is as close as one can get to a unique id
// without having to talk to other clients nor being able to have access to the server code.
var myId = Math.ceil(Math.random() * 10000) + 'id' +Date.now();
//gives user a random color to start with
var myColor = '#'+Math.random().toString(16).substr(-6); 
//places to store previous position for dragging
var pastX;
var pastY;
//a conditional for if the mouse is down on the canvas
var paint= false;

//This will check the position of the mouse when it is pressed 
//on the canvas element. It will draw a point or line on all canvases at that location.
//Next it will set the current position to be the past position for line drawing.
function drawHere(e, canvas, isLine){
  var mouseX = e.pageX - canvas.offsetLeft;
  var mouseY = e.pageY - canvas.offsetTop;
	if(isLine == 'line'){
  doTo(['all'], 'draw', myColor, pastX, pastY, mouseX, mouseY);
	}else{
  doTo(['all'], 'draw', myColor, mouseX -1, mouseY, mouseX, mouseY);
	}
	pastX = mouseX;
	pastY = mouseY;
}

//If the mouse is clicked on the canvas a point will be drawn
$('#canvas').mousedown(function(e){
  	paint = true;
		drawHere(e, this, 'point');
});

//If the mouse is dragged it will draw a line between current and previous point
//on all clients.
$('#canvas').mousemove(function(e){
  if(paint){
		drawHere(e, this, 'line');
  }
});

//When click is released, or marker leaves canvas, painting will stop.
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
$( '#clear' ).click(function(){doTo(['all'], 'clearCanvas');});

//listener for submission of color change field
$( '#changeColor' ).click(changeColor);

//Function that changes the users color 
//to the color in the text field if it is valid
function changeColor(){
		newColor = $('#color').val();
		if(validateCssColour(newColor)){
		myColor = newColor;
		}else{
			window.alert("Invalid Color Entry");
		}
}
//Thanks to: http://stackoverflow.com/questions/6386090/validating-css-color-names
//For the following function.
//This function trys to set the css of a dummy element 'rgb' to the given color.
//If rgb.css("color", colour) fails to change the color of rgb it returns false telling us that it was not a valid colour. Otherwise it returns true.
//However it also needs to test if the inputted color was the dummy color of rgb. If it was it returns true that the color entry is valid.
var validateCssColour = function(colour){
    var rgb = $('<div style="color:#28e32a">');     // Use a non standard dummy colour to ease checking for edge cases
    var valid_rgb = "rgb(40, 227, 42)";
    rgb.css("color", colour);
    if(rgb.css('color') == valid_rgb && colour != ':#28e32a' && colour.replace(/ /g,"") != valid_rgb.replace(/ /g,""))
        return false;
    else
        return true;
};
//This is a list of functions that are allowed to be called on this client by other clients
var authenticatedFuncs = {clearCanvas: clearCanvas, log : log, draw : draw};
//This checks if the message function is meant to be called on this client
function isForMe(target){
		if(target.includes('all') || target.includes('others')){
			return true;	
		}else if(target.includes(myId)){
				return true;
		}else{
				return false;
		}
}
//This function allows other clients to log to this client.
function log(...params){
		if(console){
			console.log.apply(console, params);
		}
}
//This function can call functions on a given audience, even itself.
//If you have ['all'] as the who it will call the function on this
// client and on all others.
//If who is ['others'] it will call on all other clients excluding itself.
//If who is a list of ids like ['id1', 'id2', 'id3', myId] it will call the given
//function on clients with those ids, aswell as calling it on your own.
function doTo(who, func, ...params){
		if(func in authenticatedFuncs){
		//Conditional check for whether to call the function on self
		//before emitting to other clients.
		if(who.includes(myId) || who.includes('all')){
			authenticatedFuncs[func].apply(null, params);
		}
			socket.emit('message', {target: who, func: func, params: params});
		}else{
				console.log('You attempted to use an unauthenticated function.');
		}
}

function clearCanvas(){
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
}

//using redraw with storing point storing was getting performance issues, so I moved to a simple draw function
function draw(color, startX, startY, endX, endY){
	  context.lineJoin = 'round';
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
//connect to the room at the given base site
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
    doTo(['others'], 'log','Another Drawer Has Joined');
});
   //Would have used 'function' type, but is not supported by provided server
socket.on('message', function (data) {
    // The 'message' event is emitted whenever another client sends a message
    // Messages are automatically broadcasted to everyone in the room

		// When messages are received they are checked against authenticated functions.
		if(data.func in authenticatedFuncs){
				//Next it checks who the the function is for
				if(isForMe(data.target)){
						//Then it calls the function on the parameters that were passed
					authenticatedFuncs[data.func].apply(null, data.params);
				}
		}else{
				//error message for unauthenicated function attempt
			console.log('A non authenticated function was sent to be executed');
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
		//Log the error from the server
		console.log(type, message);
});
});//end: on page load
