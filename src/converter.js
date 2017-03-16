/**
 * 功能：数据整流器
 * 用来进行数据形式转换，将源数据对象，转换成指定格式的数据
 * 应用场景：将接口数据转换成页面所需数据形式等需要进行数据转换的场景
 * 备注：独自使用只生成一级JSON数据，但可以通过使用function形式的默认值进行嵌套，生成多级数据
 * Created by 赵宇飞 on 2017/3/14.
 * 支持：不需要其他框架或者库的支持
 */
(function(){
	var converter = function(){
		var self = this;
		self.debug = true;//--是否开启测试信息

		/**
		 * 内部数据，数据对应关系设置信息，通过config函数进行设置
		 * 数据形式：
		 * @key: {//--每行赛事信息的数据对应关系； t: 选项说明; k: 选项在源数据中的键值，文本类型; d: 选项默认值
				@opt1: {t: "编号", k: "serial_no", d: ""},
				@opt2: {t: "赛事", k: "league_name", d: ""}
			}
		* 关于默认值d：可以使任意形式的数据或者对象，也可以是匿名函数。匿名函数接收 apiData 和 _self 两个参数。
		* apiData代表源数据对象，_self代表生成的数据实例本身
		*/
		var $default = {
			//item: {//--每行赛事信息的数据对应关系； t: 选项说明; k: 选项在源数据中的键值，文本类型; d: 选项默认值
			//	no: {t: "编号", k: "serial_no", d: ""},
			//	saishi: {t: "赛事", k: "league_name", d: ""}
			//}
		};

		/**
		 * 数据转换设置，设置新数据与原数据的对应关系
		 * 使用方式：
		 * 注意：选项数据格式 = {t: "描述信息", k: "键值", d: "默认值"}
		 * 关于默认值：	可以是object对象，但实例化后，所有实例化对象共享
		 * 				可以是function，,会被立即执行
		 * converter.config({
				key: "toto_Item",
				opts: {
					no: {t: "编号", k: "serial_no", d: ""},
					saishi: {t: "赛事", k: "league_name", d: ""},
					bgcolor: {t: "赛事背景色", k: "league_color[0]", d: ""},
					fontcolor: {t: "赛事字体颜色", k: "league_color[1]", d: "#000"},
					date: {t: "比赛时间", k: "match_time", d: ""},
					id: {t: "标识", k: "match_id", d: ""},
					hostName: {t: "主队名称", k: "host_name_s", d: ""},
					guestName: {t: "客队名称", k: "guest_name_s", d: ""},
					peilv3: {t: "胜赔率", k: "odds[3]", d: "0"},
					peilv1: {t: "平赔率", k: "odds[1]", d: "0"},
					peilv0: {t: "负赔率", k: "odds[0]", d: "0"},
					selected: {t: "选中项", k: "", d: []},
					dan: {t: "胆", k: "", d: false}
				}
			});
		*/
		self.config = function(params){
			var key = params.key,
				opts = params.opts;
			$default[key] = opts;
		};

		/**
		 * 数据原型工厂对象：
		 * 用来根据设置，生成指定的数据原型函数。
		 * 只有create一个方法。方法接收@key参数，@key为通过config设置的对应信息键值
		 * create方法返回一个数据原型函数。该函数自带 reload 和 getJson 方法。
		 * reload方法用来重新刷新数据，参数为源数据对象
		 * getJson方法用来获取纯JSON对象，会剔除构造函数对象属性中的function
		 */
		self.factory = new function(){//--数据信息创建工厂
			var _self = this;
			_self.create = function(key){//--创建并返回行数据原型
				var arr = [];//--接口数据信息映射处理
				if(!$default[key]){
					if(self.debug) {
						console.debug("不存在类型为" + key + "的接口对应关系");
					}
					return new function(){};
				}
				arr.push("var debug = " + self.debug + ";");
				arr.push("var _default = $default['" + key + "'];");
				for(var i in $default[key]){
					arr.push("try{");
					if($default[key][i].k){//--当设置中存在键值时，获取键值代表数据
						arr.push("var val = apiData." + $default[key][i].k + ";");
						arr.push("switch (typeof val) {");
						arr.push("case 'undefined': throw ''; break;");//--当值不存在时，进入获取默认值流程
						arr.push("case 'function': _self." + i + " = val(apiData, _self); break;");//--当值的类型为function，立即执行获取返回值
						arr.push("default: _self." + i + " = val; break;");//--默认获得当前值
						arr.push("}");
					}else{//--当设置中不存在键值时，抛出，进入获取默认值过程
						arr.push("throw ''");
					}
					arr.push("}catch(error){");
					arr.push("try{");//--尝试获取默认值
					arr.push("var val = _default['" + i + "'].d;");
					arr.push("switch (typeof val) {");
					arr.push("case 'undefined': _self." + i + " = null; break;");
					arr.push("case 'function': _self." + i + " = val(apiData, _self); break;");
					arr.push("default: _self." + i + " = val; break;");
					arr.push("}");
					arr.push("}catch(error){");
					arr.push(" _self." + i + " = null;");
					arr.push("if(debug && error.message){");
					arr.push("console.debug(error.message)");
					arr.push("}");
					arr.push("}");
					arr.push("if(debug && error.message){");
					arr.push("console.debug(error.message)");
					arr.push("}");
					arr.push("}");
				}
				var opts = new Function("_self", "apiData", "$default", arr.join("\n"));
				var __Data = function(apiData){//--数据原型
					var _self = this;
					apiData = apiData || {};
					opts(_self, apiData, $default);
				};
				__Data.prototype.reload = function(apiData){//--重新加载数据
					var _self = this;
					apiData = apiData || {};
					opts(_self, apiData, $default);
					return _self;
				};
				__Data.prototype.getJson = function(){//--返回纯JSON数据
					var _self = this,
						r = {};
					for(var i in _self){
						if(typeof _self[i] != "function"){
							r[i] = _self[i];
						}
					}
					return r;
				};
				return __Data;
			};
		};
	};

	converter = new converter();

	if (typeof exports == "object") {//--支持 CommonJS
		module.exports = converter;
	} else if (typeof define == "function" && define.amd) {//--支持 AMD
		define([], function(){ return converter });
	} else {//--其它情况直接挂到window上
		window.converter = converter;
	}
})();
