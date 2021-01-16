import * as WavFile from "./wavFile.js"
import * as M4aFile from "./m4aFile.js"
import {  pack, unpack,enumerate,reversed,len,int,str,range,IOBase,bytearray,print  } from "./esePy.js";

String.prototype.with_suffix = function(newSuffix){
	let path = this
	if (path.lastIndexOf(".") != -1){
		path = path.substring(0, path.lastIndexOf("."))
	}
	path += newSuffix
	return path
}


async function wavConv(file,addArgs){

	const createFFmpeg = FFmpeg.createFFmpeg
	const fetchFile = FFmpeg.fetchFile
	const ffmpeg = createFFmpeg({log: true})

	const logDiv = document.getElementById("logDiv")
	const logOut = document.createElement("output")
	const brElm = document.createElement("br")
	const progress = document.getElementById("progress")


	logDiv.appendChild(logOut)
	logDiv.appendChild(brElm)

	let cmd = {}
	const inPath = file.name

	logOut.value = inPath + " を変換中"

	cmd["ogg"] = ["-y","-i",str(inPath),"-vn","-acodec","libvorbis", "-f", "ogg",inPath.with_suffix(".ogg")]
	cmd["m4a"] = ["-y","-i",str(inPath),"-vn","-acodec","aac"      , "-f", "mp4",inPath.with_suffix(".m4a")]

	let bytes = {}

	try {
		await ffmpeg.load();
	}catch (e) {
		print(e)
		logOut.value = str(inPath)+" の変換に失敗しました (" + e + ")"
	}
	ffmpeg.FS('writeFile', inPath, await fetchFile(file))

	let wavBytes = ffmpeg.FS('readFile', inPath)
	let srcWav = new WavFile.WavFile()
	srcWav.read(wavBytes)

	let loopEnable=false
	let loopStartPoint=0
	let loopLength=0
	let loopEndPoint=0

	if (srcWav.checkChunk("smpl")){
		loopEnable = true
		loopStartPoint = srcWav.Chunk["smpl"].Start[0]
		loopEndPoint = srcWav.Chunk["smpl"].End[0]
		loopLength = loopEndPoint - loopStartPoint
	}

	if (loopEnable){
		const loopArgs = ['-metadata','LOOPSTART=' + str(loopStartPoint),'-metadata','LOOPEND=' + str(loopEndPoint),'-metadata','LOOPLENGTH=' + str(loopLength)]
		for ( const key of Object.keys(cmd)){
			cmd[key].splice(3,0,...loopArgs)
		}
	}

	for (const key of Object.keys(addArgs)){
		cmd[key].splice(3,0,...addArgs[key])
		await ffmpeg.run(...cmd[key]);
		bytes[key] = ffmpeg.FS('readFile', inPath.with_suffix("."+str(key)))
	}

	ffmpeg.FS("unlink", inPath)
	ffmpeg.FS("unlink", inPath.with_suffix(".ogg"))
	ffmpeg.FS("unlink", inPath.with_suffix(".m4a"))

	if (loopEnable){
		let m4a = new M4aFile.M4aFile()
		m4a.read(bytes["m4a"])
		m4a.setTag("LOOPSTART",str(loopStartPoint))
		m4a.setTag("LOOPEND",str(loopEndPoint))
		m4a.setTag("LOOPLENGTH",str(loopLength))
		bytes["m4a"] = m4a.write()
	}

	logOut.remove()
	brElm.remove()

	let aObj = {}
	aObj["ogg"] = {"data":bytes["ogg"],"name":inPath.with_suffix(".ogg")}
	aObj["m4a"] = {"data":bytes["m4a"],"name":inPath.with_suffix(".m4a")}


	progress.value += 1

	return aObj
}

async function fileSelected(e){
	let zip = new JSZip();

	const logOut = document.createElement("output")
	const logDiv = document.getElementById("logDiv")
	const prgDiv = document.getElementById("prgDiv")
	const progress = document.createElement("progress")

	progress.classList.add( "progress", "is-primary" )
	progress.id = "progress"
	progress.max = len(this.files)
	progress.value = 0

	while(logDiv.firstChild){
		logDiv.removeChild(logDiv.firstChild)
	}

	while(prgDiv.firstChild){
		prgDiv.removeChild(prgDiv.firstChild)
	}

	prgDiv.appendChild(progress)


	let addArgs = {}
	addArgs["ogg"] = document.getElementById("oggArgs").value.split(/\s+/)
	addArgs["m4a"] = document.getElementById("m4aArgs").value.split(/\s+/)

	let waitList = []

	for (const key of Object.keys(addArgs)){
		if (addArgs[key][0] == ""){
			addArgs[key].pop()
		}
	}

	for (const file of this.files){
		waitList.push(wavConv(file,addArgs))
	}
	const aDatas = await Promise.all(waitList)
	await logDiv.appendChild(logOut)
	logOut.value = await "zip 生成中"
	for (const aData of aDatas){
		for (const key in aData){
			await zip.file(aData[key].name,aData[key].data)
			await zip.file(aData[key].name,aData[key].data)
		}
	}
	const blob = await zip.generateAsync({ type: 'blob' })

	let downLoadElm = document.createElement("a")
	downLoadElm.download = "oggAndM4a"
	downLoadElm.href = URL.createObjectURL(blob, {type: "blob"})
	downLoadElm.dataset.downloadurl = ["text/plain", downLoadElm.download, downLoadElm.href].join(":")
	await downLoadElm.click()
	logOut.value = await "変換終了"

}

window.onload = function()
{
	loadLib()
	document.getElementById('fileSelect').addEventListener('change', fileSelected)
}


function loadLib()
{
	const urls = [
		"https://unpkg.com/@ffmpeg/ffmpeg@0.9.7/dist/ffmpeg.min.js",
		'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.5.0/jszip.min.js',
	]

	for (const url of urls){
		let script = document.createElement("script")
		script.src = url
		document.head.append(script)
	}
}

