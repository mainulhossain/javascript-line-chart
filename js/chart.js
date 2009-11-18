/** 
 * JavaScript source file for the munsell analysis charts
 *
 * @author Muhammad Mainul Hossain
 * @copyright Muhammad Mainul Hossain, Karlsruhe, Germany, 2009
 * @version 0.1
*/

var defaultColor = '848484';
/** 
 * Abstract class definition for chart item
 *
 * @author Muhammad Mainul Hossain
 * @copyright Muhammad Mainul Hossain, Karlsruhe, Germany, 2009
 * @version 0.1
*/
var ChartItem = new Class({
	visible: true,
	draw: function(js)
	{
	}
});

/** 
 * A 2D point definition
 *
 * @author Muhammad Mainul Hossain
 * @copyright Muhammad Mainul Hossain, Karlsruhe, Germany, 2009
 * @version 0.1
*/
var Point = new Class({
	Implements: [ChartItem,Options,Events],
	options:
	{
		x: 0,
		y: 0,
		color: 'defaultColor',
		drawer: null,
		id: -1
	},
	initialize: function (options)
	{
		this.setOptions(options);
	},
	draw: function(js, transform)
	{
		if (!this.visible) return;
		
		if (this.options.drawer)
		{
			var div = $(this.options.drawer(this, js, transform));
			if (div)
			{
				div.setStyle('cursor', 'pointer');
				div.addEvent('click', function(){
						this.fireEvent('click', this);
					}.bind(this));
			}
		}
	},
	getjsPoint: function(transform)
	{
		point = {x: this.options.x, y: this.options.y};
		if (transform)
			point = transform(this);
		return new jsPoint(point.x, point.y);
	},
	show: function(value)
	{
		this.visible = value;
	}
});

/** 
 * A line definition. If the points are 2D, then then line is 2D,
 * otherwise, the line is 3D.
 *
 * @author Muhammad Mainul Hossain
 * @copyright Muhammad Mainul Hossain, Karlsruhe, Germany, 2009
 * @version 0.1
*/
var Line = new Class({
	Implements: [ChartItem, Options],
	options:
	{
		point1: null,
		point2: null,
		color: defaultColor,
		drawer: null,
		id: -1,
		weight: 1
	},
	initialize: function (options)
	{
		this.setOptions(options);
	},
	draw: function(js, transform)
	{
		if (!this.visible) return;
		if (this.options.drawer)
		{
			this.options.drawer(this, js, transform);
		}
		else
		{
			this.options.point1.draw(js, transform);
			this.options.point2.draw(js, transform);
			
			js.drawLine(new jsPen(new jsColor('#' + this.options.color), this.options.weight), this.options.point1.getjsPoint(transform), this.options.point2.getjsPoint(transform));
		}
	},
	show: function(value)
	{
		this.options.point1.show(value);
		this.options.point2.show(value);
		this.visible = value;
	}
});

/** 
 * A polyline definition. If the points are 2D, it is drawn as 2D.
 * Otherwise, as 3D.
 *
 * @author Muhammad Mainul Hossain
 * @copyright Muhammad Mainul Hossain, Karlsruhe, Germany, 2009
 * @version 0.1
*/
var PolyLine = new Class({
	Implements: [ChartItem, Options],
	options: 
	{
		points: new Array(),
		color: defaultColor,
		id: -1,
		drawer: null,
		showLine: true
	},
	initialize: function (options)
	{
		this.setOptions(options);
	},
	draw: function(js, transform)
	{
		if (!this.visible) return;
		if (this.options.drawer)
		{
			this.options.drawer(this, js, transform);
		}
		else
		{
			if (this.options.points.length == 1)
			{
				this.options.points[0].draw(js, transform);
			}
			else if (!this.options.showLine)
			{
				this.options.points.each(function(point){ point.draw(js, transform);});
			}
			else
			{
				for (var i = 1; i < this.options.points.length; i++) 
				{
					new Line({point1: this.options.points[i - 1], point2: this.options.points[i], color: this.options.color}).draw(js, transform);
				}
			}
		}
	},
	add: function(point)
	{
		this.options.points[this.options.points.length] = point;
	},
	show: function(value)
	{
		this.options.points.each(function(item) { item.show(value); });
		this.visible = value;
	}
});

/** 
 * Definition of text to be drawn on the chart. 
 *
 * @author Muhammad Mainul Hossain
 * @copyright Muhammad Mainul Hossain, Karlsruhe, Germany, 2009
 * @version 0.1
*/
var Text = new Class({
	Implements: [ChartItem, Options],
	options: 
	{
		point: null,
		color: defaultColor,
		id: -1,
		drawer: null,
		text: ''
	},
	initialize: function (options)
	{
		this.setOptions(options);
	},
	draw: function(js, transform)
	{
		if (!this.visible) return;
		if (this.options.drawer)
		{
			this.options.drawer(this, js, transform);
		}
		else
		{
			this.options.point.draw(js, transform);
			js.drawText(this.options.text, this.options.point.getjsPoint(transform), null, new jsColor(this.options.color));
		}
	},
	show: function(value)
	{
		this.options.point.show(value);
		this.visible = value;
	}
});

/** 
 * Definition of 2D axis for the chart
 *
 * @author Muhammad Mainul Hossain
 * @copyright Muhammad Mainul Hossain, Karlsruhe, Germany, 2009
 * @version 0.1
*/
var Axis = new Class({
	Implements: [ChartItem,Options],
	options: {
		line: new Line(new Point(0, 0, defaultColor), new Point(0, 0, defaultColor), defaultColor),
		range: 
		{
			start: 0,
			end: 100
		},
		tick: 0,
		text: null,
		labels: 
		{
			text: [],
			fixed: false
		},
		mode: 'x'
	},
	tickItems: [],
	initialize: function(options)
	{
		this.setOptions(options);
		//var rng = Math.abs(this.options.range.end - this.options.range.start);
		var firstPoint = this.options.line.options.point1;
		var secondPoint = this.options.line.options.point2;
		
		if (this.options.mode == 'x')
			var length = secondPoint.options.x - firstPoint.options.x;
		else
			length = secondPoint.options.y - firstPoint.options.y;

		var count = length/this.options.tick;
		
		if (this.options.tick > 0)
		{
			this.tickItems.length = 0;
			if (this.options.mode == 'x')
			{
				for(var i = 1; i < count; ++i)
				{
					this.tickItems[this.tickItems.length] = new Line({
							point1: new Point({x: firstPoint.options.x + i * this.options.tick, y: firstPoint.options.y, color: defaultColor, transform:firstPoint.options.tranform}),
							point2: new Point({x: firstPoint.options.x + i * this.options.tick, y: firstPoint.options.y - 2, color: defaultColor, transform:firstPoint.options.tranform}),
							color: defaultColor
					});
				}
			}
			else if (this.options.mode == 'y')
			{
				for(i = 1; i < count; ++i)
				{
					this.tickItems[this.tickItems.length] = new Line({
							point1: new Point({x: firstPoint.options.x - 2, y: firstPoint.options.y + i * this.options.tick, color: defaultColor, transform:firstPoint.options.tranform}),
							point2: new Point({x: firstPoint.options.x, y: firstPoint.options.y + i * this.options.tick, color: defaultColor, transform:firstPoint.options.tranform}),
							color: defaultColor
					});
				}
			}	
		}
		if (this.options.labels.text.length > 0 && !this.options.labels.fixed)
		{
			labelsDiff = length/this.options.labels.text.length; 
			this.options.labels.text.each(function(value, i)
			{
				if (this.options.mode == 'x')
					value.options.point = new Point({x: firstPoint.options.x + i * labelsDiff, y: firstPoint.options.y - 5, color: defaultColor, transform:firstPoint.options.tranform});
				else
					value.options.point = new Point({x: firstPoint.options.x - 5, y: firstPoint.options.y + i * labelsDiff, color: defaultColor, transform:firstPoint.options.tranform});
			});
		}
	},
	draw: function(js, transform)
	{
		if (!this.visible) return;
		if (this.options.line)
			this.options.line.draw(js, transform);
		
		if (this.options.text)
		{
			this.options.text.draw(js, transform);
		}
		this.tickItems.each(function(text){text.draw(js, transform);});
		this.options.labels.text.each(function(text){text.draw(js, transform);});
	},
	show: function(value)
	{
		this.options.line.show(value);
		this.options.text.show(value);
		this.tickItems.each(function(item) { item.show(value); });
		this.options.labels.text.each(function(item) { item.show(value); });
		this.visible = value;
	}
});

/** 
 * A 2D chart.
 *
 * @author Muhammad Mainul Hossain
 * @copyright Muhammad Mainul Hossain, Karlsruhe, Germany, 2009
 * @version 0.1
*/
var Chart = new Class({
	Implements: [ChartItem,Options],
	options:
	{
		items: new Array(),
		axes:  new Array(),
		canvas: null,
		graphics: null
	},
	transformation: null,
	initialize: function(options)
	{
		this.setOptions(options);
		if (this.options.canvas)
		{
			this.transformation = new Transformation({width: this.options.canvas.offsetWidth, height: this.options.canvas.offsetHeight, scale: 3});
		}
		
		if (!this.options.graphics && this.options.canvas)
		{
			this.options.graphics = new jsGraphics(this.options.canvas);
			this.options.graphics.setCoordinateSystem("cartecian");
			
			this.options.graphics.setOrigin(new jsPoint(0 + 40, this.transformation.options.height));
		}
		
		if (!this.options.axes.length)
		{
			this.options.axes = [new Axis({
				line: new Line({
					point1: new Point({x: 0, y:0, color:defaultColor}),
					point2: new Point({x: 100, y:0, color:defaultColor}),
					color: defaultColor
					}),
				range: {start: 0, end: 100},
				text: new Text({ 
					point: new Point({x: 100, y:0, color:defaultColor}),
					text: 'Hue'
				}),
				tick: 10,
				mode: 'x'
			}),
			new Axis({
				line: new Line({
					point1: new Point({x: 0, y:0, color:defaultColor}),
					point2: new Point({x: 0, y:100, color:defaultColor}),
					color: defaultColor
					}),
				range: {start: 0, end: 100},
				text: new Text({ 
					point: new Point({x: 0, y:100, color:defaultColor}),
					text: 'Value'
				}),
				tick: 10,
				mode: 'y'
			})];
		}
		
	},
	paint: function()
	{
		this.draw(this.options.graphics, this.transformation.transform.bind(this.transformation));
	},
	draw: function(js, transform) 
	{
		js.clear();
		// draw the axes
		this.options.axes.each(function(text){text.draw(js, transform);});
		if (!this.visible) return;
		this.options.items.each(function(text){text.draw(js, transform);});
	},
	add: function(item)
	{
		this.options.items[this.options.items.length] = item; 
	},
	clear: function()
	{
		this.options.items.length = 0;
		this.options.graphics.clear();
	},
	show: function(value, ids){
		
		if (ids)
		{
			ids.each(function(item)
				{
					this.options.items.each(function(elem){
						if (item == elem.options.id) 
							elem.show(value);
					});
				}.bind(this));
		}
		else
			this.visible = value;
	},
	showLine: function(value, ids)
	{
		if (ids)
		{
			ids.each(function(item)
				{
					this.options.items.each(function(elem){
						if (item == elem.options.id) 
							elem.options.showLine = value;
					});
				}.bind(this));
		}
	}
});

/** 
 * Definition of 3D point for 3D chart.
 *
 * @author Muhammad Mainul Hossain
 * @copyright Muhammad Mainul Hossain, Karlsruhe, Germany, 2009
 * @version 0.1
*/
var Point3D = new Class({
	Implements: [ChartItem,Options,Events],
	Extends: Point,
	options:
	{
		z: 0,
		w: 0
	},
	initialize: function(options)
	{
		this.parent(options);
	}
});

/** 
 * Transformation of a 2D point.
 *
 * @author Muhammad Mainul Hossain
 * @copyright Muhammad Mainul Hossain, Karlsruhe, Germany, 2009
 * @version 0.1
*/
var Transformation = new Class({
	Implements: [Options],
	options:
	{
		width: 0,
		height: 0,
		scale: 1
	},
	initialize: function(options) 
	{
		this.setOptions(options);
	},
	transform: function(point)
	{
		return {x: this.options.scale * point.options.x, y: this.options.scale * point.options.y};
	}
});

/** 
 * 3D axis definition
 *
 * @author Muhammad Mainul Hossain
 * @copyright Muhammad Mainul Hossain, Karlsruhe, Germany, 2009
 * @version 0.1
*/
var Axis3D = new Class({
	Implements: [ChartItem,Options],
	Extends: Axis,
	options: {
	},
	initialize: function(options)
	{
		this.parent(options);
		//var rng = Math.abs(this.options.range.end - this.options.range.start);
		var point1 = this.options.line.options.point1;
		var point2 = this.options.line.options.point2;
		
		if (this.options.mode == 'x')
			var length = point2.options.x - point1.options.x;
		else if (this.options.mode == 'y')
			length = point2.options.y - point1.options.y;
		else
			length = point2.options.z - point1.options.z;

		var count = length/this.options.tick;
		
		if (this.options.tick > 0)
		{
			this.tickItems.length = 0;

			if (this.options.mode == 'x')
			{
				for(var i = 1; i < count; ++i)
				{
					this.tickItems[this.tickItems.length] = new Line({
							point1: new Point3D({x: point1.options.x + i * this.options.tick, y: point1.options.y, z: point1.options.z, color: defaultColor, transform:point1.options.tranform}),
							point2: new Point3D({x: point1.options.x + i * this.options.tick, y: point1.options.y - 2, z: point1.options.z - 2, color: defaultColor, transform:point1.options.tranform}),
							color: defaultColor
					});
				}
			}
			else if (this.options.mode == 'y')	
			{
				for(i = 1; i < count; ++i)
				{
					this.tickItems[this.tickItems.length] = new Line({
							point1: new Point3D({x: point1.options.x - 5, y: point1.options.y + i * this.options.tick, z: point1.options.z, color: defaultColor, transform:point1.options.tranform}),
							point2: new Point3D({x: point1.options.x, y: point1.options.y + i * this.options.tick, z: point1.options.z + 2, color: defaultColor, transform:point1.options.tranform}),
							color: defaultColor
					});
				}
			}
			else
			{
				for(i = 1; i < count; ++i)
				{
					this.tickItems[this.tickItems.length] = new Line({
							point1: new Point3D({x: point1.options.x, y: point1.options.y, z: point1.options.z + i * this.options.tick, color: defaultColor, transform:point1.options.tranform}),
							point2: new Point3D({x: point1.options.x + 5, y: point1.options.y + 2, z: point1.options.z + i * this.options.tick, color: defaultColor, transform:point1.options.tranform}),
							color: defaultColor
					});
				}
			}
		}
		if (this.options.labels.text.length > 0 && !this.options.labels.fixed)
		{
			labelsDiff = length/this.options.labels.text.length; 
			this.options.labels.text.each(function(value, i)
			{
				if (this.options.mode == 'x')
					value.options.point = new Point({x: point1.options.x + i * labelsDiff, y: point1.options.y - 5, z: point1.options.z, color: defaultColor, transform:point1.options.tranform});
				else if (this.options.mode == 'y')
					value.options.point = new Point({x: point1.options.x - 5, y: point1.options.y + i * labelsDiff, z: point1.options.z, color: defaultColor, transform:point1.options.tranform});
				else
					value.options.point = new Point({x: point1.options.x, y: point1.options.y, z: point1.options.z + i * labelsDiff, color: defaultColor, transform:point1.options.tranform});
			});
		}
	}
});

/** 
 * A 3D transformation definition for the rotation, scaling, and
 * translation of 3D points.
 *
 * @author Muhammad Mainul Hossain
 * @copyright Muhammad Mainul Hossain, Karlsruhe, Germany, 2009
 * @version 0.1
*/
var Transformation3D = new Class({
	Implements: [Options],
	Extends: Transformation,
	identity: [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]],
	matrix: [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]],
	initialize: function(options) 
	{
		this.parent(options);
		if (this.options.scale > 1)
		{
			this.matrix = this.scale(this.options.scale, this.options.scale, this.options.scale)
		}
	},
	mult: function(m1, m2) {
		//Initialize the result matrix
		var result = new Array(4);
		for (var i = 0; i<4;i++) {
			result[i] = new Array(4);
		}
		
		// Perform the multiplication.
		for(i = 0; i < 4; i++){
			result[i][0] = m1[i][0] * m2[0][0] + m1[i][1] * m2[1][0] + m1[i][2] * m2[2][0] + m1[i][3] * m2[3][0];
			result[i][1] = m1[i][0] * m2[0][1] + m1[i][1] * m2[1][1] + m1[i][2] * m2[2][1] + m1[i][3] * m2[3][1];
			result[i][2] = m1[i][0] * m2[0][2] + m1[i][1] * m2[1][2] + m1[i][2] * m2[2][2] + m1[i][3] * m2[3][2];
			result[i][3] = m1[i][0] * m2[0][3] + m1[i][1] * m2[1][3] + m1[i][2] * m2[2][3] + m1[i][3] * m2[3][3];
		}
		return result;
	},
	multV: function(m,v0,v1,v2,v3) 
	{
		// Initialize the result vector.
		var result = new Array(4);
		
		// Perform the multiplication
		result[0] = m[0][0]*v0 + m[0][1]*v1 + m[0][2]*v2 + m[0][3]*v3;
		result[1] = m[1][0]*v0 + m[1][1]*v1 + m[1][2]*v2 + m[1][3]*v3;
		result[2] = m[2][0]*v0 + m[2][1]*v1 + m[2][2]*v2 + m[2][3]*v3;
		result[3] = m[3][0]*v0 + m[3][1]*v1 + m[3][2]*v2 + m[3][3]*v3;
		return result;
	},
	identity: function () 
	{
		return [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
	},
	resetMatrix: function() {
		// translate the axes to the center of the canvas.
		this.matrix = this.identity();
		this.matrix = this.translate(this.options.width/2, this.options.height/2, 0);
	},
	rotateX: function(angle) 
	{
		var c = Math.cos(angle);
		var s = Math.sin(angle);
		this.matrix = this.mult(this.matrix,[[1, 0, 0, 0],[0, c, -s, 0],[0, s, c, 0],[0, 0, 0, 1]]);
		return this.matrix;
	},
	rotateY: function(angle)
	{	var c = Math.cos(angle);
		var s = Math.sin(angle);
		this.matrix = this.mult(this.matrix,[[c, 0, s, 0],[0, 1, 0, 0],[-s, 0, c, 0],[0, 0, 0, 1]]);
		return this.matrix;
	},
	rotateZ: function(angle) 
	{
		var c = Math.cos(angle);
		var s = Math.sin(angle);
		this.matrix = this.mult(this.matrix,[[c, -s, 0, 0],[s, c, 0, 0],[0, 0, 1, 0],[0, 0, 0, 1]]);
		return this.matrix;
	},
	scale: function(scaleX,scaleY,scaleZ) 
	{
		 this.matrix = this.mult(this.matrix,[[scaleX,0,0,0],[0,scaleY,0,0],[0,0,scaleZ,0],[0,0,0,1]]);
		 return this.matrix;
	},
	translate: function(dX, dY, dZ) 
	{
		this.matrix = this.mult(this.matrix,[[1,0,0,dX],[0,1,0,dY],[0,0,1,dZ],[0,0,0,1]]);
		return this.matrix;
	},
	transform: function(point)
	{
		point =  this.multV(this.matrix, point.options.x, point.options.y, point.options.z, point.options.w);
		return {x: point[0], y: point[1]};
	}
});

/** 
 * 3D Chart definition
 *
 * @author Muhammad Mainul Hossain
 * @copyright Muhammad Mainul Hossain, Karlsruhe, Germany, 2009
 * @version 0.1
*/
var Chart3D = new Class({
	Implements: [ChartItem,Options],
	Extends: Chart,
	options:
	{
		maxZ: 0
	},
	initialize: function(options)
	{
		//this.setOptions(options);
		this.parent(options);

		if (this.options.canvas)
		{
			this.transformation = new Transformation3D({width: this.options.canvas.offsetWidth, height: this.options.canvas.offsetHeight, scale: 2});
		}
		
		if (this.options.axes.length < 3)
		{
			this.options.axes.length = 0;
			this.options.axes = [
			 new Axis3D({
				line: new Line({
					point1: new Point3D({x: 0, y:0, z:0, color:defaultColor}),
					point2: new Point3D({x: 100, y:0, z:0, color:defaultColor}),
					color: defaultColor
				}),
				range: {start: 0, end: 100},
				text: new Text({ 
					point: new Point3D({x: 100, y:0, z:0, color:defaultColor}),
					text: 'Hue'
				}),
				tick: 10,
				mode: 'x'
			}),
			
			new Axis3D({
				line: new Line({
					point1: new Point3D({x: 0, y:0, z:0, color:defaultColor}),
					point2: new Point3D({x: 0, y:100, z:0, color:defaultColor}),
					color: defaultColor
					}),
				range: {start: 0, end: 100},
				text: new Text({ 
					point: new Point3D({x: 0, y:100, z:0, color:defaultColor}),
					text: 'Value'
				}),
				tick: 10,
				mode: 'y'
			}),
			new Axis3D({
				line: new Line({
					point1: new Point3D({x: 0, y:0, z:0, color:defaultColor}),
					point2: new Point3D({x: 0, y:0, z:100, color:defaultColor}),
					color: defaultColor
					}),
				range: {start: 0, end: 100},
				text: new Text({ 
					point: new Point3D({x: 0, y:0, z:100, color:defaultColor}),
					text: 'Chroma'
				}),
				tick: 10,
				mode: 'z'
			})];
		}

		if (this.options.graphics)
		{
			this.options.graphics.setOrigin(new jsPoint(this.transformation.options.width/2, this.transformation.options.height/2 + 60));
			this.options.graphics.setScale(1);
		}
	},
	createPoint3D: function(options)
	{
		var point = new Point3D(options);
		point.setOptions({transform: this.transformation.transform.bind(this.transformation)})
	}
	
});