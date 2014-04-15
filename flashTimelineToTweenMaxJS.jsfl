/*
author:milkmidi
version:1.0.0
date:2014/04/15

Flash Timeline to TweenMaxJS
*/

fl.outputPanel.clear();


var DOC   = fl.getDocumentDOM();
var TIME_LINE = DOC.getTimeline();
var FPS = fl.getDocumentDOM().frameRate;
var DEBUG = false;

//trace("FPS:"+FPS);

var fcnt = TIME_LINE.frameCount;
var lcnt = TIME_LINE.layerCount;
//trace( "frameCount = " + fcnt );
//trace( "layerCount = " + lcnt );

var layers = TIME_LINE.layers;
var MILKMIDI_CLASS = "milkmidi_tweenmax";
var css = "."+MILKMIDI_CLASS+"{position:absolute;display:block;}\n";
var divArr = [];

//test();
tweenMaxParse();
function test(){
	
	TIME_LINE.currentFrame = 0;
	TIME_LINE.setSelectedLayers(0);		
	//trace(" layers[0].frames.length:"+ layers[0].frames.length);		
	trace(" layers[0].frames.length:"+ layers[0].elements);	
}


function tweenMaxParse(){
	var timelineName = TIME_LINE.name;
	var script = "var __tweenTimeline =  (function(){\n";
	var divNames = [];
	
	var length = DEBUG ? 1: layers.length;
	for (var i = 0; i < length ; i++) {
		TIME_LINE.currentFrame = 0;
		TIME_LINE.setSelectedLayers(i);		
		if(layers[i].layerType != "guide" ){
			// trace( layers[i].elements );
			var result = fl.runScript(fl.configURI + 'Javascript/MotionXML.jsfl','copyMotionAsXML');
			var resultArr = parseXML(XML(result) , i);	
			divNames.push( resultArr[0] );
			script+= resultArr[1];			
		}	 	
	};
	
	//trace("function ease_get(amount) {if (amount < -1) { amount = -1; }if (amount > 1) { amount = 1; }return function(t) {if (amount==0) { return t; }if (amount<0) { return t*(t*-amount+1+amount); }return t*((2-t)*amount+(1-amount));}}");
	
	
	trace( css );
	trace("\n");	
	for(var i = divArr.length -1 ; i >= 0; i --){
		trace( divArr[i] );
	}
	trace("\n\n");
	
	script +="\n	var t = new TimelineLite();\n	t.add(["+divNames+"]);\n	return t;\n";
	script +='})();';
	trace(script);	
	fl.clipCopyString( script );
}


function trace( o ){
	fl.trace( o );
}

function parseXML( xml , layerIndex )/*Array*/{
	var element = fl.getDocumentDOM().getTimeline().layers[layerIndex].frames[0].elements[0];
	var startX = Math.round( element.x );
	var startY = Math.round( element.y );
	var width = Math.round( element.width );
	var height = Math.round( element.height );
	var startA = element.colorAlphaPercent;

	var layerName = fl.getDocumentDOM().getTimeline().layers[layerIndex].name;
	var oName = layerName;

	if(DEBUG){
		trace(xml+"\n\n");
	}

	var varName = "_" + layerName;
	
	css+="."+layerName+"{\n	width:"+width+"px;\n	height:"+height+"px;\n	left:"+startX+"px;\n	top:"+startY+"px;\n	background-image:url(img/"+layerName+".png);\n}\n";
	divArr.push("<div class='"+MILKMIDI_CLASS+" "+layerName+"'></div>");
	
	var layerName = "'."+layerName+"'";
	
	var template = '	var '+varName + ' = new TimelineLite();\n';	
	template += "	"+varName+ ".set("+layerName+", { left:"+startX+", top:"+startY+", alpha:"+startA+" });\n";

	var childrenLength = xml.children().length();		

	var lastTime = 0;
	var funName = "Cubic.easeOut";
	for(var i = 1 ; i <childrenLength;i++){
		var keyFrame = xml.children()[i];	
		if( i == 1 ){
			funName = parseEase(keyFrame);			
		}else{
			
			if( keyFrame.localName() == 'Keyframe'){			
			
				var alpha = 1;
				if ( keyFrame.children()[0].localName() == 'color'){					
					var alpha = keyFrame.children()[0].children()[0].@alphaMultiplier;
					if(alpha == undefined){
						alpha = 1;
					}					
				}
				
				var time =  keyFrame.@index / FPS - lastTime;	
				lastTime = time;
				var x = startX + Math.round( keyFrame.@x );
				var y = startY + Math.round( keyFrame.@y );		
				var rotation = Math.round( keyFrame.@rotation );
				
				time = time.toFixed(2);
				
				var prop = {
					left	:x == startX ? undefined : x,
					top		:y == startY ? undefined : y,
					rotation:rotation,
					alpha	:alpha
				};
				var p ="{ ";
				for(var a in prop ){
					if(prop[a]!=undefined){
						p+= a+":" + prop[a]+", "
					}
				}				
				
				
				template+= "	"+varName+'.to('+layerName+', '+time+', '+p+'ease:'+funName+' });\n';
				
				funName = parseEase(keyFrame);
			}
		}
		
		
	}
					
	var result = template;	
	return ["_"+oName,result];
}


function parseEase( keyFrame ){
	var funName = "Cubic.easeOut";	
	try{
		if ( keyFrame.children()[1].localName() == 'tweens'){
			var ease = keyFrame.children()[1].children()[0].@ease;
		}		
		if( ease < 0 ){
			funName = "Cubic.easeIn";
		}
	}catch(err){
	}
	return funName;
}