(function () { "use strict";
var $hxClasses = {};
function $extend(from, fields) {
	function Inherit() {} Inherit.prototype = from; var proto = new Inherit();
	for (var name in fields) proto[name] = fields[name];
	if( fields.toString !== Object.prototype.toString ) proto.toString = fields.toString;
	return proto;
}
var EReg = function(r,opt) {
	opt = opt.split("u").join("");
	this.r = new RegExp(r,opt);
};
$hxClasses["EReg"] = EReg;
EReg.__name__ = ["EReg"];
EReg.prototype = {
	match: function(s) {
		if(this.r.global) this.r.lastIndex = 0;
		this.r.m = this.r.exec(s);
		this.r.s = s;
		return this.r.m != null;
	}
	,matched: function(n) {
		if(this.r.m != null && n >= 0 && n < this.r.m.length) return this.r.m[n]; else throw "EReg::matched";
	}
	,matchedRight: function() {
		if(this.r.m == null) throw "No string matched";
		var sz = this.r.m.index + this.r.m[0].length;
		return this.r.s.substr(sz,this.r.s.length - sz);
	}
	,split: function(s) {
		var d = "#__delim__#";
		return s.replace(this.r,d).split(d);
	}
	,replace: function(s,by) {
		return s.replace(this.r,by);
	}
	,__class__: EReg
};
var HxOverrides = function() { };
$hxClasses["HxOverrides"] = HxOverrides;
HxOverrides.__name__ = ["HxOverrides"];
HxOverrides.dateStr = function(date) {
	var m = date.getMonth() + 1;
	var d = date.getDate();
	var h = date.getHours();
	var mi = date.getMinutes();
	var s = date.getSeconds();
	return date.getFullYear() + "-" + (m < 10?"0" + m:"" + m) + "-" + (d < 10?"0" + d:"" + d) + " " + (h < 10?"0" + h:"" + h) + ":" + (mi < 10?"0" + mi:"" + mi) + ":" + (s < 10?"0" + s:"" + s);
};
HxOverrides.strDate = function(s) {
	var _g = s.length;
	switch(_g) {
	case 8:
		var k = s.split(":");
		var d = new Date();
		d.setTime(0);
		d.setUTCHours(k[0]);
		d.setUTCMinutes(k[1]);
		d.setUTCSeconds(k[2]);
		return d;
	case 10:
		var k1 = s.split("-");
		return new Date(k1[0],k1[1] - 1,k1[2],0,0,0);
	case 19:
		var k2 = s.split(" ");
		var y = k2[0].split("-");
		var t = k2[1].split(":");
		return new Date(y[0],y[1] - 1,y[2],t[0],t[1],t[2]);
	default:
		throw "Invalid date format : " + s;
	}
};
HxOverrides.cca = function(s,index) {
	var x = s.charCodeAt(index);
	if(x != x) return undefined;
	return x;
};
HxOverrides.substr = function(s,pos,len) {
	if(pos != null && pos != 0 && len != null && len < 0) return "";
	if(len == null) len = s.length;
	if(pos < 0) {
		pos = s.length + pos;
		if(pos < 0) pos = 0;
	} else if(len < 0) len = s.length + len - pos;
	return s.substr(pos,len);
};
HxOverrides.indexOf = function(a,obj,i) {
	var len = a.length;
	if(i < 0) {
		i += len;
		if(i < 0) i = 0;
	}
	while(i < len) {
		if(a[i] === obj) return i;
		i++;
	}
	return -1;
};
HxOverrides.remove = function(a,obj) {
	var i = HxOverrides.indexOf(a,obj,0);
	if(i == -1) return false;
	a.splice(i,1);
	return true;
};
HxOverrides.iter = function(a) {
	return { cur : 0, arr : a, hasNext : function() {
		return this.cur < this.arr.length;
	}, next : function() {
		return this.arr[this.cur++];
	}};
};
var Lambda = function() { };
$hxClasses["Lambda"] = Lambda;
Lambda.__name__ = ["Lambda"];
Lambda.list = function(it) {
	var l = new List();
	var $it0 = $iterator(it)();
	while( $it0.hasNext() ) {
		var i = $it0.next();
		l.add(i);
	}
	return l;
};
Lambda.exists = function(it,f) {
	var $it0 = $iterator(it)();
	while( $it0.hasNext() ) {
		var x = $it0.next();
		if(f(x)) return true;
	}
	return false;
};
Lambda.indexOf = function(it,v) {
	var i = 0;
	var $it0 = $iterator(it)();
	while( $it0.hasNext() ) {
		var v2 = $it0.next();
		if(v == v2) return i;
		i++;
	}
	return -1;
};
Lambda.find = function(it,f) {
	var $it0 = $iterator(it)();
	while( $it0.hasNext() ) {
		var v = $it0.next();
		if(f(v)) return v;
	}
	return null;
};
var Level = function(model,sheet,index) {
	this.reloading = false;
	this.startPos = null;
	this.mousePos = { x : 0, y : 0};
	this.zoomView = 1.;
	this.sheet = sheet;
	this.sheetPath = model.getPath(sheet);
	this.index = index;
	this.obj = sheet.lines[index];
	this.model = model;
};
$hxClasses["Level"] = Level;
Level.__name__ = ["Level"];
Level.prototype = {
	getName: function() {
		var name = "#" + this.index;
		var _g = 0;
		var _g1 = this.sheet.columns;
		while(_g < _g1.length) {
			var c = _g1[_g];
			++_g;
			var v = Reflect.field(this.obj,c.name);
			var _g2 = c.type;
			switch(_g2[1]) {
			case 1:
				if(c.name == this.sheet.props.displayColumn && v != null && v != "") return v; else {
				}
				break;
			case 0:
				name = v;
				break;
			default:
			}
		}
		return name;
	}
	,init: function() {
		var _g = this;
		this.layers = [];
		this.watchList = [];
		this.watchTimer = new haxe.Timer(50);
		this.watchTimer.run = $bind(this,this.checkWatch);
		this.props = this.sheet.props.levelProps;
		if(this.props.tileSize == null) this.props.tileSize = 16;
		this.tileSize = this.props.tileSize;
		var lprops = new haxe.ds.StringMap();
		if(this.props.layers == null) this.props.layers = [];
		var _g1 = 0;
		var _g11 = this.props.layers;
		while(_g1 < _g11.length) {
			var ld = _g11[_g1];
			++_g1;
			lprops.set(ld.l,ld);
		}
		var getProps = function(name) {
			var p = lprops.get(name);
			if(p == null) {
				p = { l : name, p : { alpha : 1.}};
				_g.props.layers.push(p);
			}
			lprops.remove(name);
			return p.p;
		};
		this.waitCount = 1;
		var title = "";
		var _g2 = 0;
		var _g12 = this.sheet.columns;
		while(_g2 < _g12.length) {
			var c = _g12[_g2];
			++_g2;
			var val = Reflect.field(this.obj,c.name);
			var _g21 = c.name;
			switch(_g21) {
			case "width":
				this.width = val;
				break;
			case "height":
				this.height = val;
				break;
			default:
			}
			{
				var _g22 = c.type;
				switch(_g22[1]) {
				case 0:
					title = val;
					break;
				case 12:
					var type = _g22[2];
					var l = new lvl.LayerData(this,c.name,getProps(c.name),{ o : this.obj, f : c.name});
					l.loadSheetData(this.model.smap.get(type).s);
					l.setLayerData(val);
					this.layers.push(l);
					break;
				case 8:
					var sheet = this.model.smap.get(this.sheet.name + "@" + c.name).s;
					var floatCoord = false;
					if(this.model.hasColumn(sheet,"x",[cdb.ColumnType.TInt]) && this.model.hasColumn(sheet,"y",[cdb.ColumnType.TInt]) || (floatCoord = this.model.hasColumn(sheet,"x",[cdb.ColumnType.TFloat]) && this.model.hasColumn(sheet,"y",[cdb.ColumnType.TFloat]))) {
						var sid = null;
						var idCol = null;
						var _g3 = 0;
						var _g4 = sheet.columns;
						try {
							while(_g3 < _g4.length) {
								var cid = _g4[_g3];
								++_g3;
								{
									var _g5 = cid.type;
									switch(_g5[1]) {
									case 6:
										var rid = _g5[2];
										sid = this.model.smap.get(rid).s;
										idCol = cid.name;
										throw "__break__";
										break;
									default:
									}
								}
							}
						} catch( e ) { if( e != "__break__" ) throw e; }
						var l1 = new lvl.LayerData(this,c.name,getProps(c.name),{ o : this.obj, f : c.name});
						l1.hasFloatCoord = l1.floatCoord = floatCoord;
						l1.baseSheet = sheet;
						l1.loadSheetData(sid);
						l1.setObjectsData(idCol,val);
						l1.hasSize = this.model.hasColumn(sheet,"width",[floatCoord?cdb.ColumnType.TFloat:cdb.ColumnType.TInt]) && this.model.hasColumn(sheet,"height",[floatCoord?cdb.ColumnType.TFloat:cdb.ColumnType.TInt]);
						this.layers.push(l1);
					} else if(this.model.hasColumn(sheet,"name",[cdb.ColumnType.TString]) && this.model.hasColumn(sheet,"data",[cdb.ColumnType.TTileLayer])) {
						var val1 = val;
						var _g31 = 0;
						while(_g31 < val1.length) {
							var lobj = val1[_g31];
							++_g31;
							if(lobj.name == null) continue;
							var l2 = new lvl.LayerData(this,lobj.name,getProps(lobj.name),{ o : lobj, f : "data"});
							l2.setTilesData(lobj.data);
							l2.listColumnn = c;
							this.layers.push(l2);
						}
						this.newLayer = c;
					}
					break;
				case 15:
					var l3 = new lvl.LayerData(this,c.name,getProps(c.name),{ o : this.obj, f : c.name});
					l3.setTilesData(val);
					this.layers.push(l3);
					break;
				default:
				}
			}
		}
		var $it0 = lprops.iterator();
		while( $it0.hasNext() ) {
			var c1 = $it0.next();
			HxOverrides.remove(this.props.layers,c1);
		}
		if(this.sheet.props.displayColumn != null) {
			var t = Reflect.field(this.obj,this.sheet.props.displayColumn);
			if(t != null) title = t;
		}
		this.waitDone();
	}
	,reload: function() {
		if(!this.reloading) {
			this.reloading = true;
			this.model.initContent();
		}
	}
	,dispose: function() {
		if(this.content != null) this.content.html("");
		if(this.view != null) {
			this.view.dispose();
			var ca = this.view.getCanvas();
			ca.parentNode.removeChild(ca);
			this.view = null;
		}
		this.watchTimer.stop();
		this.watchTimer = null;
	}
	,isDisposed: function() {
		return this.watchTimer == null;
	}
	,watch: function(path,callb) {
		path = this.model.getAbsPath(path);
		this.watchList.push({ path : path, time : this.getFileTime(path), callb : callb});
	}
	,checkWatch: function() {
		var _g = 0;
		var _g1 = this.watchList;
		while(_g < _g1.length) {
			var w = _g1[_g];
			++_g;
			var f = this.getFileTime(w.path);
			if(f != w.time && f != 0.) {
				w.time = f;
				w.callb();
			}
		}
	}
	,getFileTime: function(path) {
		try {
			return js.Node.require("fs").statSync(path).mtime.getTime() * 1.;
		} catch( e ) {
			return 0.;
		}
	}
	,wait: function() {
		this.waitCount++;
	}
	,waitDone: function() {
		if(--this.waitCount != 0) return;
		if(this.isDisposed()) return;
		this.setup();
		this.draw();
		var layer = this.layers[0];
		var state;
		try {
			state = haxe.Unserializer.run(js.Browser.getLocalStorage().getItem(this.sheetPath));
		} catch( e ) {
			state = null;
		}
		if(state != null) {
			var _g = 0;
			var _g1 = this.layers;
			while(_g < _g1.length) {
				var l = _g1[_g];
				++_g;
				if(l.name == state.curLayer) {
					layer = l;
					break;
				}
			}
			this.zoomView = state.zoomView;
			this.paintMode = state.paintMode;
			this.randomMode = state.randomMode;
		}
		this.setCursor(layer);
		this.updateZoom();
		if(state != null) {
			var sc = this.content.find(".scroll");
			sc.scrollLeft(state.scrollX);
			sc.scrollTop(state.scrollY);
		}
	}
	,toColor: function(v) {
		return "#" + StringTools.hex(v,6);
	}
	,pick: function() {
		if(this.curPos == null) return null;
		var i = this.layers.length - 1;
		while(i >= 0) {
			var l = this.layers[i--];
			if(!l.visible) continue;
			{
				var _g = l.data;
				switch(_g[1]) {
				case 0:
					var data = _g[2];
					var idx = this.curPos.x + this.curPos.y * this.width;
					var k = data[idx];
					if(k == 0 && i >= 0) continue;
					return { k : k, layer : l, index : idx};
				case 1:
					var objs = _g[3];
					var idCol = _g[2];
					var x = this.curPos.xf;
					var y = this.curPos.yf;
					var _g2 = 0;
					var _g1 = objs.length;
					while(_g2 < _g1) {
						var i1 = _g2++;
						var o = objs[i1];
						var w;
						if(l.hasSize) w = o.width; else w = 1;
						var h;
						if(l.hasSize) h = o.height; else h = 1;
						if(!(o.x >= x + 1 || o.y >= y + 1 || o.x + w < x || o.y + h < y)) {
							if(l.idToIndex == null) return { k : 0, layer : l, index : i1};
							var k1;
							var key = Reflect.field(o,idCol);
							k1 = l.idToIndex.get(key);
							if(k1 != null) return { k : k1, layer : l, index : i1};
						}
					}
					break;
				case 2:
					var data1 = _g[3];
					var idx1 = this.curPos.x + this.curPos.y * this.width;
					var k2 = data1[idx1] - 1;
					if(k2 < 0) continue;
					return { k : k2, layer : l, index : idx1};
				}
			}
		}
		return null;
	}
	,action: function(name) {
		var _g = this;
		switch(name) {
		case "close":
			(js.Boot.__cast(this.model , Main)).closeLevel(this);
			break;
		case "options":
			var opt = this.content.find(".submenu.options");
			var hide = opt["is"](":visible");
			this.content.find(".submenu").hide();
			if(hide) this.content.find(".submenu.layer").show(); else {
				opt.show();
				this.content.find("[name=tileSize]").val("" + this.tileSize);
			}
			break;
		case "layer":
			if(this.newLayer == null) return;
			var opt1 = this.content.find(".submenu.newlayer");
			var hide1 = opt1["is"](":visible");
			this.content.find(".submenu").hide();
			if(hide1) this.content.find(".submenu.layer").show(); else {
				opt1.show();
				this.content.find("[name=newName]").val("");
			}
			break;
		case "file":
			var m;
			m = js.Boot.__cast(this.model , Main);
			m.chooseFile(function(path) {
				{
					var _g1 = _g.currentLayer.data;
					switch(_g1[1]) {
					case 2:
						var data = _g1[3];
						var t = _g1[2];
						t.file = path;
						_g.currentLayer.dirty = true;
						_g.save();
						_g.reload();
						break;
					default:
					}
				}
			});
			break;
		}
	}
	,addNewLayer: function(name) {
		var _g = this.newLayer.type;
		switch(_g[1]) {
		case 8:
			var s = this.model.smap.get(this.sheet.name + "@" + this.newLayer.name).s;
			var o = { name : null, data : null};
			var _g1 = 0;
			var _g2 = s.columns;
			while(_g1 < _g2.length) {
				var c = _g2[_g1];
				++_g1;
				var v = this.model.getDefault(c);
				if(v != null) o[c.name] = v;
			}
			var a = Reflect.field(this.obj,this.newLayer.name);
			o.name = name;
			a.push(o);
			var n = a.length - 2;
			while(n >= 0) {
				var o2 = a[n--];
				if(o2.data != null) {
					var a1 = cdb._Types.TileLayerData_Impl_.encode((function($this) {
						var $r;
						var _g11 = [];
						{
							var _g3 = 0;
							var _g21 = $this.width * $this.height;
							while(_g3 < _g21) {
								var k = _g3++;
								_g11.push(0);
							}
						}
						$r = _g11;
						return $r;
					}(this)));
					o.data = { file : o2.data.file, size : o2.data.size, stride : o2.data.stride, data : a1};
					break;
				}
			}
			this.save();
			this.reload();
			break;
		default:
		}
	}
	,popupLayer: function(l,mouseX,mouseY) {
		var _g = this;
		this.setCursor(l);
		var n = new nodejs.webkit.Menu();
		var nclear = new nodejs.webkit.MenuItem({ label : "Clear"});
		var ndel = new nodejs.webkit.MenuItem({ label : "Delete"});
		var _g1 = 0;
		var _g11 = [nclear,ndel];
		while(_g1 < _g11.length) {
			var m = _g11[_g1];
			++_g1;
			n.append(m);
		}
		nclear.click = function() {
			{
				var _g2 = l.data;
				switch(_g2[1]) {
				case 2:
					var data = _g2[3];
					var _g21 = 0;
					var _g12 = data.length;
					while(_g21 < _g12) {
						var i = _g21++;
						data[i] = 0;
					}
					break;
				case 1:
					var objs = _g2[3];
					while(objs.length > 0) objs.pop();
					break;
				case 0:
					var data1 = _g2[2];
					var _g22 = 0;
					var _g13 = data1.length;
					while(_g22 < _g13) {
						var i1 = _g22++;
						data1[i1] = 0;
					}
					break;
				}
			}
			l.dirty = true;
			_g.save();
			_g.draw();
		};
		ndel.enabled = l.listColumnn != null;
		ndel.click = function() {
			var layers = Reflect.field(_g.obj,l.listColumnn.name);
			var x = l.targetObj.o;
			HxOverrides.remove(layers,x);
			_g.save();
			_g.reload();
		};
		n.popup(mouseX,mouseY);
	}
	,onResize: function() {
		var win = nodejs.webkit.Window.get();
		this.content.find(".scroll").css("height",win.height - 240 + "px");
	}
	,setup: function() {
		var _g3 = this;
		var page = new js.JQuery("#content");
		page.html("");
		this.content = ((function($this) {
			var $r;
			var html = new js.JQuery("#levelContent").html();
			$r = new js.JQuery(html);
			return $r;
		}(this))).appendTo(page);
		var menu = this.content.find(".menu");
		var _g = 0;
		var _g1 = this.layers;
		while(_g < _g1.length) {
			var l = [_g1[_g]];
			++_g;
			var td = [new js.JQuery("<div class='item layer'>").appendTo(menu)];
			l[0].comp = td[0];
			if(!l[0].visible) td[0].addClass("hidden");
			td[0].mousedown((function(l) {
				return function(e) {
					var _g2 = e.which;
					switch(_g2) {
					case 1:
						_g3.setCursor(l[0]);
						break;
					case 3:
						_g3.popupLayer(l[0],e.pageX,e.pageY);
						e.preventDefault();
						break;
					}
				};
			})(l));
			new js.JQuery("<span>").text(l[0].name).appendTo(td[0]);
			if(l[0].images != null) {
				var isel = new js.JQuery("<div class='img'>").appendTo(td[0]);
				if(l[0].images.length > 0) isel.append((function($this) {
					var $r;
					var html1 = l[0].images[l[0].current].getCanvas();
					$r = new js.JQuery(html1);
					return $r;
				}(this)));
				isel.click((function(td,l) {
					return function(e1) {
						_g3.setCursor(l[0]);
						var list = new js.JQuery("<div class='imglist'>");
						var _g4 = 0;
						var _g21 = l[0].images.length;
						while(_g4 < _g21) {
							var i = [_g4++];
							list.append(new js.JQuery("<img>").attr("src",l[0].images[i[0]].getCanvas().toDataURL()).click((function(i,l) {
								return function(_) {
									l[0].set_current(i[0]);
									_g3.setCursor(l[0]);
								};
							})(i,l)));
						}
						td[0].append(list);
						var remove = (function() {
							return function() {
								list.detach();
								((function($this) {
									var $r;
									var html2 = window;
									$r = new js.JQuery(html2);
									return $r;
								}(this))).unbind("click");
							};
						})();
						((function($this) {
							var $r;
							var html3 = window;
							$r = new js.JQuery(html3);
							return $r;
						}(this))).bind("click",(function() {
							return function(_1) {
								remove();
							};
						})());
						e1.stopPropagation();
					};
				})(td,l));
				continue;
			}
			var id = Level.UID++;
			var t = ((function($this) {
				var $r;
				var html4 = "<input type=\"text\" id=\"_" + Level.UID++ + "\">";
				$r = new js.JQuery(html4);
				return $r;
			}(this))).appendTo(td[0]);
			t.spectrum({ color : this.toColor(l[0].colors[l[0].current]), clickoutFiresChange : true, showButtons : false, showPaletteOnly : true, showPalette : true, palette : (function($this) {
				var $r;
				var _g22 = [];
				{
					var _g31 = 0;
					var _g41 = l[0].colors;
					while(_g31 < _g41.length) {
						var c = _g41[_g31];
						++_g31;
						_g22.push($this.toColor(c));
					}
				}
				$r = _g22;
				return $r;
			}(this)), show : (function(l) {
				return function(_2) {
					_g3.setCursor(l[0]);
				};
			})(l), change : (function(l) {
				return function(e2) {
					var color = Std.parseInt("0x" + e2.toHex());
					var _g42 = 0;
					var _g32 = l[0].colors.length;
					while(_g42 < _g32) {
						var i1 = _g42++;
						if(l[0].colors[i1] == color) {
							l[0].set_current(i1);
							_g3.setCursor(l[0]);
							return;
						}
					}
					_g3.setCursor(l[0]);
				};
			})(l)});
		}
		this.content.find("[name=newlayer]").css({ display : this.newLayer != null?"block":"none"});
		var scroll = this.content.find(".scroll");
		var scont = this.content.find(".scrollContent");
		this.view = lvl.Image3D.getInstance();
		var ca = this.view.getCanvas();
		ca.className = "display";
		scont.append(ca);
		scroll.scroll(function(_3) {
			_g3.savePrefs();
		});
		this.content.find("[name=color]").spectrum({ clickoutFiresChange : true, showButtons : false, change : function(c1) {
			_g3.currentLayer.props.color = Std.parseInt("0x" + c1.toHex());
			_g3.draw();
			_g3.save();
		}});
		this.onResize();
		this.cursor = this.content.find("#cursor");
		this.cursorImage = new lvl.Image(0,0);
		this.cursor[0].appendChild(this.cursorImage.getCanvas());
		this.cursor.hide();
		scont.mouseleave(function(_4) {
			_g3.curPos = null;
			_g3.cursor.hide();
			new js.JQuery(".cursorPosition").text("");
		});
		scont.mousemove(function(e3) {
			_g3.mousePos.x = e3.pageX;
			_g3.mousePos.y = e3.pageY;
			_g3.updateCursorPos();
		});
		var onMouseUp = function(_5) {
			_g3.mouseDown = false;
			if(_g3.needSave) _g3.save();
		};
		scroll.mousedown(function(e4) {
			var _g5 = e4.which;
			switch(_g5) {
			case 1:
				_g3.mouseDown = true;
				if(_g3.curPos != null) {
					_g3.set(_g3.curPos.x,_g3.curPos.y);
					_g3.startPos = Reflect.copy(_g3.curPos);
				}
				break;
			case 3:
				var p = _g3.pick();
				if(p != null) {
					p.layer.set_current(p.k);
					_g3.setCursor(p.layer);
				}
				break;
			}
		});
		scroll.mouseleave(onMouseUp);
		scroll.mouseup(function(e5) {
			onMouseUp(e5);
			if(_g3.curPos == null) {
				_g3.startPos = null;
				return;
			}
			{
				var _g6 = _g3.currentLayer.data;
				switch(_g6[1]) {
				case 1:
					var objs = _g6[3];
					var idCol = _g6[2];
					var fc = _g3.currentLayer.floatCoord;
					var px;
					if(fc) px = _g3.curPos.xf; else px = _g3.curPos.x;
					var py;
					if(fc) py = _g3.curPos.yf; else py = _g3.curPos.y;
					var w = 0.;
					var h = 0.;
					if(_g3.currentLayer.hasSize) {
						if(_g3.startPos == null) return;
						var sx;
						if(fc) sx = _g3.startPos.xf; else sx = _g3.startPos.x;
						var sy;
						if(fc) sy = _g3.startPos.yf; else sy = _g3.startPos.y;
						w = px - sx;
						h = py - sy;
						px = sx;
						py = sy;
						if(w < 0.5) if(fc) w = 0.5; else w = 1;
						if(h < 0.5) if(fc) h = 0.5; else h = 1;
					}
					var _g23 = 0;
					var _g11 = objs.length;
					while(_g23 < _g11) {
						var i2 = _g23++;
						var o = objs[i2];
						if(o.x == px && o.y == py) {
							_g3.editProps(_g3.currentLayer,i2);
							return;
						}
					}
					var o1 = { x : px, y : py};
					objs.push(o1);
					if(idCol != null) o1[idCol] = _g3.currentLayer.indexToId[_g3.currentLayer.current];
					var _g12 = 0;
					var _g24 = _g3.currentLayer.baseSheet.columns;
					while(_g12 < _g24.length) {
						var c2 = _g24[_g12];
						++_g12;
						if(c2.opt || c2.name == "x" || c2.name == "y" || c2.name == idCol) continue;
						var v = _g3.model.getDefault(c2);
						if(v != null) o1[c2.name] = v;
					}
					if(_g3.currentLayer.hasSize) {
						o1.width = w;
						o1.height = h;
						_g3.setCursor(_g3.currentLayer);
					}
					_g3.editProps(_g3.currentLayer,objs.length - 1);
					objs.sort(function(o11,o2) {
						var r = Reflect.compare(o11.y,o2.y);
						if(r == 0) return Reflect.compare(o11.x,o2.x); else return r;
					});
					_g3.draw();
					_g3.save();
					break;
				default:
				}
			}
			_g3.startPos = null;
		});
	}
	,updateCursorPos: function() {
		if(this.currentLayer == null) return;
		var off = ((function($this) {
			var $r;
			var html = $this.view.getCanvas();
			$r = new js.JQuery(html);
			return $r;
		}(this))).parent().offset();
		var cxf = ((this.mousePos.x - off.left) / this.zoomView | 0) / this.tileSize;
		var cyf = ((this.mousePos.y - off.top) / this.zoomView | 0) / this.tileSize;
		var cx = cxf | 0;
		var cy = cyf | 0;
		if(cx < this.width && cy < this.height) {
			this.cursor.show();
			var fc = this.currentLayer.floatCoord;
			var border = 0;
			var ccx;
			if(fc) ccx = cxf; else ccx = cx;
			var ccy;
			if(fc) ccy = cyf; else ccy = cy;
			if(this.currentLayer.hasSize && this.mouseDown) {
				var px;
				if(fc) px = this.startPos.xf; else px = this.startPos.x;
				var py;
				if(fc) py = this.startPos.yf; else py = this.startPos.y;
				var pw;
				pw = (fc?cxf:cx) - px;
				var ph;
				ph = (fc?cyf:cy) - py;
				if(pw < 0.5) if(fc) pw = 0.5; else pw = 1;
				if(ph < 0.5) if(fc) ph = 0.5; else ph = 1;
				ccx = px;
				ccy = py;
				this.cursorImage.setSize(pw * this.tileSize * this.zoomView | 0,ph * this.tileSize * this.zoomView | 0);
			}
			if(this.currentLayer.images == null) border = 1;
			this.cursor.css({ marginLeft : (ccx * this.tileSize * this.zoomView - border | 0) + "px", marginTop : (ccy * this.tileSize * this.zoomView - border | 0) + "px"});
			this.curPos = { x : cx, y : cy, xf : cxf, yf : cyf};
			new js.JQuery(".cursorPosition").text(cx + "," + cy);
			if(this.mouseDown) this.set(cx,cy);
		} else {
			this.cursor.hide();
			this.curPos = null;
			new js.JQuery(".cursorPosition").text("");
		}
	}
	,editProps: function(l,index) {
		var _g = this;
		var hasProp = false;
		var o = Reflect.field(this.obj,l.name)[index];
		var idCol;
		{
			var _g1 = l.data;
			switch(_g1[1]) {
			case 1:
				var idCol1 = _g1[2];
				idCol = idCol1;
				break;
			default:
				idCol = null;
			}
		}
		var _g2 = 0;
		var _g11 = l.baseSheet.columns;
		while(_g2 < _g11.length) {
			var c = _g11[_g2];
			++_g2;
			if(c.name != "x" && c.name != "y" && c.name != idCol) hasProp = true;
		}
		if(!hasProp) return;
		var popup = new js.JQuery("<div>").addClass("popup").prependTo(this.content.find(".scrollContent"));
		((function($this) {
			var $r;
			var html = window;
			$r = new js.JQuery(html);
			return $r;
		}(this))).bind("mousedown",function(_) {
			popup.remove();
			_g.draw();
			((function($this) {
				var $r;
				var html1 = window;
				$r = new js.JQuery(html1);
				return $r;
			}(this))).unbind("mousedown");
		});
		popup.mousedown(function(e) {
			e.stopPropagation();
		});
		popup.mouseup(function(e1) {
			e1.stopPropagation();
		});
		popup.click(function(e2) {
			e2.stopPropagation();
		});
		var table = new js.JQuery("<table>").appendTo(popup);
		var main = Std.instance(this.model,Main);
		var _g3 = 0;
		var _g12 = l.baseSheet.columns;
		while(_g3 < _g12.length) {
			var c1 = [_g12[_g3]];
			++_g3;
			var tr = new js.JQuery("<tr>").appendTo(table);
			var th = new js.JQuery("<th>").text(c1[0].name).appendTo(tr);
			var td = [new js.JQuery("<td>").html(main.valueHtml(c1[0],Reflect.field(o,c1[0].name),l.baseSheet,o)).appendTo(tr)];
			td[0].click((function(td,c1) {
				return function(e3) {
					var psheet = { columns : l.baseSheet.columns, props : l.baseSheet.props, name : l.baseSheet.name, path : _g.model.getPath(l.baseSheet) + ":" + index, parent : { sheet : _g.sheet, column : Lambda.indexOf(_g.sheet.columns,Lambda.find(_g.sheet.columns,(function() {
						return function(c2) {
							return c2.name == l.name;
						};
					})())), line : index}, lines : Reflect.field(_g.obj,l.name), separators : []};
					main.editCell(c1[0],td[0],psheet,index);
					e3.preventDefault();
					e3.stopPropagation();
				};
			})(td,c1));
		}
		popup.css({ marginLeft : ((o.x + 1) * this.tileSize * this.zoomView | 0) + "px", marginTop : ((o.y + 1) * this.tileSize * this.zoomView | 0) + "px"});
	}
	,updateZoom: function(f) {
		if(f != null) {
			new js.JQuery(".popup").remove();
			if(f) this.zoomView *= 1.2; else this.zoomView /= 1.2;
		}
		this.savePrefs();
		this.view.setSize(this.width * this.tileSize * this.zoomView | 0,this.height * this.tileSize * this.zoomView | 0);
		this.view.set_zoom(this.zoomView);
		this.draw();
		this.updateCursorPos();
		this.setCursor(this.currentLayer);
	}
	,paint: function(x,y) {
		var l = this.currentLayer;
		{
			var _g = l.data;
			switch(_g[1]) {
			case 0:
				var data = _g[2];
				if(data[x + y * this.width] == l.current || l.blanks[l.current]) return;
				var k = data[x + y * this.width];
				var todo = [x,y];
				while(todo.length > 0) {
					var y1 = todo.pop();
					var x1 = todo.pop();
					if(data[x1 + y1 * this.width] != k) continue;
					data[x1 + y1 * this.width] = l.current;
					l.dirty = true;
					if(x1 > 0) {
						todo.push(x1 - 1);
						todo.push(y1);
					}
					if(y1 > 0) {
						todo.push(x1);
						todo.push(y1 - 1);
					}
					if(x1 < this.width - 1) {
						todo.push(x1 + 1);
						todo.push(y1);
					}
					if(y1 < this.height - 1) {
						todo.push(x1);
						todo.push(y1 + 1);
					}
				}
				this.save();
				this.draw();
				break;
			case 2:
				var data1 = _g[3];
				if(data1[x + y * this.width] != 0) return;
				var px = x;
				var py = y;
				var zero = [];
				var todo1 = [x,y];
				while(todo1.length > 0) {
					var y2 = todo1.pop();
					var x2 = todo1.pop();
					if(data1[x2 + y2 * this.width] != 0) continue;
					var dx = (x2 - px) % l.currentWidth;
					if(dx < 0) dx += l.currentWidth;
					var dy = (y2 - py) % l.currentHeight;
					if(dy < 0) dy += l.currentHeight;
					var t;
					t = l.current + (this.randomMode?Std.random(l.currentWidth) + Std.random(l.currentHeight) * l.imagesStride:dx + dy * l.imagesStride);
					if(l.blanks[t]) zero.push(x2 + y2 * this.width);
					data1[x2 + y2 * this.width] = t + 1;
					l.dirty = true;
					if(x2 > 0) {
						todo1.push(x2 - 1);
						todo1.push(y2);
					}
					if(y2 > 0) {
						todo1.push(x2);
						todo1.push(y2 - 1);
					}
					if(x2 < this.width - 1) {
						todo1.push(x2 + 1);
						todo1.push(y2);
					}
					if(y2 < this.height - 1) {
						todo1.push(x2);
						todo1.push(y2 + 1);
					}
				}
				var _g1 = 0;
				while(_g1 < zero.length) {
					var z = zero[_g1];
					++_g1;
					data1[z] = 0;
				}
				this.save();
				this.draw();
				break;
			default:
			}
		}
	}
	,onKey: function(e) {
		if(e.ctrlKey && e.keyCode == 115) this.action("close");
		if(e.ctrlKey) return;
		var _g = e.keyCode;
		switch(_g) {
		case 107:
			this.updateZoom(true);
			break;
		case 109:
			this.updateZoom(false);
			break;
		case 111:
			this.zoomView = 1;
			this.updateZoom();
			break;
		case 27:
			new js.JQuery(".popup").remove();
			this.draw();
			break;
		case 9:
			var i;
			i = (HxOverrides.indexOf(this.layers,this.currentLayer,0) + (e.shiftKey?this.layers.length - 1:1)) % this.layers.length;
			this.setCursor(this.layers[i]);
			e.preventDefault();
			e.stopPropagation();
			break;
		default:
		}
		if(this.curPos == null) return;
		var _g1 = e.keyCode;
		switch(_g1) {
		case 80:
			this.paint(this.curPos.x,this.curPos.y);
			break;
		case 46:
			this.delDown = true;
			var p = this.pick();
			if(p == null) return;
			{
				var _g11 = p.layer.data;
				switch(_g11[1]) {
				case 0:
					var data = _g11[2];
					if(data[p.index] == 0) return;
					data[p.index] = 0;
					p.layer.dirty = true;
					this.cursor.css({ opacity : 0}).fadeTo(100,1);
					this.save();
					this.draw();
					break;
				case 1:
					var objs = _g11[3];
					if(HxOverrides.remove(objs,objs[p.index])) {
						this.save();
						this.draw();
					}
					break;
				case 2:
					var data1 = _g11[3];
					var changed = false;
					var l = this.currentLayer;
					var _g3 = 0;
					var _g2 = l.currentHeight;
					while(_g3 < _g2) {
						var dy = _g3++;
						var _g5 = 0;
						var _g4 = l.currentWidth;
						while(_g5 < _g4) {
							var dx = _g5++;
							var i1 = p.index + dx + dy * this.width;
							if(data1[i1] == 0) continue;
							data1[i1] = 0;
							changed = true;
						}
					}
					if(changed) {
						p.layer.dirty = true;
						this.cursor.css({ opacity : 0}).fadeTo(100,1);
						this.save();
						this.draw();
					}
					break;
				}
			}
			break;
		case 69:
			var p1 = this.pick();
			{
				var _g12 = p1.layer.data;
				switch(_g12[1]) {
				case 0:case 2:
					break;
				case 1:
					var objs1 = _g12[3];
					new js.JQuery(".popup").remove();
					this.editProps(p1.layer,p1.index);
					break;
				}
			}
			break;
		default:
		}
	}
	,onKeyUp: function(e) {
		var _g = e.keyCode;
		switch(_g) {
		case 46:
			this.delDown = false;
			if(this.needSave) this.save();
			break;
		default:
		}
	}
	,set: function(x,y) {
		if(this.paintMode) {
			this.paint(x,y);
			return;
		}
		var l = this.currentLayer;
		{
			var _g = l.data;
			switch(_g[1]) {
			case 0:
				var data = _g[2];
				if(data[x + y * this.width] == l.current || l.blanks[l.current]) return;
				data[x + y * this.width] = l.current;
				l.dirty = true;
				this.save();
				this.draw();
				break;
			case 2:
				var data1 = _g[3];
				var changed = false;
				if(this.randomMode) {
					var p = x + y * this.width;
					var id = l.current + Std.random(l.currentWidth) + Std.random(l.currentHeight) * l.imagesStride + 1;
					if(data1[p] == id || l.blanks[id - 1]) return;
					data1[p] = id;
					changed = true;
				} else {
					var _g2 = 0;
					var _g1 = l.currentHeight;
					while(_g2 < _g1) {
						var dy = _g2++;
						var _g4 = 0;
						var _g3 = l.currentWidth;
						while(_g4 < _g3) {
							var dx = _g4++;
							var p1 = x + dx + (y + dy) * this.width;
							var id1 = l.current + dx + dy * l.imagesStride + 1;
							if(data1[p1] == id1 || l.blanks[id1 - 1]) continue;
							data1[p1] = id1;
							changed = true;
						}
					}
				}
				if(!changed) return;
				l.dirty = true;
				this.save();
				this.draw();
				break;
			case 1:
				break;
			}
		}
	}
	,draw: function() {
		this.view.fill(-2039584);
		var _g1 = 0;
		var _g = this.layers.length;
		while(_g1 < _g) {
			var index = _g1++;
			var l = this.layers[index];
			this.view.set_alpha(l.props.alpha);
			if(!l.visible) continue;
			{
				var _g2 = l.data;
				switch(_g2[1]) {
				case 0:
					var data = _g2[2];
					var first = index == 0;
					var _g4 = 0;
					var _g3 = this.height;
					while(_g4 < _g3) {
						var y = _g4++;
						var _g6 = 0;
						var _g5 = this.width;
						while(_g6 < _g5) {
							var x = _g6++;
							var k = data[x + y * this.width];
							if(k == 0 && !first) continue;
							if(l.images != null) {
								this.view.draw(l.images[k],x * this.tileSize,y * this.tileSize);
								continue;
							}
							this.view.fillRect(x * this.tileSize,y * this.tileSize,this.tileSize,this.tileSize,l.colors[k] | -16777216);
						}
					}
					break;
				case 2:
					var data1 = _g2[3];
					var t = _g2[2];
					var _g41 = 0;
					var _g31 = this.height;
					while(_g41 < _g31) {
						var y1 = _g41++;
						var _g61 = 0;
						var _g51 = this.width;
						while(_g61 < _g51) {
							var x1 = _g61++;
							var k1 = data1[x1 + y1 * this.width] - 1;
							if(k1 < 0) continue;
							this.view.draw(l.images[k1],x1 * this.tileSize,y1 * this.tileSize);
						}
					}
					break;
				case 1:
					var objs = _g2[3];
					var idCol = _g2[2];
					if(idCol == null) {
						var col = l.props.color | -16777216;
						var _g32 = 0;
						while(_g32 < objs.length) {
							var o = objs[_g32];
							++_g32;
							var w;
							if(l.hasSize) w = o.width * this.tileSize; else w = this.tileSize;
							var h;
							if(l.hasSize) h = o.height * this.tileSize; else h = this.tileSize;
							this.view.fillRect(o.x * this.tileSize | 0,o.y * this.tileSize | 0,w | 0,h | 0,col);
						}
					} else {
						var _g33 = 0;
						while(_g33 < objs.length) {
							var o1 = objs[_g33];
							++_g33;
							var id = Reflect.field(o1,idCol);
							var k2 = l.idToIndex.get(id);
							if(k2 == null) {
								var w1;
								if(l.hasSize) w1 = o1.width * this.tileSize; else w1 = this.tileSize;
								var h1;
								if(l.hasSize) h1 = o1.height * this.tileSize; else h1 = this.tileSize;
								this.view.fillRect(o1.x * this.tileSize | 0,o1.y * this.tileSize | 0,w1 | 0,h1 | 0,-65281);
								continue;
							}
							if(l.images != null) {
								this.view.draw(l.images[k2],o1.x * this.tileSize | 0,o1.y * this.tileSize | 0);
								continue;
							}
							var w2;
							if(l.hasSize) w2 = o1.width * this.tileSize; else w2 = this.tileSize;
							var h2;
							if(l.hasSize) h2 = o1.height * this.tileSize; else h2 = this.tileSize;
							this.view.fillRect(o1.x * this.tileSize | 0,o1.y * this.tileSize | 0,w2 | 0,h2 | 0,l.colors[k2] | -16777216);
						}
					}
					break;
				}
			}
		}
		this.view.flush();
	}
	,save: function() {
		if(this.mouseDown || this.delDown) {
			this.needSave = true;
			return;
		}
		this.needSave = false;
		var _g = 0;
		var _g1 = this.layers;
		while(_g < _g1.length) {
			var l = _g1[_g];
			++_g;
			l.save();
		}
		this.model.save();
	}
	,savePrefs: function() {
		var sc = this.content.find(".scroll");
		var state = { zoomView : this.zoomView, curLayer : this.currentLayer.name, scrollX : sc.scrollLeft(), scrollY : sc.scrollTop(), paintMode : this.paintMode, randomMode : this.randomMode};
		js.Browser.getLocalStorage().setItem(this.sheetPath,haxe.Serializer.run(state));
	}
	,scroll: function(dx,dy) {
		var _g = 0;
		var _g1 = this.layers;
		while(_g < _g1.length) {
			var l = _g1[_g];
			++_g;
			l.dirty = true;
			{
				var _g2 = l.data;
				switch(_g2[1]) {
				case 2:
					var data = _g2[3];
					var ndata = [];
					var _g4 = 0;
					var _g3 = this.height;
					while(_g4 < _g3) {
						var y = _g4++;
						var _g6 = 0;
						var _g5 = this.width;
						while(_g6 < _g5) {
							var x = _g6++;
							var tx = x - dx;
							var ty = y - dy;
							var k;
							if(tx < 0 || ty < 0 || tx >= this.width || ty >= this.height) k = 0; else k = data[tx + ty * this.width];
							ndata.push(k);
						}
					}
					var _g41 = 0;
					var _g31 = this.width * this.height;
					while(_g41 < _g31) {
						var i = _g41++;
						data[i] = ndata[i];
					}
					break;
				case 0:
					var data = _g2[2];
					var ndata = [];
					var _g4 = 0;
					var _g3 = this.height;
					while(_g4 < _g3) {
						var y = _g4++;
						var _g6 = 0;
						var _g5 = this.width;
						while(_g6 < _g5) {
							var x = _g6++;
							var tx = x - dx;
							var ty = y - dy;
							var k;
							if(tx < 0 || ty < 0 || tx >= this.width || ty >= this.height) k = 0; else k = data[tx + ty * this.width];
							ndata.push(k);
						}
					}
					var _g41 = 0;
					var _g31 = this.width * this.height;
					while(_g41 < _g31) {
						var i = _g41++;
						data[i] = ndata[i];
					}
					break;
				case 1:
					var objs = _g2[3];
					var _g32 = 0;
					var _g42 = objs.slice();
					while(_g32 < _g42.length) {
						var o = _g42[_g32];
						++_g32;
						o.x += dx;
						o.y += dy;
						if(o.x < 0 || o.y < 0 || o.x >= this.width || o.y >= this.height) HxOverrides.remove(objs,o);
					}
					break;
				}
			}
		}
		this.draw();
		this.save();
	}
	,setLock: function(b) {
		this.currentLayer.floatCoord = this.currentLayer.hasFloatCoord && !b;
		this.currentLayer.saveState();
	}
	,setVisible: function(b) {
		this.currentLayer.set_visible(b);
		this.draw();
	}
	,setAlpha: function(v) {
		this.currentLayer.props.alpha = Std.parseInt(v) / 100;
		this.model.save(false);
		this.draw();
	}
	,setTileSize: function(value) {
		this.props.tileSize = this.tileSize = value;
		var _g = 0;
		var _g1 = this.layers;
		while(_g < _g1.length) {
			var l = _g1[_g];
			++_g;
			if(!l.hasFloatCoord) continue;
			{
				var _g2 = l.data;
				switch(_g2[1]) {
				case 1:
					var objs = _g2[3];
					var _g3 = 0;
					while(_g3 < objs.length) {
						var o = objs[_g3];
						++_g3;
						o.x = (o.x * this.tileSize | 0) / this.tileSize;
						o.y = (o.y * this.tileSize | 0) / this.tileSize;
						if(l.hasSize) {
							o.width = (o.width * this.tileSize | 0) / this.tileSize;
							o.height = (o.height * this.tileSize | 0) / this.tileSize;
						}
					}
					break;
				default:
				}
			}
		}
		var canvas = this.content.find("canvas");
		canvas.attr("width",this.width * this.tileSize + "px");
		canvas.attr("height",this.height * this.tileSize + "px");
		this.setCursor(this.currentLayer);
		this.draw();
		this.save();
	}
	,setSize: function(size) {
		{
			var _g = this.currentLayer.data;
			switch(_g[1]) {
			case 2:
				var t = _g[2];
				t.stride = t.size * t.stride / size | 0;
				t.size = size;
				this.currentLayer.dirty = true;
				this.save();
				this.reload();
				break;
			default:
			}
		}
	}
	,paletteOption: function(name) {
		var l = this.currentLayer;
		switch(name) {
		case "random":
			this.randomMode = !this.randomMode;
			this.palette.find(".icon.random").toggleClass("active",this.randomMode);
			this.savePrefs();
			this.setCursor(l);
			break;
		case "paint":
			this.paintMode = !this.paintMode;
			this.savePrefs();
			this.palette.find(".icon.paint").toggleClass("active",this.paintMode);
			break;
		}
	}
	,setCursor: function(l) {
		var _g = this;
		this.content.find(".menu .item.selected").removeClass("selected");
		l.comp.addClass("selected");
		var old = this.currentLayer;
		this.currentLayer = l;
		if(old != l) {
			this.savePrefs();
			this.content.find("[name=alpha]").val(Std.string(l.props.alpha * 100 | 0));
			this.content.find("[name=visible]").prop("checked",l.visible);
			this.content.find("[name=lock]").prop("checked",!l.floatCoord).closest(".item").css({ display : l.hasFloatCoord?"":"none"});
			this.content.find("[name=color]").spectrum("set",this.toColor(l.props.color)).closest(".item").css({ display : l.idToIndex == null && !(function($this) {
				var $r;
				var _g1 = l.data;
				$r = (function($this) {
					var $r;
					switch(_g1[1]) {
					case 2:
						$r = true;
						break;
					default:
						$r = false;
					}
					return $r;
				}($this));
				return $r;
			}(this))?"":"none"});
			{
				var _g2 = l.data;
				switch(_g2[1]) {
				case 2:
					var t = _g2[2];
					this.content.find("[name=size]").val("" + t.size).closest(".item").show();
					this.content.find("[name=file]").closest(".item").show();
					break;
				default:
					this.content.find("[name=size]").closest(".item").hide();
					this.content.find("[name=file]").closest(".item").hide();
				}
			}
			if(this.palette != null) {
				this.palette.remove();
				this.paletteSelect = null;
			}
			if(l.images != null) {
				this.palette = ((function($this) {
					var $r;
					var html = new js.JQuery("#paletteContent").html();
					$r = new js.JQuery(html);
					return $r;
				}(this))).appendTo(this.content);
				var i = lvl.Image.fromCanvas(this.palette.find("canvas.view")[0]);
				i.setSize(l.imagesStride * (this.tileSize + 1),Math.ceil(l.images.length / l.imagesStride) * (this.tileSize + 1));
				var _g11 = 0;
				var _g3 = l.images.length;
				while(_g11 < _g3) {
					var n = _g11++;
					var x = n % l.imagesStride * (this.tileSize + 1);
					var y = (n / l.imagesStride | 0) * (this.tileSize + 1);
					i.draw(l.images[n],x,y);
				}
				var jsel = this.palette.find("canvas.select");
				var select = lvl.Image.fromCanvas(jsel[0]);
				select.setSize(i.width,i.height);
				this.palette.find(".icon.random").toggleClass("active",this.randomMode);
				this.palette.find(".icon.paint").toggleClass("active",this.paintMode);
				var start_x = l.current % l.imagesStride;
				var start_y = l.current / l.imagesStride | 0;
				var start_down = false;
				jsel.mousedown(function(e) {
					var o = jsel.offset();
					var x1 = (e.pageX - o.left) / (_g.tileSize + 1) | 0;
					var y1 = (e.pageY - o.top) / (_g.tileSize + 1) | 0;
					if(e.shiftKey) {
						var x0;
						if(x1 < start_x) x0 = x1; else x0 = start_x;
						var y0;
						if(y1 < start_y) y0 = y1; else y0 = start_y;
						var x11;
						if(x1 < start_x) x11 = start_x; else x11 = x1;
						var y11;
						if(y1 < start_y) y11 = start_y; else y11 = y1;
						l.set_current(x0 + y0 * l.imagesStride);
						l.currentWidth = x11 - x0 + 1;
						l.currentHeight = y11 - y0 + 1;
						l.saveState();
						_g.setCursor(l);
					} else {
						start_x = x1;
						start_y = y1;
						start_down = true;
						l.set_current(x1 + y1 * l.imagesStride);
						_g.setCursor(l);
					}
				});
				jsel.mousemove(function(e1) {
					if(!start_down) return;
					var o1 = jsel.offset();
					var x2 = (e1.pageX - o1.left) / (_g.tileSize + 1) | 0;
					var y2 = (e1.pageY - o1.top) / (_g.tileSize + 1) | 0;
					var x01;
					if(x2 < start_x) x01 = x2; else x01 = start_x;
					var y01;
					if(y2 < start_y) y01 = y2; else y01 = start_y;
					var x12;
					if(x2 < start_x) x12 = start_x; else x12 = x2;
					var y12;
					if(y2 < start_y) y12 = start_y; else y12 = y2;
					l.set_current(x01 + y01 * l.imagesStride);
					l.currentWidth = x12 - x01 + 1;
					l.currentHeight = y12 - y01 + 1;
					l.saveState();
					_g.setCursor(l);
				});
				jsel.mouseup(function(e2) {
					start_down = false;
				});
				this.paletteSelect = select;
			}
		}
		if(this.paletteSelect != null) {
			this.paletteSelect.clear();
			var used = [];
			{
				var _g4 = l.data;
				switch(_g4[1]) {
				case 2:
					var data = _g4[3];
					var _g12 = 0;
					while(_g12 < data.length) {
						var k = data[_g12];
						++_g12;
						if(k == 0) continue;
						used[k - 1] = true;
					}
					break;
				case 0:
					var data1 = _g4[2];
					var _g13 = 0;
					while(_g13 < data1.length) {
						var k1 = data1[_g13];
						++_g13;
						used[k1] = true;
					}
					break;
				case 1:
					var objs = _g4[3];
					var id = _g4[2];
					var _g14 = 0;
					while(_g14 < objs.length) {
						var o2 = objs[_g14];
						++_g14;
						var id1;
						var key = Reflect.field(o2,id);
						id1 = l.idToIndex.get(key);
						if(id1 != null) used[id1] = true;
					}
					break;
				}
			}
			var _g15 = 0;
			var _g5 = l.images.length;
			while(_g15 < _g5) {
				var i1 = _g15++;
				if(used[i1]) continue;
				this.paletteSelect.fillRect(i1 % l.imagesStride * (this.tileSize + 1),(i1 / l.imagesStride | 0) * (this.tileSize + 1),this.tileSize,this.tileSize,-2147483648);
			}
			this.paletteSelect.fillRect(l.current % l.imagesStride * (this.tileSize + 1),(l.current / l.imagesStride | 0) * (this.tileSize + 1),(this.tileSize + 1) * l.currentWidth - 1,(this.tileSize + 1) * l.currentHeight - 1,-2141478405);
		}
		var size;
		if(this.zoomView < 1) size = this.tileSize * this.zoomView | 0; else size = Math.ceil(this.tileSize * this.zoomView);
		var w;
		if(this.randomMode) w = 1; else w = l.currentWidth;
		var h;
		if(this.randomMode) h = 1; else h = l.currentHeight;
		this.cursorImage.setSize(size * w,size * h);
		if(l.images != null) {
			this.cursorImage.clear();
			var _g6 = 0;
			while(_g6 < h) {
				var y3 = _g6++;
				var _g16 = 0;
				while(_g16 < w) {
					var x3 = _g16++;
					var i2 = l.images[l.current + x3 + y3 * l.imagesStride];
					this.cursorImage.drawSub(i2,0,0,i2.width,i2.height,x3 * size,y3 * size,size,size);
				}
			}
			this.cursorImage.fill(1616617979);
			this.cursor.css({ border : "none"});
		} else {
			var c = l.colors[l.current];
			var lum = ((c & 255) + (c >> 8 & 255) + (c >> 16 & 255)) / 765;
			this.cursorImage.fill(c | -16777216);
			this.cursor.css({ border : "1px solid " + (lum < 0.25?"white":"black")});
		}
	}
	,__class__: Level
};
var List = function() {
	this.length = 0;
};
$hxClasses["List"] = List;
List.__name__ = ["List"];
List.prototype = {
	add: function(item) {
		var x = [item];
		if(this.h == null) this.h = x; else this.q[1] = x;
		this.q = x;
		this.length++;
	}
	,remove: function(v) {
		var prev = null;
		var l = this.h;
		while(l != null) {
			if(l[0] == v) {
				if(prev == null) this.h = l[1]; else prev[1] = l[1];
				if(this.q == l) this.q = prev;
				this.length--;
				return true;
			}
			prev = l;
			l = l[1];
		}
		return false;
	}
	,iterator: function() {
		return { h : this.h, hasNext : function() {
			return this.h != null;
		}, next : function() {
			if(this.h == null) return null;
			var x = this.h[0];
			this.h = this.h[1];
			return x;
		}};
	}
	,__class__: List
};
var K = function() { };
$hxClasses["K"] = K;
K.__name__ = ["K"];
var Model = function() {
	this.openedList = new haxe.ds.StringMap();
	this.r_ident = new EReg("^[A-Za-z_][A-Za-z0-9_]*$","");
	this.prefs = { windowPos : { x : 50, y : 50, w : 800, h : 600, max : false}, curFile : null, curSheet : 0};
	try {
		this.prefs = haxe.Unserializer.run(js.Browser.getLocalStorage().getItem("prefs"));
	} catch( e ) {
	}
};
$hxClasses["Model"] = Model;
Model.__name__ = ["Model"];
Model.prototype = {
	getImageData: function(key) {
		return Reflect.field(this.imageBank,key);
	}
	,getAbsPath: function(file) {
		if(file.charAt(0) == "/" || file.charAt(1) == ":") return file; else return new haxe.io.Path(this.prefs.curFile).dir.split("\\").join("/") + "/" + file;
	}
	,getSheet: function(name) {
		return this.smap.get(name).s;
	}
	,getPseudoSheet: function(sheet,c) {
		return this.smap.get(sheet.name + "@" + c.name).s;
	}
	,getParentSheet: function(sheet) {
		if(!sheet.props.hide) return null;
		var parts = sheet.name.split("@");
		var colName = parts.pop();
		return { s : this.getSheet(parts.join("@")), c : colName};
	}
	,getSheetLines: function(sheet) {
		var p = this.getParentSheet(sheet);
		if(p == null) return sheet.lines;
		var all = [];
		var _g = 0;
		var _g1 = this.getSheetLines(p.s);
		while(_g < _g1.length) {
			var obj = _g1[_g];
			++_g;
			var v = Reflect.field(obj,p.c);
			if(v != null) {
				var _g2 = 0;
				while(_g2 < v.length) {
					var v1 = v[_g2];
					++_g2;
					all.push(v1);
				}
			}
		}
		return all;
	}
	,getSheetObjects: function(sheet) {
		var p = this.getParentSheet(sheet);
		if(p == null) {
			var _g = [];
			var _g2 = 0;
			var _g1 = sheet.lines.length;
			while(_g2 < _g1) {
				var i = _g2++;
				_g.push({ path : [sheet.lines[i]], indexes : [i]});
			}
			return _g;
		}
		var all = [];
		var _g11 = 0;
		var _g21 = this.getSheetObjects(p.s);
		while(_g11 < _g21.length) {
			var obj = _g21[_g11];
			++_g11;
			var v = Reflect.field(obj.path[obj.path.length - 1],p.c);
			if(v != null) {
				var _g4 = 0;
				var _g3 = v.length;
				while(_g4 < _g3) {
					var i1 = _g4++;
					var sobj = v[i1];
					var p1 = obj.path.slice();
					var idx = obj.indexes.slice();
					p1.push(sobj);
					idx.push(i1);
					all.push({ path : p1, indexes : idx});
				}
			}
		}
		return all;
	}
	,newLine: function(sheet,index) {
		var o = { };
		var _g = 0;
		var _g1 = sheet.columns;
		while(_g < _g1.length) {
			var c = _g1[_g];
			++_g;
			var d = this.getDefault(c);
			if(d != null) o[c.name] = d;
		}
		if(index == null) sheet.lines.push(o); else {
			var _g11 = 0;
			var _g2 = sheet.separators.length;
			while(_g11 < _g2) {
				var i = _g11++;
				var s = sheet.separators[i];
				if(s > index) sheet.separators[i] = s + 1;
			}
			sheet.lines.splice(index + 1,0,o);
			this.changeLineOrder(sheet,(function($this) {
				var $r;
				var _g3 = [];
				{
					var _g21 = 0;
					var _g12 = sheet.lines.length;
					while(_g21 < _g12) {
						var i1 = _g21++;
						_g3.push(i1 <= index?i1:i1 + 1);
					}
				}
				$r = _g3;
				return $r;
			}(this)));
		}
	}
	,getPath: function(sheet) {
		if(sheet.path == null) return sheet.name; else return sheet.path;
	}
	,getDefault: function(c) {
		if(c.opt) return null;
		{
			var _g = c.type;
			switch(_g[1]) {
			case 3:case 4:case 5:case 10:case 11:
				return 0;
			case 1:case 0:case 6:case 7:case 12:case 13:
				return "";
			case 2:
				return false;
			case 8:
				return [];
			case 9:case 14:case 15:
				return null;
			}
		}
	}
	,hasColumn: function(s,name,types) {
		var _g = 0;
		var _g1 = s.columns;
		while(_g < _g1.length) {
			var c = _g1[_g];
			++_g;
			if(c.name == name) {
				if(types != null) {
					var _g2 = 0;
					while(_g2 < types.length) {
						var t = types[_g2];
						++_g2;
						if(Type.enumEq(c.type,t)) return true;
					}
					return false;
				}
				return true;
			}
		}
		return false;
	}
	,save: function(history) {
		if(history == null) history = true;
		var _g = 0;
		var _g1 = this.data.sheets;
		while(_g < _g1.length) {
			var s = _g1[_g];
			++_g;
			var _g2 = 0;
			var _g3 = Reflect.fields(s.props);
			while(_g2 < _g3.length) {
				var p = _g3[_g2];
				++_g2;
				var v = Reflect.field(s.props,p);
				if(v == null || v == false) Reflect.deleteField(s.props,p);
			}
			if(s.props.hasIndex) {
				var lines = this.getSheetLines(s);
				var _g31 = 0;
				var _g21 = lines.length;
				while(_g31 < _g21) {
					var i = _g31++;
					lines[i].index = i;
				}
			}
			if(s.props.hasGroup) {
				var lines1 = this.getSheetLines(s);
				var gid = 0;
				var sindex = 0;
				var titles = s.props.separatorTitles;
				if(titles != null) {
					if(s.separators[sindex] == 0 && titles[sindex] != null) sindex++;
					var _g32 = 0;
					var _g22 = lines1.length;
					while(_g32 < _g22) {
						var i1 = _g32++;
						if(s.separators[sindex] == i1) {
							if(titles[sindex] != null) gid++;
							sindex++;
						}
						lines1[i1].group = gid;
					}
				}
			}
		}
		if(history) {
			var sdata = this.quickSave();
			if(sdata != this.curSavedData) {
				if(this.curSavedData != null) {
					this.history.push(this.curSavedData);
					this.redo = [];
				}
				this.curSavedData = sdata;
			}
		}
		if(this.prefs.curFile == null) return;
		var save = [];
		var _g4 = 0;
		var _g11 = this.data.sheets;
		while(_g4 < _g11.length) {
			var s1 = _g11[_g4];
			++_g4;
			var _g23 = 0;
			var _g33 = s1.columns;
			while(_g23 < _g33.length) {
				var c = _g33[_g23];
				++_g23;
				save.push(c.type);
				if(c.typeStr == null) c.typeStr = cdb.Parser.saveType(c.type);
				Reflect.deleteField(c,"type");
			}
		}
		var _g5 = 0;
		var _g12 = this.data.customTypes;
		while(_g5 < _g12.length) {
			var t = _g12[_g5];
			++_g5;
			var _g24 = 0;
			var _g34 = t.cases;
			while(_g24 < _g34.length) {
				var c1 = _g34[_g24];
				++_g24;
				var _g41 = 0;
				var _g51 = c1.args;
				while(_g41 < _g51.length) {
					var a = _g51[_g41];
					++_g41;
					save.push(a.type);
					if(a.typeStr == null) a.typeStr = cdb.Parser.saveType(a.type);
					Reflect.deleteField(a,"type");
				}
			}
		}
		sys.io.File.saveContent(this.prefs.curFile,js.Node.stringify(this.data,null,"\t"));
		var _g6 = 0;
		var _g13 = this.data.sheets;
		while(_g6 < _g13.length) {
			var s2 = _g13[_g6];
			++_g6;
			var _g25 = 0;
			var _g35 = s2.columns;
			while(_g25 < _g35.length) {
				var c2 = _g35[_g25];
				++_g25;
				c2.type = save.shift();
			}
		}
		var _g7 = 0;
		var _g14 = this.data.customTypes;
		while(_g7 < _g14.length) {
			var t1 = _g14[_g7];
			++_g7;
			var _g26 = 0;
			var _g36 = t1.cases;
			while(_g26 < _g36.length) {
				var c3 = _g36[_g26];
				++_g26;
				var _g42 = 0;
				var _g52 = c3.args;
				while(_g42 < _g52.length) {
					var a1 = _g52[_g42];
					++_g42;
					a1.type = save.shift();
				}
			}
		}
	}
	,saveImages: function() {
		if(this.prefs.curFile == null) return;
		var img = this.prefs.curFile.split(".");
		img.pop();
		var path = img.join(".") + ".img";
		if(this.imageBank == null) js.Node.require("fs").unlinkSync(path); else sys.io.File.saveContent(path,js.Node.stringify(this.imageBank,null,"\t"));
	}
	,quickSave: function() {
		return haxe.Serializer.run({ d : this.data, o : this.openedList});
	}
	,quickLoad: function(sdata) {
		var t = haxe.Unserializer.run(sdata);
		this.data = t.d;
		this.openedList = t.o;
	}
	,moveLine: function(sheet,index,delta) {
		if(delta < 0 && index > 0) {
			var l = sheet.lines[index];
			sheet.lines.splice(index,1);
			sheet.lines.splice(index - 1,0,l);
			var arr;
			var _g = [];
			var _g2 = 0;
			var _g1 = sheet.lines.length;
			while(_g2 < _g1) {
				var i = _g2++;
				_g.push(i);
			}
			arr = _g;
			arr[index] = index - 1;
			arr[index - 1] = index;
			this.changeLineOrder(sheet,arr);
			return index - 1;
		} else if(delta > 0 && sheet != null && index < sheet.lines.length - 1) {
			var l1 = sheet.lines[index];
			sheet.lines.splice(index,1);
			sheet.lines.splice(index + 1,0,l1);
			var arr1;
			var _g3 = [];
			var _g21 = 0;
			var _g11 = sheet.lines.length;
			while(_g21 < _g11) {
				var i1 = _g21++;
				_g3.push(i1);
			}
			arr1 = _g3;
			arr1[index] = index + 1;
			arr1[index + 1] = index;
			this.changeLineOrder(sheet,arr1);
			return index + 1;
		}
		return null;
	}
	,deleteLine: function(sheet,index) {
		var arr;
		var _g = [];
		var _g2 = 0;
		var _g1 = sheet.lines.length;
		while(_g2 < _g1) {
			var i = _g2++;
			_g.push(i < index?i:i - 1);
		}
		arr = _g;
		arr[index] = -1;
		this.changeLineOrder(sheet,arr);
		sheet.lines.splice(index,1);
		var prev = -1;
		var toRemove = null;
		var _g21 = 0;
		var _g11 = sheet.separators.length;
		while(_g21 < _g11) {
			var i1 = _g21++;
			var s = sheet.separators[i1];
			if(s > index) {
				if(prev == s) toRemove = i1;
				sheet.separators[i1] = s - 1;
			} else prev = s;
		}
		if(toRemove != null) {
			sheet.separators.splice(toRemove,1);
			if(sheet.props.separatorTitles != null) sheet.props.separatorTitles.splice(toRemove,1);
		}
	}
	,deleteColumn: function(sheet,cname) {
		var _g = 0;
		var _g1 = sheet.columns;
		while(_g < _g1.length) {
			var c = _g1[_g];
			++_g;
			if(c.name == cname) {
				HxOverrides.remove(sheet.columns,c);
				var _g2 = 0;
				var _g3 = this.getSheetLines(sheet);
				while(_g2 < _g3.length) {
					var o = _g3[_g2];
					++_g2;
					Reflect.deleteField(o,c.name);
				}
				if(sheet.props.displayColumn == c.name) {
					sheet.props.displayColumn = null;
					this.makeSheet(sheet);
				}
				if(c.type == cdb.ColumnType.TList) this.deleteSheet(this.smap.get(sheet.name + "@" + c.name).s);
				return true;
			}
		}
		return false;
	}
	,deleteSheet: function(sheet) {
		HxOverrides.remove(this.data.sheets,sheet);
		this.smap.remove(sheet.name);
		var _g = 0;
		var _g1 = sheet.columns;
		while(_g < _g1.length) {
			var c = _g1[_g];
			++_g;
			var _g2 = c.type;
			switch(_g2[1]) {
			case 8:
				this.deleteSheet(this.smap.get(sheet.name + "@" + c.name).s);
				break;
			default:
			}
		}
		this.mapType(function(t) {
			switch(t[1]) {
			case 6:
				var r = t[2];
				if(r == sheet.name) return cdb.ColumnType.TString; else return t;
				break;
			case 12:
				var r = t[2];
				if(r == sheet.name) return cdb.ColumnType.TString; else return t;
				break;
			default:
				return t;
			}
		});
	}
	,addColumn: function(sheet,c,index) {
		var _g = 0;
		var _g1 = sheet.columns;
		while(_g < _g1.length) {
			var c2 = _g1[_g];
			++_g;
			if(c2.name == c.name) return "Column already exists"; else if(c2.type == cdb.ColumnType.TId && c.type == cdb.ColumnType.TId) return "Only one ID allowed";
		}
		if(c.name == "index" && sheet.props.hasIndex) return "Sheet already has an index";
		if(c.name == "group" && sheet.props.hasGroup) return "Sheet already has a group";
		if(index == null) sheet.columns.push(c); else sheet.columns.splice(index,0,c);
		var _g2 = 0;
		var _g11 = this.getSheetLines(sheet);
		while(_g2 < _g11.length) {
			var i = _g11[_g2];
			++_g2;
			var def = this.getDefault(c);
			if(def != null) i[c.name] = def;
		}
		if(c.type == cdb.ColumnType.TList) {
			var s = { name : sheet.name + "@" + c.name, props : { hide : true}, separators : [], lines : [], columns : []};
			this.data.sheets.push(s);
			this.makeSheet(s);
		}
		return null;
	}
	,getConvFunction: function(old,t) {
		var conv = null;
		if(Type.enumEq(old,t)) return { f : null};
		switch(old[1]) {
		case 3:
			switch(t[1]) {
			case 4:
				break;
			case 1:
				conv = Std.string;
				break;
			case 2:
				conv = function(v) {
					return v != 0;
				};
				break;
			case 5:
				var values = t[2];
				conv = function(i) {
					if(i < 0 || i >= values.length) return null; else return i;
				};
				break;
			case 11:
				conv = function(i1) {
					return i1;
				};
				break;
			default:
				return null;
			}
			break;
		case 0:case 6:case 12:
			switch(t[1]) {
			case 1:
				break;
			default:
				return null;
			}
			break;
		case 1:
			switch(t[1]) {
			case 0:case 6:case 12:
				var r_invalid = new EReg("[^A-Za-z0-9_]","g");
				conv = function(r) {
					return r_invalid.replace(r,"_");
				};
				break;
			case 3:
				conv = Std.parseInt;
				break;
			case 4:
				conv = function(str) {
					var f = Std.parseFloat(str);
					if(isNaN(f)) return null; else return f;
				};
				break;
			case 2:
				conv = function(s) {
					return s != "";
				};
				break;
			case 5:
				var values1 = t[2];
				var map = new haxe.ds.StringMap();
				var _g1 = 0;
				var _g = values1.length;
				while(_g1 < _g) {
					var i2 = _g1++;
					var key = values1[i2].toLowerCase();
					map.set(key,i2);
				}
				conv = function(s1) {
					var key1 = s1.toLowerCase();
					return map.get(key1);
				};
				break;
			default:
				return null;
			}
			break;
		case 2:
			switch(t[1]) {
			case 3:case 4:
				conv = function(b) {
					if(b) return 1; else return 0;
				};
				break;
			case 1:
				conv = Std.string;
				break;
			default:
				return null;
			}
			break;
		case 4:
			switch(t[1]) {
			case 3:
				conv = Std["int"];
				break;
			case 1:
				conv = Std.string;
				break;
			case 2:
				conv = function(v) {
					return v != 0;
				};
				break;
			default:
				return null;
			}
			break;
		case 5:
			switch(t[1]) {
			case 5:
				var values11 = old[2];
				var values2 = t[2];
				var map1 = [];
				var _g2 = 0;
				var _g3 = this.makePairs((function($this) {
					var $r;
					var _g4 = [];
					{
						var _g21 = 0;
						var _g11 = values11.length;
						while(_g21 < _g11) {
							var i3 = _g21++;
							_g4.push({ name : values11[i3], i : i3});
						}
					}
					$r = _g4;
					return $r;
				}(this)),(function($this) {
					var $r;
					var _g12 = [];
					{
						var _g31 = 0;
						var _g22 = values2.length;
						while(_g31 < _g22) {
							var i4 = _g31++;
							_g12.push({ name : values2[i4], i : i4});
						}
					}
					$r = _g12;
					return $r;
				}(this)));
				while(_g2 < _g3.length) {
					var p = _g3[_g2];
					++_g2;
					if(p.b == null) continue;
					map1[p.a.i] = p.b.i;
				}
				conv = function(i5) {
					return map1[i5];
				};
				break;
			case 3:
				var values3 = old[2];
				break;
			case 10:
				var val1 = old[2];
				var val2 = t[2];
				if(Std.string(val1) == Std.string(val2)) conv = function(i6) {
					return 1 << i6;
				}; else return null;
				break;
			default:
				return null;
			}
			break;
		case 10:
			switch(t[1]) {
			case 10:
				var values12 = old[2];
				var values21 = t[2];
				var map2 = [];
				var _g23 = 0;
				var _g32 = this.makePairs((function($this) {
					var $r;
					var _g5 = [];
					{
						var _g24 = 0;
						var _g13 = values12.length;
						while(_g24 < _g13) {
							var i7 = _g24++;
							_g5.push({ name : values12[i7], i : i7});
						}
					}
					$r = _g5;
					return $r;
				}(this)),(function($this) {
					var $r;
					var _g14 = [];
					{
						var _g33 = 0;
						var _g25 = values21.length;
						while(_g33 < _g25) {
							var i8 = _g33++;
							_g14.push({ name : values21[i8], i : i8});
						}
					}
					$r = _g14;
					return $r;
				}(this)));
				while(_g23 < _g32.length) {
					var p1 = _g32[_g23];
					++_g23;
					if(p1.b == null) continue;
					map2[p1.a.i] = p1.b.i;
				}
				conv = function(i9) {
					var out = 0;
					var k = 0;
					while(i9 >= 1 << k) {
						if(map2[k] != null && (i9 & 1 << k) != 0) out |= 1 << map2[k];
						k++;
					}
					return out;
				};
				break;
			case 3:
				var values4 = old[2];
				break;
			default:
				return null;
			}
			break;
		case 11:
			switch(t[1]) {
			case 3:
				conv = function(i1) {
					return i1;
				};
				break;
			default:
				return null;
			}
			break;
		default:
			return null;
		}
		return { f : conv};
	}
	,updateColumn: function(sheet,old,c) {
		var _g = this;
		if(old.name != c.name) {
			var _g1 = 0;
			var _g11 = sheet.columns;
			while(_g1 < _g11.length) {
				var c2 = _g11[_g1];
				++_g1;
				if(c2.name == c.name) return "Column name already used";
			}
			if(c.name == "index" && sheet.props.hasIndex) return "Sheet already has an index";
			if(c.name == "group" && sheet.props.hasGroup) return "Sheet already has a group";
			var _g2 = 0;
			var _g12 = this.getSheetLines(sheet);
			while(_g2 < _g12.length) {
				var o = _g12[_g2];
				++_g2;
				var v = Reflect.field(o,old.name);
				Reflect.deleteField(o,old.name);
				if(v != null) o[c.name] = v;
			}
			var renameRec;
			var renameRec1 = null;
			renameRec1 = function(sheet1,col) {
				var s = _g.smap.get(sheet1.name + "@" + col.name).s;
				s.name = sheet1.name + "@" + c.name;
				var _g13 = 0;
				var _g21 = s.columns;
				while(_g13 < _g21.length) {
					var c1 = _g21[_g13];
					++_g13;
					if(c1.type == cdb.ColumnType.TList) renameRec1(s,c1);
				}
				_g.makeSheet(s);
			};
			renameRec = renameRec1;
			if(old.type == cdb.ColumnType.TList) renameRec(sheet,old);
			old.name = c.name;
		}
		if(!Type.enumEq(old.type,c.type)) {
			var conv = this.getConvFunction(old.type,c.type);
			if(conv == null) return "Cannot convert " + this.typeStr(old.type) + " to " + this.typeStr(c.type);
			var conv1 = conv.f;
			if(conv1 != null) {
				var _g3 = 0;
				var _g14 = this.getSheetLines(sheet);
				while(_g3 < _g14.length) {
					var o1 = _g14[_g3];
					++_g3;
					var v1 = Reflect.field(o1,c.name);
					if(v1 != null) {
						v1 = conv1(v1);
						if(v1 != null) o1[c.name] = v1; else Reflect.deleteField(o1,c.name);
					}
				}
			}
			old.type = c.type;
			old.typeStr = null;
		}
		if(old.opt != c.opt) {
			if(old.opt) {
				var _g4 = 0;
				var _g15 = this.getSheetLines(sheet);
				while(_g4 < _g15.length) {
					var o2 = _g15[_g4];
					++_g4;
					var v2 = Reflect.field(o2,c.name);
					if(v2 == null) {
						v2 = this.getDefault(c);
						if(v2 != null) o2[c.name] = v2;
					}
				}
			} else {
				var _g5 = old.type;
				switch(_g5[1]) {
				case 5:
					break;
				default:
					var def = this.getDefault(old);
					var _g16 = 0;
					var _g22 = this.getSheetLines(sheet);
					while(_g16 < _g22.length) {
						var o3 = _g22[_g16];
						++_g16;
						var v3 = Reflect.field(o3,c.name);
						var _g31 = c.type;
						switch(_g31[1]) {
						case 8:
							var v4 = v3;
							if(v4.length == 0) Reflect.deleteField(o3,c.name);
							break;
						default:
							if(v3 == def) Reflect.deleteField(o3,c.name);
						}
					}
				}
			}
			old.opt = c.opt;
		}
		if(c.display == null) Reflect.deleteField(old,"display"); else old.display = c.display;
		this.makeSheet(sheet);
		return null;
	}
	,load: function(noError) {
		if(noError == null) noError = false;
		this.history = [];
		this.redo = [];
		try {
			this.data = cdb.Parser.parse(sys.io.File.getContent(this.prefs.curFile));
		} catch( e ) {
			if(!noError) js.Lib.alert(e);
			this.prefs.curFile = null;
			this.prefs.curSheet = 0;
			this.data = { sheets : [], customTypes : []};
		}
		try {
			var img = this.prefs.curFile.split(".");
			img.pop();
			this.imageBank = haxe.Json.parse(sys.io.File.getContent(img.join(".") + ".img"));
		} catch( e1 ) {
			this.imageBank = null;
		}
		this.curSavedData = this.quickSave();
		this.initContent();
	}
	,initContent: function() {
		this.smap = new haxe.ds.StringMap();
		var _g = 0;
		var _g1 = this.data.sheets;
		while(_g < _g1.length) {
			var s = _g1[_g];
			++_g;
			this.makeSheet(s);
		}
		this.tmap = new haxe.ds.StringMap();
		var _g2 = 0;
		var _g11 = this.data.customTypes;
		while(_g2 < _g11.length) {
			var t = _g11[_g2];
			++_g2;
			this.tmap.set(t.name,t);
		}
	}
	,sortById: function(a,b) {
		if(a.disp > b.disp) return 1; else return -1;
	}
	,makeSheet: function(s) {
		var sdat = { s : s, index : new haxe.ds.StringMap(), all : []};
		var cid = null;
		var lines = this.getSheetLines(s);
		var _g = 0;
		var _g1 = s.columns;
		while(_g < _g1.length) {
			var c = _g1[_g];
			++_g;
			if(c.type == cdb.ColumnType.TId) {
				var _g2 = 0;
				while(_g2 < lines.length) {
					var l = lines[_g2];
					++_g2;
					var v = Reflect.field(l,c.name);
					if(v != null && v != "") {
						var disp = v;
						if(s.props.displayColumn != null) {
							disp = Reflect.field(l,s.props.displayColumn);
							if(disp == null || disp == "") disp = "#" + v;
						}
						var o = { id : v, disp : disp, obj : l};
						if(sdat.index.get(v) == null) sdat.index.set(v,o);
						sdat.all.push(o);
					}
				}
				sdat.all.sort($bind(this,this.sortById));
				break;
			}
		}
		this.smap.set(s.name,sdat);
	}
	,cleanImages: function() {
		if(this.imageBank == null) return;
		var used = new haxe.ds.StringMap();
		var _g = 0;
		var _g1 = this.data.sheets;
		while(_g < _g1.length) {
			var s = _g1[_g];
			++_g;
			var _g2 = 0;
			var _g3 = s.columns;
			while(_g2 < _g3.length) {
				var c = _g3[_g2];
				++_g2;
				var _g4 = c.type;
				switch(_g4[1]) {
				case 7:
					var _g5 = 0;
					var _g6 = this.getSheetLines(s);
					while(_g5 < _g6.length) {
						var obj = _g6[_g5];
						++_g5;
						var v = Reflect.field(obj,c.name);
						if(v != null) used.set(v,true);
					}
					break;
				default:
				}
			}
		}
		var _g7 = 0;
		var _g11 = Reflect.fields(this.imageBank);
		while(_g7 < _g11.length) {
			var f = _g11[_g7];
			++_g7;
			if(!used.get(f)) Reflect.deleteField(this.imageBank,f);
		}
	}
	,savePrefs: function() {
		js.Browser.getLocalStorage().setItem("prefs",haxe.Serializer.run(this.prefs));
	}
	,objToString: function(sheet,obj,esc) {
		if(esc == null) esc = false;
		if(obj == null) return "null";
		var fl = [];
		var _g = 0;
		var _g1 = sheet.columns;
		while(_g < _g1.length) {
			var c = _g1[_g];
			++_g;
			var v = Reflect.field(obj,c.name);
			if(v == null) continue;
			fl.push(c.name + " : " + this.colToString(sheet,c,v,esc));
		}
		if(fl.length == 0) return "{}";
		return "{ " + fl.join(", ") + " }";
	}
	,colToString: function(sheet,c,v,esc) {
		if(esc == null) esc = false;
		if(v == null) return "null";
		var _g = c.type;
		switch(_g[1]) {
		case 8:
			var a = v;
			if(a.length == 0) return "[]";
			var s = this.smap.get(sheet.name + "@" + c.name).s;
			return "[ " + ((function($this) {
				var $r;
				var _g1 = [];
				{
					var _g2 = 0;
					while(_g2 < a.length) {
						var v1 = a[_g2];
						++_g2;
						_g1.push($this.objToString(s,v1,esc));
					}
				}
				$r = _g1;
				return $r;
			}(this))).join(", ") + " ]";
		default:
			return this.valToString(c.type,v,esc);
		}
	}
	,valToString: function(t,val,esc) {
		if(esc == null) esc = false;
		if(val == null) return "null";
		switch(t[1]) {
		case 3:case 4:case 2:case 7:
			return Std.string(val);
		case 0:case 6:case 12:case 13:
			if(esc) return "\"" + Std.string(val) + "\""; else return val;
			break;
		case 1:
			var val1 = val;
			if(new EReg("^[A-Za-z0-9_]+$","g").match(val1) && !esc) return val1; else return "\"" + val1.split("\\").join("\\\\").split("\"").join("\\\"") + "\"";
			break;
		case 5:
			var values = t[2];
			return this.valToString(cdb.ColumnType.TString,values[val],esc);
		case 8:case 14:case 15:
			return "????";
		case 9:
			var t1 = t[2];
			return this.typeValToString(this.tmap.get(t1),val,esc);
		case 10:
			var values1 = t[2];
			var v = val;
			var flags = [];
			var _g1 = 0;
			var _g = values1.length;
			while(_g1 < _g) {
				var i = _g1++;
				if((v & 1 << i) != 0) flags.push(this.valToString(cdb.ColumnType.TString,values1[i],esc));
			}
			return Std.string(flags);
		case 11:
			var s = "#" + StringTools.hex(val,6);
			if(esc) return "\"" + s + "\""; else return s;
			break;
		}
	}
	,typeValToString: function(t,val,esc) {
		if(esc == null) esc = false;
		var c = t.cases[val[0]];
		var str = c.name;
		if(c.args.length > 0) {
			str += "(";
			var out = [];
			var _g1 = 1;
			var _g = val.length;
			while(_g1 < _g) {
				var i = _g1++;
				out.push(this.valToString(c.args[i - 1].type,val[i],esc));
			}
			str += out.join(",");
			str += ")";
		}
		return str;
	}
	,typeStr: function(t) {
		switch(t[1]) {
		case 6:
			var n = t[2];
			return n;
		case 9:
			var n = t[2];
			return n;
		default:
			var _this = Std.string(t);
			return HxOverrides.substr(_this,1,null);
		}
	}
	,parseVal: function(t,val) {
		switch(t[1]) {
		case 3:
			if(new EReg("^-?[0-9]+$","").match(val)) return Std.parseInt(val);
			break;
		case 1:
			if(HxOverrides.cca(val,0) == 34) {
				var esc = false;
				var p = 0;
				try {
					while(true) {
						if(p == val.length) throw "Unclosed \"";
						var c;
						var index = p++;
						c = HxOverrides.cca(val,index);
						if(esc) esc = false; else if(c != null) switch(c) {
						case 34:
							if(p < val.length) throw "Invalid content after string '" + val + "'";
							throw "__break__";
							break;
						case 47:
							esc = true;
							break;
						}
					}
				} catch( e ) { if( e != "__break__" ) throw e; }
			} else if(new EReg("^[A-Za-z0-9_]+$","").match(val)) return val;
			throw "String requires quotes '" + val + "'";
			break;
		case 2:
			if(val == "true") return true;
			if(val == "false") return false;
			break;
		case 4:
			var f = Std.parseFloat(val);
			if(!isNaN(f)) return f;
			break;
		case 9:
			var t1 = t[2];
			return this.parseTypeVal(this.tmap.get(t1),val);
		case 6:
			var t2 = t[2];
			var r = this.smap.get(t2).index.get(val);
			if(r == null) throw val + " is not a known " + t2 + " id";
			return r.id;
		case 11:
			if(val.charAt(0) == "#") val = "0x" + HxOverrides.substr(val,1,null);
			if(new EReg("^-?[0-9]+$","").match(val) || new EReg("^0x[0-9A-Fa-f]+$","").match(val)) return Std.parseInt(val);
			break;
		default:
		}
		throw "'" + val + "' should be " + this.typeStr(t);
	}
	,parseTypeVal: function(t,val) {
		if(t == null || val == null) throw "Missing val/type";
		val = StringTools.trim(val);
		var missingCloseParent = false;
		var pos = val.indexOf("(");
		var id;
		var args = null;
		if(pos < 0) {
			id = val;
			args = [];
		} else {
			id = HxOverrides.substr(val,0,pos);
			val = HxOverrides.substr(val,pos + 1,null);
			if(StringTools.endsWith(val,")")) val = HxOverrides.substr(val,0,val.length - 1); else missingCloseParent = true;
			args = [];
			var p = 0;
			var start = 0;
			var pc = 0;
			while(p < val.length) {
				var _g;
				var index = p++;
				_g = HxOverrides.cca(val,index);
				if(_g != null) switch(_g) {
				case 40:
					pc++;
					break;
				case 41:
					if(pc == 0) throw "Extra )";
					pc--;
					break;
				case 34:
					var esc = false;
					try {
						while(true) {
							if(p == val.length) throw "Unclosed \"";
							var c;
							var index1 = p++;
							c = HxOverrides.cca(val,index1);
							if(esc) esc = false; else if(c != null) switch(c) {
							case 34:
								throw "__break__";
								break;
							case 47:
								esc = true;
								break;
							}
						}
					} catch( e ) { if( e != "__break__" ) throw e; }
					break;
				case 44:
					if(pc == 0) {
						args.push(HxOverrides.substr(val,start,p - start - 1));
						start = p;
					}
					break;
				default:
				} else {
				}
			}
			if(pc > 0) missingCloseParent = true;
			if(p > start || start > 0 && p == start) args.push(HxOverrides.substr(val,start,p - start));
		}
		var _g1 = 0;
		var _g2 = t.cases.length;
		while(_g1 < _g2) {
			var i = _g1++;
			var c1 = t.cases[i];
			if(c1.name == id) {
				var vals = [i];
				var _g21 = 0;
				var _g3 = c1.args;
				while(_g21 < _g3.length) {
					var a = _g3[_g21];
					++_g21;
					var v = args.shift();
					if(v == null) {
						if(a.opt) vals.push(null); else throw "Missing argument " + a.name + " : " + this.typeStr(a.type);
					} else {
						v = StringTools.trim(v);
						if(a.opt && v == "null") {
							vals.push(null);
							continue;
						}
						var val1;
						try {
							val1 = this.parseVal(a.type,v);
						} catch( e ) {
							if( js.Boot.__instanceof(e,String) ) {
								throw e + " for " + a.name;
							} else throw(e);
						}
						vals.push(val1);
					}
				}
				if(args.length > 0) throw "Extra argument '" + args.shift() + "'";
				if(missingCloseParent) throw "Missing )";
				while(vals[vals.length - 1] == null) vals.pop();
				return vals;
			}
		}
		throw "Unkown value '" + id + "'";
		return null;
	}
	,parseType: function(tstr) {
		switch(tstr) {
		case "Int":
			return cdb.ColumnType.TInt;
		case "Float":
			return cdb.ColumnType.TFloat;
		case "Bool":
			return cdb.ColumnType.TBool;
		case "String":
			return cdb.ColumnType.TString;
		default:
			if(this.tmap.exists(tstr)) return cdb.ColumnType.TCustom(tstr); else if(this.smap.exists(tstr)) return cdb.ColumnType.TRef(tstr); else {
				if(StringTools.endsWith(tstr,">")) {
					var tname = tstr.split("<").shift();
					var tparam;
					var _this = HxOverrides.substr(tstr,tname.length + 1,null);
					tparam = HxOverrides.substr(_this,0,-1);
				}
				throw "Unknown type " + tstr;
			}
		}
	}
	,typeCasesToString: function(t,prefix) {
		if(prefix == null) prefix = "";
		var arr = [];
		var _g = 0;
		var _g1 = t.cases;
		while(_g < _g1.length) {
			var c = _g1[_g];
			++_g;
			var str = c.name;
			if(c.args.length > 0) {
				str += "( ";
				var out = [];
				var _g2 = 0;
				var _g3 = c.args;
				while(_g2 < _g3.length) {
					var a = _g3[_g2];
					++_g2;
					var k = "";
					if(a.opt) k += "?";
					k += a.name + " : " + this.typeStr(a.type);
					out.push(k);
				}
				str += out.join(", ");
				str += " )";
			}
			str += ";";
			arr.push(prefix + str);
		}
		return arr.join("\n");
	}
	,parseTypeCases: function(def) {
		var cases = [];
		var cmap = new haxe.ds.StringMap();
		var _g = 0;
		var _g1 = new EReg("[\n;]","g").split(def);
		while(_g < _g1.length) {
			var line = _g1[_g];
			++_g;
			var line1 = StringTools.trim(line);
			if(line1 == "") continue;
			if(HxOverrides.cca(line1,line1.length - 1) == 59) line1 = HxOverrides.substr(line1,1,null);
			var pos = line1.indexOf("(");
			var name = null;
			var args = [];
			if(pos < 0) name = line1; else {
				name = HxOverrides.substr(line1,0,pos);
				line1 = HxOverrides.substr(line1,pos + 1,null);
				if(HxOverrides.cca(line1,line1.length - 1) != 41) throw "Missing closing parent in " + line1;
				line1 = HxOverrides.substr(line1,0,line1.length - 1);
				var _g2 = 0;
				var _g3 = line1.split(",");
				while(_g2 < _g3.length) {
					var arg = _g3[_g2];
					++_g2;
					var tname = arg.split(":");
					if(tname.length != 2) throw "Required name:type in '" + arg + "'";
					var opt = false;
					var id = StringTools.trim(tname[0]);
					if(id.charAt(0) == "?") {
						opt = true;
						id = StringTools.trim(HxOverrides.substr(id,1,null));
					}
					var t = StringTools.trim(tname[1]);
					if(!this.r_ident.match(id)) throw "Invalid identifier " + id;
					var c = { name : id, type : this.parseType(t), typeStr : null};
					if(opt) c.opt = true;
					args.push(c);
				}
			}
			if(!this.r_ident.match(name)) throw "Invalid identifier " + line1;
			if(cmap.exists(name)) throw "Duplicate identifier " + name;
			cmap.set(name,true);
			cases.push({ name : name, args : args});
		}
		return cases;
	}
	,makePairs: function(oldA,newA) {
		var pairs = [];
		var oldL = Lambda.list(oldA);
		var newL = Lambda.list(newA);
		var _g = 0;
		while(_g < oldA.length) {
			var a = oldA[_g];
			++_g;
			var $it0 = newL.iterator();
			while( $it0.hasNext() ) {
				var b = $it0.next();
				if(a.name == b.name) {
					pairs.push({ a : a, b : b});
					oldL.remove(a);
					newL.remove(b);
					break;
				}
			}
		}
		var $it1 = oldL.iterator();
		while( $it1.hasNext() ) {
			var a1 = $it1.next();
			var $it2 = newL.iterator();
			while( $it2.hasNext() ) {
				var b1 = $it2.next();
				if(Lambda.indexOf(oldA,a1) == Lambda.indexOf(newA,b1)) {
					pairs.push({ a : a1, b : b1});
					oldL.remove(a1);
					newL.remove(b1);
					break;
				}
			}
		}
		var $it3 = oldL.iterator();
		while( $it3.hasNext() ) {
			var a2 = $it3.next();
			pairs.push({ a : a2, b : null});
		}
		return pairs;
	}
	,mapType: function(callb) {
		var _g = 0;
		var _g1 = this.data.sheets;
		while(_g < _g1.length) {
			var s = _g1[_g];
			++_g;
			var _g2 = 0;
			var _g3 = s.columns;
			while(_g2 < _g3.length) {
				var c = _g3[_g2];
				++_g2;
				var t = callb(c.type);
				if(t != c.type) {
					c.type = t;
					c.typeStr = null;
				}
			}
		}
		var _g4 = 0;
		var _g11 = this.data.customTypes;
		while(_g4 < _g11.length) {
			var t1 = _g11[_g4];
			++_g4;
			var _g21 = 0;
			var _g31 = t1.cases;
			while(_g21 < _g31.length) {
				var c1 = _g31[_g21];
				++_g21;
				var _g41 = 0;
				var _g5 = c1.args;
				while(_g41 < _g5.length) {
					var a = _g5[_g41];
					++_g41;
					var t2 = callb(a.type);
					if(t2 != a.type) {
						a.type = t2;
						a.typeStr = null;
					}
				}
			}
		}
	}
	,changeLineOrder: function(sheet,remap) {
		var _g = 0;
		var _g1 = this.data.sheets;
		while(_g < _g1.length) {
			var s = _g1[_g];
			++_g;
			var _g2 = 0;
			var _g3 = s.columns;
			while(_g2 < _g3.length) {
				var c = _g3[_g2];
				++_g2;
				{
					var _g4 = c.type;
					switch(_g4[1]) {
					case 12:
						var t = _g4[2];
						if(t == sheet.name) {
							var _g5 = 0;
							var _g6 = this.getSheetLines(s);
							while(_g5 < _g6.length) {
								var obj = _g6[_g5];
								++_g5;
								var ldat = Reflect.field(obj,c.name);
								if(ldat == null || ldat == "") continue;
								var d = haxe.crypto.Base64.decode(ldat);
								var _g8 = 0;
								var _g7 = d.length;
								while(_g8 < _g7) {
									var i = _g8++;
									var r = remap[d.b[i]];
									if(r < 0) r = 0;
									d.b[i] = r;
								}
								ldat = haxe.crypto.Base64.encode(d);
								obj[c.name] = ldat;
							}
						} else {
						}
						break;
					default:
					}
				}
			}
		}
	}
	,updateRefs: function(sheet,refMap) {
		var _g3 = this;
		var convertTypeRec;
		var convertTypeRec1 = null;
		convertTypeRec1 = function(t,o) {
			var c = t.cases[o[0]];
			var _g1 = 0;
			var _g = o.length - 1;
			while(_g1 < _g) {
				var i = _g1++;
				var v = o[i + 1];
				if(v == null) continue;
				{
					var _g2 = c.args[i].type;
					switch(_g2[1]) {
					case 6:
						var n = _g2[2];
						if(n == sheet.name) {
							var v1;
							var key = v;
							v1 = refMap.get(key);
							if(v1 == null) continue;
							o[i + 1] = v1;
						} else {
						}
						break;
					case 9:
						var name = _g2[2];
						convertTypeRec1(_g3.tmap.get(name),v);
						break;
					default:
					}
				}
			}
		};
		convertTypeRec = convertTypeRec1;
		var _g4 = 0;
		var _g11 = this.data.sheets;
		while(_g4 < _g11.length) {
			var s = _g11[_g4];
			++_g4;
			var _g21 = 0;
			var _g31 = s.columns;
			while(_g21 < _g31.length) {
				var c1 = _g31[_g21];
				++_g21;
				{
					var _g41 = c1.type;
					switch(_g41[1]) {
					case 6:
						var n1 = _g41[2];
						if(n1 == sheet.name) {
							var _g5 = 0;
							var _g6 = this.getSheetLines(s);
							while(_g5 < _g6.length) {
								var obj = _g6[_g5];
								++_g5;
								var id = Reflect.field(obj,c1.name);
								if(id == null) continue;
								id = refMap.get(id);
								if(id == null) continue;
								obj[c1.name] = id;
							}
						} else {
						}
						break;
					case 9:
						var t1 = _g41[2];
						var _g51 = 0;
						var _g61 = this.getSheetLines(s);
						while(_g51 < _g61.length) {
							var obj1 = _g61[_g51];
							++_g51;
							var o1 = Reflect.field(obj1,c1.name);
							if(o1 == null) continue;
							convertTypeRec(this.tmap.get(t1),o1);
						}
						break;
					default:
					}
				}
			}
		}
	}
	,updateType: function(old,t) {
		var _g2 = this;
		var casesPairs = this.makePairs(old.cases,t.cases);
		var convMap = [];
		var _g = 0;
		while(_g < casesPairs.length) {
			var p = casesPairs[_g];
			++_g;
			if(p.b == null) continue;
			var id = Lambda.indexOf(t.cases,p.b);
			var conv = { def : [id], args : []};
			var args = this.makePairs(p.a.args,p.b.args);
			var _g1 = 0;
			while(_g1 < args.length) {
				var a = args[_g1];
				++_g1;
				if(a.b == null) {
					conv.args[Lambda.indexOf(p.a.args,a.a)] = (function() {
						return function(_) {
							return null;
						};
					})();
					continue;
				}
				var b = [a.b];
				var a1 = a.a;
				var c = this.getConvFunction(a1.type,b[0].type);
				if(c == null) throw "Cannot convert " + p.a.name + "." + a1.name + ":" + this.typeStr(a1.type) + " to " + p.b.name + "." + b[0].name + ":" + this.typeStr(b[0].type);
				var f = [c.f];
				if(f[0] == null) f[0] = (function() {
					return function(x) {
						return x;
					};
				})();
				if(a1.opt != b[0].opt) {
					var oldf = [f[0]];
					if(a1.opt) f[0] = (function(oldf,b) {
						return function(v) {
							v = oldf[0](v);
							if(v == null) return _g2.getDefault(b[0]); else return v;
						};
					})(oldf,b); else {
						var def = [this.getDefault(a1)];
						f[0] = (function(def,oldf) {
							return function(v1) {
								if(v1 == def[0]) return null; else return oldf[0](v1);
							};
						})(def,oldf);
					}
				}
				var index = [Lambda.indexOf(p.b.args,b[0])];
				conv.args[Lambda.indexOf(p.a.args,a1)] = (function(index,f,b) {
					return function(v2) {
						v2 = f[0](v2);
						if(v2 == null && b[0].opt) return null; else return { index : index[0], v : v2};
					};
				})(index,f,b);
			}
			var _g11 = 0;
			var _g21 = p.b.args;
			while(_g11 < _g21.length) {
				var b1 = _g21[_g11];
				++_g11;
				conv.def.push(this.getDefault(b1));
			}
			while(conv.def[conv.def.length - 1] == null) conv.def.pop();
			convMap[Lambda.indexOf(old.cases,p.a)] = conv;
		}
		var convertTypeRec;
		var convertTypeRec1 = null;
		convertTypeRec1 = function(t1,v3) {
			if(t1 == null) return null;
			if(t1 == old) {
				var conv1 = convMap[v3[0]];
				if(conv1 == null) return null;
				var out = conv1.def.slice();
				var _g12 = 0;
				var _g3 = conv1.args.length;
				while(_g12 < _g3) {
					var i = _g12++;
					var v4 = conv1.args[i](v3[i + 1]);
					if(v4 == null) continue;
					out[v4.index + 1] = v4.v;
				}
				return out;
			}
			var c1 = t1.cases[v3[0]];
			var _g13 = 0;
			var _g4 = c1.args.length;
			while(_g13 < _g4) {
				var i1 = _g13++;
				{
					var _g22 = c1.args[i1].type;
					switch(_g22[1]) {
					case 9:
						var tname = _g22[2];
						var av = v3[i1 + 1];
						if(av != null) v3[i1 + 1] = convertTypeRec1(_g2.tmap.get(tname),av);
						break;
					default:
					}
				}
			}
			return v3;
		};
		convertTypeRec = convertTypeRec1;
		var _g5 = 0;
		var _g14 = this.data.sheets;
		while(_g5 < _g14.length) {
			var s = _g14[_g5];
			++_g5;
			var _g23 = 0;
			var _g31 = s.columns;
			while(_g23 < _g31.length) {
				var c2 = _g31[_g23];
				++_g23;
				{
					var _g41 = c2.type;
					switch(_g41[1]) {
					case 9:
						var tname1 = _g41[2];
						var t2 = this.tmap.get(tname1);
						var _g51 = 0;
						var _g6 = this.getSheetLines(s);
						while(_g51 < _g6.length) {
							var obj = _g6[_g51];
							++_g51;
							var v5 = Reflect.field(obj,c2.name);
							if(v5 != null) {
								v5 = convertTypeRec(t2,v5);
								if(v5 == null) Reflect.deleteField(obj,c2.name); else obj[c2.name] = v5;
							}
						}
						if(tname1 == old.name && t.name != old.name) {
							c2.type = cdb.ColumnType.TCustom(t.name);
							c2.typeStr = null;
						}
						break;
					default:
					}
				}
			}
		}
		if(t.name != old.name) {
			var _g7 = 0;
			var _g15 = this.data.customTypes;
			while(_g7 < _g15.length) {
				var t21 = _g15[_g7];
				++_g7;
				var _g24 = 0;
				var _g32 = t21.cases;
				while(_g24 < _g32.length) {
					var c3 = _g32[_g24];
					++_g24;
					var _g42 = 0;
					var _g52 = c3.args;
					while(_g42 < _g52.length) {
						var a2 = _g52[_g42];
						++_g42;
						{
							var _g61 = a2.type;
							switch(_g61[1]) {
							case 9:
								var n = _g61[2];
								if(n == old.name) {
									a2.type = cdb.ColumnType.TCustom(t.name);
									a2.typeStr = null;
								} else {
								}
								break;
							default:
							}
						}
					}
				}
			}
			this.tmap.remove(old.name);
			old.name = t.name;
			this.tmap.set(old.name,old);
		}
		old.cases = t.cases;
	}
	,__class__: Model
};
var Main = function() {
	Model.call(this);
	this.window = nodejs.webkit.Window.get();
	this.window.on("resize",$bind(this,this.onResize));
	this.initMenu();
	this.levels = [];
	this.mousePos = { x : 0, y : 0};
	this.sheetCursors = new haxe.ds.StringMap();
	this.window.window.addEventListener("keydown",$bind(this,this.onKey));
	this.window.window.addEventListener("keypress",$bind(this,this.onKeyPress));
	this.window.window.addEventListener("keyup",$bind(this,this.onKeyUp));
	this.window.window.addEventListener("mousemove",$bind(this,this.onMouseMove));
	new js.JQuery(".modal").keypress(function(e) {
		e.stopPropagation();
	}).keydown(function(e1) {
		e1.stopPropagation();
	});
	this.cursor = { s : null, x : 0, y : 0};
	this.load(true);
	var t = new haxe.Timer(1000);
	t.run = $bind(this,this.checkTime);
};
$hxClasses["Main"] = Main;
Main.__name__ = ["Main"];
Main.main = function() {
	var m = new Main();
	Reflect.setField(window,"_",m);
};
Main.__super__ = Model;
Main.prototype = $extend(Model.prototype,{
	onResize: function(_) {
		if(this.level != null) this.level.onResize();
	}
	,onMouseMove: function(e) {
		this.mousePos.x = e.clientX;
		this.mousePos.y = e.clientY;
	}
	,setClipBoard: function(schema,data) {
		this.clipboard = { text : Std.string((function($this) {
			var $r;
			var _g = [];
			{
				var _g1 = 0;
				while(_g1 < data.length) {
					var o = data[_g1];
					++_g1;
					_g.push($this.objToString($this.cursor.s,o,true));
				}
			}
			$r = _g;
			return $r;
		}(this))), data : data, schema : schema};
		nodejs.webkit.Clipboard.get().set(this.clipboard.text,"text");
	}
	,moveCursor: function(dx,dy,shift,ctrl) {
		if(this.cursor.s == null) return;
		if(this.cursor.x == -1 && ctrl) {
			if(dy != 0) this.moveLine(this.cursor.s,this.cursor.y,dy);
			this.updateCursor();
			return;
		}
		if(dx < 0 && this.cursor.x >= 0) this.cursor.x--;
		if(dy < 0 && this.cursor.y > 0) this.cursor.y--;
		if(dx > 0 && this.cursor.x < this.cursor.s.columns.length - 1) this.cursor.x++;
		if(dy > 0 && this.cursor.y < this.cursor.s.lines.length - 1) this.cursor.y++;
		this.cursor.select = null;
		this.updateCursor();
	}
	,onKeyPress: function(e) {
		if(!e.ctrlKey) new js.JQuery(".cursor").not(".edit").dblclick();
	}
	,getSelection: function() {
		if(this.cursor.s == null) return null;
		var x1;
		if(this.cursor.x < 0) x1 = 0; else x1 = this.cursor.x;
		var x2;
		if(this.cursor.x < 0) x2 = this.cursor.s.columns.length - 1; else if(this.cursor.select != null) x2 = this.cursor.select.x; else x2 = x1;
		var y1 = this.cursor.y;
		var y2;
		if(this.cursor.select != null) y2 = this.cursor.select.y; else y2 = y1;
		if(x2 < x1) {
			var tmp = x2;
			x2 = x1;
			x1 = tmp;
		}
		if(y2 < y1) {
			var tmp1 = y2;
			y2 = y1;
			y1 = tmp1;
		}
		return { x1 : x1, x2 : x2, y1 : y1, y2 : y2};
	}
	,onKey: function(e) {
		var _g = e.keyCode;
		switch(_g) {
		case 45:
			if(this.cursor.s != null) this.newLine(this.cursor.s,this.cursor.y);
			break;
		case 46:
			if(this.level == null) {
				new js.JQuery(".selected.deletable").change();
				if(this.cursor.s != null) {
					if(this.cursor.x < 0) {
						var s = this.getSelection();
						var y = s.y2;
						while(y >= s.y1) {
							this.deleteLine(this.cursor.s,y);
							y--;
						}
						this.cursor.y = s.y1;
						this.cursor.select = null;
					} else {
						var s1 = this.getSelection();
						var _g2 = s1.y1;
						var _g1 = s1.y2 + 1;
						while(_g2 < _g1) {
							var y1 = _g2++;
							var obj = this.cursor.s.lines[y1];
							var _g4 = s1.x1;
							var _g3 = s1.x2 + 1;
							while(_g4 < _g3) {
								var x = _g4++;
								var c = this.cursor.s.columns[x];
								var def = this.getDefault(c);
								if(def == null) Reflect.deleteField(obj,c.name); else obj[c.name] = def;
							}
						}
					}
				}
				this.refresh();
				this.save();
			} else {
			}
			break;
		case 38:
			this.moveCursor(0,-1,e.shiftKey,e.ctrlKey);
			e.preventDefault();
			break;
		case 40:
			this.moveCursor(0,1,e.shiftKey,e.ctrlKey);
			e.preventDefault();
			break;
		case 37:
			this.moveCursor(-1,0,e.shiftKey,e.ctrlKey);
			break;
		case 39:
			this.moveCursor(1,0,e.shiftKey,e.ctrlKey);
			break;
		case 90:
			if(e.ctrlKey) {
				if(this.history.length > 0) {
					this.redo.push(this.curSavedData);
					this.curSavedData = this.history.pop();
					this.quickLoad(this.curSavedData);
					this.initContent();
					this.save(false);
				}
			} else {
			}
			break;
		case 89:
			if(e.ctrlKey) {
				if(this.redo.length > 0) {
					this.history.push(this.curSavedData);
					this.curSavedData = this.redo.pop();
					this.quickLoad(this.curSavedData);
					this.initContent();
					this.save(false);
				}
			} else {
			}
			break;
		case 67:
			if(e.ctrlKey) {
				if(this.cursor.s != null) {
					var s2 = this.getSelection();
					var data = [];
					var _g21 = s2.y1;
					var _g11 = s2.y2 + 1;
					while(_g21 < _g11) {
						var y2 = _g21++;
						var obj1 = this.cursor.s.lines[y2];
						var out = { };
						var _g41 = s2.x1;
						var _g31 = s2.x2 + 1;
						while(_g41 < _g31) {
							var x1 = _g41++;
							var c1 = this.cursor.s.columns[x1];
							var v = Reflect.field(obj1,c1.name);
							if(v != null) out[c1.name] = v;
						}
						data.push(out);
					}
					this.setClipBoard((function($this) {
						var $r;
						var _g12 = [];
						{
							var _g32 = s2.x1;
							var _g22 = s2.x2 + 1;
							while(_g32 < _g22) {
								var x2 = _g32++;
								_g12.push($this.cursor.s.columns[x2]);
							}
						}
						$r = _g12;
						return $r;
					}(this)),data);
				}
			} else {
			}
			break;
		case 88:
			if(e.ctrlKey) {
				this.onKey({ keyCode : 67, ctrlKey : true});
				this.onKey({ keyCode : 46});
			} else {
			}
			break;
		case 86:
			if(e.ctrlKey) {
				if(this.cursor.s == null || this.clipboard == null || nodejs.webkit.Clipboard.get().get("text") != this.clipboard.text) return;
				var sheet = this.cursor.s;
				var posX;
				if(this.cursor.x < 0) posX = 0; else posX = this.cursor.x;
				var posY = this.cursor.y;
				var _g13 = 0;
				var _g23 = this.clipboard.data;
				while(_g13 < _g23.length) {
					var obj11 = _g23[_g13];
					++_g13;
					if(posY == sheet.lines.length) Model.prototype.newLine.call(this,sheet);
					var obj2 = sheet.lines[posY];
					var _g42 = 0;
					var _g33 = this.clipboard.schema.length;
					while(_g42 < _g33) {
						var cid = _g42++;
						var c11 = this.clipboard.schema[cid];
						var c2 = sheet.columns[cid + posX];
						if(c2 == null) continue;
						var f = this.getConvFunction(c11.type,c2.type);
						var v1 = Reflect.field(obj11,c11.name);
						if(f == null) v1 = this.getDefault(c2); else if(f.f != null) v1 = f.f(v1);
						if(v1 == null && !c2.opt) v1 = this.getDefault(c2);
						if(v1 == null) Reflect.deleteField(obj2,c2.name); else obj2[c2.name] = v1;
					}
					posY++;
				}
				this.makeSheet(sheet);
				this.refresh();
				this.save();
			} else {
			}
			break;
		case 9:
			if(e.ctrlKey) {
				var sheets = this.data.sheets.filter(function(s3) {
					return !s3.props.hide;
				});
				var pos;
				pos = (this.level == null?Lambda.indexOf(sheets,this.viewSheet):sheets.length + Lambda.indexOf(this.levels,this.level)) + 1;
				var s4 = sheets[pos % (sheets.length + this.levels.length)];
				if(s4 != null) this.selectSheet(s4); else {
					var level = this.levels[pos - sheets.length];
					if(level != null) this.selectLevel(level);
				}
			} else this.moveCursor(e.shiftKey?-1:1,0,false,false);
			break;
		case 27:
			if(this.cursor.s != null && this.cursor.s.parent != null) {
				var p = this.cursor.s.parent;
				this.setCursor(p.sheet,p.column,p.line);
				new js.JQuery(".cursor").click();
			} else if(this.cursor.select != null) {
				this.cursor.select = null;
				this.updateCursor();
			}
			break;
		case 113:
			new js.JQuery(".cursor").not(".edit").dblclick();
			break;
		case 114:
			if(this.cursor.s != null) this.showReferences(this.cursor.s,this.cursor.y);
			break;
		case 115:
			if(this.cursor.s != null && this.cursor.x >= 0) {
				var c3 = this.cursor.s.columns[this.cursor.x];
				var id = Reflect.field(this.cursor.s.lines[this.cursor.y],c3.name);
				{
					var _g14 = c3.type;
					switch(_g14[1]) {
					case 6:
						var s5 = _g14[2];
						var sd = this.smap.get(s5);
						if(sd != null) {
							var k = sd.index.get(id);
							if(k != null) {
								var index = Lambda.indexOf(sd.s.lines,k.obj);
								if(index >= 0) {
									this.sheetCursors.set(s5,{ s : sd.s, x : 0, y : index});
									this.selectSheet(sd.s);
								}
							}
						}
						break;
					default:
					}
				}
			}
			break;
		default:
		}
		if(this.level != null) this.level.onKey(e);
	}
	,onKeyUp: function(e) {
		if(this.level != null) this.level.onKeyUp(e);
	}
	,getLine: function(sheet,index) {
		return ((function($this) {
			var $r;
			var html = "table[sheet='" + $this.getPath(sheet) + "'] > tbody > tr";
			$r = new js.JQuery(html);
			return $r;
		}(this))).not(".head,.separator,.list").eq(index);
	}
	,showReferences: function(sheet,index) {
		var _g3 = this;
		var id = null;
		var _g = 0;
		var _g1 = sheet.columns;
		try {
			while(_g < _g1.length) {
				var c = _g1[_g];
				++_g;
				var _g2 = c.type;
				switch(_g2[1]) {
				case 0:
					id = Reflect.field(sheet.lines[index],c.name);
					throw "__break__";
					break;
				default:
				}
			}
		} catch( e ) { if( e != "__break__" ) throw e; }
		if(id == "" || id == null) return;
		var results = [];
		var _g4 = 0;
		var _g11 = this.data.sheets;
		while(_g4 < _g11.length) {
			var s = _g11[_g4];
			++_g4;
			var _g21 = 0;
			var _g31 = s.columns;
			while(_g21 < _g31.length) {
				var c1 = _g31[_g21];
				++_g21;
				{
					var _g41 = c1.type;
					switch(_g41[1]) {
					case 6:
						var sname = _g41[2];
						if(sname == sheet.name) {
							var sheets = [];
							var p = { s : s, c : c1.name, id : null};
							while(true) {
								var _g5 = 0;
								var _g6 = p.s.columns;
								try {
									while(_g5 < _g6.length) {
										var c2 = _g6[_g5];
										++_g5;
										var _g7 = c2.type;
										switch(_g7[1]) {
										case 0:
											p.id = c2.name;
											throw "__break__";
											break;
										default:
										}
									}
								} catch( e ) { if( e != "__break__" ) throw e; }
								sheets.unshift(p);
								var p2 = this.getParentSheet(p.s);
								if(p2 == null) break;
								p = { s : p2.s, c : p2.c, id : null};
							}
							var _g51 = 0;
							var _g61 = this.getSheetObjects(s);
							while(_g51 < _g61.length) {
								var o = _g61[_g51];
								++_g51;
								var obj = o.path[o.path.length - 1];
								if(Reflect.field(obj,c1.name) == id) results.push({ s : sheets, o : o});
							}
						} else {
						}
						break;
					case 9:
						var tname = _g41[2];
						break;
					default:
					}
				}
			}
		}
		if(results.length == 0) {
			this.setErrorMessage(id + " not found");
			haxe.Timer.delay((function(f) {
				return function() {
					f();
				};
			})($bind(this,this.setErrorMessage)),500);
			return;
		}
		var line = this.getLine(sheet,index);
		line.next("tr.list").change();
		var res = new js.JQuery("<tr>").addClass("list");
		new js.JQuery("<td>").appendTo(res);
		var cell = new js.JQuery("<td>").attr("colspan","" + (sheet.columns.length + (sheet.props.levelProps != null?1:0))).appendTo(res);
		var div = new js.JQuery("<div>").appendTo(cell);
		div.hide();
		var content = new js.JQuery("<table>").appendTo(div);
		var cols = new js.JQuery("<tr>").addClass("head");
		new js.JQuery("<td>").addClass("start").appendTo(cols).click(function(_) {
			res.change();
		});
		var _g8 = 0;
		var _g12 = ["path","id"];
		while(_g8 < _g12.length) {
			var name = _g12[_g8];
			++_g8;
			new js.JQuery("<td>").text(name).appendTo(cols);
		}
		content.append(cols);
		var index1 = 0;
		var _g9 = 0;
		while(_g9 < results.length) {
			var rs = [results[_g9]];
			++_g9;
			var l = new js.JQuery("<tr>").appendTo(content).addClass("clickable");
			new js.JQuery("<td>").text("" + index1++).appendTo(l);
			var slast = [rs[0].s[rs[0].s.length - 1]];
			new js.JQuery("<td>").text(slast[0].s.name.split("@").join(".") + "." + slast[0].c).appendTo(l);
			var path = [];
			var _g22 = 0;
			var _g13 = rs[0].s.length;
			while(_g22 < _g13) {
				var i = _g22++;
				var s1 = rs[0].s[i];
				var oid = Reflect.field(rs[0].o.path[i],s1.id);
				if(oid == null || oid == "") path.push(s1.s.name.split("@").pop() + "[" + rs[0].o.indexes[i] + "]"); else path.push(oid);
			}
			new js.JQuery("<td>").text(path.join(".")).appendTo(l);
			l.click((function(slast,rs) {
				return function(e) {
					var key = null;
					var _g23 = 0;
					var _g14 = rs[0].s.length - 1;
					while(_g23 < _g14) {
						var i1 = _g23++;
						var p1 = rs[0].s[i1];
						key = _g3.getPath(p1.s) + "@" + p1.c + ":" + rs[0].o.indexes[i1];
						_g3.openedList.set(key,true);
					}
					var starget = rs[0].s[0].s;
					_g3.sheetCursors.set(starget.name,{ s : { name : slast[0].s.name, path : key, separators : [], lines : [], columns : [], props : { }}, x : -1, y : rs[0].o.indexes[rs[0].o.indexes.length - 1]});
					_g3.selectSheet(starget);
					e.stopPropagation();
				};
			})(slast,rs));
		}
		res.change(function(e1) {
			div.slideUp(100,function() {
				res.remove();
			});
			e1.stopPropagation();
		});
		res.insertAfter(line);
		div.slideDown(100);
	}
	,moveLine: function(sheet,index,delta) {
		this.getLine(sheet,index).next("tr.list").change();
		var index1 = Model.prototype.moveLine.call(this,sheet,index,delta);
		if(index1 != null) {
			this.setCursor(sheet,-1,index1,null,false);
			this.refresh();
			this.save();
		}
		return index1;
	}
	,changed: function(sheet,c,index,old) {
		var _g = c.type;
		switch(_g[1]) {
		case 0:
			this.makeSheet(sheet);
			break;
		case 7:
			this.saveImages();
			break;
		case 3:
			if(sheet.props.levelProps != null && c.name == "width" || c.name == "height") {
				var obj = sheet.lines[index];
				var newW = Reflect.field(obj,"width");
				var newH = Reflect.field(obj,"height");
				var oldW = newW;
				var oldH = newH;
				if(c.name == "width") oldW = old; else oldH = old;
				var remapTileLayer = function(v) {
					if(v == null) return null;
					var odat = cdb._Types.TileLayerData_Impl_.decode(v.data);
					var pos = 0;
					var ndat = [];
					var _g1 = 0;
					while(_g1 < newH) {
						var y = _g1++;
						if(y >= oldH) {
							var _g2 = 0;
							while(_g2 < newW) {
								var x = _g2++;
								ndat.push(0);
							}
						} else if(newW <= oldW) {
							var _g21 = 0;
							while(_g21 < newW) {
								var x1 = _g21++;
								ndat.push(odat[pos++]);
							}
							pos += oldW - newW;
						} else {
							var _g22 = 0;
							while(_g22 < oldW) {
								var x2 = _g22++;
								ndat.push(odat[pos++]);
							}
							var _g23 = oldW;
							while(_g23 < newW) {
								var x3 = _g23++;
								ndat.push(0);
							}
						}
					}
					return { file : v.file, size : v.size, stride : v.stride, data : cdb._Types.TileLayerData_Impl_.encode(ndat)};
				};
				var _g11 = 0;
				var _g24 = sheet.columns;
				while(_g11 < _g24.length) {
					var c1 = _g24[_g11];
					++_g11;
					var v1 = Reflect.field(obj,c1.name);
					{
						var _g3 = c1.type;
						switch(_g3[1]) {
						case 12:
							if(v1 == null || v1 == "") continue;
							var odat1 = haxe.crypto.Base64.decode(v1);
							var ndat1 = haxe.io.Bytes.alloc(newW * newH);
							var _g4 = 0;
							while(_g4 < newH) {
								var y1 = _g4++;
								var _g5 = 0;
								while(_g5 < newW) {
									var x4 = _g5++;
									var k;
									if(y1 < oldH && x4 < oldW) k = odat1.b[x4 + y1 * oldW]; else k = 0;
									ndat1.b[x4 + y1 * newW] = k;
								}
							}
							v1 = haxe.crypto.Base64.encode(ndat1);
							obj[c1.name] = v1;
							break;
						case 8:
							var s = this.smap.get(sheet.name + "@" + c1.name).s;
							if(this.hasColumn(s,"x",[cdb.ColumnType.TInt,cdb.ColumnType.TFloat]) && this.hasColumn(s,"y",[cdb.ColumnType.TInt,cdb.ColumnType.TFloat])) {
								var elts = Reflect.field(obj,c1.name);
								var _g41 = 0;
								var _g51 = elts.slice();
								while(_g41 < _g51.length) {
									var e = _g51[_g41];
									++_g41;
									if(e.x >= newW || e.y >= newH) HxOverrides.remove(elts,e);
								}
							} else if(this.hasColumn(s,"data",[cdb.ColumnType.TTileLayer])) {
								var a = v1;
								var _g42 = 0;
								while(_g42 < a.length) {
									var o = a[_g42];
									++_g42;
									o.data = remapTileLayer(o.data);
								}
							}
							break;
						case 15:
							Reflect.setField(obj,c1.name,remapTileLayer(v1));
							break;
						default:
						}
					}
				}
			} else if(sheet.props.displayColumn == c.name) {
				var obj1 = sheet.lines[index];
				var s1 = this.smap.get(sheet.name);
				var _g12 = 0;
				var _g25 = sheet.columns;
				while(_g12 < _g25.length) {
					var cid = _g25[_g12];
					++_g12;
					if(cid.type == cdb.ColumnType.TId) {
						var id = Reflect.field(obj1,cid.name);
						if(id != null) {
							var disp = Reflect.field(obj1,c.name);
							if(disp == null) disp = "#" + id;
							s1.index.get(id).disp = disp;
						}
					}
				}
			}
			break;
		case 14:
			var obj2 = sheet.lines[index];
			var oldV = old;
			var newV = Reflect.field(obj2,c.name);
			if(newV != null && oldV != null && oldV.file != newV.file && !sys.FileSystem.exists(this.getAbsPath(oldV.file)) && sys.FileSystem.exists(this.getAbsPath(newV.file))) {
				var change = false;
				var _g26 = 0;
				var _g13 = sheet.lines.length;
				while(_g26 < _g13) {
					var i = _g26++;
					var t = Reflect.field(sheet.lines[i],c.name);
					if(t != null && t.file == oldV.file) {
						t.file = newV.file;
						change = true;
					}
				}
				if(change) this.refresh();
			}
			break;
		default:
			if(sheet.props.displayColumn == c.name) {
				var obj1 = sheet.lines[index];
				var s1 = this.smap.get(sheet.name);
				var _g12 = 0;
				var _g25 = sheet.columns;
				while(_g12 < _g25.length) {
					var cid = _g25[_g12];
					++_g12;
					if(cid.type == cdb.ColumnType.TId) {
						var id = Reflect.field(obj1,cid.name);
						if(id != null) {
							var disp = Reflect.field(obj1,c.name);
							if(disp == null) disp = "#" + id;
							s1.index.get(id).disp = disp;
						}
					}
				}
			}
		}
		this.save();
	}
	,error: function(msg) {
		js.Lib.alert(msg);
	}
	,setErrorMessage: function(msg) {
		if(msg == null) new js.JQuery(".errorMsg").hide(); else new js.JQuery(".errorMsg").text(msg).show();
	}
	,valueHtml: function(c,v,sheet,obj) {
		if(v == null) {
			if(c.opt) return "&nbsp;";
			return "<span class=\"error\">#NULL</span>";
		}
		{
			var _g = c.type;
			switch(_g[1]) {
			case 3:case 4:
				var _g1 = c.display;
				switch(_g1) {
				case 1:
					return Math.round(v * 10000) / 100 + "%";
				default:
					return Std.string(v) + "";
				}
				break;
			case 0:
				if(v == "") return "<span class=\"error\">#MISSING</span>"; else if(((function($this) {
					var $r;
					var key = v;
					$r = $this.smap.get(sheet.name).index.get(key);
					return $r;
				}(this))).obj == obj) return v; else return "<span class=\"error\">#DUP(" + Std.string(v) + ")</span>";
				break;
			case 1:case 12:
				if(v == "") return "&nbsp;"; else return StringTools.htmlEscape(v);
				break;
			case 6:
				var sname = _g[2];
				if(v == "") return "<span class=\"error\">#MISSING</span>"; else {
					var s = this.smap.get(sname);
					var i;
					var key1 = v;
					i = s.index.get(key1);
					if(i == null) return "<span class=\"error\">#REF(" + Std.string(v) + ")</span>"; else return StringTools.htmlEscape(i.disp);
				}
				break;
			case 2:
				if(v) return "Y"; else return "N";
				break;
			case 5:
				var values = _g[2];
				return values[v];
			case 7:
				if(v == "") return "<span class=\"error\">#MISSING</span>"; else {
					var data = Reflect.field(this.imageBank,v);
					if(data == null) return "<span class=\"error\">#NOTFOUND(" + Std.string(v) + ")</span>"; else return "<img src=\"" + data + "\"/>";
				}
				break;
			case 8:
				var a = v;
				var ps = this.smap.get(sheet.name + "@" + c.name).s;
				var out = [];
				var _g11 = 0;
				while(_g11 < a.length) {
					var v1 = a[_g11];
					++_g11;
					var vals = [];
					var _g2 = 0;
					var _g3 = ps.columns;
					while(_g2 < _g3.length) {
						var c1 = _g3[_g2];
						++_g2;
						var _g4 = c1.type;
						switch(_g4[1]) {
						case 8:
							continue;
							break;
						default:
							vals.push(this.valueHtml(c1,Reflect.field(v1,c1.name),ps,v1));
						}
					}
					out.push(vals.length == 1?vals[0]:vals);
				}
				return Std.string(out);
			case 9:
				var name = _g[2];
				var t = this.tmap.get(name);
				var a1 = v;
				var cas = t.cases[a1[0]];
				var str = cas.name;
				if(cas.args.length > 0) {
					str += "(";
					var out1 = [];
					var pos = 1;
					var _g21 = 1;
					var _g12 = a1.length;
					while(_g21 < _g12) {
						var i1 = _g21++;
						out1.push(this.valueHtml(cas.args[i1 - 1],a1[i1],sheet,this));
					}
					str += out1.join(",");
					str += ")";
				}
				return str;
			case 10:
				var values1 = _g[2];
				var v2 = v;
				var flags = [];
				var _g22 = 0;
				var _g13 = values1.length;
				while(_g22 < _g13) {
					var i2 = _g22++;
					if((v2 & 1 << i2) != 0) flags.push(StringTools.htmlEscape(values1[i2]));
				}
				if(flags.length == 0) return String.fromCharCode(8709); else return flags.join("|");
				break;
			case 11:
				var id = Main.UID++;
				return "<input type=\"text\" id=\"_c" + id + "\"/><script>$(\"#_c" + id + "\").spectrum({ color : \"#" + StringTools.hex(v,6) + "\", showInput: true, clickoutFiresChange : true, showButtons: false, change : function(e) { _.colorChangeEvent(e,$(this),\"" + c.name + "\"); } })</script>";
			case 13:
				var path = this.getAbsPath(v);
				var ext = v.split(".").pop().toLowerCase();
				var html;
				if(v == "") html = "<span class=\"error\">#MISSING</span>"; else html = StringTools.htmlEscape(v);
				if(v != "" && !js.Node.require("fs").existsSync(path)) html = "<span class=\"error\">" + html + "</span>"; else if(ext == "png" || ext == "jpg" || ext == "jpeg" || ext == "gif") html = "<span class=\"preview\">" + html + "<div class=\"previewContent\"><div class=\"label\"></div><img src=\"" + path + "\" onload=\"$(this).parent().find('.label').text(this.width+'x'+this.height)\"/></div></span>";
				if(v != "") html += " <input type=\"submit\" value=\"open\" onclick=\"_.openFile('" + path + "')\"/>";
				return html;
			case 14:
				var v3 = v;
				var path1 = this.getAbsPath(v3.file);
				if(!js.Node.require("fs").existsSync(path1)) return "<span class=\"error\">" + v3.file + "</span>"; else {
					var id1 = Main.UID++;
					var zoom = 2;
					var html1 = "<div id=\"_c" + id1 + "\" style=\"width : " + v3.size * zoom + "px; height : " + v3.size * zoom + "px; background : url('" + path1 + "') -" + v3.size * v3.x * zoom + "px -" + v3.size * v3.y * zoom + "px; border : 1px solid black;\"></div>";
					html1 += "<img src=\"" + path1 + "\" onload=\"$('#_c" + id1 + "').css({backgroundSize : (this.width*" + zoom + ")+'px ' + (this.height*" + zoom + ")+'px'}); this.parentNode.removeChild(this)\"/>";
					return html1;
				}
				break;
			case 15:
				var v4 = v;
				var path2 = this.getAbsPath(v4.file);
				if(!js.Node.require("fs").existsSync(path2)) return "<span class=\"error\">" + v4.file + "</span>"; else return "#DATA";
				break;
			}
		}
	}
	,colorChangeEvent: function(value,comp,col) {
		var color = Std.parseInt("0x" + value.toHex());
		var line = comp.parent().parent();
		var idx = line.data("index");
		var sheet = this.getSheet(line.parent().parent().attr("sheet"));
		var obj = sheet.lines[idx];
		obj[col] = color;
		this.save();
	}
	,popupLine: function(sheet,index) {
		var _g = this;
		var n = new nodejs.webkit.Menu();
		var nup = new nodejs.webkit.MenuItem({ label : "Move Up"});
		var ndown = new nodejs.webkit.MenuItem({ label : "Move Down"});
		var nins = new nodejs.webkit.MenuItem({ label : "Insert"});
		var ndel = new nodejs.webkit.MenuItem({ label : "Delete"});
		var nsep = new nodejs.webkit.MenuItem({ label : "Separator", type : "checkbox"});
		var nref = new nodejs.webkit.MenuItem({ label : "Show References"});
		var _g1 = 0;
		var _g11 = [nup,ndown,nins,ndel,nsep,nref];
		while(_g1 < _g11.length) {
			var m = _g11[_g1];
			++_g1;
			n.append(m);
		}
		var sepIndex = Lambda.indexOf(sheet.separators,index);
		nsep.checked = sepIndex >= 0;
		nins.click = function() {
			_g.newLine(sheet,index);
		};
		nup.click = function() {
			_g.moveLine(sheet,index,-1);
		};
		ndown.click = function() {
			_g.moveLine(sheet,index,1);
		};
		ndel.click = function() {
			_g.deleteLine(sheet,index);
			_g.refresh();
			_g.save();
		};
		nsep.click = function() {
			if(sepIndex >= 0) {
				sheet.separators.splice(sepIndex,1);
				if(sheet.props.separatorTitles != null) sheet.props.separatorTitles.splice(sepIndex,1);
			} else {
				sepIndex = sheet.separators.length;
				var _g12 = 0;
				var _g2 = sheet.separators.length;
				while(_g12 < _g2) {
					var i = _g12++;
					if(sheet.separators[i] > index) {
						sepIndex = i;
						break;
					}
				}
				sheet.separators.splice(sepIndex,0,index);
				if(sheet.props.separatorTitles != null && sheet.props.separatorTitles.length > sepIndex) sheet.props.separatorTitles.splice(sepIndex,0,null);
			}
			_g.refresh();
			_g.save();
		};
		nref.click = function() {
			_g.showReferences(sheet,index);
		};
		if(sheet.props.hide) nsep.enabled = false;
		n.popup(this.mousePos.x,this.mousePos.y);
	}
	,popupColumn: function(sheet,c) {
		var _g4 = this;
		var n = new nodejs.webkit.Menu();
		var nedit = new nodejs.webkit.MenuItem({ label : "Edit"});
		var nins = new nodejs.webkit.MenuItem({ label : "Add Column"});
		var nleft = new nodejs.webkit.MenuItem({ label : "Move Left"});
		var nright = new nodejs.webkit.MenuItem({ label : "Move Right"});
		var ndel = new nodejs.webkit.MenuItem({ label : "Delete"});
		var ndisp = new nodejs.webkit.MenuItem({ label : "Display Column", type : "checkbox"});
		var _g = 0;
		var _g1 = [nedit,nins,nleft,nright,ndel,ndisp];
		while(_g < _g1.length) {
			var m = _g1[_g];
			++_g;
			n.append(m);
		}
		{
			var _g2 = c.type;
			switch(_g2[1]) {
			case 0:case 1:case 5:case 10:
				var conv = new nodejs.webkit.MenuItem({ label : "Convert"});
				var cm = new nodejs.webkit.Menu();
				var _g11 = 0;
				var _g21 = [{ n : "lowercase", f : function(s) {
					return s.toLowerCase();
				}},{ n : "UPPERCASE", f : function(s1) {
					return s1.toUpperCase();
				}},{ n : "UpperIdent", f : function(s2) {
					return HxOverrides.substr(s2,0,1).toUpperCase() + HxOverrides.substr(s2,1,null);
				}},{ n : "lowerIdent", f : function(s3) {
					return HxOverrides.substr(s3,0,1).toLowerCase() + HxOverrides.substr(s3,1,null);
				}}];
				while(_g11 < _g21.length) {
					var k = [_g21[_g11]];
					++_g11;
					var m1 = new nodejs.webkit.MenuItem({ label : k[0].n});
					m1.click = (function(k) {
						return function() {
							{
								var _g3 = c.type;
								switch(_g3[1]) {
								case 5:
									var values = _g3[2];
									var _g5 = 0;
									var _g41 = values.length;
									while(_g5 < _g41) {
										var i = _g5++;
										values[i] = k[0].f(values[i]);
									}
									break;
								case 10:
									var values = _g3[2];
									var _g5 = 0;
									var _g41 = values.length;
									while(_g5 < _g41) {
										var i = _g5++;
										values[i] = k[0].f(values[i]);
									}
									break;
								default:
									var refMap = new haxe.ds.StringMap();
									var _g51 = 0;
									var _g6 = _g4.getSheetLines(sheet);
									while(_g51 < _g6.length) {
										var obj = _g6[_g51];
										++_g51;
										var t = Reflect.field(obj,c.name);
										if(t != null && t != "") {
											var t2 = k[0].f(t);
											if(t2 == null && !c.opt) t2 = "";
											if(t2 == null) Reflect.deleteField(obj,c.name); else {
												obj[c.name] = t2;
												if(t2 != "") refMap.set(t,t2);
											}
										}
									}
									if(c.type == cdb.ColumnType.TId) _g4.updateRefs(sheet,refMap);
									_g4.makeSheet(sheet);
								}
							}
							_g4.refresh();
							_g4.save();
						};
					})(k);
					cm.append(m1);
				}
				conv.submenu = cm;
				n.append(conv);
				break;
			case 3:case 4:
				var conv1 = new nodejs.webkit.MenuItem({ label : "Convert"});
				var cm1 = new nodejs.webkit.Menu();
				var _g12 = 0;
				var _g22 = [{ n : "* 10", f : function(s4) {
					return s4 * 10;
				}},{ n : "/ 10", f : function(s5) {
					return s5 / 10;
				}},{ n : "+ 1", f : function(s6) {
					return s6 + 1;
				}},{ n : "- 1", f : function(s7) {
					return s7 - 1;
				}}];
				while(_g12 < _g22.length) {
					var k1 = [_g22[_g12]];
					++_g12;
					var m2 = new nodejs.webkit.MenuItem({ label : k1[0].n});
					m2.click = (function(k1) {
						return function() {
							var _g31 = 0;
							var _g52 = _g4.getSheetLines(sheet);
							while(_g31 < _g52.length) {
								var obj1 = _g52[_g31];
								++_g31;
								var t1 = Reflect.field(obj1,c.name);
								if(t1 != null) {
									var t21 = k1[0].f(t1);
									if(c.type == cdb.ColumnType.TInt) t21 = t21 | 0;
									obj1[c.name] = t21;
								}
							}
							_g4.refresh();
							_g4.save();
						};
					})(k1);
					cm1.append(m2);
				}
				conv1.submenu = cm1;
				n.append(conv1);
				break;
			default:
			}
		}
		ndisp.checked = sheet.props.displayColumn == c.name;
		nedit.click = function() {
			_g4.newColumn(sheet.name,c);
		};
		nleft.click = function() {
			var index = Lambda.indexOf(sheet.columns,c);
			if(index > 0) {
				HxOverrides.remove(sheet.columns,c);
				sheet.columns.splice(index - 1,0,c);
				_g4.refresh();
				_g4.save();
			}
		};
		nright.click = function() {
			var index1 = Lambda.indexOf(sheet.columns,c);
			if(index1 < sheet.columns.length - 1) {
				HxOverrides.remove(sheet.columns,c);
				sheet.columns.splice(index1 + 1,0,c);
				_g4.refresh();
				_g4.save();
			}
		};
		ndel.click = function() {
			_g4.deleteColumn(sheet,c.name);
		};
		ndisp.click = function() {
			if(sheet.props.displayColumn == c.name) sheet.props.displayColumn = null; else sheet.props.displayColumn = c.name;
			_g4.makeSheet(sheet);
			_g4.refresh();
			_g4.save();
		};
		nins.click = function() {
			_g4.newColumn(sheet.name,null,Lambda.indexOf(sheet.columns,c) + 1);
		};
		n.popup(this.mousePos.x,this.mousePos.y);
	}
	,popupSheet: function(s,li) {
		var _g = this;
		var n = new nodejs.webkit.Menu();
		var nins = new nodejs.webkit.MenuItem({ label : "Add Sheet"});
		var nleft = new nodejs.webkit.MenuItem({ label : "Move Left"});
		var nright = new nodejs.webkit.MenuItem({ label : "Move Right"});
		var nren = new nodejs.webkit.MenuItem({ label : "Rename"});
		var ndel = new nodejs.webkit.MenuItem({ label : "Delete"});
		var nindex = new nodejs.webkit.MenuItem({ label : "Add Index", type : "checkbox"});
		var ngroup = new nodejs.webkit.MenuItem({ label : "Add Group", type : "checkbox"});
		var _g1 = 0;
		var _g11 = [nins,nleft,nright,nren,ndel,nindex,ngroup];
		while(_g1 < _g11.length) {
			var m = _g11[_g1];
			++_g1;
			n.append(m);
		}
		nleft.click = function() {
			var index = Lambda.indexOf(_g.data.sheets,s);
			if(index > 0) {
				HxOverrides.remove(_g.data.sheets,s);
				_g.data.sheets.splice(index - 1,0,s);
				_g.prefs.curSheet = index - 1;
				_g.initContent();
				_g.save();
			}
		};
		nright.click = function() {
			var index1 = Lambda.indexOf(_g.data.sheets,s);
			if(index1 < _g.data.sheets.length - 1) {
				HxOverrides.remove(_g.data.sheets,s);
				_g.data.sheets.splice(index1 + 1,0,s);
				_g.prefs.curSheet = index1 + 1;
				_g.initContent();
				_g.save();
			}
		};
		ndel.click = function() {
			_g.deleteSheet(s);
			_g.initContent();
			_g.save();
		};
		nins.click = function() {
			_g.newSheet();
		};
		nindex.checked = s.props.hasIndex;
		nindex.click = function() {
			if(s.props.hasIndex) {
				var _g12 = 0;
				var _g2 = _g.getSheetLines(s);
				while(_g12 < _g2.length) {
					var o = _g2[_g12];
					++_g12;
					Reflect.deleteField(o,"index");
				}
				s.props.hasIndex = false;
			} else {
				var _g3 = 0;
				var _g13 = s.columns;
				while(_g3 < _g13.length) {
					var c = _g13[_g3];
					++_g3;
					if(c.name == "index") {
						_g.error("Column 'index' already exists");
						return;
					}
				}
				s.props.hasIndex = true;
			}
			_g.save();
		};
		ngroup.checked = s.props.hasGroup;
		ngroup.click = function() {
			if(s.props.hasGroup) {
				var _g14 = 0;
				var _g21 = _g.getSheetLines(s);
				while(_g14 < _g21.length) {
					var o1 = _g21[_g14];
					++_g14;
					Reflect.deleteField(o1,"group");
				}
				s.props.hasGroup = false;
			} else {
				var _g4 = 0;
				var _g15 = s.columns;
				while(_g4 < _g15.length) {
					var c1 = _g15[_g4];
					++_g4;
					if(c1.name == "group") {
						_g.error("Column 'group' already exists");
						return;
					}
				}
				s.props.hasGroup = true;
			}
			_g.save();
		};
		nren.click = function() {
			li.dblclick();
		};
		if(s.props.levelProps != null || this.hasColumn(s,"width",[cdb.ColumnType.TInt]) && this.hasColumn(s,"height",[cdb.ColumnType.TInt])) {
			var nlevel = new nodejs.webkit.MenuItem({ label : "Level", type : "checkbox"});
			nlevel.checked = s.props.levelProps != null;
			n.append(nlevel);
			nlevel.click = function() {
				if(s.props.levelProps != null) Reflect.deleteField(s.props,"levelProps"); else s.props.levelProps = { };
				_g.save();
				_g.refresh();
			};
		}
		n.popup(this.mousePos.x,this.mousePos.y);
	}
	,editCell: function(c,v,sheet,index) {
		var _g = this;
		var obj = sheet.lines[index];
		var val = Reflect.field(obj,c.name);
		var old = val;
		var html = _g.valueHtml(c,val,sheet,obj);
		if(v.hasClass("edit")) return;
		var editDone = function() {
			v.html(html);
			v.removeClass("edit");
			_g.setErrorMessage();
		};
		{
			var _g1 = c.type;
			switch(_g1[1]) {
			case 3:case 4:case 1:case 0:case 9:
				v.empty();
				var i = new js.JQuery("<input>");
				v.addClass("edit");
				i.appendTo(v);
				if(val != null) {
					var _g11 = c.type;
					switch(_g11[1]) {
					case 9:
						var t = _g11[2];
						i.val(this.typeValToString(this.tmap.get(t),val));
						break;
					default:
						i.val("" + Std.string(val));
					}
				}
				i.change(function(e) {
					e.stopPropagation();
				});
				i.keydown(function(e1) {
					var _g12 = e1.keyCode;
					switch(_g12) {
					case 27:
						editDone();
						break;
					case 13:
						i.blur();
						e1.preventDefault();
						break;
					case 38:case 40:
						i.blur();
						return;
					case 9:
						i.blur();
						_g.moveCursor(e1.shiftKey?-1:1,0,false,false);
						haxe.Timer.delay(function() {
							new js.JQuery(".cursor").dblclick();
						},1);
						e1.preventDefault();
						break;
					default:
					}
					e1.stopPropagation();
				});
				i.blur(function(_) {
					var nv = i.val();
					if(nv == "" && c.opt) {
						if(val != null) {
							val = html = null;
							Reflect.deleteField(obj,c.name);
							_g.changed(sheet,c,index,old);
						}
					} else {
						var val2;
						{
							var _g13 = c.type;
							switch(_g13[1]) {
							case 3:
								val2 = Std.parseInt(nv);
								break;
							case 4:
								var f = Std.parseFloat(nv);
								if(isNaN(f)) val2 = null; else val2 = f;
								break;
							case 0:
								if(_g.r_ident.match(nv)) val2 = nv; else val2 = null;
								break;
							case 9:
								var t1 = _g13[2];
								try {
									val2 = _g.parseTypeVal(_g.tmap.get(t1),nv);
								} catch( e2 ) {
									val2 = null;
								}
								break;
							default:
								val2 = nv;
							}
						}
						if(val2 != val && val2 != null) {
							if(c.type == cdb.ColumnType.TId && val != null) {
								var m = new haxe.ds.StringMap();
								var key = val;
								var value = val2;
								m.set(key,value);
								_g.updateRefs(sheet,m);
							}
							val = val2;
							obj[c.name] = val;
							_g.changed(sheet,c,index,old);
							html = _g.valueHtml(c,val,sheet,obj);
						}
					}
					editDone();
				});
				{
					var _g14 = c.type;
					switch(_g14[1]) {
					case 9:
						var t2 = _g14[2];
						var t3 = this.tmap.get(t2);
						i.keyup(function(_1) {
							var str = i.val();
							try {
								if(str != "") _g.parseTypeVal(t3,str);
								_g.setErrorMessage();
								i.removeClass("error");
							} catch( msg ) {
								if( js.Boot.__instanceof(msg,String) ) {
									_g.setErrorMessage(msg);
									i.addClass("error");
								} else throw(msg);
							}
						});
						break;
					default:
					}
				}
				i.focus();
				i.select();
				break;
			case 5:
				var values = _g1[2];
				v.empty();
				var s = new js.JQuery("<select>");
				v.addClass("edit");
				var _g2 = 0;
				var _g15 = values.length;
				while(_g2 < _g15) {
					var i1 = _g2++;
					new js.JQuery("<option>").attr("value","" + i1).attr(val == i1?"selected":"_sel","selected").text(values[i1]).appendTo(s);
				}
				if(c.opt) new js.JQuery("<option>").attr("value","-1").text("--- None ---").prependTo(s);
				v.append(s);
				s.change(function(e3) {
					val = Std.parseInt(s.val());
					if(val < 0) {
						val = null;
						Reflect.deleteField(obj,c.name);
					} else obj[c.name] = val;
					html = _g.valueHtml(c,val,sheet,obj);
					_g.changed(sheet,c,index,old);
					editDone();
					e3.stopPropagation();
				});
				s.keydown(function(e4) {
					var _g16 = e4.keyCode;
					switch(_g16) {
					case 37:case 39:
						s.blur();
						return;
					case 9:
						s.blur();
						_g.moveCursor(e4.shiftKey?-1:1,0,false,false);
						haxe.Timer.delay(function() {
							new js.JQuery(".cursor").dblclick();
						},1);
						e4.preventDefault();
						break;
					default:
					}
					e4.stopPropagation();
				});
				s.blur(function(_2) {
					editDone();
				});
				s.focus();
				var event = window.document.createEvent("MouseEvents");
				event.initMouseEvent("mousedown",true,true,window);
				s[0].dispatchEvent(event);
				break;
			case 6:
				var sname = _g1[2];
				var sdat = this.smap.get(sname);
				if(sdat == null) return;
				v.empty();
				v.addClass("edit");
				var s1 = new js.JQuery("<select>");
				var _g17 = 0;
				var _g21 = sdat.all;
				while(_g17 < _g21.length) {
					var l = _g21[_g17];
					++_g17;
					new js.JQuery("<option>").attr("value","" + l.id).attr(val == l.id?"selected":"_sel","selected").text(l.disp).appendTo(s1);
				}
				if(c.opt || val == null || val == "") new js.JQuery("<option>").attr("value","").text("--- None ---").prependTo(s1);
				v.append(s1);
				s1.change(function(e5) {
					val = s1.val();
					if(val == "") {
						val = null;
						Reflect.deleteField(obj,c.name);
					} else obj[c.name] = val;
					html = _g.valueHtml(c,val,sheet,obj);
					_g.changed(sheet,c,index,old);
					editDone();
					e5.stopPropagation();
				});
				s1.keydown(function(e6) {
					var _g18 = e6.keyCode;
					switch(_g18) {
					case 37:case 39:
						s1.blur();
						return;
					case 9:
						s1.blur();
						_g.moveCursor(e6.shiftKey?-1:1,0,false,false);
						haxe.Timer.delay(function() {
							new js.JQuery(".cursor").dblclick();
						},1);
						e6.preventDefault();
						break;
					default:
					}
					e6.stopPropagation();
				});
				s1.blur(function(_3) {
					editDone();
				});
				s1.focus();
				var event1 = window.document.createEvent("MouseEvents");
				event1.initMouseEvent("mousedown",true,true,window);
				s1[0].dispatchEvent(event1);
				break;
			case 2:
				if(c.opt && val == false) {
					val = null;
					Reflect.deleteField(obj,c.name);
				} else {
					val = !val;
					obj[c.name] = val;
				}
				v.html(_g.valueHtml(c,val,sheet,obj));
				_g.changed(sheet,c,index,old);
				break;
			case 7:
				var i2 = new js.JQuery("<input>").attr("type","file").css("display","none").change(function(e7) {
					var j = $(this);
					var file = j.val();
					var ext = file.split(".").pop().toLowerCase();
					if(ext == "jpeg") ext = "jpg";
					if(ext != "png" && ext != "gif" && ext != "jpg") {
						_g.error("Unsupported image extension " + ext);
						return;
					}
					var bytes = sys.io.File.getBytes(file);
					var md5 = haxe.crypto.Md5.make(bytes).toHex();
					if(_g.imageBank == null) _g.imageBank = { };
					if(!Object.prototype.hasOwnProperty.call(_g.imageBank,md5)) {
						var data = "data:image/" + ext + ";base64," + new haxe.crypto.BaseCode(haxe.io.Bytes.ofString("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/")).encodeBytes(bytes).toString();
						_g.imageBank[md5] = data;
					}
					val = md5;
					obj[c.name] = val;
					v.html(_g.valueHtml(c,val,sheet,obj));
					_g.changed(sheet,c,index,old);
					j.remove();
				});
				i2.appendTo(new js.JQuery("body"));
				i2.click();
				break;
			case 10:
				var values1 = _g1[2];
				var div = new js.JQuery("<div>").addClass("flagValues");
				div.click(function(e8) {
					e8.stopPropagation();
				}).dblclick(function(e9) {
					e9.stopPropagation();
				});
				var _g22 = 0;
				var _g19 = values1.length;
				while(_g22 < _g19) {
					var i3 = [_g22++];
					var f1 = new js.JQuery("<input>").attr("type","checkbox").prop("checked",(val & 1 << i3[0]) != 0).change((function(i3) {
						return function(e10) {
							val &= ~(1 << i3[0]);
							if($(this).prop("checked")) val |= 1 << i3[0];
							e10.stopPropagation();
						};
					})(i3));
					new js.JQuery("<label>").text(values1[i3[0]]).appendTo(div).append(f1);
				}
				v.empty();
				v.append(div);
				this.cursor.onchange = function() {
					if(c.opt && val == 0) {
						val = null;
						Reflect.deleteField(obj,c.name);
					} else obj[c.name] = val;
					html = _g.valueHtml(c,val,sheet,obj);
					editDone();
					_g.save();
				};
				break;
			case 15:
				break;
			case 8:case 11:case 12:case 13:case 14:
				throw "assert";
				break;
			}
		}
	}
	,updateCursor: function() {
		new js.JQuery(".selected").removeClass("selected");
		new js.JQuery(".cursor").removeClass("cursor");
		if(this.cursor.s == null) return;
		if(this.cursor.y < 0) {
			this.cursor.y = 0;
			this.cursor.select = null;
		}
		if(this.cursor.y >= this.cursor.s.lines.length) {
			this.cursor.y = this.cursor.s.lines.length - 1;
			this.cursor.select = null;
		}
		if(this.cursor.x >= this.cursor.s.columns.length) {
			this.cursor.x = this.cursor.s.columns.length - 1;
			this.cursor.select = null;
		}
		var l = this.getLine(this.cursor.s,this.cursor.y);
		if(this.cursor.x < 0) {
			l.addClass("selected");
			if(this.cursor.select != null) {
				var y = this.cursor.y;
				while(this.cursor.select.y != y) {
					if(this.cursor.select.y > y) y++; else y--;
					this.getLine(this.cursor.s,y).addClass("selected");
				}
			}
		} else {
			l.find("td.c").eq(this.cursor.x).addClass("cursor");
			if(this.cursor.select != null) {
				var s = this.getSelection();
				var _g1 = s.y1;
				var _g = s.y2 + 1;
				while(_g1 < _g) {
					var y1 = _g1++;
					this.getLine(this.cursor.s,y1).find("td.c").slice(s.x1,s.x2 + 1).addClass("selected");
				}
			}
		}
		var e = l[0];
		if(e != null) e.scrollIntoViewIfNeeded();
	}
	,refresh: function() {
		var t = new js.JQuery("<table>");
		this.checkCursor = true;
		this.fillTable(t,this.viewSheet);
		if(this.cursor.s != this.viewSheet && this.checkCursor) this.setCursor(this.viewSheet,null,null,null,false);
		var content = new js.JQuery("#content");
		content.empty();
		t.appendTo(content);
		this.updateCursor();
	}
	,chooseFile: function(callb,cancel) {
		var _g = this;
		var fs = new js.JQuery("#fileSelect");
		if(fs.attr("nwworkingdir") == null) fs.attr("nwworkingdir",new haxe.io.Path(this.prefs.curFile).dir);
		fs.change(function(_) {
			fs.unbind("change");
			var path = fs.val().split("\\").join("/");
			fs.val("");
			if(path == "") {
				if(cancel != null) cancel();
				return;
			}
			fs.attr("nwworkingdir","");
			var parts = path.split("/");
			var base = _g.prefs.curFile.split("\\").join("/").split("/");
			base.pop();
			while(parts.length > 1 && base.length > 0 && parts[0] == base[0]) {
				parts.shift();
				base.shift();
			}
			if(parts.length == 0 || parts[0] != "" && parts[0].charAt(1) != ":") while(base.length > 0) {
				parts.unshift("..");
				base.pop();
			}
			var relPath = parts.join("/");
			callb(relPath);
		}).click();
	}
	,fillTable: function(content,sheet) {
		var _g4 = this;
		if(sheet.columns.length == 0) {
			content.html("<a href=\"javascript:_.newColumn('" + sheet.name + "')\">Add a column</a>");
			return;
		}
		var todo = [];
		var inTodo = false;
		var cols = new js.JQuery("<tr>").addClass("head");
		var types;
		var _g = [];
		var _g1 = 0;
		var _g2 = Type.getEnumConstructs(cdb.ColumnType);
		while(_g1 < _g2.length) {
			var t = _g2[_g1];
			++_g1;
			_g.push(HxOverrides.substr(t,1,null).toLowerCase());
		}
		types = _g;
		new js.JQuery("<td>").addClass("start").appendTo(cols).click(function(_) {
			if(sheet.props.hide) content.change(); else new js.JQuery("tr.list table").change();
		});
		content.addClass("sheet");
		content.attr("sheet",this.getPath(sheet));
		content.click(function(e) {
			e.stopPropagation();
		});
		var lines;
		var _g11 = [];
		var _g3 = 0;
		var _g21 = sheet.lines.length;
		while(_g3 < _g21) {
			var i = [_g3++];
			_g11.push((function($this) {
				var $r;
				var l = new js.JQuery("<tr>");
				l.data("index",i[0]);
				var head = [new js.JQuery("<td>").addClass("start").text("" + i[0])];
				l.mousedown((function(head,i) {
					return function(e1) {
						if(e1.which == 3) {
							head[0].click();
							haxe.Timer.delay(((function() {
								return function(f,a1,a2) {
									return (function() {
										return function() {
											f(a1,a2);
										};
									})();
								};
							})())($bind(_g4,_g4.popupLine),sheet,i[0]),1);
							e1.preventDefault();
							return;
						}
					};
				})(head,i)).click((function(i) {
					return function(e2) {
						if(e2.shiftKey && _g4.cursor.s == sheet && _g4.cursor.x < 0) {
							_g4.cursor.select = { x : -1, y : i[0]};
							_g4.updateCursor();
						} else _g4.setCursor(sheet,-1,i[0]);
					};
				})(i));
				head[0].appendTo(l);
				$r = l;
				return $r;
			}(this)));
		}
		lines = _g11;
		var colCount = sheet.columns.length;
		if(sheet.props.levelProps != null) colCount++;
		var _g31 = 0;
		var _g22 = sheet.columns.length;
		while(_g31 < _g22) {
			var cindex = [_g31++];
			var c = [sheet.columns[cindex[0]]];
			var col = new js.JQuery("<td>");
			col.html(c[0].name);
			col.css("width",(100 / colCount | 0) + "%");
			if(sheet.props.displayColumn == c[0].name) col.addClass("display");
			col.mousedown((function(c) {
				return function(e3) {
					if(e3.which == 3) {
						haxe.Timer.delay(((function() {
							return function(f1,a11,c1) {
								return (function() {
									return function() {
										f1(a11,c1);
									};
								})();
							};
						})())($bind(_g4,_g4.popupColumn),sheet,c[0]),1);
						e3.preventDefault();
						return;
					}
				};
			})(c));
			cols.append(col);
			var ctype = "t_" + types[c[0].type[1]];
			var _g5 = 0;
			var _g41 = sheet.lines.length;
			while(_g5 < _g41) {
				var index = [_g5++];
				var obj = [sheet.lines[index[0]]];
				var val = [Reflect.field(obj[0],c[0].name)];
				var v = [new js.JQuery("<td>").addClass(ctype).addClass("c")];
				var l1 = [lines[index[0]]];
				v[0].appendTo(l1[0]);
				var html = [this.valueHtml(c[0],val[0],sheet,obj[0])];
				v[0].html(html[0]);
				v[0].data("index",cindex[0]);
				v[0].click((function(index,cindex) {
					return function(e4) {
						if(inTodo) {
						} else if(e4.shiftKey && _g4.cursor.s == sheet) {
							_g4.cursor.select = { x : cindex[0], y : index[0]};
							_g4.updateCursor();
							e4.stopImmediatePropagation();
						} else _g4.setCursor(sheet,cindex[0],index[0]);
						e4.stopPropagation();
					};
				})(index,cindex));
				var set = [(function(html,v,val,obj,index,c) {
					return function(val2) {
						var old = val[0];
						val[0] = val2;
						if(val[0] == null) Reflect.deleteField(obj[0],c[0].name); else obj[0][c[0].name] = val[0];
						html[0] = _g4.valueHtml(c[0],val[0],sheet,obj[0]);
						v[0].html(html[0]);
						_g4.changed(sheet,c[0],index[0],old);
					};
				})(html,v,val,obj,index,c)];
				{
					var _g6 = c[0].type;
					switch(_g6[1]) {
					case 7:
						v[0].find("img").addClass("deletable").change((function(obj,c) {
							return function(e5) {
								if(Reflect.field(obj[0],c[0].name) != null) {
									Reflect.deleteField(obj[0],c[0].name);
									_g4.refresh();
									_g4.save();
								}
							};
						})(obj,c)).click((function() {
							return function(e6) {
								$(this).addClass("selected");
								e6.stopPropagation();
							};
						})());
						v[0].dblclick((function(v,index,c) {
							return function(_1) {
								_g4.editCell(c[0],v[0],sheet,index[0]);
							};
						})(v,index,c));
						break;
					case 8:
						var key = [this.getPath(sheet) + "@" + c[0].name + ":" + index[0]];
						v[0].click((function(key,html,l1,v,val,obj,index,c,cindex) {
							return function(e7) {
								var next = l1[0].next("tr.list");
								if(next.length > 0) {
									if(next.data("name") == c[0].name) {
										next.change();
										return;
									}
									next.change();
								}
								next = new js.JQuery("<tr>").addClass("list").data("name",c[0].name);
								new js.JQuery("<td>").appendTo(next);
								var cell = new js.JQuery("<td>").attr("colspan","" + colCount).appendTo(next);
								var div = new js.JQuery("<div>").appendTo(cell);
								if(!inTodo) div.hide();
								var content1 = new js.JQuery("<table>").appendTo(div);
								var psheet = _g4.smap.get(sheet.name + "@" + c[0].name).s;
								if(val[0] == null) {
									val[0] = [];
									obj[0][c[0].name] = val[0];
								}
								psheet = { columns : psheet.columns, props : psheet.props, name : psheet.name, path : key[0], parent : { sheet : sheet, column : cindex[0], line : index[0]}, lines : val[0], separators : []};
								_g4.fillTable(content1,psheet);
								next.insertAfter(l1[0]);
								v[0].html("...");
								_g4.openedList.set(key[0],true);
								next.change((function(key,html,v,val,obj,c) {
									return function(e8) {
										if(c[0].opt && val[0].length == 0) {
											val[0] = null;
											Reflect.deleteField(obj[0],c[0].name);
										}
										html[0] = _g4.valueHtml(c[0],val[0],sheet,obj[0]);
										v[0].html(html[0]);
										div.slideUp(100,(function() {
											return function() {
												next.remove();
											};
										})());
										_g4.openedList.remove(key[0]);
										e8.stopPropagation();
									};
								})(key,html,v,val,obj,c));
								if(inTodo) {
									if(_g4.cursor.s != null && _g4.getPath(_g4.cursor.s) == _g4.getPath(psheet)) {
										_g4.cursor.s = psheet;
										_g4.checkCursor = false;
									}
								} else {
									div.slideDown(100);
									_g4.setCursor(psheet);
								}
								e7.stopPropagation();
							};
						})(key,html,l1,v,val,obj,index,c,cindex));
						if(this.openedList.get(key[0])) todo.push((function(v) {
							return function() {
								v[0].click();
							};
						})(v));
						break;
					case 11:case 12:
						break;
					case 13:
						v[0].find("input").addClass("deletable").change((function(obj,c) {
							return function(e9) {
								if(Reflect.field(obj[0],c[0].name) != null) {
									Reflect.deleteField(obj[0],c[0].name);
									_g4.refresh();
									_g4.save();
								}
							};
						})(obj,c));
						v[0].dblclick((function(set) {
							return function(_2) {
								_g4.chooseFile((function(set) {
									return function(path) {
										set[0](path);
										_g4.save();
									};
								})(set));
							};
						})(set));
						break;
					case 14:
						v[0].find("div").addClass("deletable").change((function(obj,c) {
							return function(e10) {
								if(Reflect.field(obj[0],c[0].name) != null) {
									Reflect.deleteField(obj[0],c[0].name);
									_g4.refresh();
									_g4.save();
								}
							};
						})(obj,c));
						v[0].dblclick((function(set,v,val,index,c) {
							return function(_3) {
								var rv = val[0];
								var file;
								if(rv == null) file = null; else file = rv.file;
								var size;
								if(rv == null) size = 16; else size = rv.size;
								var posX;
								if(rv == null) posX = 0; else posX = rv.x;
								var posY;
								if(rv == null) posY = 0; else posY = rv.y;
								var prevX = posX;
								var prevY = posY;
								if(file == null) {
									var i1 = index[0] - 1;
									while(i1 >= 0) {
										var o = sheet.lines[i1--];
										var v2 = Reflect.field(o,c[0].name);
										if(v2 != null) {
											file = v2.file;
											size = v2.size;
											break;
										}
									}
								}
								if(file == null) {
									_g4.chooseFile((function(set,v) {
										return function(path1) {
											set[0]({ file : path1, size : size, x : prevX, y : prevY});
											v[0].dblclick();
										};
									})(set,v));
									return;
								}
								var dialog = ((function($this) {
									var $r;
									var html1 = new js.JQuery(".tileSelect").parent().html();
									$r = new js.JQuery(html1);
									return $r;
								}(this))).prependTo(new js.JQuery("body"));
								dialog.find(".tileView").css({ backgroundImage : "url(\"" + _g4.getAbsPath(file) + "\")"}).mousemove((function() {
									return function(e11) {
										var off = $(this).offset();
										posX = (e11.pageX - off.left) / size | 0;
										posY = (e11.pageY - off.top) / size | 0;
										new js.JQuery(".tileCursor").not(".current").css({ marginLeft : size * posX - 1 + "px", marginTop : size * posY - 1 + "px"});
									};
								})()).click((function(set) {
									return function(_4) {
										set[0]({ file : file, size : size, x : posX, y : posY});
										dialog.remove();
										_g4.save();
									};
								})(set));
								dialog.find("[name=size]").val("" + size).change((function() {
									return function(_5) {
										size = Std.parseInt($(this).val());
										new js.JQuery(".tileCursor").css({ width : size + "px", height : size + "px"});
										new js.JQuery(".tileCursor.current").css({ marginLeft : size * posX - 2 + "px", marginTop : size * posY - 2 + "px"});
									};
								})()).change();
								dialog.find("[name=cancel]").click((function() {
									return function() {
										dialog.remove();
									};
								})());
								dialog.find("[name=file]").click((function(set,v) {
									return function() {
										_g4.chooseFile((function(set,v) {
											return function(file1) {
												dialog.remove();
												set[0]({ file : file1, size : size, x : posX, y : posY});
												_g4.save();
												v[0].dblclick();
											};
										})(set,v));
									};
								})(set,v));
								dialog.keydown((function() {
									return function(e12) {
										e12.stopPropagation();
									};
								})()).keypress((function() {
									return function(e13) {
										e13.stopPropagation();
									};
								})());
								dialog.show();
							};
						})(set,v,val,index,c));
						break;
					default:
						v[0].dblclick((function(v,index,c) {
							return function(e14) {
								_g4.editCell(c[0],v[0],sheet,index[0]);
							};
						})(v,index,c));
					}
				}
			}
		}
		if(sheet.props.levelProps != null) {
			var col1 = new js.JQuery("<td>");
			cols.append(col1);
			var _g32 = 0;
			var _g23 = sheet.lines.length;
			while(_g32 < _g23) {
				var index1 = [_g32++];
				var l2 = lines[index1[0]];
				var c2 = new js.JQuery("<input type='submit' value='Edit'>");
				new js.JQuery("<td>").append(c2).appendTo(l2);
				c2.click((function(index1) {
					return function() {
						var found = null;
						var _g51 = 0;
						var _g61 = _g4.levels;
						while(_g51 < _g61.length) {
							var l3 = _g61[_g51];
							++_g51;
							if(l3.sheet == sheet && l3.index == index1[0]) found = l3;
						}
						if(found == null) {
							found = new Level(_g4,sheet,index1[0]);
							_g4.levels.push(found);
							_g4.selectLevel(found);
							_g4.initContent();
						} else _g4.selectLevel(found);
					};
				})(index1));
			}
		}
		content.empty();
		content.append(cols);
		var snext = 0;
		var _g33 = 0;
		var _g24 = lines.length;
		while(_g33 < _g24) {
			var i2 = _g33++;
			if(sheet.separators[snext] == i2) {
				var sep = new js.JQuery("<tr>").addClass("separator").append("<td colspan=\"" + (colCount + 1) + "\">").appendTo(content);
				var content2 = [sep.find("td")];
				var title = [sheet.props.separatorTitles != null?sheet.props.separatorTitles[snext]:null];
				if(title[0] != null) content2[0].text(title[0]);
				var pos = [snext];
				sep.dblclick((function(pos,title,content2) {
					return function(e15) {
						content2[0].empty();
						new js.JQuery("<input>").appendTo(content2[0]).focus().val(title[0] == null?"":title[0]).blur((function(pos,title,content2) {
							return function(_6) {
								title[0] = $(this).val();
								$(this).remove();
								content2[0].text(title[0]);
								var titles = sheet.props.separatorTitles;
								if(titles == null) titles = [];
								while(titles.length < pos[0]) titles.push(null);
								if(title[0] == "") titles[pos[0]] = null; else titles[pos[0]] = title[0];
								while(titles[titles.length - 1] == null && titles.length > 0) titles.pop();
								if(titles.length == 0) titles = null;
								sheet.props.separatorTitles = titles;
								_g4.save();
							};
						})(pos,title,content2)).keypress((function() {
							return function(e16) {
								e16.stopPropagation();
							};
						})()).keydown((function(title,content2) {
							return function(e17) {
								if(e17.keyCode == 13) {
									$(this).blur();
									e17.preventDefault();
								} else if(e17.keyCode == 27) content2[0].text(title[0]);
								e17.stopPropagation();
							};
						})(title,content2));
					};
				})(pos,title,content2));
				snext++;
			}
			content.append(lines[i2]);
		}
		inTodo = true;
		var _g25 = 0;
		while(_g25 < todo.length) {
			var t1 = todo[_g25];
			++_g25;
			t1();
		}
		inTodo = false;
	}
	,openFile: function(file) {
		nodejs.webkit.Shell.openItem(file);
	}
	,setCursor: function(s,x,y,sel,update) {
		if(update == null) update = true;
		if(y == null) y = 0;
		if(x == null) x = 0;
		this.cursor.s = s;
		this.cursor.x = x;
		this.cursor.y = y;
		this.cursor.select = sel;
		var ch = this.cursor.onchange;
		if(ch != null) {
			this.cursor.onchange = null;
			ch();
		}
		if(update) this.updateCursor();
	}
	,selectSheet: function(s,manual) {
		if(manual == null) manual = true;
		this.viewSheet = s;
		this.cursor = this.sheetCursors.get(s.name);
		if(this.cursor == null) {
			this.cursor = { x : 0, y : 0, s : s};
			this.sheetCursors.set(s.name,this.cursor);
		}
		if(manual) {
			if(this.level != null) this.level.dispose();
			this.level = null;
		}
		this.prefs.curSheet = Lambda.indexOf(this.data.sheets,s);
		new js.JQuery("#sheets li").removeClass("active").filter("#sheet_" + this.prefs.curSheet).addClass("active");
		this.refresh();
	}
	,selectLevel: function(l) {
		if(this.level != null) this.level.dispose();
		this.level = l;
		this.level.init();
		new js.JQuery("#sheets li").removeClass("active").filter("#level_" + l.sheetPath.split(".").join("_") + "_" + l.index).addClass("active");
	}
	,closeLevel: function(l) {
		l.dispose();
		var i = Lambda.indexOf(this.levels,l);
		HxOverrides.remove(this.levels,l);
		if(this.level == l) this.level = null;
		this.initContent();
	}
	,newSheet: function() {
		new js.JQuery("#newsheet").show();
	}
	,deleteColumn: function(sheet,cname) {
		if(cname == null) {
			sheet = this.smap.get(this.colProps.sheet).s;
			cname = this.colProps.ref.name;
		}
		if(!Model.prototype.deleteColumn.call(this,sheet,cname)) return false;
		new js.JQuery("#newcol").hide();
		this.refresh();
		this.save();
		return true;
	}
	,editTypes: function() {
		var _g = this;
		if(this.typesStr == null) {
			var tl = [];
			var _g1 = 0;
			var _g11 = this.data.customTypes;
			while(_g1 < _g11.length) {
				var t = _g11[_g1];
				++_g1;
				tl.push("enum " + t.name + " {\n" + this.typeCasesToString(t,"\t") + "\n}");
			}
			this.typesStr = tl.join("\n\n");
		}
		var content = new js.JQuery("#content");
		content.html(new js.JQuery("#editTypes").html());
		var text = content.find("textarea");
		var apply = content.find("input.button").first();
		var cancel = content.find("input.button").eq(1);
		var types;
		text.change(function(_) {
			var nstr = text.val();
			if(nstr == _g.typesStr) return;
			_g.typesStr = nstr;
			var errors = [];
			var t1 = StringTools.trim(_g.typesStr);
			var r = new EReg("^enum[ \r\n\t]+([A-Za-z0-9_]+)[ \r\n\t]*\\{([^}]*)\\}","");
			var oldTMap = _g.tmap;
			var descs = [];
			_g.tmap = new haxe.ds.StringMap();
			types = [];
			while(r.match(t1)) {
				var name = r.matched(1);
				var desc = r.matched(2);
				if(_g.tmap.get(name) != null) errors.push("Duplicate type " + name);
				var td = { name : name, cases : []};
				_g.tmap.set(name,td);
				descs.push(desc);
				types.push(td);
				t1 = StringTools.trim(r.matchedRight());
			}
			var _g12 = 0;
			while(_g12 < types.length) {
				var t2 = types[_g12];
				++_g12;
				try {
					t2.cases = _g.parseTypeCases(descs.shift());
				} catch( msg ) {
					errors.push(msg);
				}
			}
			_g.tmap = oldTMap;
			if(t1 != "") errors.push("Invalid " + StringTools.htmlEscape(t1));
			_g.setErrorMessage(errors.length == 0?null:errors.join("<br>"));
			if(errors.length == 0) apply.removeAttr("disabled"); else apply.attr("disabled","");
		});
		text.keydown(function(e) {
			if(e.keyCode == 9) {
				e.preventDefault();
				new js.Selection(text[0]).insert("\t","","");
			}
			e.stopPropagation();
		});
		text.keyup(function(e1) {
			text.change();
			e1.stopPropagation();
		});
		text.val(this.typesStr);
		cancel.click(function(_1) {
			_g.typesStr = null;
			_g.setErrorMessage();
			_g.quickLoad(_g.curSavedData);
			_g.initContent();
		});
		apply.click(function(_2) {
			var tpairs = _g.makePairs(_g.data.customTypes,types);
			var _g13 = 0;
			while(_g13 < tpairs.length) {
				var p = tpairs[_g13];
				++_g13;
				if(p.b == null) {
					var t3 = p.a;
					var _g2 = 0;
					var _g3 = _g.data.sheets;
					while(_g2 < _g3.length) {
						var s = _g3[_g2];
						++_g2;
						var _g4 = 0;
						var _g5 = s.columns;
						while(_g4 < _g5.length) {
							var c = _g5[_g4];
							++_g4;
							{
								var _g6 = c.type;
								switch(_g6[1]) {
								case 9:
									var name1 = _g6[2];
									if(name1 == t3.name) {
										_g.error("Type " + name1 + " used by " + s.name + "@" + c.name + " cannot be removed");
										return;
									} else {
									}
									break;
								default:
								}
							}
						}
					}
				}
			}
			var _g14 = 0;
			while(_g14 < types.length) {
				var t4 = [types[_g14]];
				++_g14;
				if(!Lambda.exists(tpairs,(function(t4) {
					return function(p1) {
						return p1.b == t4[0];
					};
				})(t4))) _g.data.customTypes.push(t4[0]);
			}
			var _g15 = 0;
			while(_g15 < tpairs.length) {
				var p2 = tpairs[_g15];
				++_g15;
				if(p2.b == null) HxOverrides.remove(_g.data.customTypes,p2.a); else try {
					_g.updateType(p2.a,p2.b);
				} catch( msg1 ) {
					if( js.Boot.__instanceof(msg1,String) ) {
						_g.error("Error while updating " + p2.b.name + " : " + msg1);
						return;
					} else throw(msg1);
				}
			}
			_g.initContent();
			_g.typesStr = null;
			_g.save();
		});
		this.typesStr = null;
		text.change();
	}
	,newColumn: function(sheetName,ref,index) {
		var form = new js.JQuery("#newcol form");
		this.colProps = { sheet : sheetName, ref : ref, index : index};
		var sheets = new js.JQuery("[name=sheet]");
		sheets.empty();
		var _g1 = 0;
		var _g = this.data.sheets.length;
		while(_g1 < _g) {
			var i = _g1++;
			var s = this.data.sheets[i];
			if(s.props.hide) continue;
			new js.JQuery("<option>").attr("value","" + i).text(s.name).appendTo(sheets);
		}
		var types = new js.JQuery("[name=ctype]");
		types.empty();
		types.unbind("change");
		types.change(function(_) {
			new js.JQuery("#col_options").toggleClass("t_edit",types.val() != "");
		});
		new js.JQuery("<option>").attr("value","").text("--- Select ---").appendTo(types);
		var _g2 = 0;
		var _g11 = this.data.customTypes;
		while(_g2 < _g11.length) {
			var t = _g11[_g2];
			++_g2;
			new js.JQuery("<option>").attr("value","" + t.name).text(t.name).appendTo(types);
		}
		form.removeClass("edit").removeClass("create");
		if(ref != null) {
			form.addClass("edit");
			form.find("[name=name]").val(ref.name);
			form.find("[name=type]").val(HxOverrides.substr(ref.type[0],1,null).toLowerCase()).change();
			form.find("[name=req]").prop("checked",!ref.opt);
			form.find("[name=display]").val(ref.display == null?"0":Std.string(ref.display));
			{
				var _g3 = ref.type;
				switch(_g3[1]) {
				case 5:
					var values = _g3[2];
					form.find("[name=values]").val(values.join(","));
					break;
				case 10:
					var values = _g3[2];
					form.find("[name=values]").val(values.join(","));
					break;
				case 6:
					var sname = _g3[2];
					form.find("[name=sheet]").val("" + Lambda.indexOf(this.data.sheets,Lambda.find(this.data.sheets,function(s1) {
						return s1.name == sname;
					})));
					break;
				case 12:
					var sname = _g3[2];
					form.find("[name=sheet]").val("" + Lambda.indexOf(this.data.sheets,Lambda.find(this.data.sheets,function(s1) {
						return s1.name == sname;
					})));
					break;
				case 9:
					var name = _g3[2];
					form.find("[name=ctype]").val(name);
					break;
				default:
				}
			}
		} else {
			form.addClass("create");
			form.find("input").not("[type=submit]").val("");
			form.find("[name=req]").prop("checked",true);
		}
		types.change();
		new js.JQuery("#newcol").show();
	}
	,newLine: function(sheet,index) {
		Model.prototype.newLine.call(this,sheet,index);
		this.refresh();
		this.save();
	}
	,insertLine: function() {
		if(this.cursor.s != null) this.newLine(this.cursor.s);
	}
	,createSheet: function(name) {
		name = StringTools.trim(name);
		if(!this.r_ident.match(name)) {
			this.error("Invalid sheet name");
			return;
		}
		var _g = 0;
		var _g1 = this.data.sheets;
		while(_g < _g1.length) {
			var s = _g1[_g];
			++_g;
			if(s.name == name) {
				this.error("Sheet name already in use");
				return;
			}
		}
		new js.JQuery("#newsheet").hide();
		var s1 = { name : name, columns : [], lines : [], separators : [], props : { }};
		this.prefs.curSheet = this.data.sheets.length;
		this.data.sheets.push(s1);
		this.initContent();
		this.save();
	}
	,createColumn: function() {
		var v = { };
		var cols = new js.JQuery("#col_form input, #col_form select").not("[type=submit]");
		var $it0 = (cols.iterator)();
		while( $it0.hasNext() ) {
			var i = $it0.next();
			Reflect.setField(v,i.attr("name"),i.attr("type") == "checkbox"?i["is"](":checked")?"on":null:i.val());
		}
		var sheet;
		if(this.colProps.sheet == null) sheet = this.viewSheet; else sheet = this.smap.get(this.colProps.sheet).s;
		var refColumn = this.colProps.ref;
		var t;
		var _g = v.type;
		switch(_g) {
		case "id":
			t = cdb.ColumnType.TId;
			break;
		case "int":
			t = cdb.ColumnType.TInt;
			break;
		case "float":
			t = cdb.ColumnType.TFloat;
			break;
		case "string":
			t = cdb.ColumnType.TString;
			break;
		case "bool":
			t = cdb.ColumnType.TBool;
			break;
		case "enum":
			var vals = StringTools.trim(v.values).split(",");
			if(vals.length == 0) {
				this.error("Missing value list");
				return;
			}
			t = cdb.ColumnType.TEnum((function($this) {
				var $r;
				var _g1 = [];
				{
					var _g2 = 0;
					while(_g2 < vals.length) {
						var f = vals[_g2];
						++_g2;
						_g1.push(StringTools.trim(f));
					}
				}
				$r = _g1;
				return $r;
			}(this)));
			break;
		case "flags":
			var vals1 = StringTools.trim(v.values).split(",");
			if(vals1.length == 0) {
				this.error("Missing value list");
				return;
			}
			t = cdb.ColumnType.TFlags((function($this) {
				var $r;
				var _g11 = [];
				{
					var _g21 = 0;
					while(_g21 < vals1.length) {
						var f1 = vals1[_g21];
						++_g21;
						_g11.push(StringTools.trim(f1));
					}
				}
				$r = _g11;
				return $r;
			}(this)));
			break;
		case "ref":
			var s = this.data.sheets[Std.parseInt(v.sheet)];
			if(s == null) {
				this.error("Sheet not found");
				return;
			}
			t = cdb.ColumnType.TRef(s.name);
			break;
		case "image":
			t = cdb.ColumnType.TImage;
			break;
		case "list":
			t = cdb.ColumnType.TList;
			break;
		case "custom":
			var t1 = this.tmap.get(v.ctype);
			if(t1 == null) {
				this.error("Type not found");
				return;
			}
			t = cdb.ColumnType.TCustom(t1.name);
			break;
		case "color":
			t = cdb.ColumnType.TColor;
			break;
		case "layer":
			var s1 = this.data.sheets[Std.parseInt(v.sheet)];
			if(s1 == null) {
				this.error("Sheet not found");
				return;
			}
			t = cdb.ColumnType.TLayer(s1.name);
			break;
		case "file":
			t = cdb.ColumnType.TFile;
			break;
		case "tilepos":
			t = cdb.ColumnType.TTilePos;
			break;
		case "tilelayer":
			t = cdb.ColumnType.TTileLayer;
			break;
		default:
			return;
		}
		var c = { type : t, typeStr : null, name : v.name};
		if(v.req != "on") c.opt = true;
		if(v.display != "0") c.display = Std.parseInt(v.display);
		if(refColumn != null) {
			var err = Model.prototype.updateColumn.call(this,sheet,refColumn,c);
			if(err != null) {
				this.refresh();
				this.save();
				this.error(err);
				return;
			}
		} else {
			var err1 = Model.prototype.addColumn.call(this,sheet,c,this.colProps.index);
			if(err1 != null) {
				this.error(err1);
				return;
			}
		}
		new js.JQuery("#newcol").hide();
		var $it1 = (cols.iterator)();
		while( $it1.hasNext() ) {
			var c1 = $it1.next();
			c1.val("");
		}
		this.refresh();
		this.save();
	}
	,initContent: function() {
		var _g2 = this;
		Model.prototype.initContent.call(this);
		var sheets = new js.JQuery("ul#sheets");
		sheets.children().remove();
		var _g1 = 0;
		var _g = this.data.sheets.length;
		while(_g1 < _g) {
			var i = _g1++;
			var s = [this.data.sheets[i]];
			if(s[0].props.hide) continue;
			var li = [new js.JQuery("<li>")];
			li[0].text(s[0].name).attr("id","sheet_" + i).appendTo(sheets).click(((function() {
				return function(f,s1) {
					return (function() {
						return function() {
							f(s1);
						};
					})();
				};
			})())($bind(this,this.selectSheet),s[0])).dblclick((function(li,s) {
				return function(_) {
					li[0].empty();
					new js.JQuery("<input>").val(s[0].name).appendTo(li[0]).focus().blur((function(li,s) {
						return function(_1) {
							li[0].text(s[0].name);
							var name = $(this).val();
							if(!_g2.r_ident.match(name)) {
								_g2.error("Invalid sheet name");
								return;
							}
							var f1 = _g2.smap.get(name);
							if(f1 != null) {
								if(f1.s != s[0]) _g2.error("Sheet name already in use");
								return;
							}
							var old = s[0].name;
							s[0].name = name;
							_g2.mapType((function() {
								return function(t) {
									switch(t[1]) {
									case 6:
										var o = t[2];
										if(o == old) return cdb.ColumnType.TRef(name); else return t;
										break;
									case 12:
										var o1 = t[2];
										if(o1 == old) return cdb.ColumnType.TLayer(name); else return t;
										break;
									default:
										return t;
									}
								};
							})());
							var _g3 = 0;
							var _g4 = _g2.data.sheets;
							while(_g3 < _g4.length) {
								var s2 = _g4[_g3];
								++_g3;
								if(StringTools.startsWith(s2.name,old + "@")) s2.name = name + "@" + HxOverrides.substr(s2.name,old.length + 1,null);
							}
							_g2.initContent();
							_g2.save();
						};
					})(li,s)).keydown((function() {
						return function(e) {
							if(e.keyCode == 13) $(this).blur(); else if(e.keyCode == 27) _g2.initContent();
							e.stopPropagation();
						};
					})()).keypress((function() {
						return function(e1) {
							e1.stopPropagation();
						};
					})());
				};
			})(li,s)).mousedown((function(li,s) {
				return function(e2) {
					if(e2.which == 3) {
						haxe.Timer.delay(((function() {
							return function(f2,s3,li1) {
								return (function() {
									return function() {
										f2(s3,li1);
									};
								})();
							};
						})())($bind(_g2,_g2.popupSheet),s[0],li[0]),1);
						e2.stopPropagation();
					}
				};
			})(li,s));
		}
		if(this.data.sheets.length == 0) {
			new js.JQuery("#content").html("<a href='javascript:_.newSheet()'>Create a sheet</a>");
			return;
		}
		var s4 = this.data.sheets[this.prefs.curSheet];
		if(s4 == null) s4 = this.data.sheets[0];
		this.selectSheet(s4,false);
		var old1 = this.levels;
		var lcur = null;
		this.levels = [];
		var _g5 = 0;
		while(_g5 < old1.length) {
			var level = old1[_g5];
			++_g5;
			if(!this.smap.exists(level.sheetPath)) continue;
			var s5 = this.smap.get(level.sheetPath).s;
			if(s5.lines.length < level.index) continue;
			var l = new Level(this,s5,level.index);
			if(level == this.level) lcur = l;
			this.levels.push(l);
			var li2 = new js.JQuery("<li>");
			li2.text(level.getName()).attr("id","level_" + l.sheetPath.split(".").join("_") + "_" + l.index).appendTo(sheets).click((function(f3,l1) {
				return function() {
					f3(l1);
				};
			})($bind(this,this.selectLevel),l));
		}
		if(lcur != null) this.selectLevel(lcur);
	}
	,initMenu: function() {
		var _g = this;
		var menu = new nodejs.webkit.Menu({ type : "menubar"});
		var mfile = new nodejs.webkit.MenuItem({ label : "File"});
		var mfiles = new nodejs.webkit.Menu();
		var mnew = new nodejs.webkit.MenuItem({ label : "New"});
		var mopen = new nodejs.webkit.MenuItem({ label : "Open..."});
		var msave = new nodejs.webkit.MenuItem({ label : "Save As..."});
		var mclean = new nodejs.webkit.MenuItem({ label : "Clean Images"});
		var mabout = new nodejs.webkit.MenuItem({ label : "About"});
		var mexit = new nodejs.webkit.MenuItem({ label : "Exit"});
		var mdebug = new nodejs.webkit.MenuItem({ label : "Dev"});
		mnew.click = function() {
			_g.prefs.curFile = null;
			_g.load(true);
		};
		mdebug.click = function() {
			_g.window.showDevTools();
		};
		mopen.click = function() {
			var i = new js.JQuery("<input>").attr("type","file").css("display","none").change(function(e) {
				var j = $(this);
				_g.prefs.curFile = j.val();
				_g.load();
				j.remove();
			});
			i.appendTo(new js.JQuery("body"));
			i.click();
		};
		msave.click = function() {
			var i1 = new js.JQuery("<input>").attr("type","file").attr("nwsaveas","new.cdb").css("display","none").change(function(e1) {
				var j1 = $(this);
				_g.prefs.curFile = j1.val();
				_g.save();
				j1.remove();
			});
			i1.appendTo(new js.JQuery("body"));
			i1.click();
		};
		mclean.click = function() {
			if(_g.imageBank == null) {
				_g.error("No image bank");
				return;
			}
			var count = Reflect.fields(_g.imageBank).length;
			_g.cleanImages();
			var count2 = Reflect.fields(_g.imageBank).length;
			_g.error(count - count2 + " unused images removed");
			if(count2 == 0) _g.imageBank = null;
			_g.refresh();
			_g.saveImages();
		};
		mexit.click = function() {
			Sys.exit(0);
		};
		mabout.click = function() {
			new js.JQuery("#about").show();
		};
		mfiles.append(mnew);
		mfiles.append(mopen);
		mfiles.append(msave);
		mfiles.append(mclean);
		mfiles.append(mabout);
		mfiles.append(mexit);
		mfile.submenu = mfiles;
		menu.append(mfile);
		menu.append(mdebug);
		this.window.menu = menu;
		this.window.moveTo(this.prefs.windowPos.x,this.prefs.windowPos.y);
		this.window.resizeTo(this.prefs.windowPos.w,this.prefs.windowPos.h);
		this.window.show();
		if(this.prefs.windowPos.max) this.window.maximize();
		this.window.on("close",function() {
			if(!_g.prefs.windowPos.max) _g.prefs.windowPos = { x : _g.window.x, y : _g.window.y, w : _g.window.width, h : _g.window.height, max : false};
			_g.savePrefs();
			_g.window.close(true);
		});
		this.window.on("maximize",function() {
			_g.prefs.windowPos.max = true;
		});
		this.window.on("unmaximize",function() {
			_g.prefs.windowPos.max = false;
		});
	}
	,getFileTime: function() {
		try {
			return js.Node.require("fs").statSync(this.prefs.curFile).mtime.getTime() * 1.;
		} catch( e ) {
			return 0.;
		}
	}
	,checkTime: function() {
		if(this.prefs.curFile == null) return;
		var fileTime = this.getFileTime();
		if(fileTime != this.lastSave && fileTime != 0) {
			if(window.confirm("The CDB file has been modified. Reload?")) {
				if(sys.io.File.getContent(this.prefs.curFile).indexOf("<<<<<<<") >= 0) {
					this.error("The file has conflicts, please resolve them before reloading");
					return;
				}
				this.load();
			} else this.lastSave = fileTime;
		}
	}
	,load: function(noError) {
		if(noError == null) noError = false;
		Model.prototype.load.call(this,noError);
		this.lastSave = this.getFileTime();
	}
	,save: function(history) {
		if(history == null) history = true;
		Model.prototype.save.call(this,history);
		this.lastSave = this.getFileTime();
	}
	,__class__: Main
});
var IMap = function() { };
$hxClasses["IMap"] = IMap;
IMap.__name__ = ["IMap"];
IMap.prototype = {
	__class__: IMap
};
Math.__name__ = ["Math"];
var Reflect = function() { };
$hxClasses["Reflect"] = Reflect;
Reflect.__name__ = ["Reflect"];
Reflect.field = function(o,field) {
	try {
		return o[field];
	} catch( e ) {
		return null;
	}
};
Reflect.setField = function(o,field,value) {
	o[field] = value;
};
Reflect.fields = function(o) {
	var a = [];
	if(o != null) {
		var hasOwnProperty = Object.prototype.hasOwnProperty;
		for( var f in o ) {
		if(f != "__id__" && f != "hx__closures__" && hasOwnProperty.call(o,f)) a.push(f);
		}
	}
	return a;
};
Reflect.isFunction = function(f) {
	return typeof(f) == "function" && !(f.__name__ || f.__ename__);
};
Reflect.compare = function(a,b) {
	if(a == b) return 0; else if(a > b) return 1; else return -1;
};
Reflect.deleteField = function(o,field) {
	if(!Object.prototype.hasOwnProperty.call(o,field)) return false;
	delete(o[field]);
	return true;
};
Reflect.copy = function(o) {
	var o2 = { };
	var _g = 0;
	var _g1 = Reflect.fields(o);
	while(_g < _g1.length) {
		var f = _g1[_g];
		++_g;
		Reflect.setField(o2,f,Reflect.field(o,f));
	}
	return o2;
};
var Std = function() { };
$hxClasses["Std"] = Std;
Std.__name__ = ["Std"];
Std.instance = function(value,c) {
	if((value instanceof c)) return value; else return null;
};
Std.string = function(s) {
	return js.Boot.__string_rec(s,"");
};
Std["int"] = function(x) {
	return x | 0;
};
Std.parseInt = function(x) {
	var v = parseInt(x,10);
	if(v == 0 && (HxOverrides.cca(x,1) == 120 || HxOverrides.cca(x,1) == 88)) v = parseInt(x);
	if(isNaN(v)) return null;
	return v;
};
Std.parseFloat = function(x) {
	return parseFloat(x);
};
Std.random = function(x) {
	if(x <= 0) return 0; else return Math.floor(Math.random() * x);
};
var StringBuf = function() {
	this.b = "";
};
$hxClasses["StringBuf"] = StringBuf;
StringBuf.__name__ = ["StringBuf"];
StringBuf.prototype = {
	add: function(x) {
		this.b += Std.string(x);
	}
	,__class__: StringBuf
};
var StringTools = function() { };
$hxClasses["StringTools"] = StringTools;
StringTools.__name__ = ["StringTools"];
StringTools.htmlEscape = function(s,quotes) {
	s = s.split("&").join("&amp;").split("<").join("&lt;").split(">").join("&gt;");
	if(quotes) return s.split("\"").join("&quot;").split("'").join("&#039;"); else return s;
};
StringTools.startsWith = function(s,start) {
	return s.length >= start.length && HxOverrides.substr(s,0,start.length) == start;
};
StringTools.endsWith = function(s,end) {
	var elen = end.length;
	var slen = s.length;
	return slen >= elen && HxOverrides.substr(s,slen - elen,elen) == end;
};
StringTools.isSpace = function(s,pos) {
	var c = HxOverrides.cca(s,pos);
	return c > 8 && c < 14 || c == 32;
};
StringTools.ltrim = function(s) {
	var l = s.length;
	var r = 0;
	while(r < l && StringTools.isSpace(s,r)) r++;
	if(r > 0) return HxOverrides.substr(s,r,l - r); else return s;
};
StringTools.rtrim = function(s) {
	var l = s.length;
	var r = 0;
	while(r < l && StringTools.isSpace(s,l - r - 1)) r++;
	if(r > 0) return HxOverrides.substr(s,0,l - r); else return s;
};
StringTools.trim = function(s) {
	return StringTools.ltrim(StringTools.rtrim(s));
};
StringTools.hex = function(n,digits) {
	var s = "";
	var hexChars = "0123456789ABCDEF";
	do {
		s = hexChars.charAt(n & 15) + s;
		n >>>= 4;
	} while(n > 0);
	if(digits != null) while(s.length < digits) s = "0" + s;
	return s;
};
StringTools.fastCodeAt = function(s,index) {
	return s.charCodeAt(index);
};
var Sys = function() { };
$hxClasses["Sys"] = Sys;
Sys.__name__ = ["Sys"];
Sys.args = function() {
	return js.Node.process.argv;
};
Sys.getEnv = function(key) {
	return Reflect.field(js.Node.process.env,key);
};
Sys.environment = function() {
	return js.Node.process.env;
};
Sys.exit = function(code) {
	js.Node.process.exit(code);
};
Sys.time = function() {
	return new Date().getTime() / 1000;
};
var ValueType = $hxClasses["ValueType"] = { __ename__ : ["ValueType"], __constructs__ : ["TNull","TInt","TFloat","TBool","TObject","TFunction","TClass","TEnum","TUnknown"] };
ValueType.TNull = ["TNull",0];
ValueType.TNull.__enum__ = ValueType;
ValueType.TInt = ["TInt",1];
ValueType.TInt.__enum__ = ValueType;
ValueType.TFloat = ["TFloat",2];
ValueType.TFloat.__enum__ = ValueType;
ValueType.TBool = ["TBool",3];
ValueType.TBool.__enum__ = ValueType;
ValueType.TObject = ["TObject",4];
ValueType.TObject.__enum__ = ValueType;
ValueType.TFunction = ["TFunction",5];
ValueType.TFunction.__enum__ = ValueType;
ValueType.TClass = function(c) { var $x = ["TClass",6,c]; $x.__enum__ = ValueType; return $x; };
ValueType.TEnum = function(e) { var $x = ["TEnum",7,e]; $x.__enum__ = ValueType; return $x; };
ValueType.TUnknown = ["TUnknown",8];
ValueType.TUnknown.__enum__ = ValueType;
var Type = function() { };
$hxClasses["Type"] = Type;
Type.__name__ = ["Type"];
Type.getClassName = function(c) {
	var a = c.__name__;
	return a.join(".");
};
Type.getEnumName = function(e) {
	var a = e.__ename__;
	return a.join(".");
};
Type.resolveClass = function(name) {
	var cl = $hxClasses[name];
	if(cl == null || !cl.__name__) return null;
	return cl;
};
Type.resolveEnum = function(name) {
	var e = $hxClasses[name];
	if(e == null || !e.__ename__) return null;
	return e;
};
Type.createEmptyInstance = function(cl) {
	function empty() {}; empty.prototype = cl.prototype;
	return new empty();
};
Type.createEnum = function(e,constr,params) {
	var f = Reflect.field(e,constr);
	if(f == null) throw "No such constructor " + constr;
	if(Reflect.isFunction(f)) {
		if(params == null) throw "Constructor " + constr + " need parameters";
		return f.apply(e,params);
	}
	if(params != null && params.length != 0) throw "Constructor " + constr + " does not need parameters";
	return f;
};
Type.getEnumConstructs = function(e) {
	var a = e.__constructs__;
	return a.slice();
};
Type["typeof"] = function(v) {
	var _g = typeof(v);
	switch(_g) {
	case "boolean":
		return ValueType.TBool;
	case "string":
		return ValueType.TClass(String);
	case "number":
		if(Math.ceil(v) == v % 2147483648.0) return ValueType.TInt;
		return ValueType.TFloat;
	case "object":
		if(v == null) return ValueType.TNull;
		var e = v.__enum__;
		if(e != null) return ValueType.TEnum(e);
		var c;
		if((v instanceof Array) && v.__enum__ == null) c = Array; else c = v.__class__;
		if(c != null) return ValueType.TClass(c);
		return ValueType.TObject;
	case "function":
		if(v.__name__ || v.__ename__) return ValueType.TObject;
		return ValueType.TFunction;
	case "undefined":
		return ValueType.TNull;
	default:
		return ValueType.TUnknown;
	}
};
Type.enumEq = function(a,b) {
	if(a == b) return true;
	try {
		if(a[0] != b[0]) return false;
		var _g1 = 2;
		var _g = a.length;
		while(_g1 < _g) {
			var i = _g1++;
			if(!Type.enumEq(a[i],b[i])) return false;
		}
		var e = a.__enum__;
		if(e != b.__enum__ || e == null) return false;
	} catch( e1 ) {
		return false;
	}
	return true;
};
var cdb = {};
cdb.ColumnType = $hxClasses["cdb.ColumnType"] = { __ename__ : ["cdb","ColumnType"], __constructs__ : ["TId","TString","TBool","TInt","TFloat","TEnum","TRef","TImage","TList","TCustom","TFlags","TColor","TLayer","TFile","TTilePos","TTileLayer"] };
cdb.ColumnType.TId = ["TId",0];
cdb.ColumnType.TId.__enum__ = cdb.ColumnType;
cdb.ColumnType.TString = ["TString",1];
cdb.ColumnType.TString.__enum__ = cdb.ColumnType;
cdb.ColumnType.TBool = ["TBool",2];
cdb.ColumnType.TBool.__enum__ = cdb.ColumnType;
cdb.ColumnType.TInt = ["TInt",3];
cdb.ColumnType.TInt.__enum__ = cdb.ColumnType;
cdb.ColumnType.TFloat = ["TFloat",4];
cdb.ColumnType.TFloat.__enum__ = cdb.ColumnType;
cdb.ColumnType.TEnum = function(values) { var $x = ["TEnum",5,values]; $x.__enum__ = cdb.ColumnType; return $x; };
cdb.ColumnType.TRef = function(sheet) { var $x = ["TRef",6,sheet]; $x.__enum__ = cdb.ColumnType; return $x; };
cdb.ColumnType.TImage = ["TImage",7];
cdb.ColumnType.TImage.__enum__ = cdb.ColumnType;
cdb.ColumnType.TList = ["TList",8];
cdb.ColumnType.TList.__enum__ = cdb.ColumnType;
cdb.ColumnType.TCustom = function(name) { var $x = ["TCustom",9,name]; $x.__enum__ = cdb.ColumnType; return $x; };
cdb.ColumnType.TFlags = function(values) { var $x = ["TFlags",10,values]; $x.__enum__ = cdb.ColumnType; return $x; };
cdb.ColumnType.TColor = ["TColor",11];
cdb.ColumnType.TColor.__enum__ = cdb.ColumnType;
cdb.ColumnType.TLayer = function(type) { var $x = ["TLayer",12,type]; $x.__enum__ = cdb.ColumnType; return $x; };
cdb.ColumnType.TFile = ["TFile",13];
cdb.ColumnType.TFile.__enum__ = cdb.ColumnType;
cdb.ColumnType.TTilePos = ["TTilePos",14];
cdb.ColumnType.TTilePos.__enum__ = cdb.ColumnType;
cdb.ColumnType.TTileLayer = ["TTileLayer",15];
cdb.ColumnType.TTileLayer.__enum__ = cdb.ColumnType;
cdb.Parser = function() { };
$hxClasses["cdb.Parser"] = cdb.Parser;
cdb.Parser.__name__ = ["cdb","Parser"];
cdb.Parser.saveType = function(t) {
	switch(t[1]) {
	case 6:case 9:case 12:
		return t[1] + ":" + t.slice(2)[0];
	case 5:
		var values = t[2];
		return t[1] + ":" + values.join(",");
	case 10:
		var values = t[2];
		return t[1] + ":" + values.join(",");
	case 0:case 1:case 8:case 3:case 7:case 4:case 2:case 11:case 13:case 14:case 15:
		return Std.string(t[1]);
	}
};
cdb.Parser.getType = function(str) {
	var _g = Std.parseInt(str);
	if(_g != null) switch(_g) {
	case 0:
		return cdb.ColumnType.TId;
	case 1:
		return cdb.ColumnType.TString;
	case 2:
		return cdb.ColumnType.TBool;
	case 3:
		return cdb.ColumnType.TInt;
	case 4:
		return cdb.ColumnType.TFloat;
	case 5:
		return cdb.ColumnType.TEnum(((function($this) {
			var $r;
			var pos = str.indexOf(":") + 1;
			$r = HxOverrides.substr(str,pos,null);
			return $r;
		}(this))).split(","));
	case 6:
		return cdb.ColumnType.TRef((function($this) {
			var $r;
			var pos1 = str.indexOf(":") + 1;
			$r = HxOverrides.substr(str,pos1,null);
			return $r;
		}(this)));
	case 7:
		return cdb.ColumnType.TImage;
	case 8:
		return cdb.ColumnType.TList;
	case 9:
		return cdb.ColumnType.TCustom((function($this) {
			var $r;
			var pos2 = str.indexOf(":") + 1;
			$r = HxOverrides.substr(str,pos2,null);
			return $r;
		}(this)));
	case 10:
		return cdb.ColumnType.TFlags(((function($this) {
			var $r;
			var pos3 = str.indexOf(":") + 1;
			$r = HxOverrides.substr(str,pos3,null);
			return $r;
		}(this))).split(","));
	case 11:
		return cdb.ColumnType.TColor;
	case 12:
		return cdb.ColumnType.TLayer((function($this) {
			var $r;
			var pos4 = str.indexOf(":") + 1;
			$r = HxOverrides.substr(str,pos4,null);
			return $r;
		}(this)));
	case 13:
		return cdb.ColumnType.TFile;
	case 14:
		return cdb.ColumnType.TTilePos;
	case 15:
		return cdb.ColumnType.TTileLayer;
	default:
		throw "Unknown type " + str;
	} else throw "Unknown type " + str;
};
cdb.Parser.parse = function(content) {
	if(content == null) throw "CDB content is null";
	var data = js.Node.parse(content);
	var _g = 0;
	var _g1 = data.sheets;
	while(_g < _g1.length) {
		var s = _g1[_g];
		++_g;
		var _g2 = 0;
		var _g3 = s.columns;
		while(_g2 < _g3.length) {
			var c = _g3[_g2];
			++_g2;
			c.type = cdb.Parser.getType(c.typeStr);
			c.typeStr = null;
		}
	}
	var _g4 = 0;
	var _g11 = data.customTypes;
	while(_g4 < _g11.length) {
		var t = _g11[_g4];
		++_g4;
		var _g21 = 0;
		var _g31 = t.cases;
		while(_g21 < _g31.length) {
			var c1 = _g31[_g21];
			++_g21;
			var _g41 = 0;
			var _g5 = c1.args;
			while(_g41 < _g5.length) {
				var a = _g5[_g41];
				++_g41;
				a.type = cdb.Parser.getType(a.typeStr);
				a.typeStr = null;
			}
		}
	}
	return data;
};
cdb._Types = {};
cdb._Types.ArrayIterator = function(a) {
	this.a = a;
	this.pos = 0;
};
$hxClasses["cdb._Types.ArrayIterator"] = cdb._Types.ArrayIterator;
cdb._Types.ArrayIterator.__name__ = ["cdb","_Types","ArrayIterator"];
cdb._Types.ArrayIterator.prototype = {
	hasNext: function() {
		return this.pos < this.a.length;
	}
	,next: function() {
		return this.a[this.pos++];
	}
	,__class__: cdb._Types.ArrayIterator
};
cdb._Types.FlagsIterator = function(flags) {
	this.flags = flags;
	this.k = 0;
};
$hxClasses["cdb._Types.FlagsIterator"] = cdb._Types.FlagsIterator;
cdb._Types.FlagsIterator.__name__ = ["cdb","_Types","FlagsIterator"];
cdb._Types.FlagsIterator.prototype = {
	hasNext: function() {
		return this.flags >= 1 << this.k;
	}
	,next: function() {
		while((this.flags & 1 << this.k) == 0) this.k++;
		return this.k++;
	}
	,__class__: cdb._Types.FlagsIterator
};
cdb._Types.ArrayRead_Impl_ = function() { };
$hxClasses["cdb._Types.ArrayRead_Impl_"] = cdb._Types.ArrayRead_Impl_;
cdb._Types.ArrayRead_Impl_.__name__ = ["cdb","_Types","ArrayRead_Impl_"];
cdb._Types.ArrayRead_Impl_._new = function(a) {
	return a;
};
cdb._Types.ArrayRead_Impl_.get_length = function(this1) {
	return this1.length;
};
cdb._Types.ArrayRead_Impl_.iterator = function(this1) {
	return new cdb._Types.ArrayIterator(this1);
};
cdb._Types.ArrayRead_Impl_.castArray = function(this1) {
	return this1;
};
cdb._Types.ArrayRead_Impl_.toArrayCopy = function(this1) {
	return this1.slice();
};
cdb._Types.ArrayRead_Impl_.getIndex = function(this1,v) {
	return this1[v];
};
cdb._Types.Flags_Impl_ = function() { };
$hxClasses["cdb._Types.Flags_Impl_"] = cdb._Types.Flags_Impl_;
cdb._Types.Flags_Impl_.__name__ = ["cdb","_Types","Flags_Impl_"];
cdb._Types.Flags_Impl_._new = function(x) {
	return x;
};
cdb._Types.Flags_Impl_.has = function(this1,t) {
	return (this1 & 1 << t) != 0;
};
cdb._Types.Flags_Impl_.set = function(this1,t) {
	this1 |= 1 << t;
};
cdb._Types.Flags_Impl_.unset = function(this1,t) {
	this1 &= ~(1 << t);
};
cdb._Types.Flags_Impl_.iterator = function(this1) {
	return new cdb._Types.FlagsIterator(this1);
};
cdb._Types.Flags_Impl_.toInt = function(this1) {
	return this1;
};
cdb._Types.Layer_Impl_ = function() { };
$hxClasses["cdb._Types.Layer_Impl_"] = cdb._Types.Layer_Impl_;
cdb._Types.Layer_Impl_.__name__ = ["cdb","_Types","Layer_Impl_"];
cdb._Types.Layer_Impl_._new = function(x) {
	return x;
};
cdb._Types.Layer_Impl_.decode = function(this1,all) {
	var k = haxe.crypto.Base64.decode(this1);
	var _g = [];
	var _g2 = 0;
	var _g1 = k.length;
	while(_g2 < _g1) {
		var i = _g2++;
		_g.push(all[k.b[i]]);
	}
	return _g;
};
cdb._Types.TileLayerData_Impl_ = function() { };
$hxClasses["cdb._Types.TileLayerData_Impl_"] = cdb._Types.TileLayerData_Impl_;
cdb._Types.TileLayerData_Impl_.__name__ = ["cdb","_Types","TileLayerData_Impl_"];
cdb._Types.TileLayerData_Impl_._new = function(v) {
	return v;
};
cdb._Types.TileLayerData_Impl_.decode = function(this1) {
	var k = haxe.crypto.Base64.decode(this1);
	var _g = [];
	var _g2 = 0;
	var _g1 = k.length >> 1;
	while(_g2 < _g1) {
		var i = _g2++;
		_g.push(k.b[i << 1] | k.b[(i << 1) + 1] << 8);
	}
	return _g;
};
cdb._Types.TileLayerData_Impl_.encode = function(a) {
	var b = haxe.io.Bytes.alloc(a.length * 2);
	var _g1 = 0;
	var _g = a.length;
	while(_g1 < _g) {
		var i = _g1++;
		var v = a[i];
		b.b[i << 1] = v & 255;
		b.b[(i << 1) + 1] = v >> 8 & 255;
	}
	return cdb._Types.TileLayerData_Impl_._new(haxe.crypto.Base64.encode(b));
};
cdb.IndexNoId = function(data,sheet) {
	this.name = sheet;
	var _g = 0;
	var _g1 = data.sheets;
	while(_g < _g1.length) {
		var s = _g1[_g];
		++_g;
		if(s.name == sheet) {
			this.all = s.lines;
			return;
		}
	}
	throw "'" + sheet + "' not found in CDB data";
};
$hxClasses["cdb.IndexNoId"] = cdb.IndexNoId;
cdb.IndexNoId.__name__ = ["cdb","IndexNoId"];
cdb.IndexNoId.prototype = {
	__class__: cdb.IndexNoId
};
cdb.Index = function(data,sheet) {
	this.name = sheet;
	var _g = 0;
	var _g1 = data.sheets;
	while(_g < _g1.length) {
		var s = _g1[_g];
		++_g;
		if(s.name == sheet) {
			this.all = s.lines;
			this.byId = new haxe.ds.StringMap();
			this.byIndex = [];
			var _g2 = 0;
			var _g3 = s.columns;
			try {
				while(_g2 < _g3.length) {
					var c = _g3[_g2];
					++_g2;
					var _g4 = c.type;
					switch(_g4[1]) {
					case 0:
						var cname = c.name;
						var _g5 = 0;
						var _g6 = s.lines;
						while(_g5 < _g6.length) {
							var a = _g6[_g5];
							++_g5;
							var id = Reflect.field(a,cname);
							if(id != null && id != "") {
								var value = a;
								this.byId.set(id,value);
								this.byIndex.push(a);
							}
						}
						throw "__break__";
						break;
					default:
					}
				}
			} catch( e ) { if( e != "__break__" ) throw e; }
			return;
		}
	}
	throw "'" + sheet + "' not found in CDB data";
};
$hxClasses["cdb.Index"] = cdb.Index;
cdb.Index.__name__ = ["cdb","Index"];
cdb.Index.prototype = {
	get: function(k) {
		return this.byId.get(k);
	}
	,resolve: function(id,opt) {
		if(id == null) return null;
		var v = this.byId.get(id);
		if(v == null && !opt) throw "Missing " + this.name + "." + id; else return v;
	}
	,__class__: cdb.Index
};
var haxe = {};
haxe.Json = function() { };
$hxClasses["haxe.Json"] = haxe.Json;
haxe.Json.__name__ = ["haxe","Json"];
haxe.Json.stringify = function(obj,replacer,insertion) {
	return js.Node.stringify(obj,replacer,insertion);
};
haxe.Json.parse = function(jsonString) {
	return js.Node.parse(jsonString);
};
haxe.Serializer = function() {
	this.buf = new StringBuf();
	this.cache = new Array();
	this.useCache = haxe.Serializer.USE_CACHE;
	this.useEnumIndex = haxe.Serializer.USE_ENUM_INDEX;
	this.shash = new haxe.ds.StringMap();
	this.scount = 0;
};
$hxClasses["haxe.Serializer"] = haxe.Serializer;
haxe.Serializer.__name__ = ["haxe","Serializer"];
haxe.Serializer.run = function(v) {
	var s = new haxe.Serializer();
	s.serialize(v);
	return s.toString();
};
haxe.Serializer.prototype = {
	toString: function() {
		return this.buf.b;
	}
	,serializeString: function(s) {
		var x = this.shash.get(s);
		if(x != null) {
			this.buf.b += "R";
			if(x == null) this.buf.b += "null"; else this.buf.b += "" + x;
			return;
		}
		this.shash.set(s,this.scount++);
		this.buf.b += "y";
		s = encodeURIComponent(s);
		if(s.length == null) this.buf.b += "null"; else this.buf.b += "" + s.length;
		this.buf.b += ":";
		if(s == null) this.buf.b += "null"; else this.buf.b += "" + s;
	}
	,serializeRef: function(v) {
		var vt = typeof(v);
		var _g1 = 0;
		var _g = this.cache.length;
		while(_g1 < _g) {
			var i = _g1++;
			var ci = this.cache[i];
			if(typeof(ci) == vt && ci == v) {
				this.buf.b += "r";
				if(i == null) this.buf.b += "null"; else this.buf.b += "" + i;
				return true;
			}
		}
		this.cache.push(v);
		return false;
	}
	,serializeFields: function(v) {
		var _g = 0;
		var _g1 = Reflect.fields(v);
		while(_g < _g1.length) {
			var f = _g1[_g];
			++_g;
			this.serializeString(f);
			this.serialize(Reflect.field(v,f));
		}
		this.buf.b += "g";
	}
	,serialize: function(v) {
		{
			var _g = Type["typeof"](v);
			switch(_g[1]) {
			case 0:
				this.buf.b += "n";
				break;
			case 1:
				var v1 = v;
				if(v1 == 0) {
					this.buf.b += "z";
					return;
				}
				this.buf.b += "i";
				if(v1 == null) this.buf.b += "null"; else this.buf.b += "" + v1;
				break;
			case 2:
				var v2 = v;
				if(isNaN(v2)) this.buf.b += "k"; else if(!isFinite(v2)) if(v2 < 0) this.buf.b += "m"; else this.buf.b += "p"; else {
					this.buf.b += "d";
					if(v2 == null) this.buf.b += "null"; else this.buf.b += "" + v2;
				}
				break;
			case 3:
				if(v) this.buf.b += "t"; else this.buf.b += "f";
				break;
			case 6:
				var c = _g[2];
				if(c == String) {
					this.serializeString(v);
					return;
				}
				if(this.useCache && this.serializeRef(v)) return;
				switch(c) {
				case Array:
					var ucount = 0;
					this.buf.b += "a";
					var l = v.length;
					var _g1 = 0;
					while(_g1 < l) {
						var i = _g1++;
						if(v[i] == null) ucount++; else {
							if(ucount > 0) {
								if(ucount == 1) this.buf.b += "n"; else {
									this.buf.b += "u";
									if(ucount == null) this.buf.b += "null"; else this.buf.b += "" + ucount;
								}
								ucount = 0;
							}
							this.serialize(v[i]);
						}
					}
					if(ucount > 0) {
						if(ucount == 1) this.buf.b += "n"; else {
							this.buf.b += "u";
							if(ucount == null) this.buf.b += "null"; else this.buf.b += "" + ucount;
						}
					}
					this.buf.b += "h";
					break;
				case List:
					this.buf.b += "l";
					var v3 = v;
					var $it0 = v3.iterator();
					while( $it0.hasNext() ) {
						var i1 = $it0.next();
						this.serialize(i1);
					}
					this.buf.b += "h";
					break;
				case Date:
					var d = v;
					this.buf.b += "v";
					this.buf.add(HxOverrides.dateStr(d));
					break;
				case haxe.ds.StringMap:
					this.buf.b += "b";
					var v4 = v;
					var $it1 = v4.keys();
					while( $it1.hasNext() ) {
						var k = $it1.next();
						this.serializeString(k);
						this.serialize(v4.get(k));
					}
					this.buf.b += "h";
					break;
				case haxe.ds.IntMap:
					this.buf.b += "q";
					var v5 = v;
					var $it2 = v5.keys();
					while( $it2.hasNext() ) {
						var k1 = $it2.next();
						this.buf.b += ":";
						if(k1 == null) this.buf.b += "null"; else this.buf.b += "" + k1;
						this.serialize(v5.get(k1));
					}
					this.buf.b += "h";
					break;
				case haxe.ds.ObjectMap:
					this.buf.b += "M";
					var v6 = v;
					var $it3 = v6.keys();
					while( $it3.hasNext() ) {
						var k2 = $it3.next();
						var id = Reflect.field(k2,"__id__");
						Reflect.deleteField(k2,"__id__");
						this.serialize(k2);
						k2.__id__ = id;
						this.serialize(v6.h[k2.__id__]);
					}
					this.buf.b += "h";
					break;
				case haxe.io.Bytes:
					var v7 = v;
					var i2 = 0;
					var max = v7.length - 2;
					var charsBuf = new StringBuf();
					var b64 = haxe.Serializer.BASE64;
					while(i2 < max) {
						var b1 = v7.get(i2++);
						var b2 = v7.get(i2++);
						var b3 = v7.get(i2++);
						charsBuf.add(b64.charAt(b1 >> 2));
						charsBuf.add(b64.charAt((b1 << 4 | b2 >> 4) & 63));
						charsBuf.add(b64.charAt((b2 << 2 | b3 >> 6) & 63));
						charsBuf.add(b64.charAt(b3 & 63));
					}
					if(i2 == max) {
						var b11 = v7.get(i2++);
						var b21 = v7.get(i2++);
						charsBuf.add(b64.charAt(b11 >> 2));
						charsBuf.add(b64.charAt((b11 << 4 | b21 >> 4) & 63));
						charsBuf.add(b64.charAt(b21 << 2 & 63));
					} else if(i2 == max + 1) {
						var b12 = v7.get(i2++);
						charsBuf.add(b64.charAt(b12 >> 2));
						charsBuf.add(b64.charAt(b12 << 4 & 63));
					}
					var chars = charsBuf.b;
					this.buf.b += "s";
					if(chars.length == null) this.buf.b += "null"; else this.buf.b += "" + chars.length;
					this.buf.b += ":";
					if(chars == null) this.buf.b += "null"; else this.buf.b += "" + chars;
					break;
				default:
					if(this.useCache) this.cache.pop();
					if(v.hxSerialize != null) {
						this.buf.b += "C";
						this.serializeString(Type.getClassName(c));
						if(this.useCache) this.cache.push(v);
						v.hxSerialize(this);
						this.buf.b += "g";
					} else {
						this.buf.b += "c";
						this.serializeString(Type.getClassName(c));
						if(this.useCache) this.cache.push(v);
						this.serializeFields(v);
					}
				}
				break;
			case 4:
				if(this.useCache && this.serializeRef(v)) return;
				this.buf.b += "o";
				this.serializeFields(v);
				break;
			case 7:
				var e = _g[2];
				if(this.useCache) {
					if(this.serializeRef(v)) return;
					this.cache.pop();
				}
				if(this.useEnumIndex) this.buf.b += "j"; else this.buf.b += "w";
				this.serializeString(Type.getEnumName(e));
				if(this.useEnumIndex) {
					this.buf.b += ":";
					this.buf.b += Std.string(v[1]);
				} else this.serializeString(v[0]);
				this.buf.b += ":";
				var l1 = v.length;
				this.buf.b += Std.string(l1 - 2);
				var _g11 = 2;
				while(_g11 < l1) {
					var i3 = _g11++;
					this.serialize(v[i3]);
				}
				if(this.useCache) this.cache.push(v);
				break;
			case 5:
				throw "Cannot serialize function";
				break;
			default:
				throw "Cannot serialize " + Std.string(v);
			}
		}
	}
	,__class__: haxe.Serializer
};
haxe.Timer = function(time_ms) {
	var me = this;
	this.id = setInterval(function() {
		me.run();
	},time_ms);
};
$hxClasses["haxe.Timer"] = haxe.Timer;
haxe.Timer.__name__ = ["haxe","Timer"];
haxe.Timer.delay = function(f,time_ms) {
	var t = new haxe.Timer(time_ms);
	t.run = function() {
		t.stop();
		f();
	};
	return t;
};
haxe.Timer.prototype = {
	stop: function() {
		if(this.id == null) return;
		clearInterval(this.id);
		this.id = null;
	}
	,run: function() {
	}
	,__class__: haxe.Timer
};
haxe.Unserializer = function(buf) {
	this.buf = buf;
	this.length = buf.length;
	this.pos = 0;
	this.scache = new Array();
	this.cache = new Array();
	var r = haxe.Unserializer.DEFAULT_RESOLVER;
	if(r == null) {
		r = Type;
		haxe.Unserializer.DEFAULT_RESOLVER = r;
	}
	this.setResolver(r);
};
$hxClasses["haxe.Unserializer"] = haxe.Unserializer;
haxe.Unserializer.__name__ = ["haxe","Unserializer"];
haxe.Unserializer.initCodes = function() {
	var codes = new Array();
	var _g1 = 0;
	var _g = haxe.Unserializer.BASE64.length;
	while(_g1 < _g) {
		var i = _g1++;
		codes[haxe.Unserializer.BASE64.charCodeAt(i)] = i;
	}
	return codes;
};
haxe.Unserializer.run = function(v) {
	return new haxe.Unserializer(v).unserialize();
};
haxe.Unserializer.prototype = {
	setResolver: function(r) {
		if(r == null) this.resolver = { resolveClass : function(_) {
			return null;
		}, resolveEnum : function(_1) {
			return null;
		}}; else this.resolver = r;
	}
	,get: function(p) {
		return this.buf.charCodeAt(p);
	}
	,readDigits: function() {
		var k = 0;
		var s = false;
		var fpos = this.pos;
		while(true) {
			var c = this.buf.charCodeAt(this.pos);
			if(c != c) break;
			if(c == 45) {
				if(this.pos != fpos) break;
				s = true;
				this.pos++;
				continue;
			}
			if(c < 48 || c > 57) break;
			k = k * 10 + (c - 48);
			this.pos++;
		}
		if(s) k *= -1;
		return k;
	}
	,unserializeObject: function(o) {
		while(true) {
			if(this.pos >= this.length) throw "Invalid object";
			if(this.buf.charCodeAt(this.pos) == 103) break;
			var k = this.unserialize();
			if(!(typeof(k) == "string")) throw "Invalid object key";
			var v = this.unserialize();
			o[k] = v;
		}
		this.pos++;
	}
	,unserializeEnum: function(edecl,tag) {
		if(this.get(this.pos++) != 58) throw "Invalid enum format";
		var nargs = this.readDigits();
		if(nargs == 0) return Type.createEnum(edecl,tag);
		var args = new Array();
		while(nargs-- > 0) args.push(this.unserialize());
		return Type.createEnum(edecl,tag,args);
	}
	,unserialize: function() {
		var _g = this.get(this.pos++);
		switch(_g) {
		case 110:
			return null;
		case 116:
			return true;
		case 102:
			return false;
		case 122:
			return 0;
		case 105:
			return this.readDigits();
		case 100:
			var p1 = this.pos;
			while(true) {
				var c = this.buf.charCodeAt(this.pos);
				if(c >= 43 && c < 58 || c == 101 || c == 69) this.pos++; else break;
			}
			return Std.parseFloat(HxOverrides.substr(this.buf,p1,this.pos - p1));
		case 121:
			var len = this.readDigits();
			if(this.get(this.pos++) != 58 || this.length - this.pos < len) throw "Invalid string length";
			var s = HxOverrides.substr(this.buf,this.pos,len);
			this.pos += len;
			s = decodeURIComponent(s.split("+").join(" "));
			this.scache.push(s);
			return s;
		case 107:
			return NaN;
		case 109:
			return -Infinity;
		case 112:
			return Infinity;
		case 97:
			var buf = this.buf;
			var a = new Array();
			this.cache.push(a);
			while(true) {
				var c1 = this.buf.charCodeAt(this.pos);
				if(c1 == 104) {
					this.pos++;
					break;
				}
				if(c1 == 117) {
					this.pos++;
					var n = this.readDigits();
					a[a.length + n - 1] = null;
				} else a.push(this.unserialize());
			}
			return a;
		case 111:
			var o = { };
			this.cache.push(o);
			this.unserializeObject(o);
			return o;
		case 114:
			var n1 = this.readDigits();
			if(n1 < 0 || n1 >= this.cache.length) throw "Invalid reference";
			return this.cache[n1];
		case 82:
			var n2 = this.readDigits();
			if(n2 < 0 || n2 >= this.scache.length) throw "Invalid string reference";
			return this.scache[n2];
		case 120:
			throw this.unserialize();
			break;
		case 99:
			var name = this.unserialize();
			var cl = this.resolver.resolveClass(name);
			if(cl == null) throw "Class not found " + name;
			var o1 = Type.createEmptyInstance(cl);
			this.cache.push(o1);
			this.unserializeObject(o1);
			return o1;
		case 119:
			var name1 = this.unserialize();
			var edecl = this.resolver.resolveEnum(name1);
			if(edecl == null) throw "Enum not found " + name1;
			var e = this.unserializeEnum(edecl,this.unserialize());
			this.cache.push(e);
			return e;
		case 106:
			var name2 = this.unserialize();
			var edecl1 = this.resolver.resolveEnum(name2);
			if(edecl1 == null) throw "Enum not found " + name2;
			this.pos++;
			var index = this.readDigits();
			var tag = Type.getEnumConstructs(edecl1)[index];
			if(tag == null) throw "Unknown enum index " + name2 + "@" + index;
			var e1 = this.unserializeEnum(edecl1,tag);
			this.cache.push(e1);
			return e1;
		case 108:
			var l = new List();
			this.cache.push(l);
			var buf1 = this.buf;
			while(this.buf.charCodeAt(this.pos) != 104) l.add(this.unserialize());
			this.pos++;
			return l;
		case 98:
			var h = new haxe.ds.StringMap();
			this.cache.push(h);
			var buf2 = this.buf;
			while(this.buf.charCodeAt(this.pos) != 104) {
				var s1 = this.unserialize();
				h.set(s1,this.unserialize());
			}
			this.pos++;
			return h;
		case 113:
			var h1 = new haxe.ds.IntMap();
			this.cache.push(h1);
			var buf3 = this.buf;
			var c2 = this.get(this.pos++);
			while(c2 == 58) {
				var i = this.readDigits();
				h1.set(i,this.unserialize());
				c2 = this.get(this.pos++);
			}
			if(c2 != 104) throw "Invalid IntMap format";
			return h1;
		case 77:
			var h2 = new haxe.ds.ObjectMap();
			this.cache.push(h2);
			var buf4 = this.buf;
			while(this.buf.charCodeAt(this.pos) != 104) {
				var s2 = this.unserialize();
				h2.set(s2,this.unserialize());
			}
			this.pos++;
			return h2;
		case 118:
			var d;
			var s3 = HxOverrides.substr(this.buf,this.pos,19);
			d = HxOverrides.strDate(s3);
			this.cache.push(d);
			this.pos += 19;
			return d;
		case 115:
			var len1 = this.readDigits();
			var buf5 = this.buf;
			if(this.get(this.pos++) != 58 || this.length - this.pos < len1) throw "Invalid bytes length";
			var codes = haxe.Unserializer.CODES;
			if(codes == null) {
				codes = haxe.Unserializer.initCodes();
				haxe.Unserializer.CODES = codes;
			}
			var i1 = this.pos;
			var rest = len1 & 3;
			var size;
			size = (len1 >> 2) * 3 + (rest >= 2?rest - 1:0);
			var max = i1 + (len1 - rest);
			var bytes = haxe.io.Bytes.alloc(size);
			var bpos = 0;
			while(i1 < max) {
				var c11 = codes[StringTools.fastCodeAt(buf5,i1++)];
				var c21 = codes[StringTools.fastCodeAt(buf5,i1++)];
				bytes.set(bpos++,c11 << 2 | c21 >> 4);
				var c3 = codes[StringTools.fastCodeAt(buf5,i1++)];
				bytes.set(bpos++,c21 << 4 | c3 >> 2);
				var c4 = codes[StringTools.fastCodeAt(buf5,i1++)];
				bytes.set(bpos++,c3 << 6 | c4);
			}
			if(rest >= 2) {
				var c12 = codes[StringTools.fastCodeAt(buf5,i1++)];
				var c22 = codes[StringTools.fastCodeAt(buf5,i1++)];
				bytes.set(bpos++,c12 << 2 | c22 >> 4);
				if(rest == 3) {
					var c31 = codes[StringTools.fastCodeAt(buf5,i1++)];
					bytes.set(bpos++,c22 << 4 | c31 >> 2);
				}
			}
			this.pos += len1;
			this.cache.push(bytes);
			return bytes;
		case 67:
			var name3 = this.unserialize();
			var cl1 = this.resolver.resolveClass(name3);
			if(cl1 == null) throw "Class not found " + name3;
			var o2 = Type.createEmptyInstance(cl1);
			this.cache.push(o2);
			o2.hxUnserialize(this);
			if(this.get(this.pos++) != 103) throw "Invalid custom data";
			return o2;
		default:
		}
		this.pos--;
		throw "Invalid char " + this.buf.charAt(this.pos) + " at position " + this.pos;
	}
	,__class__: haxe.Unserializer
};
haxe.io = {};
haxe.io.Bytes = function(length,b) {
	this.length = length;
	this.b = b;
};
$hxClasses["haxe.io.Bytes"] = haxe.io.Bytes;
haxe.io.Bytes.__name__ = ["haxe","io","Bytes"];
haxe.io.Bytes.alloc = function(length) {
	var b = new Buffer(length);
	b.fill(0,0);
	return new haxe.io.Bytes(length,b);
};
haxe.io.Bytes.ofString = function(s) {
	var nb = new Buffer(s,"utf8");
	return new haxe.io.Bytes(nb.length,nb);
};
haxe.io.Bytes.ofData = function(b) {
	return new haxe.io.Bytes(b.length,b);
};
haxe.io.Bytes.prototype = {
	get: function(pos) {
		return this.b[pos];
	}
	,set: function(pos,v) {
		this.b[pos] = v;
	}
	,blit: function(pos,src,srcpos,len) {
		if(pos < 0 || srcpos < 0 || len < 0 || pos + len > this.length || srcpos + len > src.length) throw haxe.io.Error.OutsideBounds;
		src.b.copy(this.b,pos,srcpos,srcpos + len);
	}
	,sub: function(pos,len) {
		if(pos < 0 || len < 0 || pos + len > this.length) throw haxe.io.Error.OutsideBounds;
		var nb = new Buffer(len);
		var slice = this.b.slice(pos,pos + len);
		slice.copy(nb,0,0,len);
		return new haxe.io.Bytes(len,nb);
	}
	,compare: function(other) {
		var b1 = this.b;
		var b2 = other.b;
		var len;
		if(this.length < other.length) len = this.length; else len = other.length;
		var _g = 0;
		while(_g < len) {
			var i = _g++;
			if(b1[i] != b2[i]) return b1[i] - b2[i];
		}
		return this.length - other.length;
	}
	,readString: function(pos,len) {
		if(pos < 0 || len < 0 || pos + len > this.length) throw haxe.io.Error.OutsideBounds;
		var s = "";
		var b = this.b;
		var fcc = String.fromCharCode;
		var i = pos;
		var max = pos + len;
		while(i < max) {
			var c = b[i++];
			if(c < 128) {
				if(c == 0) break;
				s += fcc(c);
			} else if(c < 224) s += fcc((c & 63) << 6 | b[i++] & 127); else if(c < 240) {
				var c2 = b[i++];
				s += fcc((c & 31) << 12 | (c2 & 127) << 6 | b[i++] & 127);
			} else {
				var c21 = b[i++];
				var c3 = b[i++];
				s += fcc((c & 15) << 18 | (c21 & 127) << 12 | c3 << 6 & 127 | b[i++] & 127);
			}
		}
		return s;
	}
	,toString: function() {
		return this.readString(0,this.length);
	}
	,toHex: function() {
		var s = new StringBuf();
		var chars = [];
		var str = "0123456789abcdef";
		var _g1 = 0;
		var _g = str.length;
		while(_g1 < _g) {
			var i = _g1++;
			chars.push(HxOverrides.cca(str,i));
		}
		var _g11 = 0;
		var _g2 = this.length;
		while(_g11 < _g2) {
			var i1 = _g11++;
			var c = this.b[i1];
			s.b += String.fromCharCode(chars[c >> 4]);
			s.b += String.fromCharCode(chars[c & 15]);
		}
		return s.b;
	}
	,getData: function() {
		return this.b;
	}
	,__class__: haxe.io.Bytes
};
haxe.crypto = {};
haxe.crypto.Base64 = function() { };
$hxClasses["haxe.crypto.Base64"] = haxe.crypto.Base64;
haxe.crypto.Base64.__name__ = ["haxe","crypto","Base64"];
haxe.crypto.Base64.encode = function(bytes,complement) {
	if(complement == null) complement = true;
	var str = new haxe.crypto.BaseCode(haxe.crypto.Base64.BYTES).encodeBytes(bytes).toString();
	if(complement) {
		var _g1 = 0;
		var _g = (3 - bytes.length * 4 % 3) % 3;
		while(_g1 < _g) {
			var i = _g1++;
			str += "=";
		}
	}
	return str;
};
haxe.crypto.Base64.decode = function(str,complement) {
	if(complement == null) complement = true;
	if(complement) while(HxOverrides.cca(str,str.length - 1) == 61) str = HxOverrides.substr(str,0,-1);
	return new haxe.crypto.BaseCode(haxe.crypto.Base64.BYTES).decodeBytes(haxe.io.Bytes.ofString(str));
};
haxe.crypto.BaseCode = function(base) {
	var len = base.length;
	var nbits = 1;
	while(len > 1 << nbits) nbits++;
	if(nbits > 8 || len != 1 << nbits) throw "BaseCode : base length must be a power of two.";
	this.base = base;
	this.nbits = nbits;
};
$hxClasses["haxe.crypto.BaseCode"] = haxe.crypto.BaseCode;
haxe.crypto.BaseCode.__name__ = ["haxe","crypto","BaseCode"];
haxe.crypto.BaseCode.prototype = {
	encodeBytes: function(b) {
		var nbits = this.nbits;
		var base = this.base;
		var size = b.length * 8 / nbits | 0;
		var out = haxe.io.Bytes.alloc(size + (b.length * 8 % nbits == 0?0:1));
		var buf = 0;
		var curbits = 0;
		var mask = (1 << nbits) - 1;
		var pin = 0;
		var pout = 0;
		while(pout < size) {
			while(curbits < nbits) {
				curbits += 8;
				buf <<= 8;
				buf |= b.get(pin++);
			}
			curbits -= nbits;
			out.set(pout++,base.b[buf >> curbits & mask]);
		}
		if(curbits > 0) out.set(pout++,base.b[buf << nbits - curbits & mask]);
		return out;
	}
	,initTable: function() {
		var tbl = new Array();
		var _g = 0;
		while(_g < 256) {
			var i = _g++;
			tbl[i] = -1;
		}
		var _g1 = 0;
		var _g2 = this.base.length;
		while(_g1 < _g2) {
			var i1 = _g1++;
			tbl[this.base.b[i1]] = i1;
		}
		this.tbl = tbl;
	}
	,decodeBytes: function(b) {
		var nbits = this.nbits;
		var base = this.base;
		if(this.tbl == null) this.initTable();
		var tbl = this.tbl;
		var size = b.length * nbits >> 3;
		var out = haxe.io.Bytes.alloc(size);
		var buf = 0;
		var curbits = 0;
		var pin = 0;
		var pout = 0;
		while(pout < size) {
			while(curbits < 8) {
				curbits += nbits;
				buf <<= nbits;
				var i = tbl[b.get(pin++)];
				if(i == -1) throw "BaseCode : invalid encoded char";
				buf |= i;
			}
			curbits -= 8;
			out.set(pout++,buf >> curbits & 255);
		}
		return out;
	}
	,__class__: haxe.crypto.BaseCode
};
haxe.crypto.Md5 = function() {
};
$hxClasses["haxe.crypto.Md5"] = haxe.crypto.Md5;
haxe.crypto.Md5.__name__ = ["haxe","crypto","Md5"];
haxe.crypto.Md5.make = function(b) {
	var h = new haxe.crypto.Md5().doEncode(haxe.crypto.Md5.bytes2blks(b));
	var out = haxe.io.Bytes.alloc(16);
	var p = 0;
	var _g = 0;
	while(_g < 4) {
		var i = _g++;
		out.set(p++,h[i] & 255);
		out.set(p++,h[i] >> 8 & 255);
		out.set(p++,h[i] >> 16 & 255);
		out.set(p++,h[i] >>> 24);
	}
	return out;
};
haxe.crypto.Md5.bytes2blks = function(b) {
	var nblk = (b.length + 8 >> 6) + 1;
	var blks = new Array();
	var blksSize = nblk * 16;
	var _g = 0;
	while(_g < blksSize) {
		var i = _g++;
		blks[i] = 0;
	}
	var i1 = 0;
	while(i1 < b.length) {
		blks[i1 >> 2] |= b.b[i1] << (((b.length << 3) + i1 & 3) << 3);
		i1++;
	}
	blks[i1 >> 2] |= 128 << (b.length * 8 + i1) % 4 * 8;
	var l = b.length * 8;
	var k = nblk * 16 - 2;
	blks[k] = l & 255;
	blks[k] |= (l >>> 8 & 255) << 8;
	blks[k] |= (l >>> 16 & 255) << 16;
	blks[k] |= (l >>> 24 & 255) << 24;
	return blks;
};
haxe.crypto.Md5.prototype = {
	bitOR: function(a,b) {
		var lsb = a & 1 | b & 1;
		var msb31 = a >>> 1 | b >>> 1;
		return msb31 << 1 | lsb;
	}
	,bitXOR: function(a,b) {
		var lsb = a & 1 ^ b & 1;
		var msb31 = a >>> 1 ^ b >>> 1;
		return msb31 << 1 | lsb;
	}
	,bitAND: function(a,b) {
		var lsb = a & 1 & (b & 1);
		var msb31 = a >>> 1 & b >>> 1;
		return msb31 << 1 | lsb;
	}
	,addme: function(x,y) {
		var lsw = (x & 65535) + (y & 65535);
		var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
		return msw << 16 | lsw & 65535;
	}
	,rol: function(num,cnt) {
		return num << cnt | num >>> 32 - cnt;
	}
	,cmn: function(q,a,b,x,s,t) {
		return this.addme(this.rol(this.addme(this.addme(a,q),this.addme(x,t)),s),b);
	}
	,ff: function(a,b,c,d,x,s,t) {
		return this.cmn(this.bitOR(this.bitAND(b,c),this.bitAND(~b,d)),a,b,x,s,t);
	}
	,gg: function(a,b,c,d,x,s,t) {
		return this.cmn(this.bitOR(this.bitAND(b,d),this.bitAND(c,~d)),a,b,x,s,t);
	}
	,hh: function(a,b,c,d,x,s,t) {
		return this.cmn(this.bitXOR(this.bitXOR(b,c),d),a,b,x,s,t);
	}
	,ii: function(a,b,c,d,x,s,t) {
		return this.cmn(this.bitXOR(c,this.bitOR(b,~d)),a,b,x,s,t);
	}
	,doEncode: function(x) {
		var a = 1732584193;
		var b = -271733879;
		var c = -1732584194;
		var d = 271733878;
		var step;
		var i = 0;
		while(i < x.length) {
			var olda = a;
			var oldb = b;
			var oldc = c;
			var oldd = d;
			step = 0;
			a = this.ff(a,b,c,d,x[i],7,-680876936);
			d = this.ff(d,a,b,c,x[i + 1],12,-389564586);
			c = this.ff(c,d,a,b,x[i + 2],17,606105819);
			b = this.ff(b,c,d,a,x[i + 3],22,-1044525330);
			a = this.ff(a,b,c,d,x[i + 4],7,-176418897);
			d = this.ff(d,a,b,c,x[i + 5],12,1200080426);
			c = this.ff(c,d,a,b,x[i + 6],17,-1473231341);
			b = this.ff(b,c,d,a,x[i + 7],22,-45705983);
			a = this.ff(a,b,c,d,x[i + 8],7,1770035416);
			d = this.ff(d,a,b,c,x[i + 9],12,-1958414417);
			c = this.ff(c,d,a,b,x[i + 10],17,-42063);
			b = this.ff(b,c,d,a,x[i + 11],22,-1990404162);
			a = this.ff(a,b,c,d,x[i + 12],7,1804603682);
			d = this.ff(d,a,b,c,x[i + 13],12,-40341101);
			c = this.ff(c,d,a,b,x[i + 14],17,-1502002290);
			b = this.ff(b,c,d,a,x[i + 15],22,1236535329);
			a = this.gg(a,b,c,d,x[i + 1],5,-165796510);
			d = this.gg(d,a,b,c,x[i + 6],9,-1069501632);
			c = this.gg(c,d,a,b,x[i + 11],14,643717713);
			b = this.gg(b,c,d,a,x[i],20,-373897302);
			a = this.gg(a,b,c,d,x[i + 5],5,-701558691);
			d = this.gg(d,a,b,c,x[i + 10],9,38016083);
			c = this.gg(c,d,a,b,x[i + 15],14,-660478335);
			b = this.gg(b,c,d,a,x[i + 4],20,-405537848);
			a = this.gg(a,b,c,d,x[i + 9],5,568446438);
			d = this.gg(d,a,b,c,x[i + 14],9,-1019803690);
			c = this.gg(c,d,a,b,x[i + 3],14,-187363961);
			b = this.gg(b,c,d,a,x[i + 8],20,1163531501);
			a = this.gg(a,b,c,d,x[i + 13],5,-1444681467);
			d = this.gg(d,a,b,c,x[i + 2],9,-51403784);
			c = this.gg(c,d,a,b,x[i + 7],14,1735328473);
			b = this.gg(b,c,d,a,x[i + 12],20,-1926607734);
			a = this.hh(a,b,c,d,x[i + 5],4,-378558);
			d = this.hh(d,a,b,c,x[i + 8],11,-2022574463);
			c = this.hh(c,d,a,b,x[i + 11],16,1839030562);
			b = this.hh(b,c,d,a,x[i + 14],23,-35309556);
			a = this.hh(a,b,c,d,x[i + 1],4,-1530992060);
			d = this.hh(d,a,b,c,x[i + 4],11,1272893353);
			c = this.hh(c,d,a,b,x[i + 7],16,-155497632);
			b = this.hh(b,c,d,a,x[i + 10],23,-1094730640);
			a = this.hh(a,b,c,d,x[i + 13],4,681279174);
			d = this.hh(d,a,b,c,x[i],11,-358537222);
			c = this.hh(c,d,a,b,x[i + 3],16,-722521979);
			b = this.hh(b,c,d,a,x[i + 6],23,76029189);
			a = this.hh(a,b,c,d,x[i + 9],4,-640364487);
			d = this.hh(d,a,b,c,x[i + 12],11,-421815835);
			c = this.hh(c,d,a,b,x[i + 15],16,530742520);
			b = this.hh(b,c,d,a,x[i + 2],23,-995338651);
			a = this.ii(a,b,c,d,x[i],6,-198630844);
			d = this.ii(d,a,b,c,x[i + 7],10,1126891415);
			c = this.ii(c,d,a,b,x[i + 14],15,-1416354905);
			b = this.ii(b,c,d,a,x[i + 5],21,-57434055);
			a = this.ii(a,b,c,d,x[i + 12],6,1700485571);
			d = this.ii(d,a,b,c,x[i + 3],10,-1894986606);
			c = this.ii(c,d,a,b,x[i + 10],15,-1051523);
			b = this.ii(b,c,d,a,x[i + 1],21,-2054922799);
			a = this.ii(a,b,c,d,x[i + 8],6,1873313359);
			d = this.ii(d,a,b,c,x[i + 15],10,-30611744);
			c = this.ii(c,d,a,b,x[i + 6],15,-1560198380);
			b = this.ii(b,c,d,a,x[i + 13],21,1309151649);
			a = this.ii(a,b,c,d,x[i + 4],6,-145523070);
			d = this.ii(d,a,b,c,x[i + 11],10,-1120210379);
			c = this.ii(c,d,a,b,x[i + 2],15,718787259);
			b = this.ii(b,c,d,a,x[i + 9],21,-343485551);
			a = this.addme(a,olda);
			b = this.addme(b,oldb);
			c = this.addme(c,oldc);
			d = this.addme(d,oldd);
			i += 16;
		}
		return [a,b,c,d];
	}
	,__class__: haxe.crypto.Md5
};
haxe.ds = {};
haxe.ds.IntMap = function() {
	this.h = { };
};
$hxClasses["haxe.ds.IntMap"] = haxe.ds.IntMap;
haxe.ds.IntMap.__name__ = ["haxe","ds","IntMap"];
haxe.ds.IntMap.__interfaces__ = [IMap];
haxe.ds.IntMap.prototype = {
	set: function(key,value) {
		this.h[key] = value;
	}
	,get: function(key) {
		return this.h[key];
	}
	,keys: function() {
		var a = [];
		for( var key in this.h ) {
		if(this.h.hasOwnProperty(key)) a.push(key | 0);
		}
		return HxOverrides.iter(a);
	}
	,__class__: haxe.ds.IntMap
};
haxe.ds.ObjectMap = function() {
	this.h = { };
	this.h.__keys__ = { };
};
$hxClasses["haxe.ds.ObjectMap"] = haxe.ds.ObjectMap;
haxe.ds.ObjectMap.__name__ = ["haxe","ds","ObjectMap"];
haxe.ds.ObjectMap.__interfaces__ = [IMap];
haxe.ds.ObjectMap.prototype = {
	set: function(key,value) {
		var id = key.__id__ || (key.__id__ = ++haxe.ds.ObjectMap.count);
		this.h[id] = value;
		this.h.__keys__[id] = key;
	}
	,get: function(key) {
		return this.h[key.__id__];
	}
	,keys: function() {
		var a = [];
		for( var key in this.h.__keys__ ) {
		if(this.h.hasOwnProperty(key)) a.push(this.h.__keys__[key]);
		}
		return HxOverrides.iter(a);
	}
	,__class__: haxe.ds.ObjectMap
};
haxe.ds.StringMap = function() {
	this.h = { };
};
$hxClasses["haxe.ds.StringMap"] = haxe.ds.StringMap;
haxe.ds.StringMap.__name__ = ["haxe","ds","StringMap"];
haxe.ds.StringMap.__interfaces__ = [IMap];
haxe.ds.StringMap.prototype = {
	set: function(key,value) {
		this.h["$" + key] = value;
	}
	,get: function(key) {
		return this.h["$" + key];
	}
	,exists: function(key) {
		return this.h.hasOwnProperty("$" + key);
	}
	,remove: function(key) {
		key = "$" + key;
		if(!this.h.hasOwnProperty(key)) return false;
		delete(this.h[key]);
		return true;
	}
	,keys: function() {
		var a = [];
		for( var key in this.h ) {
		if(this.h.hasOwnProperty(key)) a.push(key.substr(1));
		}
		return HxOverrides.iter(a);
	}
	,iterator: function() {
		return { ref : this.h, it : this.keys(), hasNext : function() {
			return this.it.hasNext();
		}, next : function() {
			var i = this.it.next();
			return this.ref["$" + i];
		}};
	}
	,__class__: haxe.ds.StringMap
};
haxe.io.BytesBuffer = function() {
	this.b = new Array();
};
$hxClasses["haxe.io.BytesBuffer"] = haxe.io.BytesBuffer;
haxe.io.BytesBuffer.__name__ = ["haxe","io","BytesBuffer"];
haxe.io.BytesBuffer.prototype = {
	addByte: function($byte) {
		this.b.push($byte);
	}
	,add: function(src) {
		var b1 = this.b;
		var b2 = src.b;
		var _g1 = 0;
		var _g = src.length;
		while(_g1 < _g) {
			var i = _g1++;
			this.b.push(b2[i]);
		}
	}
	,addBytes: function(src,pos,len) {
		if(pos < 0 || len < 0 || pos + len > src.length) throw haxe.io.Error.OutsideBounds;
		var b1 = this.b;
		var b2 = src.b;
		var _g1 = pos;
		var _g = pos + len;
		while(_g1 < _g) {
			var i = _g1++;
			this.b.push(b2[i]);
		}
	}
	,getBytes: function() {
		var nb = new Buffer(this.b);
		var bytes = new haxe.io.Bytes(nb.length,nb);
		this.b = null;
		return bytes;
	}
	,get_length: function() {
		return this.b.length;
	}
	,__class__: haxe.io.BytesBuffer
};
haxe.io.Output = function() { };
$hxClasses["haxe.io.Output"] = haxe.io.Output;
haxe.io.Output.__name__ = ["haxe","io","Output"];
haxe.io.Output.prototype = {
	writeByte: function(c) {
		throw "Not implemented";
	}
	,writeUInt16: function(x) {
		if(x < 0 || x >= 65536) throw haxe.io.Error.Overflow;
		if(this.bigEndian) {
			this.writeByte(x >> 8);
			this.writeByte(x & 255);
		} else {
			this.writeByte(x & 255);
			this.writeByte(x >> 8);
		}
	}
	,__class__: haxe.io.Output
};
haxe.io.BytesOutput = function() {
	this.b = new haxe.io.BytesBuffer();
};
$hxClasses["haxe.io.BytesOutput"] = haxe.io.BytesOutput;
haxe.io.BytesOutput.__name__ = ["haxe","io","BytesOutput"];
haxe.io.BytesOutput.__super__ = haxe.io.Output;
haxe.io.BytesOutput.prototype = $extend(haxe.io.Output.prototype,{
	writeByte: function(c) {
		this.b.b.push(c);
	}
	,getBytes: function() {
		return this.b.getBytes();
	}
	,__class__: haxe.io.BytesOutput
});
haxe.io.Eof = function() { };
$hxClasses["haxe.io.Eof"] = haxe.io.Eof;
haxe.io.Eof.__name__ = ["haxe","io","Eof"];
haxe.io.Eof.prototype = {
	toString: function() {
		return "Eof";
	}
	,__class__: haxe.io.Eof
};
haxe.io.Error = $hxClasses["haxe.io.Error"] = { __ename__ : ["haxe","io","Error"], __constructs__ : ["Blocked","Overflow","OutsideBounds","Custom"] };
haxe.io.Error.Blocked = ["Blocked",0];
haxe.io.Error.Blocked.__enum__ = haxe.io.Error;
haxe.io.Error.Overflow = ["Overflow",1];
haxe.io.Error.Overflow.__enum__ = haxe.io.Error;
haxe.io.Error.OutsideBounds = ["OutsideBounds",2];
haxe.io.Error.OutsideBounds.__enum__ = haxe.io.Error;
haxe.io.Error.Custom = function(e) { var $x = ["Custom",3,e]; $x.__enum__ = haxe.io.Error; return $x; };
haxe.io.Path = function(path) {
	switch(path) {
	case ".":case "..":
		this.dir = path;
		this.file = "";
		return;
	}
	var c1 = path.lastIndexOf("/");
	var c2 = path.lastIndexOf("\\");
	if(c1 < c2) {
		this.dir = HxOverrides.substr(path,0,c2);
		path = HxOverrides.substr(path,c2 + 1,null);
		this.backslash = true;
	} else if(c2 < c1) {
		this.dir = HxOverrides.substr(path,0,c1);
		path = HxOverrides.substr(path,c1 + 1,null);
	} else this.dir = null;
	var cp = path.lastIndexOf(".");
	if(cp != -1) {
		this.ext = HxOverrides.substr(path,cp + 1,null);
		this.file = HxOverrides.substr(path,0,cp);
	} else {
		this.ext = null;
		this.file = path;
	}
};
$hxClasses["haxe.io.Path"] = haxe.io.Path;
haxe.io.Path.__name__ = ["haxe","io","Path"];
haxe.io.Path.prototype = {
	__class__: haxe.io.Path
};
var js = {};
js.Boot = function() { };
$hxClasses["js.Boot"] = js.Boot;
js.Boot.__name__ = ["js","Boot"];
js.Boot.getClass = function(o) {
	if((o instanceof Array) && o.__enum__ == null) return Array; else return o.__class__;
};
js.Boot.__string_rec = function(o,s) {
	if(o == null) return "null";
	if(s.length >= 5) return "<...>";
	var t = typeof(o);
	if(t == "function" && (o.__name__ || o.__ename__)) t = "object";
	switch(t) {
	case "object":
		if(o instanceof Array) {
			if(o.__enum__) {
				if(o.length == 2) return o[0];
				var str = o[0] + "(";
				s += "\t";
				var _g1 = 2;
				var _g = o.length;
				while(_g1 < _g) {
					var i = _g1++;
					if(i != 2) str += "," + js.Boot.__string_rec(o[i],s); else str += js.Boot.__string_rec(o[i],s);
				}
				return str + ")";
			}
			var l = o.length;
			var i1;
			var str1 = "[";
			s += "\t";
			var _g2 = 0;
			while(_g2 < l) {
				var i2 = _g2++;
				str1 += (i2 > 0?",":"") + js.Boot.__string_rec(o[i2],s);
			}
			str1 += "]";
			return str1;
		}
		var tostr;
		try {
			tostr = o.toString;
		} catch( e ) {
			return "???";
		}
		if(tostr != null && tostr != Object.toString) {
			var s2 = o.toString();
			if(s2 != "[object Object]") return s2;
		}
		var k = null;
		var str2 = "{\n";
		s += "\t";
		var hasp = o.hasOwnProperty != null;
		for( var k in o ) {
		if(hasp && !o.hasOwnProperty(k)) {
			continue;
		}
		if(k == "prototype" || k == "__class__" || k == "__super__" || k == "__interfaces__" || k == "__properties__") {
			continue;
		}
		if(str2.length != 2) str2 += ", \n";
		str2 += s + k + " : " + js.Boot.__string_rec(o[k],s);
		}
		s = s.substring(1);
		str2 += "\n" + s + "}";
		return str2;
	case "function":
		return "<function>";
	case "string":
		return o;
	default:
		return String(o);
	}
};
js.Boot.__interfLoop = function(cc,cl) {
	if(cc == null) return false;
	if(cc == cl) return true;
	var intf = cc.__interfaces__;
	if(intf != null) {
		var _g1 = 0;
		var _g = intf.length;
		while(_g1 < _g) {
			var i = _g1++;
			var i1 = intf[i];
			if(i1 == cl || js.Boot.__interfLoop(i1,cl)) return true;
		}
	}
	return js.Boot.__interfLoop(cc.__super__,cl);
};
js.Boot.__instanceof = function(o,cl) {
	if(cl == null) return false;
	switch(cl) {
	case Int:
		return (o|0) === o;
	case Float:
		return typeof(o) == "number";
	case Bool:
		return typeof(o) == "boolean";
	case String:
		return typeof(o) == "string";
	case Array:
		return (o instanceof Array) && o.__enum__ == null;
	case Dynamic:
		return true;
	default:
		if(o != null) {
			if(typeof(cl) == "function") {
				if(o instanceof cl) return true;
				if(js.Boot.__interfLoop(js.Boot.getClass(o),cl)) return true;
			}
		} else return false;
		if(cl == Class && o.__name__ != null) return true;
		if(cl == Enum && o.__ename__ != null) return true;
		return o.__enum__ == cl;
	}
};
js.Boot.__cast = function(o,t) {
	if(js.Boot.__instanceof(o,t)) return o; else throw "Cannot cast " + Std.string(o) + " to " + Std.string(t);
};
js.Browser = function() { };
$hxClasses["js.Browser"] = js.Browser;
js.Browser.__name__ = ["js","Browser"];
js.Browser.getLocalStorage = function() {
	try {
		var s = window.localStorage;
		s.getItem("");
		return s;
	} catch( e ) {
		return null;
	}
};
js.Lib = function() { };
$hxClasses["js.Lib"] = js.Lib;
js.Lib.__name__ = ["js","Lib"];
js.Lib.alert = function(v) {
	alert(js.Boot.__string_rec(v,""));
};
js.NodeC = function() { };
$hxClasses["js.NodeC"] = js.NodeC;
js.NodeC.__name__ = ["js","NodeC"];
js.Node = function() { };
$hxClasses["js.Node"] = js.Node;
js.Node.__name__ = ["js","Node"];
js.Node.get_assert = function() {
	return js.Node.require("assert");
};
js.Node.get_childProcess = function() {
	return js.Node.require("child_process");
};
js.Node.get_cluster = function() {
	return js.Node.require("cluster");
};
js.Node.get_crypto = function() {
	return js.Node.require("crypto");
};
js.Node.get_dgram = function() {
	return js.Node.require("dgram");
};
js.Node.get_dns = function() {
	return js.Node.require("dns");
};
js.Node.get_fs = function() {
	return js.Node.require("fs");
};
js.Node.get_http = function() {
	return js.Node.require("http");
};
js.Node.get_https = function() {
	return js.Node.require("https");
};
js.Node.get_net = function() {
	return js.Node.require("net");
};
js.Node.get_os = function() {
	return js.Node.require("os");
};
js.Node.get_path = function() {
	return js.Node.require("path");
};
js.Node.get_querystring = function() {
	return js.Node.require("querystring");
};
js.Node.get_repl = function() {
	return js.Node.require("repl");
};
js.Node.get_tls = function() {
	return js.Node.require("tls");
};
js.Node.get_url = function() {
	return js.Node.require("url");
};
js.Node.get_util = function() {
	return js.Node.require("util");
};
js.Node.get_vm = function() {
	return js.Node.require("vm");
};
js.Node.get___filename = function() {
	return __filename;
};
js.Node.get___dirname = function() {
	return __dirname;
};
js.Node.newSocket = function(options) {
	return new js.Node.net.Socket(options);
};
js.Selection = function(doc) {
	this.doc = doc;
};
$hxClasses["js.Selection"] = js.Selection;
js.Selection.__name__ = ["js","Selection"];
js.Selection.prototype = {
	insert: function(left,text,right) {
		this.doc.focus();
		if(this.doc.selectionStart != null) {
			var top = this.doc.scrollTop;
			var start = this.doc.selectionStart;
			var end = this.doc.selectionEnd;
			this.doc.value = Std.string(this.doc.value.substr(0,start)) + left + text + right + Std.string(this.doc.value.substr(end));
			this.doc.selectionStart = start + left.length;
			this.doc.selectionEnd = start + left.length + text.length;
			this.doc.scrollTop = top;
			return;
		}
		var range = js.Lib.document.selection.createRange();
		range.text = left + text + right;
		range.moveStart("character",-text.length - right.length);
		range.moveEnd("character",-right.length);
		range.select();
	}
	,__class__: js.Selection
};
js.html = {};
js.html._CanvasElement = {};
js.html._CanvasElement.CanvasUtil = function() { };
$hxClasses["js.html._CanvasElement.CanvasUtil"] = js.html._CanvasElement.CanvasUtil;
js.html._CanvasElement.CanvasUtil.__name__ = ["js","html","_CanvasElement","CanvasUtil"];
js.html._CanvasElement.CanvasUtil.getContextWebGL = function(canvas,attribs) {
	var _g = 0;
	var _g1 = ["webgl","experimental-webgl"];
	while(_g < _g1.length) {
		var name = _g1[_g];
		++_g;
		var ctx = canvas.getContext(name,attribs);
		if(ctx != null) return ctx;
	}
	return null;
};
var lvl = {};
lvl.Image = function(w,h) {
	this.originY = 0;
	this.originX = 0;
	this.width = w;
	this.height = h;
	var _this = window.document;
	this.canvas = _this.createElement("canvas");
	this.origin = this.canvas;
	this.canvas.width = w;
	this.canvas.height = h;
	this.init();
};
$hxClasses["lvl.Image"] = lvl.Image;
lvl.Image.__name__ = ["lvl","Image"];
lvl.Image.clearCache = function(url) {
	lvl.Image.cache.remove(url);
};
lvl.Image.load = function(url,callb,onError,forceReload) {
	var i = lvl.Image.cache.get(url);
	if(i != null && !forceReload) {
		var im = new lvl.Image(i.width,i.height);
		im.ctx.drawImage(i,0,0);
		im.origin = i;
		callb(im);
		return;
	}
	var _this = window.document;
	i = _this.createElement("img");
	i.onload = function(_) {
		var i2 = lvl.Image.cache.get(url);
		if(i2 == null || forceReload) lvl.Image.cache.set(url,i); else i = i2;
		var im1 = new lvl.Image(i.width,i.height);
		im1.ctx.drawImage(i,0,0);
		im1.origin = i;
		callb(im1);
	};
	i.onerror = function(_1) {
		if(onError != null) {
			onError();
			return;
		}
		var i1 = new lvl.Image(16,16);
		i1.fill(-65281);
		callb(i1);
	};
	i.src = url;
};
lvl.Image.fromCanvas = function(c) {
	var i = new lvl.Image(0,0);
	i.width = c.width;
	i.height = c.height;
	i.canvas = i.origin = c;
	i.init();
	return i;
};
lvl.Image.prototype = {
	init: function() {
		this.ctx = this.canvas.getContext("2d");
	}
	,getColor: function(color) {
		if(color >>> 24 == 255) return "#" + StringTools.hex(color & 16777215,6); else return "rgba(" + (color >> 16 & 255) + "," + (color >> 8 & 255) + "," + (color & 255) + "," + (color >>> 24) / 255 + ")";
	}
	,getCanvas: function() {
		return this.canvas;
	}
	,clear: function() {
		this.ctx.clearRect(0,0,this.width,this.height);
		this.invalidate();
	}
	,invalidate: function() {
		if(this.origin == this.canvas) return;
		this.origin = this.canvas;
		this.originX = this.originY = 0;
		this.origin.texture = null;
	}
	,fill: function(color) {
		this.ctx.fillStyle = this.getColor(color);
		this.ctx.fillRect(0,0,this.width,this.height);
		this.invalidate();
	}
	,fillRect: function(x,y,w,h,color) {
		this.ctx.fillStyle = this.getColor(color);
		this.ctx.fillRect(x,y,w,h);
		this.invalidate();
	}
	,sub: function(x,y,w,h) {
		var i = new lvl.Image(w,h);
		i.ctx.drawImage(this.origin,x,y,w,h,0,0,w,h);
		i.origin = this.origin;
		i.originX = this.originX + x;
		i.originY = this.originY + y;
		return i;
	}
	,text: function(text,x,y,color) {
		if(color == null) color = -1;
		this.ctx.fillStyle = this.getColor(color);
		this.ctx.fillText(text,x,y);
		this.invalidate();
	}
	,draw: function(i,x,y) {
		this.ctx.drawImage(i.origin,i.originX,i.originY,i.width,i.height,x,y,i.width,i.height);
		this.invalidate();
	}
	,drawSub: function(i,srcX,srcY,srcW,srcH,x,y,dstW,dstH,smooth) {
		if(smooth == null) smooth = false;
		if(dstH == null) dstH = -1;
		if(dstW == null) dstW = -1;
		if(dstW < 0) dstW = srcW;
		if(dstH < 0) dstH = srcH;
		this.ctx.imageSmoothingEnabled = smooth;
		this.ctx.drawImage(i.origin,srcX + i.originX,srcY + i.originY,srcW,srcH,x,y,dstW,dstH);
		this.invalidate();
	}
	,copyFrom: function(i,smooth) {
		if(smooth == null) smooth = false;
		this.ctx.fillStyle = "rgba(0,0,0,0)";
		this.ctx.fillRect(0,0,this.width,this.height);
		this.ctx.imageSmoothingEnabled = smooth;
		this.ctx.drawImage(i.origin,i.originX,i.originY,i.width,i.height,0,0,this.width,this.height);
		this.invalidate();
	}
	,isBlank: function() {
		var i = this.ctx.getImageData(0,0,this.width,this.height);
		var _g1 = 0;
		var _g = this.width * this.height * 4;
		while(_g1 < _g) {
			var k = _g1++;
			if(i.data[k] != 0) return false;
		}
		return true;
	}
	,setSize: function(width,height) {
		if(width == this.width && height == this.height) return;
		this.canvas.width = width;
		this.canvas.height = height;
		this.canvas.setAttribute("width",width + "px");
		this.canvas.setAttribute("height",height + "px");
		this.width = width;
		this.height = height;
		this.init();
		this.invalidate();
	}
	,resize: function(width,height,smooth) {
		if(width == this.width && height == this.height) return;
		if(smooth == null) smooth = width < this.width || height < this.height;
		var c;
		var _this = window.document;
		c = _this.createElement("canvas");
		c.width = width;
		c.height = height;
		var ctx2 = c.getContext("2d");
		ctx2.imageSmoothingEnabled = smooth;
		ctx2.drawImage(this.canvas,0,0,this.width,this.height,0,0,width,height);
		this.ctx = ctx2;
		this.canvas = c;
		this.width = width;
		this.height = height;
		this.invalidate();
	}
	,__class__: lvl.Image
};
lvl.Image3D = function(w,h) {
	this.zoom = 1;
	this.alpha = 1;
	lvl.Image.call(this,w,h);
	this.colorCache = new haxe.ds.IntMap();
	this.curDraw = new Float32Array(16 * Math.ceil(10922.666666666666));
	this.curIndex = new Uint16Array(65536);
};
$hxClasses["lvl.Image3D"] = lvl.Image3D;
lvl.Image3D.__name__ = ["lvl","Image3D"];
lvl.Image3D.getInstance = function() {
	if(lvl.Image3D.inst == null) lvl.Image3D.inst = new lvl.Image3D(0,0);
	return lvl.Image3D.inst;
};
lvl.Image3D.fromCanvas = function(c) {
	var i = new lvl.Image3D(0,0);
	i.width = c.width;
	i.height = c.height;
	i.canvas = i.origin = c;
	i.init();
	return i;
};
lvl.Image3D.__super__ = lvl.Image;
lvl.Image3D.prototype = $extend(lvl.Image.prototype,{
	init: function() {
		this.dispose();
		this.gl = this.canvas.gl;
		if(this.gl != null) {
			this.setViewport();
			return;
		}
		this.gl = js.html._CanvasElement.CanvasUtil.getContextWebGL(this.canvas,{ alpha : false, antialias : false});
		this.canvas.gl = this.gl;
		this.gl.disable(2884);
		this.gl.disable(2929);
		var vertex = this.gl.createShader(35633);
		this.gl.shaderSource(vertex,"\r\n\t\t\tvarying vec2 tuv;\r\n\t\t\tattribute vec2 pos;\r\n\t\t\tattribute vec2 uv;\r\n\t\t\tvoid main() {\r\n\t\t\t\ttuv = uv;\r\n\t\t\t\tgl_Position = vec4(pos + vec2(-1.,1.), 0, 1);\r\n\t\t\t}\r\n\t\t");
		this.gl.compileShader(vertex);
		if(this.gl.getShaderParameter(vertex,35713) != 1) throw this.gl.getShaderInfoLog(vertex);
		var frag = this.gl.createShader(35632);
		this.gl.shaderSource(frag,"\r\n\t\t\tvarying mediump vec2 tuv;\r\n\t\t\tuniform sampler2D texture;\r\n\t\t\tuniform lowp float alpha;\r\n\t\t\tvoid main() {\r\n\t\t\t\tlowp vec4 color = texture2D(texture, tuv);\r\n\t\t\t\tcolor.a *= alpha;\r\n\t\t\t\tgl_FragColor = color;\r\n\t\t\t}\r\n\t\t");
		this.gl.compileShader(frag);
		if(this.gl.getShaderParameter(frag,35713) != 1) throw this.gl.getShaderInfoLog(frag);
		var p = this.gl.createProgram();
		this.gl.attachShader(p,vertex);
		this.gl.attachShader(p,frag);
		this.gl.linkProgram(p);
		if(this.gl.getProgramParameter(p,35714) != 1) throw this.gl.getProgramInfoLog(p);
		this.gl.useProgram(p);
		this.gl.enableVertexAttribArray(0);
		this.gl.enableVertexAttribArray(1);
		this.gl.enable(3042);
		this.gl.blendFunc(770,771);
		this.uniTex = this.gl.getUniformLocation(p,"texture");
		this.uniAlpha = this.gl.getUniformLocation(p,"alpha");
		this.attribPos = this.gl.getAttribLocation(p,"pos");
		this.attribUV = this.gl.getAttribLocation(p,"uv");
		this.setViewport();
	}
	,dispose: function() {
		if(this.texturesObjects != null) {
			var _g = 0;
			var _g1 = this.texturesObjects;
			while(_g < _g1.length) {
				var o = _g1[_g];
				++_g;
				this.gl.deleteTexture(o.texture);
				o.texture = null;
			}
		}
		this.texturesObjects = [];
	}
	,set_alpha: function(v) {
		this.endDraw();
		return this.alpha = v;
	}
	,beginDraw: function(t) {
		if(t != this.curTexture) {
			this.endDraw();
			this.curTexture = t;
			this.drawPos = 0;
			this.indexPos = 0;
		}
	}
	,getColorImage: function(color) {
		var i = this.colorCache.get(color);
		if(i != null) return i;
		i = new lvl.Image(1,1);
		i.fill(color);
		this.colorCache.set(color,i);
		return i;
	}
	,getTexture: function(i) {
		var t = i.origin.texture;
		if(t != null) return t;
		t = this.gl.createTexture();
		i.origin.texture = t;
		t.origin = i.origin;
		this.gl.bindTexture(3553,t);
		this.gl.texParameteri(3553,10240,9728);
		this.gl.texParameteri(3553,10241,9728);
		this.gl.texParameteri(3553,10242,33071);
		this.gl.texParameteri(3553,10243,33071);
		this.gl.texImage2D(3553,0,6408,6408,5121,i.origin);
		this.gl.bindTexture(3553,null);
		this.texturesObjects.push(i.origin);
		t.width = i.origin.width;
		t.height = i.origin.height;
		return t;
	}
	,draw: function(i,x,y) {
		var _g = this;
		this.beginDraw(this.getTexture(i));
		var x1 = x;
		var y1 = y;
		var w = i.width;
		var h = i.height;
		var pos = this.drawPos >> 2;
		var t = x1 * _g.scaleX;
		var rt = (t * _g.width | 0) / _g.width;
		this.curDraw[this.drawPos++] = rt;
		var t1 = y1 * _g.scaleY;
		var rt1 = (t1 * _g.height | 0) / _g.height;
		this.curDraw[this.drawPos++] = rt1;
		this.curDraw[this.drawPos++] = (i.originX + 0.001) / _g.curTexture.width;
		this.curDraw[this.drawPos++] = i.originY / _g.curTexture.height;
		var t2 = (x1 + w) * _g.scaleX;
		var rt2 = (t2 * _g.width | 0) / _g.width;
		this.curDraw[this.drawPos++] = rt2;
		var t3 = y1 * _g.scaleY;
		var rt3 = (t3 * _g.height | 0) / _g.height;
		this.curDraw[this.drawPos++] = rt3;
		this.curDraw[this.drawPos++] = (i.originX + i.width) / _g.curTexture.width;
		this.curDraw[this.drawPos++] = i.originY / _g.curTexture.height;
		var t4 = x1 * _g.scaleX;
		var rt4 = (t4 * _g.width | 0) / _g.width;
		this.curDraw[this.drawPos++] = rt4;
		var t5 = (y1 + h) * _g.scaleY;
		var rt5 = (t5 * _g.height | 0) / _g.height;
		this.curDraw[this.drawPos++] = rt5;
		this.curDraw[this.drawPos++] = (i.originX + 0.001) / _g.curTexture.width;
		this.curDraw[this.drawPos++] = (i.originY + i.height + -0.01) / _g.curTexture.height;
		var t6 = (x1 + w) * _g.scaleX;
		var rt6 = (t6 * _g.width | 0) / _g.width;
		this.curDraw[this.drawPos++] = rt6;
		var t7 = (y1 + h) * _g.scaleY;
		var rt7 = (t7 * _g.height | 0) / _g.height;
		this.curDraw[this.drawPos++] = rt7;
		this.curDraw[this.drawPos++] = (i.originX + i.width) / _g.curTexture.width;
		this.curDraw[this.drawPos++] = (i.originY + i.height + -0.01) / _g.curTexture.height;
		this.curIndex[this.indexPos++] = pos;
		this.curIndex[this.indexPos++] = pos + 1;
		this.curIndex[this.indexPos++] = pos + 2;
		this.curIndex[this.indexPos++] = pos + 1;
		this.curIndex[this.indexPos++] = pos + 3;
		this.curIndex[this.indexPos++] = pos + 2;
		if(this.indexPos > 65500) this.endDraw();
	}
	,endDraw: function() {
		if(this.curTexture == null || this.indexPos == 0) return;
		var index = this.gl.createBuffer();
		var vertex = this.gl.createBuffer();
		this.gl.bindBuffer(34962,vertex);
		this.gl.bufferData(34962,this.curDraw.subarray(0,this.drawPos),35044);
		this.gl.bindBuffer(34963,index);
		this.gl.bufferData(34963,this.curIndex.subarray(0,this.indexPos),35044);
		this.gl.vertexAttribPointer(this.attribPos,2,5126,false,16,0);
		this.gl.vertexAttribPointer(this.attribUV,2,5126,false,16,8);
		this.gl.activeTexture(33984);
		this.gl.uniform1i(this.uniTex,0);
		this.gl.uniform1f(this.uniAlpha,this.alpha);
		this.gl.bindTexture(3553,this.curTexture);
		this.gl.drawElements(4,this.indexPos,5123,0);
		this.gl.bindBuffer(34963,null);
		this.gl.bindBuffer(34962,null);
		this.gl.deleteBuffer(index);
		this.gl.deleteBuffer(vertex);
		this.indexPos = 0;
		this.drawPos = 0;
	}
	,setSize: function(w,h) {
		lvl.Image.prototype.setSize.call(this,w,h);
		this.setViewport();
	}
	,setViewport: function() {
		this.gl.viewport(0,0,this.width > 4096?4096:this.width,this.height > 4096?4096:this.height);
		this.scaleX = this.zoom / this.width * 2;
		this.scaleY = this.zoom / this.height * -2;
	}
	,fill: function(color) {
		this.gl.clearColor((color >> 16 & 255) / 255,(color >> 8 & 255) / 255,(color & 255) / 255,(color >>> 24) / 255);
		this.gl.clear(16384);
	}
	,fillRect: function(x,y,w,h,color) {
		var i = this.getColorImage(color);
		i.width = w;
		i.height = h;
		this.draw(i,x,y);
	}
	,flush: function() {
		this.endDraw();
		this.gl.finish();
	}
	,set_zoom: function(z) {
		this.zoom = z;
		this.setViewport();
		return z;
	}
	,__class__: lvl.Image3D
});
lvl.LayerInnerData = $hxClasses["lvl.LayerInnerData"] = { __ename__ : ["lvl","LayerInnerData"], __constructs__ : ["Layer","Objects","Tiles"] };
lvl.LayerInnerData.Layer = function(a) { var $x = ["Layer",0,a]; $x.__enum__ = lvl.LayerInnerData; return $x; };
lvl.LayerInnerData.Objects = function(idCol,objs) { var $x = ["Objects",1,idCol,objs]; $x.__enum__ = lvl.LayerInnerData; return $x; };
lvl.LayerInnerData.Tiles = function(t,data) { var $x = ["Tiles",2,t,data]; $x.__enum__ = lvl.LayerInnerData; return $x; };
lvl.LayerData = function(level,name,p,target) {
	this.currentHeight = 1;
	this.currentWidth = 1;
	this.current = 0;
	this.visible = true;
	this.imagesStride = 0;
	this.level = level;
	this.name = name;
	this.props = p;
	this.blanks = [];
	this.targetObj = target;
};
$hxClasses["lvl.LayerData"] = lvl.LayerData;
lvl.LayerData.__name__ = ["lvl","LayerData"];
lvl.LayerData.prototype = {
	loadSheetData: function(sheet) {
		var _g5 = this;
		this.sheet = sheet;
		if(sheet == null) {
			if(this.props.color == null) this.props.color = 16711680;
			this.colors = [this.props.color];
			this.names = [this.name];
			this.loadState();
			return;
		}
		var idCol = null;
		var first = this.level.layers.length == 0;
		var erase;
		if(first) erase = "#ccc"; else erase = "rgba(0,0,0,0)";
		var _g = 0;
		var _g1 = sheet.columns;
		while(_g < _g1.length) {
			var c = _g1[_g];
			++_g;
			var _g2 = c.type;
			switch(_g2[1]) {
			case 11:
				var _g3 = [];
				var _g4 = 0;
				var _g51 = sheet.lines;
				while(_g4 < _g51.length) {
					var o = _g51[_g4];
					++_g4;
					_g3.push((function($this) {
						var $r;
						var c1 = Reflect.field(o,c.name);
						$r = c1 == null?0:c1;
						return $r;
					}(this)));
				}
				this.colors = _g3;
				break;
			case 7:
				if(this.images == null) this.images = [];
				var size = [this.level.tileSize];
				var _g41 = 0;
				var _g31 = sheet.lines.length;
				while(_g41 < _g31) {
					var idx = [_g41++];
					var key = Reflect.field(sheet.lines[idx[0]],c.name);
					var idat = this.level.model.getImageData(key);
					if(idat == null && this.images[idx[0]] != null) continue;
					if(idat == null) {
						var i = new lvl.Image(size[0],size[0]);
						i.text("#" + idx[0],0,12);
						this.images[idx[0]] = i;
						continue;
					}
					this.level.wait();
					lvl.Image.load(idat,(function(idx,size) {
						return function(i1) {
							i1.resize(size[0],size[0]);
							_g5.images[idx[0]] = i1;
							_g5.level.waitDone();
						};
					})(idx,size));
				}
				break;
			case 14:
				if(this.images == null) this.images = [];
				var size1 = [this.level.tileSize];
				var _g42 = 0;
				var _g32 = sheet.lines.length;
				while(_g42 < _g32) {
					var idx1 = [_g42++];
					var data = [Reflect.field(sheet.lines[idx1[0]],c.name)];
					if(data[0] == null && this.images[idx1[0]] != null) continue;
					if(data[0] == null) {
						var i2 = new lvl.Image(size1[0],size1[0]);
						i2.text("#" + idx1[0],0,12);
						this.images[idx1[0]] = i2;
						continue;
					}
					this.level.wait();
					lvl.Image.load(this.level.model.getAbsPath(data[0].file),(function(data,idx1,size1) {
						return function(i3) {
							var i21 = i3.sub(data[0].x * data[0].size,data[0].y * data[0].size,data[0].size,data[0].size);
							i21.resize(size1[0],size1[0]);
							_g5.images[idx1[0]] = i21;
							_g5.blanks[idx1[0]] = i21.isBlank();
							_g5.level.waitDone();
						};
					})(data,idx1,size1));
					this.level.watch(data[0].file,(function(data) {
						return function() {
							lvl.Image.clearCache(_g5.level.model.getAbsPath(data[0].file));
							_g5.level.reload();
						};
					})(data));
				}
				break;
			case 0:
				idCol = c;
				break;
			default:
			}
		}
		this.names = [];
		this.imagesStride = Math.ceil(Math.sqrt(sheet.lines.length));
		this.idToIndex = new haxe.ds.StringMap();
		this.indexToId = [];
		var _g11 = 0;
		var _g6 = sheet.lines.length;
		while(_g11 < _g6) {
			var index = _g11++;
			var o1 = sheet.lines[index];
			var n;
			if(sheet.props.displayColumn != null) n = Reflect.field(o1,sheet.props.displayColumn); else n = null;
			if((n == null || n == "") && idCol != null) n = Reflect.field(o1,idCol.name);
			if(n == null || n == "") n = "#" + index;
			if(idCol != null) {
				var id = Reflect.field(o1,idCol.name);
				if(id != null && id != "") this.idToIndex.set(id,index);
				this.indexToId[index] = id;
			}
			this.names.push(n);
		}
		this.loadState();
	}
	,loadState: function() {
		var state;
		try {
			state = haxe.Unserializer.run(js.Browser.getLocalStorage().getItem(this.level.sheetPath + ":" + this.name));
		} catch( e ) {
			state = null;
		}
		if(state != null) {
			this.set_visible(state.visible);
			this.floatCoord = this.hasFloatCoord && !state.lock;
			if(state.current < (this.images != null?this.images.length:this.names.length)) {
				this.set_current(state.current);
				if(this.current % this.imagesStride + state.cw <= this.imagesStride && (this.current / this.imagesStride | 0) + state.ch <= Math.ceil((this.images != null?this.images.length:this.names.length) / this.imagesStride)) {
					this.currentWidth = state.cw;
					this.currentHeight = state.ch;
					this.saveState();
				}
			}
		}
	}
	,setLayerData: function(val) {
		if(val == null || val == "") this.data = lvl.LayerInnerData.Layer((function($this) {
			var $r;
			var _g = [];
			{
				var _g2 = 0;
				var _g1 = $this.level.width * $this.level.height;
				while(_g2 < _g1) {
					var x = _g2++;
					_g.push(0);
				}
			}
			$r = _g;
			return $r;
		}(this))); else {
			var a = haxe.crypto.Base64.decode(val);
			if(a.length != this.level.width * this.level.height) throw "Invalid layer data";
			this.data = lvl.LayerInnerData.Layer((function($this) {
				var $r;
				var _g11 = [];
				{
					var _g3 = 0;
					var _g21 = $this.level.width * $this.level.height;
					while(_g3 < _g21) {
						var i = _g3++;
						_g11.push(a.b[i]);
					}
				}
				$r = _g11;
				return $r;
			}(this)));
		}
		if(this.sheet.lines.length > 256) throw "Too many lines";
	}
	,setObjectsData: function(id,val) {
		this.data = lvl.LayerInnerData.Objects(id,val);
	}
	,setTilesData: function(val) {
		var _g3 = this;
		var file;
		if(val == null) file = null; else file = val.file;
		var size;
		if(val == null) size = 16; else size = val.size;
		var data;
		if(val == null) {
			var _g = [];
			var _g2 = 0;
			var _g1 = this.level.width * this.level.height;
			while(_g2 < _g1) {
				var i = _g2++;
				_g.push(0);
			}
			data = _g;
		} else data = cdb._Types.TileLayerData_Impl_.decode(val.data);
		var stride;
		if(val == null) stride = 0; else stride = val.stride;
		var d = { file : file, size : size, stride : stride};
		this.images = [];
		this.data = lvl.LayerInnerData.Tiles(d,data);
		if(file == null) {
			var i1 = new lvl.Image(16,16);
			i1.fill(-65281);
			this.images.push(i1);
			return;
		}
		this.level.wait();
		lvl.Image.load(this.level.model.getAbsPath(file),function(i2) {
			var w = i2.width / size | 0;
			var h = i2.height / size | 0;
			var _g11 = 0;
			while(_g11 < h) {
				var y = _g11++;
				var _g21 = 0;
				while(_g21 < w) {
					var x = _g21++;
					var i3 = i2.sub(x * size,y * size,size,size);
					_g3.blanks[_g3.images.length] = i3.isBlank();
					_g3.images.push(i3);
				}
			}
			var max = w * h;
			var _g22 = 0;
			var _g12 = data.length;
			while(_g22 < _g12) {
				var i4 = _g22++;
				var v = data[i4] - 1;
				if(v < 0) continue;
				var vx = v % stride;
				var vy = v / stride | 0;
				v = vx + vy * w;
				if(vx >= w || vy >= h || _g3.blanks[v]) data[i4] = 0; else data[i4] = v + 1;
			}
			_g3.imagesStride = d.stride = w;
			_g3.loadState();
			_g3.level.waitDone();
		});
		this.level.watch(file,function() {
			lvl.Image.load(_g3.level.model.getAbsPath(file),function(_) {
				_g3.level.reload();
			},function() {
			},true);
		});
	}
	,set_visible: function(v) {
		this.visible = v;
		if(this.comp != null) this.comp.toggleClass("hidden",!this.visible);
		this.saveState();
		return v;
	}
	,set_current: function(v) {
		this.current = v;
		this.currentWidth = 1;
		this.currentHeight = 1;
		if(this.images != null && this.comp != null) this.comp.find("div.img").html("").append(new js.JQuery(this.images[this.current].getCanvas()));
		this.saveState();
		return v;
	}
	,saveState: function() {
		var s = { current : this.current, visible : this.visible, lock : this.hasFloatCoord && !this.floatCoord, cw : this.currentWidth, ch : this.currentHeight};
		js.Browser.getLocalStorage().setItem(this.level.sheetPath + ":" + this.name,haxe.Serializer.run(s));
	}
	,save: function() {
		if(!this.dirty) return;
		this.dirty = false;
		Reflect.setField(this.targetObj.o,this.targetObj.f,this.getData());
	}
	,getData: function() {
		{
			var _g = this.data;
			switch(_g[1]) {
			case 0:
				var data = _g[2];
				var b = haxe.io.Bytes.alloc(this.level.width * this.level.height);
				var p = 0;
				var _g2 = 0;
				var _g1 = this.level.height;
				while(_g2 < _g1) {
					var y = _g2++;
					var _g4 = 0;
					var _g3 = this.level.width;
					while(_g4 < _g3) {
						var x = _g4++;
						b.b[p] = data[p];
						p++;
					}
				}
				return haxe.crypto.Base64.encode(b);
			case 1:
				var objs = _g[3];
				return objs;
			case 2:
				var data1 = _g[3];
				var t = _g[2];
				var b1 = new haxe.io.BytesOutput();
				var r = 0;
				var _g21 = 0;
				var _g11 = this.level.width;
				while(_g21 < _g11) {
					var y1 = _g21++;
					var _g41 = 0;
					var _g31 = this.level.height;
					while(_g41 < _g31) {
						var x1 = _g41++;
						b1.writeUInt16(data1[r++]);
					}
				}
				if(t.file == null) return null; else return { file : t.file, size : t.size, stride : t.stride, data : haxe.crypto.Base64.encode(b1.getBytes())};
				break;
			}
		}
	}
	,__class__: lvl.LayerData
};
var nodejs = {};
nodejs.webkit = {};
nodejs.webkit.$ui = function() { };
$hxClasses["nodejs.webkit.$ui"] = nodejs.webkit.$ui;
nodejs.webkit.$ui.__name__ = ["nodejs","webkit","$ui"];
var sys = {};
sys.FileSystem = function() { };
$hxClasses["sys.FileSystem"] = sys.FileSystem;
sys.FileSystem.__name__ = ["sys","FileSystem"];
sys.FileSystem.exists = function(path) {
	return js.Node.require("fs").existsSync(path);
};
sys.FileSystem.rename = function(path,newpath) {
	js.Node.require("fs").renameSync(path,newpath);
};
sys.FileSystem.stat = function(path) {
	return js.Node.require("fs").statSync(path);
};
sys.FileSystem.fullPath = function(relpath) {
	return js.Node.require("path").resolve(null,relpath);
};
sys.FileSystem.isDirectory = function(path) {
	if(js.Node.require("fs").statSync(path).isSymbolicLink()) return false; else return js.Node.require("fs").statSync(path).isDirectory();
};
sys.FileSystem.createDirectory = function(path) {
	js.Node.require("fs").mkdirSync(path);
};
sys.FileSystem.deleteFile = function(path) {
	js.Node.require("fs").unlinkSync(path);
};
sys.FileSystem.deleteDirectory = function(path) {
	js.Node.require("fs").rmdirSync(path);
};
sys.FileSystem.readDirectory = function(path) {
	return js.Node.require("fs").readdirSync(path);
};
sys.FileSystem.signature = function(path) {
	var shasum = js.Node.require("crypto").createHash("md5");
	shasum.update(js.Node.require("fs").readFileSync(path));
	return shasum.digest("hex");
};
sys.FileSystem.join = function(p1,p2,p3) {
	return js.Node.require("path").join(p1 == null?"":p1,p2 == null?"":p2,p3 == null?"":p3);
};
sys.FileSystem.readRecursive = function(path,filter) {
	var files = sys.FileSystem.readRecursiveInternal(path,null,filter);
	if(files == null) return []; else return files;
};
sys.FileSystem.readRecursiveInternal = function(root,dir,filter) {
	if(dir == null) dir = "";
	if(root == null) return null;
	var dirPath = js.Node.require("path").join(root == null?"":root,dir == null?"":dir,"");
	if(!(js.Node.require("fs").existsSync(dirPath) && sys.FileSystem.isDirectory(dirPath))) return null;
	var result = [];
	var _g = 0;
	var _g1 = js.Node.require("fs").readdirSync(dirPath);
	while(_g < _g1.length) {
		var file = _g1[_g];
		++_g;
		var fullPath = js.Node.require("path").join(dirPath == null?"":dirPath,file == null?"":file,"");
		var relPath;
		if(dir == "") relPath = file; else relPath = js.Node.require("path").join(dir == null?"":dir,file == null?"":file,"");
		if(js.Node.require("fs").existsSync(fullPath)) {
			if(sys.FileSystem.isDirectory(fullPath)) {
				if(fullPath.charCodeAt(fullPath.length - 1) == 47) fullPath = HxOverrides.substr(fullPath,0,-1);
				if(filter != null && !filter(relPath)) continue;
				var recursedResults = sys.FileSystem.readRecursiveInternal(root,relPath,filter);
				if(recursedResults != null && recursedResults.length > 0) result = result.concat(recursedResults);
			} else if(filter == null || filter(relPath)) result.push(relPath);
		}
	}
	return result;
};
sys.io = {};
sys.io.File = function() { };
$hxClasses["sys.io.File"] = sys.io.File;
sys.io.File.__name__ = ["sys","io","File"];
sys.io.File.append = function(path,binary) {
	throw "Not implemented";
	return null;
};
sys.io.File.copy = function(src,dst) {
	var content = js.Node.require("fs").readFileSync(src);
	js.Node.require("fs").writeFileSync(dst,content);
};
sys.io.File.getBytes = function(path) {
	var o = js.Node.require("fs").openSync(path,"r");
	var s = js.Node.require("fs").fstatSync(o);
	var len = s.size;
	var pos = 0;
	var bytes = haxe.io.Bytes.alloc(s.size);
	while(len > 0) {
		var r = js.Node.require("fs").readSync(o,bytes.b,pos,len,null);
		pos += r;
		len -= r;
	}
	js.Node.require("fs").closeSync(o);
	return bytes;
};
sys.io.File.getContent = function(path) {
	return js.Node.require("fs").readFileSync(path,"utf8");
};
sys.io.File.saveContent = function(path,content) {
	js.Node.require("fs").writeFileSync(path,content);
};
sys.io.File.write = function(path,binary) {
	throw "Not implemented";
	return null;
};
function $iterator(o) { if( o instanceof Array ) return function() { return HxOverrides.iter(o); }; return typeof(o.iterator) == 'function' ? $bind(o,o.iterator) : o.iterator; }
var $_, $fid = 0;
function $bind(o,m) { if( m == null ) return null; if( m.__id__ == null ) m.__id__ = $fid++; var f; if( o.hx__closures__ == null ) o.hx__closures__ = {}; else f = o.hx__closures__[m.__id__]; if( f == null ) { f = function(){ return f.method.apply(f.scope, arguments); }; f.scope = o; f.method = m; o.hx__closures__[m.__id__] = f; } return f; }
if(Array.prototype.indexOf) HxOverrides.indexOf = function(a,o,i) {
	return Array.prototype.indexOf.call(a,o,i);
};
$hxClasses.Math = Math;
String.prototype.__class__ = $hxClasses.String = String;
String.__name__ = ["String"];
$hxClasses.Array = Array;
Array.__name__ = ["Array"];
Date.prototype.__class__ = $hxClasses.Date = Date;
Date.__name__ = ["Date"];
var Int = $hxClasses.Int = { __name__ : ["Int"]};
var Dynamic = $hxClasses.Dynamic = { __name__ : ["Dynamic"]};
var Float = $hxClasses.Float = Number;
Float.__name__ = ["Float"];
var Bool = $hxClasses.Bool = Boolean;
Bool.__ename__ = ["Bool"];
var Class = $hxClasses.Class = { __name__ : ["Class"]};
var Enum = { };
if(Array.prototype.map == null) Array.prototype.map = function(f) {
	var a = [];
	var _g1 = 0;
	var _g = this.length;
	while(_g1 < _g) {
		var i = _g1++;
		a[i] = f(this[i]);
	}
	return a;
};
if(Array.prototype.filter == null) Array.prototype.filter = function(f1) {
	var a1 = [];
	var _g11 = 0;
	var _g2 = this.length;
	while(_g11 < _g2) {
		var i1 = _g11++;
		var e = this[i1];
		if(f1(e)) a1.push(e);
	}
	return a1;
};
var q = window.jQuery;
js.JQuery = q;
q.fn.iterator = function() {
	return { pos : 0, j : this, hasNext : function() {
		return this.pos < this.j.length;
	}, next : function() {
		return $(this.j[this.pos++]);
	}};
};
var module, setImmediate, clearImmediate;
js.Node.setTimeout = setTimeout;
js.Node.clearTimeout = clearTimeout;
js.Node.setInterval = setInterval;
js.Node.clearInterval = clearInterval;
js.Node.global = global;
js.Node.process = process;
js.Node.require = require;
js.Node.console = console;
js.Node.module = module;
js.Node.stringify = JSON.stringify;
js.Node.parse = JSON.parse;
var version = HxOverrides.substr(js.Node.process.version,1,null).split(".").map(Std.parseInt);
if(version[0] > 0 || version[1] >= 9) {
	js.Node.setImmediate = setImmediate;
	js.Node.clearImmediate = clearImmediate;
}
nodejs.webkit.$ui = require('nw.gui');
nodejs.webkit.Clipboard = nodejs.webkit.$ui.Clipboard;
nodejs.webkit.Menu = nodejs.webkit.$ui.Menu;
nodejs.webkit.MenuItem = nodejs.webkit.$ui.MenuItem;
nodejs.webkit.Shell = nodejs.webkit.$ui.Shell;
nodejs.webkit.Window = nodejs.webkit.$ui.Window;
Level.UID = 0;
K.INSERT = 45;
K.DELETE = 46;
K.LEFT = 37;
K.UP = 38;
K.RIGHT = 39;
K.DOWN = 40;
K.ESC = 27;
K.TAB = 9;
K.ENTER = 13;
K.F2 = 113;
K.F3 = 114;
K.F4 = 115;
K.NUMPAD_ADD = 107;
K.NUMPAD_SUB = 109;
K.NUMPAD_DIV = 111;
Main.UID = 0;
haxe.Serializer.USE_CACHE = false;
haxe.Serializer.USE_ENUM_INDEX = false;
haxe.Serializer.BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789%:";
haxe.Unserializer.DEFAULT_RESOLVER = Type;
haxe.Unserializer.BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789%:";
haxe.crypto.Base64.CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
haxe.crypto.Base64.BYTES = haxe.io.Bytes.ofString(haxe.crypto.Base64.CHARS);
haxe.ds.ObjectMap.count = 0;
js.NodeC.UTF8 = "utf8";
js.NodeC.ASCII = "ascii";
js.NodeC.BINARY = "binary";
js.NodeC.BASE64 = "base64";
js.NodeC.HEX = "hex";
js.NodeC.EVENT_EVENTEMITTER_NEWLISTENER = "newListener";
js.NodeC.EVENT_EVENTEMITTER_ERROR = "error";
js.NodeC.EVENT_STREAM_DATA = "data";
js.NodeC.EVENT_STREAM_END = "end";
js.NodeC.EVENT_STREAM_ERROR = "error";
js.NodeC.EVENT_STREAM_CLOSE = "close";
js.NodeC.EVENT_STREAM_DRAIN = "drain";
js.NodeC.EVENT_STREAM_CONNECT = "connect";
js.NodeC.EVENT_STREAM_SECURE = "secure";
js.NodeC.EVENT_STREAM_TIMEOUT = "timeout";
js.NodeC.EVENT_STREAM_PIPE = "pipe";
js.NodeC.EVENT_PROCESS_EXIT = "exit";
js.NodeC.EVENT_PROCESS_UNCAUGHTEXCEPTION = "uncaughtException";
js.NodeC.EVENT_PROCESS_SIGINT = "SIGINT";
js.NodeC.EVENT_PROCESS_SIGUSR1 = "SIGUSR1";
js.NodeC.EVENT_CHILDPROCESS_EXIT = "exit";
js.NodeC.EVENT_HTTPSERVER_REQUEST = "request";
js.NodeC.EVENT_HTTPSERVER_CONNECTION = "connection";
js.NodeC.EVENT_HTTPSERVER_CLOSE = "close";
js.NodeC.EVENT_HTTPSERVER_UPGRADE = "upgrade";
js.NodeC.EVENT_HTTPSERVER_CLIENTERROR = "clientError";
js.NodeC.EVENT_HTTPSERVERREQUEST_DATA = "data";
js.NodeC.EVENT_HTTPSERVERREQUEST_END = "end";
js.NodeC.EVENT_CLIENTREQUEST_RESPONSE = "response";
js.NodeC.EVENT_CLIENTRESPONSE_DATA = "data";
js.NodeC.EVENT_CLIENTRESPONSE_END = "end";
js.NodeC.EVENT_NETSERVER_CONNECTION = "connection";
js.NodeC.EVENT_NETSERVER_CLOSE = "close";
js.NodeC.FILE_READ = "r";
js.NodeC.FILE_READ_APPEND = "r+";
js.NodeC.FILE_WRITE = "w";
js.NodeC.FILE_WRITE_APPEND = "a+";
js.NodeC.FILE_READWRITE = "a";
js.NodeC.FILE_READWRITE_APPEND = "a+";
lvl.Image.cache = new haxe.ds.StringMap();
Main.main();
})();
