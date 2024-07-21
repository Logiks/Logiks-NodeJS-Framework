//Upload Files

const mime = require('mime-types');
const archiver = require('archiver');
const path = require('path');
const { customAlphabet } = require("nanoid");
const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", 12);

const BASE_URL = "/files/";

const createZip = (files, fileDir, los_no) => {
    return new Promise((resolve, reject) => {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const outputDir = CONFIG.ROOT_PATH + "/" + CONFIG.html_public_folder
            const outputZipPath = path.join(outputDir, `archive-${los_no}-${timestamp}.zip`);
            const output = fs.createWriteStream(outputZipPath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            output.on('close', () => {
                console.log(`${archive.pointer()} total bytes`);
                console.log('Archiver has been finalized and the output file descriptor has closed.');
                resolve(outputZipPath);
            });

            archive.on('warning', (err) => {
                if (err.code !== 'ENOENT') {
                    reject(err);
                }
            });

            archive.on('error', (err) => {
                reject(err);
            });

            archive.pipe(output);

            files.forEach(file => {
                const parts = file.split('-');
                const category = parts[0]; // laf or cam
                const id = parts[1]; // customer id or stage
                const fileName = parts.slice(2).join('-'); // remaining part of the file name

                let filePath;
                if (category === 'laf') {
                    filePath = `laf/${id}/${file}`;
                } else if (category === 'cam') {
                    filePath = `cam/${id}/${file}`;
                } else {
                    filePath = file; // fallback if there's an unexpected category
                }
                archive.file(path.join(fileDir, file), { name: filePath });
            });

            archive.finalize();

        } catch (error) {
            reject(error)
        }
    });
};

module.exports = function (server, restify) {
    // new logic for doc upload
    server.post('/upload', (req, res, next) => {
        var vStatus = validateRule(req.body, {
            los_no: 'required', // LOS/88802
            doc_type: 'in:laf,cam|required', // LAF/CAM
            // cam_stage: 'required'
            upload_type: 'required', // gallery
            customer_id: 'required', // 23
            doc_name: 'required', // pan_card
            content: 'required',
        });

        if (!vStatus.status) {
            res.send({
                "status": "error",
                "msg": "Input Validation Failed",
                "errors": vStatus.errors
            });
            return next();
        }

        if (req.body.doc_type == 'cam' && (!req.body?.cam_stage?.length)) {
            res.send({
                "status": "error",
                "msg": "Please provide stage for cam document upload",
            });
            return next();
        }

        // filename for laf: laf-customer_id-doc_name-nanoid
        // filename for cam: cam-doc_type-customer_id-doc_name-nanoid  
        var los_no = req.body.los_no.replace(/[^\w\s]/gi, '');
        var upload_type = req.body.upload_type;
        const doc_type = req.body.doc_type;
        const customer_id = req.body.customer_id;
        var doc_name = req.body.doc_name;
        var content = req.body.content;
        var fileID = nanoid();

        var content_original = content;
        // console.log("XXXXX", content_original);

        var ext = "";
        if (content.indexOf(";base64") > 0) {
            var temp = content.split(";base64,");
            content = temp[1];
            ext = temp[0].split("/")[1];
        } else if (doc_name.indexOf(".") > 0) {
            var temp = doc_name.split(".");
            ext = temp[temp.length - 1];
        }
        // console.log("\nYYYY", content);
        var FILE_DIR = BASE_URL + los_no + '/';
        var FILE_PATH = "" //FILE_DIR + doc_name+"_"+fileID+"."+ext;
        if (doc_type == 'laf') {
            FILE_PATH = FILE_DIR + doc_type + "-" + customer_id + "-" + doc_name + "-" + fileID + "." + ext;
        } else {
            FILE_PATH = FILE_DIR + doc_type + "-" + req.body.cam_stage + "-" + customer_id + "-" + doc_name + "-" + fileID + "." + ext;
        }
        var TARGET_FILE_PATH = ROOT_PATH + "/" + FILE_PATH;
        var TARGET_DIR_PATH = ROOT_PATH + "/" + FILE_DIR;
        var TARGET_FILE_URL = CONFIG.BASE_URL + FILE_PATH;

        if (!fs.existsSync(TARGET_DIR_PATH)) fs.mkdirSync(TARGET_DIR_PATH, '0777', true);

        fs.writeFileSync(TARGET_FILE_PATH, content.replace(/ /g, "+"), { encoding: 'base64' });

        if (fs.existsSync(TARGET_FILE_PATH)) {
            res.send({
                status: "success",
                url: TARGET_FILE_URL,
                category: upload_type,
                fileID: fileID,
                doc_name: doc_name,
                timestamp: moment().format("YYYY-MM-DD HH:mm:ss")
            });
        } else {
            res.send({
                status: "error",
                url: "",
                category: upload_type,
                fileID: fileID,
                doc_name: doc_name,
                timestamp: moment().format("YYYY-MM-DD HH:mm:ss"),
                msg: "Error uploading file"
            });
        }

        return next();
    });

    // retrieve zip of files
    server.post('/files/zip', (req, res, next) => {
        var vStatus = validateRule(req.body, {
            los_no: 'required', // LOS/88802
        });

        if (!vStatus.status) {
            res.send({
                "status": "error",
                "msg": "Input Validation Failed",
                "errors": vStatus.errors
            });
            return next();
        }

        try {
            const los_no = req.body.los_no.replace(/[^\w\s]/gi, '');
            var FILE_DIR = CONFIG.ROOT_PATH + BASE_URL + los_no + '/';
            // console.log(FILE_DIR)
            if (fs.existsSync(FILE_DIR)) {
                const files = fs.readdirSync(FILE_DIR);
                // console.log('files - ', files)s
                createZip(files, FILE_DIR, los_no)
                    .then(outputPath => {
                        const fileUrl = CONFIG.BASE_URL + "/" + CONFIG.html_public_folder + "/" + path.basename(outputPath);
                        res.send({
                            "status": "success",
                            msg: 'Files zipped successfully',
                            url: fileUrl
                        });
                        return next();
                    })
                    .catch(error => {
                        res.send({
                            "status": "success",
                            msg: 'Error creating zip of the documents',
                            error
                        });
                        return next();
                    })
            } else {
                res.send({
                    "status": "success",
                    data: []
                });
                return next();
            }
        } catch (err) {
            console.error('Error reading directory:', err);
            res.send([]);
            return next();
        }
    })

    /*
    server.post('/upload', (req, res, next) => {
        var vStatus = validateRule(req.body, {
            upload_ref: 'required',
            upload_type: 'required',
            doc_name: 'required',
            content: 'required',
        });

        if (!vStatus.status) {
            res.send({
                "status": "error",
                "msg": "Input Validation Failed",
                "errors": vStatus.errors
            });
            return next();
        }

        var upload_ref = req.body.upload_ref.replace(/[^\w\s]/gi, '');
        var upload_type = req.body.upload_type;
        var doc_name = req.body.doc_name;
        var content = req.body.content;
        var fileID = nanoid();

        var content_original = content;
        // console.log("XXXXX", content_original);

        var ext = "";
        if (content.indexOf(";base64") > 0) {
            var temp = content.split(";base64,");
            content = temp[1];
            ext = temp[0].split("/")[1];
        } else if (doc_name.indexOf(".") > 0) {
            var temp = doc_name.split(".");
            ext = temp[temp.length - 1];
        }
        // console.log("\nYYYY", content);
        var FILE_DIR = BASE_URL + upload_ref + '/';
        var FILE_PATH = FILE_DIR + doc_name + "_" + fileID + "." + ext;
        var TARGET_FILE_PATH = ROOT_PATH + "/" + FILE_PATH;
        var TARGET_DIR_PATH = ROOT_PATH + "/" + FILE_DIR;
        var TARGET_FILE_URL = CONFIG.BASE_URL + FILE_PATH;
        //console.log(TARGET_DIR_PATH, TARGET_FILE_PATH, TARGET_FILE_URL, FILE_PATH);

        if (!fs.existsSync(TARGET_DIR_PATH)) fs.mkdirSync(TARGET_DIR_PATH, '0777', true);

        fs.writeFileSync(TARGET_FILE_PATH, content.replace(/ /g, "+"), { encoding: 'base64' });

        if (fs.existsSync(TARGET_FILE_PATH)) {
            res.send({
                status: "success",
                url: TARGET_FILE_URL,
                category: upload_type,
                fileID: fileID,
                doc_name: doc_name,
                timestamp: moment().format("YYYY-MM-DD HH:mm:ss")
            });
        } else {
            res.send({
                status: "error",
                url: "",
                category: upload_type,
                fileID: fileID,
                doc_name: doc_name,
                timestamp: moment().format("YYYY-MM-DD HH:mm:ss"),
                msg: "Error uploading file"
            });
        }

        return next();
    });
*/
    server.get('/uploads/:upload_ref', (req, res, next) => {
        var upload_ref = req.params['upload_ref'].replace(/[^\w\s]/gi, '');
        var FILE_DIR = BASE_URL + upload_ref + '/';

        if (fs.existsSync(FILE_DIR)) {
            var files = [];
            var urls = [];
            fs.readdirSync(FILE_DIR).forEach(file => {
                if (file.substr(0, 1) == ".") return;
                files.push(file);
                urls.push(CONFIG.BASE_URL + FILE_DIR + "/" + file);
            });

            res.send({ "files": files, "urls": urls, "upload_ref": upload_ref });
            return next();
        } else {
            res.send([]);
            return next();
        }
    });

    server.get('/files/*', (req, res, next) => {
        var FILE_PATH = req.params['*'];
        var TARGET_FILE_PATH = ROOT_PATH + "/" + BASE_URL + FILE_PATH;
        // console.log("FILES", req.params, TARGET_FILE_PATH, FILE_PATH,  mime.lookup(FILE_PATH));
        if (fs.existsSync(TARGET_FILE_PATH)) {
            //res.sendRaw(TARGET_FILE_PATH);
            fs.readFile(TARGET_FILE_PATH, (err, file) => {
                if (err) res.send(404).end("Not Found");
                else {
                    var filename = path.parse(FILE_PATH).base;
                    // res.set("Content-Type", "image/jpeg");
                    // res.set('Content-Disposition', `inline`);
                    res.set('Content-Disposition', `inline; filename="${filename}"`);//attachment;
                    res.set("Content-Type", mime.lookup(FILE_PATH));
                    res.sendRaw(file);
                }
            });
        } else {
            res.send("File not found");
            return next();
        }
    });
}
