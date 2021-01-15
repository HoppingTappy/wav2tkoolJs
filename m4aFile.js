import {  pack, unpack,enumerate,reversed,len,int,str,range,IOBase,bytearray,print  } from "./esePy.js";
Array.prototype.append = function(value){
	this.push(value)
}

Array.prototype.extend = function(value){
	this.push(...value)
}

Uint8Array.prototype.decode = function(decodeType='utf8'){
	if (decodeType==="ascii"){
		decodeType="utf8"
	}
	decodeType="utf8"
	let decoder = new TextDecoder(decodeType)
	return decoder.decode(this)
}

Array.prototype.decode = function(decodeType='utf8'){
	if (decodeType==="ascii"){
		decodeType="utf8"
	}
	decodeType="utf8"
	let decoder = new TextDecoder(decodeType)
	return decoder.decode(new Uint8Array(this))
}

String.prototype.encode = function(decodeType='utf8'){
	if (decodeType==="ascii"){
		decodeType="utf8"
	}
	decodeType="utf8"
	let encoder = new TextEncoder(decodeType)
	return Array.from(encoder.encode(this))
}

function getOpt(obj,key,commonDataChunk){
	if (obj[key]){
		return new obj[key]()
	}else{
		return new commonDataChunk()
	}
}


class M4aFile{
	constructor(){
		this.Chunks = new M4aChunk()
	}

	read( fileBytes ){
		
		let data = new IOBase(Array.from(fileBytes))

		this.Chunks.read(data)

	}

	write(){

		let data = []

		for (const key in this.Chunks){
			data = data.concat(this.Chunks[key].write())
		}
		data = new Uint8Array(data)

		return data
	}
	remove(id){
		delete this.Chunks[id]
	}
	add(id){
		this.Chunks[id] = getOpt(options,id, commonDataChunk)
	}

	setTag(tagid,tagValue){
		this.Chunks["moov"]["udta"]["meta"]["ilst"].add("----")
		const lastIndex = len(this.Chunks["moov"]["udta"]["meta"]["ilst"])-1
		this.Chunks["moov"]["udta"]["meta"]["ilst"][lastIndex].add("name")
		this.Chunks["moov"]["udta"]["meta"]["ilst"][lastIndex]["name"].setData(tagid)
		this.Chunks["moov"]["udta"]["meta"]["ilst"][lastIndex].add("data")
		this.Chunks["moov"]["udta"]["meta"]["ilst"][lastIndex]["data"].setData(tagValue)
	}

//	def checkChunk(this, idText):
//
//		return this.Chunks.get(idText)
//
//	def getChunkNum(this, idText):
//		for i,chunk in enumerate(this.Chunks):
//			if (chunk.Id==idText):
//				return i
//
//		return -1

}


class M4aChunk{
	read(data){
		const fileSize = len(data.read())
		data.seek(0)
		while (data.tell() < fileSize){
			const offsetAddr = data.tell()
			let expandFlag = false
			let seekByte = 8
			let size = unpack(">I" ,data.read(4))[0]
			if (size==1){
				expandFlag = true
				seekByte = 16
			}
			const id = data.read(4).decode("shift-jis")
			if (expandFlag){
				size = unpack(">Q" ,data.read(8))[0]
			}
			data.seek(-seekByte,1)

			this[id] = getOpt(options,id, commonDataChunk)
			this[id].parent = this
			this[id].read(data)

			data.seek(offsetAddr + size,0)
		}
		return
	}
}
class commonDataChunk{
	constructor(){
		this.id = ""
//		this.data = new bytearray()
		this.data = []
		return
	}
	read( data ){
		let expandFlag = false
		let seekByte = 8
		let size = unpack(">I" ,data.read(4))[0]
		if (size==1){
			expandFlag = true
			seekByte = 16
		}
		this.id = data.read(4).decode("shift-jis")
		if (expandFlag){
			size = unpack(">Q" ,data.read(8))[0]
		}
		this.data = data.read(size-seekByte)
		return
	}
	write(){
		let data = []
		if (this.id=="hdlr" && this.parent.id=="meta"){
			data = data.concat( pack(">Q" , len(this.data)+8) )
		}else{
			data = data.concat( pack(">I" , len(this.data)+8) )
		}
		data = data.concat( pack("4s" , this.id.encode("shift-jis") ) )
		data = data.concat( Array.from(this.data) )
		return data
	}
	remove(){
		delete this.parent[this.id]
	}
	add(id){
		this[id] = getOpt(options,id, commonDataChunk)
		this[id].parent = this
		this[id].id = id
	}

	setData(data){
		this.data = []
		if (this.id=="data"){
			this.data = this.data.concat( pack(">I",1) )
		}
		this.data = this.data.concat( pack(">I",0) )
		this.data = this.data.concat( pack(str(len(data))+"s" , data.encode("shift-jis") ) )
	}

	clear(){
		this.data = []
	}
}

class subChunk{
	constructor(){
		this.id = ""
		return
	}
	read( data){
		let size = unpack(">I" ,data.read(4))[0]
		this.id = data.read(4).decode("shift-jis")
		let endAddr = data.tell()+size-8

		while ( data.tell() < endAddr){
			let offsetAddr = data.tell()
			let expandFlag = false
			let seekByte = 8
			let size = unpack(">I" ,data.read(4))[0]
			if (size==0){
				size = unpack(">I" ,data.read(4))[0]
				offsetAddr+=4
			}

			if (size==1){
				expandFlag = true
				seekByte = 16
			}
			let id = data.read(4).decode("shift-jis")
			if (expandFlag){
				size = unpack(">Q" ,data.read(8))[0]
			}
			data.seek(-seekByte,1)
			this[id] = getOpt(options,id, commonDataChunk)
			this[id].parent = this
			this[id].read(data)

			data.seek(offsetAddr + size,0)
		}
		return
	}
	write(){
		let data = []
		data = data.concat( pack(">I" , 0) )
		data = data.concat( pack("4s" , this.id.encode("shift-jis") ) )
		for (const key in this){
			if (key!=="id" && key!=="parent"){
				data = data.concat( this[key].write() )
			}
		}
		data.splice(0,4, ...pack(">I" , len(data)))
		return data
	}
	remove(){
		delete this.parent[this.id]
	}

	add(id){
		this[id] = getOpt(options,id, commonDataChunk)
		this[id].parent = this
		this[id].id = id
	}
}
class ilstChunk extends Array{
	constructor(){
		super()
		this.id = ""
		return
	}
	read(data){
		let size = unpack(">I" ,data.read(4))[0]
		this.id = data.read(4).decode("shift-jis")
		let endAddr = data.tell()+size-8
		while (data.tell() < endAddr){
			let offsetAddr = data.tell()
			let expandFlag = false
			let seekByte = 8
			let size = unpack(">I" ,data.read(4))[0]
			if (size==0){
				size = unpack(">I" ,data.read(4))[0]
			}

			if (size==1){
				expandFlag = true
				seekByte = 16
			}
			let id = data.read(4).decode("shift-jis")
			if (expandFlag){
				size = unpack(">Q" ,data.read(8))[0]
			}
			data.seek(-seekByte,1)
			this.append( getOpt(options,id, commonDataChunk) )
			this[len(this)-1].parent = this
			this[len(this)-1].read(data)

			data.seek(offsetAddr + size,0)
		}
		return
	}
	write(){
		let data = []
		data = data.concat( pack(">I" , 0) )
		data = data.concat( pack("4s" , this.id.encode("shift-jis") ) )
		for (const l of this){
			data = data.concat( l.write() )
		}
		data.splice(0,4, ...pack(">I" , len(data)))
		return data
	}
	remove(){
		delete this.parent[this.id]
	}


	add(id){
		this.append(getOpt(options,id, commonDataChunk))
		this[len(this)-1].parent = this
		this[len(this)-1].id = id
	}
}
let options = {
	"moov"						:subChunk,
	"udta"						:subChunk,
	"trak"						:subChunk,
	"mdia"						:subChunk,
	"minf"						:subChunk,
	"edts"						:subChunk,
	"stbl"						:subChunk,
	"meta"						:subChunk,
	"ilst"						:ilstChunk,
//		"data"						:subChunk,
//		"ｳtoo"						:subChunk,
	"----"						:subChunk,
//		"name"						:idChunk,
}
export { M4aFile };

