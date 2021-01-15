import {  pack, unpack,enumerate,reversed,len,int,str,range,IOBase,bytearray,print  } from "./esePy.js";

Array.prototype.append = function(value){
	this.push(value)
}

Uint8Array.prototype.decode = function(decodeType='utf8'){
	if (decodeType==="ascii"){
		decodeType="utf8"
	}
	decodeType="utf8"
	let decoder = new TextDecoder(decodeType)
	return decoder.decode(this)
}

String.prototype.encode = function(decodeType='utf8'){
	if (decodeType==="ascii"){
		decodeType="utf8"
	}
	decodeType="utf8"
	let encoder = new TextEncoder(decodeType)
	return encoder.encode(this)
}



class WavFile{
	constructor(){
		this.Header = new WavHeader()
		this.Chunk = new WavChunk()
	}

	read( fileBytes){

		let data = new IOBase(fileBytes)

		this.Header.read(data)
		this.Chunk.read(data, this.Header)

	}
	isEven(num){
		return num % 2 == 0
	}

//	def write(this, filePath):
//
//		file = open(filePath,"wb")
//
//		data = bytearray(this.Header.write())
//
//
//		offset = len(data)
//		data += this.Chunk["fmt "].write()
//		pack_into("<I", data, offset+4, len(data)-(offset+8))
//
//		offset = len(data)
//		data += this.Chunk["data"].write()
//		pack_into("<I", data, offset+4, len(data)-(offset+8))
//
//
//		for key in this.Chunk.keys():
//			if key == "fmt " or key == "data":
//				continue
//			offset = len(data)
//			data += this.Chunk[key].write()
//
//			pack_into("<I", data, offset+4, len(data)-(offset+8))
//
//
//		pack_into("<I", data, 4, len(data) - 8 )
//
//		file.write(data)
//		file.close()

//	def setFmt(this, ch=2, bit=16, sampleRate=48000):
//
//		key = "fmt "
//		this.Chunk[key].NumChannels = ch
//		this.Chunk[key].Bit = bit
//		this.Chunk[key].SampleRate = sampleRate
//		this.Chunk[key].BlockAlign = this.Chunk[key].NumChannels * (i.Bit//8)
//		this.Chunk[key].Bps = this.Chunk[key].SampleRate * this.Chunk[key].BlockAlign
//
//		return
//
//	def remove(this, id):
//		this.Chunk.pop(id)
//
//	def add(this, id):
//		this.Chunk[id] = this.Chunk.options.get(id, this.Chunk.noMatch)()
//
//	def addFmt(this):
//		this.Chunk["fmt "] = this.WavChunk.chunkFmt()
//
//	def addData(this):
//		this.Chunk["data"] = this.WavChunk.chunkData()
//
//	def setData(this, data):
//		key = "data"
//		this.Chunk[key].Data = data
//		return
//
//	def addSmpl(this):
//		this.Chunk["smpl"] = this.WavChunk.chunkSmpl()
//
//	def setSmpl(this, start, end):
//		key = "smpl"
//		this.Chunk[key].NumSampleLoops = this.Chunk[key].NumSampleLoops + 1
//		this.Chunk[key].CuePointID.append( 0 )
//		this.Chunk[key].Type.append( 0 )
//		this.Chunk[key].Start.append( start )
//		this.Chunk[key].End.append( end )
//		this.Chunk[key].Fraction.append( 0 )
//		this.Chunk[key].PlayCount.append( 0 )
//		return
//
//
	checkChunk( idText){
//		return this.Chunk.get(idText)
		return (idText in this.Chunk)
	}
//	def getChunkNum(this, idText):
//		for i,chunk in enumerate(this.Chunk):
//			if (chunk.Id==idText):
//				return i
//
//		return -1
}
class WavHeader{
	constructor(){
		this.Id = "RIFF"
		this.Size = 0
		this.FileType = "WAVE"
		return
	}

	read( data ){
		this.Id = data.read(4).decode("ascii")
		this.Size = unpack("<I" ,data.read(4))[0]
		this.FileType = data.read(4).decode("ascii")
	}
//
//		def write(this):
//			data = pack("4s", this.Id.encode("ascii") )
//			data += pack("<I", 0)
//			data += pack("4s", this.FileType.encode("ascii"))
//			return data
}


class WavChunk{
	constructor(){
		return
	}

	read(data,header){

		while (data.tell() < header.Size + 8){

			let id = data.read(4).decode("ascii")
			let size = unpack("<I" ,data.read(4))[0]
			let offsetAddr = data.tell()

			switch (id){
				case "fmt ":
					this[id] = new chunkFmt()
					break
				case "data":
					this[id] = new chunkData()
					break
				case "smpl":
					this[id] = new chunkSmpl()
					break
				default:
					this[id] = new noMatch()
					break
			}

//				this[id] = this.options.get(id, this.noMatch)()

			this[id].Id = id
			this[id].Size = size

			this[id].read(data)

			data.seek(offsetAddr + size,0)
		}
		return
	}

//		def write(this, data):
//			this.write
//
//			return
}
class noMatch{

	constructor(){
		this.Id = ""
		this.Size = 0
		return
	}

	read( data){
		this.Data = data.read(this.Size)
		return
	}

//			def write(this):
//				data = pack("4s" , this.Id.encode("ascii") )
//				data += pack("<I" , 0)
//		#		data += pack(str(this.Size)+"B",*this.Data)
//				data += this.Data
//				return data
}
class chunkFmt{
	constructor(){
		this.Id = "fmt "
		this.Size = 0

		this.CompCode = 1
		this.NumChannels = 2
		this.Bit = 16
		this.SampleRate = 48000
		this.BlockAlign = this.NumChannels + (this.Bit/8|0)
		this.Bps = this.SampleRate * this.BlockAlign

		this.ExSize = 0
		this.ExData = 0

		return
	}
	read(data){

		this.CompCode = unpack("<H" ,data.read(2))[0]
		this.NumChannels = unpack("<H" ,data.read(2))[0]
		this.SampleRate = unpack("<I" ,data.read(4))[0]
		this.Bps = unpack("<I" ,data.read(4))[0]
		this.BlockAlign = unpack("<H" ,data.read(2))[0]
		this.Bit = unpack("<H" ,data.read(2))[0]
		if( this.CompCode != 1){
			this.ExSize = unpack("<H" ,data.read(2))[0]
			this.ExData = data.read(this.ExSize)
		}
		return
	}
//			def write(this):
//				data = pack("4s" , this.Id.encode("ascii") )
//				data += pack("<I" , 0)
//				data += pack("<H" , this.CompCode		)
//				data += pack("<H" , this.NumChannels	)
//				data += pack("<I" , this.SampleRate		)
//				data += pack("<I" , this.Bps			)
//				data += pack("<H" , this.BlockAlign		)
//				data += pack("<H" , this.Bit			)
//				if this.CompCode != 1:
//					data += pack("<H" , this.ExSize			)
//					data += this.ExData
//
//				return data
}

class chunkData{
	constructor(){
		this.Id = "data"
		this.Size = 0

		this.Data = 0
		return
	}
	read(data){
		this.Data = new bytearray(data.read(this.Size))
		return
	}
//			def write(this):
//				data = pack("4s" , this.Id.encode("ascii") )
//				data += pack("<I" , 0)
//
//				data += this.Data
//
//				if WavFile.isEven( len(data) ):
//					pass
//				else:
//		#			data += b"\x80"
//					data += data[len(data)-1].to_bytes(1,"little")
//				return data
}

class chunkSmpl{
	constructor(){
		this.Id = "smpl"
		this.Size = 0

		this.Manufacturer = 0
		this.Product = 0
		this.SamplePeriod = 0
		this.MIDIUnityNote = 60
		this.MIDIPitchFraction = 0
		this.SMPTEFormat = 0
		this.SMPTEOffset = 0
		this.NumSampleLoops = 0
		this.SamplerData = 0


		this.CuePointID = []
		this.Type = []
		this.Start = []
		this.End = []
		this.Fraction = []
		this.PlayCount = []
		return
	}
	read(data){

		this.Manufacturer = unpack("<I" ,data.read(4))[0]
		this.Product = unpack("<I" ,data.read(4))[0]
		this.SamplePeriod = unpack("<I" ,data.read(4))[0]
		this.MIDIUnityNote = unpack("<I" ,data.read(4))[0]
		this.MIDIPitchFraction = unpack("<I" ,data.read(4))[0]
		this.SMPTEFormat = unpack("<I" ,data.read(4))[0]
		this.SMPTEOffset = unpack("<I" ,data.read(4))[0]
		this.NumSampleLoops = unpack("<I" ,data.read(4))[0]
		this.SamplerData = unpack("<I" ,data.read(4))[0]


		for ( let i of range(this.NumSampleLoops)){

			this.CuePointID.append( unpack("<I" ,data.read(4))[0] )
			this.Type.append( unpack("<I" ,data.read(4))[0] )
			this.Start.append( unpack("<I" ,data.read(4))[0] )
			this.End.append( unpack("<I" ,data.read(4))[0] )
			this.Fraction.append( unpack("<I" ,data.read(4))[0] )
			this.PlayCount.append( unpack("<I" ,data.read(4))[0] )

		}
		return
	}
//			def write(this):
//				data = pack("4s" , this.Id.encode("ascii") )
//				data += pack("<I" , 0)
//
//				data += pack("<I" , this.Manufacturer		)
//				data += pack("<I" , this.Product			)
//				data += pack("<I" , this.SamplePeriod		)
//				data += pack("<I" , this.MIDIUnityNote		)
//				data += pack("<I" , this.MIDIPitchFraction	)
//				data += pack("<I" , this.SMPTEFormat		)
//				data += pack("<I" , this.SMPTEOffset		)
//				data += pack("<I" , this.NumSampleLoops		)
//				data += pack("<I" , this.SamplerData		)
//
//				for i in range(this.NumSampleLoops):
//					data += pack("<I" , this.CuePointID[i]		)
//					data += pack("<I" , this.Type[i]			)
//					data += pack("<I" , this.Start[i]			)
//					data += pack("<I" , this.End[i]				)
//					data += pack("<I" , this.Fraction[i]		)
//					data += pack("<I" , this.PlayCount[i]		)
//
//				return data
}

export { WavFile };

