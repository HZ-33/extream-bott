//Base chitanda bot
"use strict";
require("./settings.js")
const {
default: makeWASocket,
BufferJSON,
Browsers,
initInMemoryKeyStore,
DisconnectReason,
AnyMessageContent,
makeInMemoryStore,
useSingleFileAuthState,
fetchLatestBaileysVersion,
delay,
jidDecode,
generateForwardMessageContent, 
prepareWAMessageMedia, 
generateWAMessageFromContent, 
generateMessageID, 
downloadContentFromMessage, 
WAProto,
proto
} = require("@adiwajshing/baileys")
const figlet = require("figlet");
const fs = require("fs");
const moment = require('moment')
const chalk = require('chalk')
const logg = require('pino')
const clui = require('clui')
const { Boom } = require('@hapi/boom')
const { Spinner } = clui
const {getBuffer, smsg} = require("./lib/myfunc");
const { color} = require("./lib/color");
const FileType = require('file-type')
const PhoneNumber = require('awesome-phonenumber')
const {app} = require("./keepalive.js")
const { banner, start, success,getRandom, getGroupAdmins,close} = require("./lib/functions");
const time = moment(new Date()).format('HH:mm:ss DD/MM/YYYY')
let session = `./${sessionName}.json`
const { state, saveState } = useSingleFileAuthState(session)
const { exec, spawn } = require("child_process");







const store = makeInMemoryStore({ logger: logg().child({ level: 'fatal', stream: 'store' }) })

const connectToWhatsApp = async () => {
	
const { version, isLatest } = await fetchLatestBaileysVersion()
console.log(color(`using WA v${version.join('.')}, isLatest: ${isLatest}`))


const client = makeWASocket({
printQRInTerminal: true,
logger: logg({ level: 'fatal' }),
auth: state,
browser: ["Extream", "Safari", "3.0"]
//version: [2, 2214, 9]
})


client.ev.on('connection.update', async (update) => {
const { connection, lastDisconnect } = update	    
if (connection === 'close') {
console.log(color(lastDisconnect.error));
let reason = new Boom(lastDisconnect?.error)?.output.statusCode
if (reason === DisconnectReason.badSession) { console.log(color(`Bad Session File, Please Delete Session and Scan Again`)); client.logout(); }
else if (reason === DisconnectReason.connectionClosed) { console.log(color("[SYSTEM]", "white"), color('Connection closed, reconnecting...', 'deeppink')); connectToWhatsApp(); }
else if (reason === DisconnectReason.connectionLost) { console.log(color("[SYSTEM]", "white"), color('Connection lost, trying to reconnect', 'deeppink')); exec(`cd && node index`); }
else if (reason === DisconnectReason.connectionReplaced) { console.log(color("Connection Replaced, Another New Session Opened, Please Close Current Session First")); client.logout(); }
else if (reason === DisconnectReason.loggedOut) { console.log(color(`Device Logged Out, Please Scan Again And Run.`)); client.logout(); }
else if (reason === DisconnectReason.restartRequired) { console.log(color("Restart Required, Restarting...")); connectToWhatsApp(); }
else if (reason === DisconnectReason.timedOut) { console.log(color("Connection TimedOut, Reconnecting...")); connectToWhatsApp(); }
else client.end(`Unknown DisconnectReason: ${reason}|${connection}`)
} else if (connection === 'qr') {
console.log(color('[','white'), color('!','red'), color(']','white'), color(' Scan Bwang'))
} else if (connection === 'connecting') {
console.log(color(`]─`,`magenta`),`「`,  color(`EXTREAM`,`red`), `」`,  color(`─[`,`magenta`))
start(`1`,`Connecting...`)
} else if (connection === 'open') {
success(`1`,`[■■■■■■■■■■■■■■■] Connected`) 
//await client.sendMessage(`6285156137901@s.whatsapp.net`, {text: "Bot berhasil tersambung" })
}

})
 
client.ev.on('creds.update', () => saveState)
store.bind(client.ev)

client.multi = true
client.nopref = false
client.waVersion = version
client.prefa = 'anjing'


client.ev.on('messages.upsert', async m => {
try{
if (!m.messages) return;
var msg = m.messages[0]
if (!msg.message) return
msg.message = (Object.keys(msg.message)[0] === 'ephemeralMessage') ? msg.message.ephemeralMessage.message : msg.message
if (msg.key && msg.key.remoteJid === 'status@broadcast') return
//if (!publik && !msg.key.fromMe && m.type === 'notify') return
if (msg.key.id.startsWith('BAE5') && msg.key.id.length === 16) return
msg = smsg(client, msg, store)
msg.isBaileys = msg.key.id.startsWith('BAE5') || msg.key.id.startsWith('3EB0')
require('./message/msg')(client, msg, m,store)
}catch (err){
console.log(err)
}
})

client.ev.on('group-participants.update', async (anu) => {
    require('./message/group.js')(client, anu)
    });  
        
        
        
    
    
        
    client.reply = (from, content, msg) => client.sendMessage(from, { text: content }, { quoted: msg })
    
    
    //Set status bio bot by dika
    client.setStatus = (status) => {
    client.query({
    tag: 'iq',
    attrs: {
    to: '@s.whatsapp.net',
    type: 'set',
    xmlns: 'status',
    },
    content: [{
    tag: 'status',
    attrs: {},
    content: Buffer.from(status, 'utf-8')
    }]
    })
    return status
    }
    
    // anticall auto block
    client.ws.on('CB:call', async (json) => {
    const callerId = json.content[0].attrs['call-creator']
    if (json.content[0].tag == 'offer') {
    await client.sendMessage(callerId, { text: `Sistem otomatis block!\nJangan menelpon bot!\nSilahkan Hubungi Owner Untuk Dibuka !`})
    await client.updateBlockStatus(callerId, "block")
    }
    })
    
    
    
    
    
    
    
    
    
    
      
    
    
    
     //Setting
    client.decodeJid = (jid) => {
    if (!jid) return jid
    if (/:\d+@/gi.test(jid)) {
    let decode = jidDecode(jid) || {}
    return decode.user && decode.server && decode.user + '@' + decode.server || jid
    } else return jid
    }
    
    
    client.ev.on('contacts.update', update => {
        for (let contact of update) {
            let id = client.decodeJid(contact.id)
            if (store && store.contacts) store.contacts[id] = { id, name: contact.notify }
        }
    })
    
    
    
    client.getName = async (jid, withoutContact  = false) => {
    let id = await client.decodeJid(jid)
     withoutContact = client.withoutContact || withoutContact 
    let v
    if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
    v = store.contacts[id] || {}
    if (!(v.name || v.subject)) v = await client.groupMetadata(id) || {}
    resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international')).replace(new RegExp("[()+-/ +/]", "gi"), "") 
    })
    else v = id === '0@s.whatsapp.net' ? {
    id,
    name: 'WhatsApp'
    } : id === client.decodeJid(client.user.id) ?
    client.user :
    (store.contacts[id] || {})
    return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international').replace(new RegExp("[()+-/ +/]", "gi"), "") 
     }
        
        
      
    
    
    //SEND 1 KONTAK
    client.sendKontak = (jid, nomor, nama, org = "", quoted = '', opts = {} ) => {
    const vcard ="BEGIN:VCARD\n" 
    +"VERSION:3.0\n" 
    + "FN:" +nama +"\n"
     +"ORG:" + org + "\n" 
    +"TEL;type=CELL;type=VOICE;waid=" +nomor + ":+" +nomor +"\n" 
    +"item1.X-ABLabel:Ponsel\n"
    +"item2.EMAIL;type=INTERNET:okeae2410@gmail.com\n"
    +"item2.X-ABLabel:Email\nitem3.URL:https://instagram.com/cak_haho\n"
    +"item3.X-ABLabel:Instagram\n"
    +"item4.ADR:;;Indonesia;;;;\n"
    +"item4.X-ABLabel:Region\n"
    +"END:VCARD"
     client.sendMessage(jid,{contacts: {displayName: nama, contacts: [{ vcard }] }, ...opts},{quoted})
    };
    
    
    
    
    /**
    * 
    * @param {*} message 
    * @param {*} filename 
    * @param {*} attachExtension 
    * @returns 
    */
    client.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
    let quoted = message.msg ? message.msg : message
    let mime = (message.msg || message).mimetype || ''
    let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
    const stream = await downloadContentFromMessage(quoted, messageType)
    let buffer = Buffer.from([])
    for await(const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk])
    }
    let type = await FileType.fromBuffer(buffer)
    let trueFileName = attachExtension ? (filename + '.' + type.ext) : filename
    // save to file
    await fs.writeFileSync(trueFileName, buffer)
    return trueFileName
    }
    
    client.downloadMediaMessage = async (message) => {
    let mime = (message.msg || message).mimetype || ''
    let messageType = message.type ? message.type.replace(/Message/gi, '') : mime.split('/')[0]
    const stream = await downloadContentFromMessage(message, messageType)
    let buffer = Buffer.from([])
    for await(const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk])
    }
    return buffer
    } 
    
    /**
    * 
    * @param {*} path 
    * @returns 
    */
    client.getFile = async (path, save) => {
    let res, filename
    let data = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,` [1], 'base64') : /^https?:\/\//.test(path) ? await (res = await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : typeof path === 'string' ? path : Buffer.alloc(0)
    if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer')
    let type = await FileType.fromBuffer(data) || {
    mime: 'application/octet-stream',
    ext: '.bin'
    }
    if (data && save && !filename) (filename = path.join(__dirname, './src/' + new Date * 1 + '.' + type.ext), await fs.promises.writeFile(filename, data))
    return {
    res,
    filename,
    ...type,
    data
    }
    }
        
    /**
    * 
    * @param {*} jid 
    * @param {*} path 
    * @param {*} quoted 
    * @param {*} options 
    * @returns 
    */
    client.sendMedia = async (jid, path, quoted, options = {}) => {
    let { ext, mime, data } = await client.getFile(path)
    let messageType = mime.split("/")[0]
    let pase = messageType.replace('application', 'document') || messageType
    return await client.sendMessage(jid, { [`${pase}`]: data, mimetype: mime, ...options }, { quoted })
    } 
    
    
    /**
    * 
    * @param {*} jid 
    * @param {*} message 
    * @param {*} forceForward 
    * @param {*} options 
    * @returns 
    */
    client.copyNForward = async (jid, message, forceForward = false, options = {}) => {
    let vtype
    if (options.readViewOnce) {
    message.message = message.message && message.message.ephemeralMessage && message.message.ephemeralMessage.message ? message.message.ephemeralMessage.message : (message.message || undefined)
    vtype = Object.keys(message.message.viewOnceMessage.message)[0]
    delete(message.message && message.message.ignore ? message.message.ignore : (message.message || undefined))
    delete message.message.viewOnceMessage.message[vtype].viewOnce
    message.message = {
    ...message.message.viewOnceMessage.message
    }
    }
    let mtype = Object.keys(message.message)[0]
    let content = await generateForwardMessageContent(message, forceForward)
    let ctype = Object.keys(content)[0]
    let context = {}
    if (mtype != "conversation") context = message.message[mtype].contextInfo
    content[ctype].contextInfo = {
    ...context,
    ...content[ctype].contextInfo
    }
    const waMessage = await generateWAMessageFromContent(jid, content, options ? {
    ...content[ctype],
    ...options,
    ...(options.contextInfo ? {
    contextInfo: {
    ...content[ctype].contextInfo,
    ...options.contextInfo
    }
    } : {})
    } : {})
    await client.relayMessage(jid, waMessage.message, { messageId:  waMessage.key.id })
    return waMessage
    }
        
        
        
    client.cMod = (jid, copy, text = '', sender = client.user.id, options = {}) => {
    let mtype = Object.keys(copy.message)[0]
    let isEphemeral = mtype === 'ephemeralMessage'
    if (isEphemeral) {
    mtype = Object.keys(copy.message.ephemeralMessage.message)[0]
    }
    let msg = isEphemeral ? copy.message.ephemeralMessage.message : copy.message
    let content = msg[mtype]
    if (typeof content === 'string') msg[mtype] = text || content
    else if (content.caption) content.caption = text || content.caption
    else if (content.text) content.text = text || content.text
    if (typeof content !== 'string') msg[mtype] = {
    ...content,
    ...options
    }
    if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
    else if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
    if (copy.key.remoteJid.includes('@s.whatsapp.net')) sender = sender || copy.key.remoteJid
    else if (copy.key.remoteJid.includes('@broadcast')) sender = sender || copy.key.remoteJid
    copy.key.remoteJid = jid
    copy.key.fromMe = sender === client.user.id
    return proto.WebMessageInfo.fromObject(copy)
    } 
    
    
      
    
        /**
         * 
         * @param {*} jid 
         * @param {*} buttons 
         * @param {*} caption 
         * @param {*} footer 
         * @param {*} quoted 
         * @param {*} options 
         */
        client.sendButtonText = (jid, buttons = [], text, footer, quoted = '', options = {}) => {
            let buttonMessage = {
                text,
                footer,
                buttons,
                headerType: 2,
                ...options
            }
            client.sendMessage(jid, buttonMessage, { quoted, ...options })
        }
    
    
    
    
    /**
         * 
         * @param {*} jid 
         * @param {*} text 
         * @param {*} quoted 
         * @param {*} options 
         * @returns 
         */
     client.sendText = (jid, text, quoted = '', options) => client.sendMessage(jid, { text: text, ...options }, { quoted })
    
     /**
      * 
      * @param {*} jid 
      * @param {*} path 
      * @param {*} caption 
      * @param {*} quoted 
      * @param {*} options 
      * @returns 
      */
     client.sendImage = async (jid, path, caption = '', setquoted, options) => {
    let buffer = Buffer.isBuffer(path) ? path : await getBuffer(path)
         return await client.sendMessage(jid, { image: buffer, caption: caption, ...options }, { quoted : setquoted})
     }
    
     /**
      * 
      * @param {*} jid 
      * @param {*} path 
      * @param {*} caption 
      * @param {*} quoted 
      * @param {*} options 
      * @returns 
      */
     client.sendVideo = async (jid, yo, caption = '', quoted = '', gif = false, options) => {
         //let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
         return await client.sendMessage(jid, { video: yo, caption: caption, gifPlayback: gif, ...options }, { quoted })
     }
    
    
    /**
         * 
         * @param {*} jid 
         * @param {*} path 
         * @param {*} quoted 
         * @param {*} mime 
         * @param {*} options 
         * @returns 
         */
     client.sendAudio = async (jid, path, quoted = '', ptt = false, options) => {
        let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
        return await client.sendMessage(jid, { audio: buffer, ptt: ptt, ...options }, { quoted })
    }
    
    /**
     * 
     * @param {*} jid 
     * @param {*} text 
     * @param {*} quoted 
     * @param {*} options 
     * @returns 
     */
    client.sendTextWithMentions = async (jid, text, quoted, options = {}) => client.sendMessage(jid, { text: text, contextInfo: { mentionedJid: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net') }, ...options }, { quoted })
    
        /**
         * 
         * @param {*} jid 
         * @param {*} path 
         * @param {*} quoted 
         * @param {*} options 
         * @returns 
         */
    client.sendImageAsSticker = async (jid, media, dev, options = {}) => {
    let { Sticker, StickerTypes } = require('wa-sticker-formatter')
    let jancok = new Sticker(media, {
        pack: packName, // The pack name
        author: authorName, // The author name
        type: StickerTypes.FULL, // The sticker type
        categories: ['🤩', '🎉'], // The sticker category
        id: '12345', // The sticker id
        quality: 50, // The quality of the output file
        background: '#FFFFFF00' // The sticker background color (only for full stickers)
    })
    let stok = getRandom(".webp")
    let nono = await jancok.toFile(stok)
    let nah = fs.readFileSync(nono)
    await client.sendMessage(jid,{sticker: nah},{quoted: dev})
    return await fs.unlinkSync(stok)
     }
    /**
     * 
     * @param {*} jid 
     * @param {*} path 
     * @param {*} quoted 
     * @param {*} options 
     * @returns 
     */
    client.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
        let buffer
        if (options && (options.packname || options.author)) {
            buffer = await writeExifVid(buff, options)
        } else {
            buffer = await videoToWebp(buff)
        }
    
        await client.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
        return buffer
    }
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
     
    
    /**
     * send group invitation via message
     * @param {string} jid gorupJid 
     * @param {string} participant this message sent to?
     * @param {string} inviteCode group invite code
     * @param {Number} inviteExpiration invite expiration
     * @param {string} groupName group name
     * @param {string} jpegThumbnail file path or url
     * @param {string} caption message caption
     * @param {any} options message options
     */
     client.sendGroupV4Invite = async(jid, participant, inviteCode, inviteExpiration, groupName = 'unknown subject', jpegThumbnail, caption = 'Invitation to join my WhatsApp group', options = {}) => {
        let msg = WAProto.Message.fromObject({
            groupInviteMessage: WAProto.GroupInviteMessage.fromObject({
                inviteCode,
                inviteExpiration: inviteExpiration ? parseInt(inviteExpiration) : + new Date(new Date + (3 * 86400000)),
                groupJid: jid,
                groupName: groupName ? groupName : (await client.groupMetadata(jid)).subject,
                jpegThumbnail: jpegThumbnail ? (await getBuffer(jpegThumbnail)).buffer : '',
                caption
            })
        })
        const m = generateWAMessageFromContent(participant, msg, options)
       return await client.relayMessage(participant, m.message, { messageId: m.key.id })
    }
    
    
    ///Button Image ✓
    client.sendButImage = async(id, text1, desc1, gam1, but = [], options1 = {}) => {
    let buttonMessage = {
    image: gam1,
    caption: text1,
    footer: desc1,
    buttons: but,
    headerType: 4
    }
    
    return await client.sendMessage(id, buttonMessage, options1)
    }
    
    ///Button Text ✓
    client.sendButMessage = async (id, text1, desc1, but = [], options  ) => {
    let buttonMessage = {
    text: text1,
    footer: desc1,
    buttons: but,
    headerType: 1
    }
    return client.sendMessage(id, buttonMessage,{quoted: options})
    }
    
    //Button Gif ✓
    client.send5ButGif = async (id, text1, desc1, gam1, but = [], options = {}) => {
    let message = await prepareWAMessageMedia({ video: gam1, gifPlayback: true }, { upload: client.waUploadToServer })
    let template = generateWAMessageFromContent(id, proto.Message.fromObject({
    templateMessage: {
    hydratedTemplate: {
    videoMessage: message.videoMessage,
    hydratedContentText: text1,
    hydratedFooterText: desc1,
    hydratedButtons : but
    }
    }
    }), {});
    return await client.relayMessage(id, template.message,{ messageId: template.key.id })
    }
    
    ///Button Image 2 ✓
    client.send5ButImg = async(id, text1, desc1, gam1, but = []) => {
    let message = await prepareWAMessageMedia({ image: gam1}, { upload: client.waUploadToServer })
    let template = generateWAMessageFromContent(id, proto.Message.fromObject({
    templateMessage: {
    hydratedTemplate: {
    imageMessage: message.imageMessage,
    hydratedContentText: text1,
    hydratedFooterText: desc1,
    hydratedButtons: but
    }
    }
    }), {});
    return await client.relayMessage(id, template.message,{ messageId: template.key.id })                   
    }
    
    
    //Button Image 2 ✓
    client.send5ButLoc = async(id, text1, desc1, gam1, but = []) => {
      let template = generateWAMessageFromContent(id, proto.Message.fromObject({
      templateMessage: {
      hydratedTemplate: {
      locationMessage: { 
      jpegThumbnail: gam1},
      hydratedContentText: text1,
      hydratedFooterText: desc1,
      hydratedButtons: but
      }
      }
      }), {});
      return await client.relayMessage(id, template.message,{ messageId: template.key.id })                   
      }
    
    ///Button Loc ✓
    client.sendButLoc = async(id, text1, desc1, gam1, but = [], options1 = {}) => {
    let message = await prepareWAMessageMedia({ image: gam1}, { upload: client.waUploadToServer })
    let buttonMessage = {
    location: { jpegThumbnail: gam1 } ,
    caption: text1,
    footer: desc1,
    buttons: but,
    headerType: "LOCATION"
    }
    return await client.sendMessage(id, buttonMessage, options1)
    }
    
    //Button document ✓
    client.sendButDoc = async(id, text1, desc1, gam1, but = [], options, options1 = {}) => {	
    if(docType === "pptx"){
    var AppType = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    } else if(docType === "xlsx"){
    var AppType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    } else if(docType === "zip"){
    var AppType = "application/zip"
    } else if(docType === "pdf"){
    var AppType = "application/pdf"
    } else if(docType === "docx"){
    var AppType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    } 
    const buttonMessage = {
    contextInfo: options,
    document: fs.readFileSync('./temp/file.docx'),
    mimetype: AppType, 
    title : "Footer text", 
    fileLength : 999999999999, 
    pageCount: 100, 
    fileName : "Extream", 
    caption: text1,
    footer: desc1,
    buttons: but,
    headerType: "DOCUMENT"
    }
    
    return await client.sendMessage(id, buttonMessage,options1)
    } 
    
    
    
    return client
    }
    
    connectToWhatsApp()
    
    
    
    
    
    
    let file = require.resolve(__filename)
    fs.watchFile(file, () => {
        fs.unwatchFile(file)
        console.log(chalk.redBright(`Update ${__filename}`))
        delete require.cache[file]
        require(file)
    })
    