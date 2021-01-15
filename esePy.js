let print = console.log

let bytearray = Uint8Array


class IOBase{
	constructor(bytes){
		this.data = bytes
		this.seekPoint = 0
	}
	read(num=this.data.length){
		this.seekPoint+=num
		return this.data.slice(this.seekPoint-num,this.seekPoint)
	}
	seek(moveNum,seekType=0){
		switch (seekType){
			case 0:
				this.seekPoint = moveNum
				break
			case 1:
				this.seekPoint += moveNum
				break
			case 2:
				this.seekPoint = moveNum + this.data.length
				break
		}
	}
	tell(){
		return this.seekPoint
	}
}


let range = n => [...Array(n).keys()];

let str = String

let toString = Object.prototype.toString;
function typeOf(obj) {
	return toString.call(obj).slice(8, -1).toLowerCase();
}

function int(str,int=10){
	return parseInt(str,int)
}

function len(l){
		return l.length
}

function reversed(l){
		return l.reverse()
}
function enumerate(l){
		return l.entries()
}
function clamp(x, min, max){
	if (x < min){
		x = min
	} else if (x > max){
		x = max
	}
	return x
}



let structFormatTypes = {
	"x":{"size":1,"signed":false},
	"c":{"size":1,"signed":false},
	"b":{"size":1,"signed":true },
	"B":{"size":1,"signed":false},
	"?":{"size":1,"signed":false},
	"h":{"size":2,"signed":true },
	"H":{"size":2,"signed":false},
	"i":{"size":4,"signed":true },
	"I":{"size":4,"signed":false},
	"l":{"size":4,"signed":true },
	"L":{"size":4,"signed":false},
	"q":{"size":8,"signed":true },
	"Q":{"size":8,"signed":false},
	"n":{"size":1,"signed":true },
	"N":{"size":1,"signed":false},
	"e":{"size":2,"signed":true },
	"f":{"size":4,"signed":true },
	"d":{"size":8,"signed":true },
	"s":{"size":1,"signed":false},
	"p":{"size":1,"signed":false},
	"P":{"size":1,"signed":false},
}

function pack(structStr){
	let datas = [...arguments]
	datas.shift()
	datas = datas.flat()
	let endian = "little"
	let byteSize = 0
	let num = 0
	let structs = structStr.matchAll(/([><]?)(\d*?)([xc\?bBhHiIlLqQnNefdspP])/g)
	let dataPtr = 0
	let bytes = []
	let byte = 0
	let data = 0

	for ( const s of structs){

		endian = "little"
		byteSize = 0
		num = 1
		byte=0

		if (s[1]===">"){
			endian = "big"
		}else if (s[1]==="<"){
			endian = "little"
		}
		if (s[2]!==""){
			num = parseInt(s[2],int)
		}
		for ( let j=0; j<num; j++){
			data = datas[dataPtr]
			if (structFormatTypes[s[3]].signed===true){
				if (data<0){
					data = (structFormatTypes[s[3]].size*2)**8 + data
				}
			}
			for ( let k=0; k<structFormatTypes[s[3]].size; k++){
				if (endian==="little"){
					byte = (data>>(8*k))&0xff
				}else{
					byte = (data>>(8*(structFormatTypes[s[3]].size-1-k)))&0xff
				}
				bytes.push(byte)
			}
			dataPtr++
		}
		dataPtr++
	}
	return bytes
}

function unpack(structStr, bytes){
	let endian = "little"
	let byteSize = 0
	let num = 0
	let structs = structStr.matchAll(/([><]?)(\d*?)([xc\?bBhHiIlLqQnNefdspP])/g)
	let dataPtr = 0
	let datas = []
	let data = 0

	for ( const s of structs){

		endian = "little"
		byteSize = 0
		num = 1

		if (s[1]===">"){
			endian = "big"
		}else if (s[1]==="<"){
			endian = "little"
		}
		if (s[2]!==""){
			num = parseInt(s[2],int)
		}
		for ( let j=0; j<num; j++){
			let byte = bytes.slice(dataPtr,dataPtr+structFormatTypes[s[3]].size)
			for ( let k=0; k<structFormatTypes[s[3]].size; k++){
				if (endian==="little"){
					data |= byte[k]<<(8*k)
				}else{
					data |= byte[structFormatTypes[s[3]].size-1-k]<<(8*k)
				}
			}
			if (structFormatTypes[s[3]].signed===true){
				data = ~data+1
			}
			datas.push(data)
			dataPtr++
		}
		dataPtr++
	}
	return datas
}

export { pack, unpack,enumerate,reversed,len,int,str,range,IOBase,bytearray,print  };
