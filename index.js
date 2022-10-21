console.log("Grading Tool Running 🏃");

// **************************************************************Libraries needed************************
var stringSimilarity = require("string-similarity");
var fs = require("fs");
const { readFileSync } = require("fs");
var path = require("path");
var process = require("process");
const { stringify } = require("querystring");
const extract = require("extract-zip");
const validator = require("html-validator");



// when importing extract you need to find this code => if (!path.isAbsolute(opts.dir) in extract-zip/index.html and comment it out to use relative path )
// *******************************************************************************************************

// Your Custom Directory
var zipDirectory = "./zipped";
// Your "to be graded" directory
var directory = "./toBeGraded";
// Your rubric can be found here
var rubricDirectory = "./rubric_Profile_page";
// Temporary Directory to hold files to be renamed appropriatelly must be empty
var tempDirectory = "./tempFolder";
// This is your array of folder & files inside your 'toBeGraded' directory
var folderArray = [];
// This is the array of student info you need at the end of running the code
var studentArray = [];

// *******************************************Regex****************************************************


let goodWords = [/flex[" "]{0,1}\:/g, /justify-content[" "]{0,1}\:/g, /align-items[" "]{0,1}\:/g];
let badWords = [/position[" "]{0,1}\:/g, /float[" "]{0,1}\:/g];
let imgRegex = /src[" "]{0,1}\=[" "]{0,1}(\'|\")[" "]{0,1}(.*)\.(png|jpg|[a-zA-Z])[" "]{0,1}(\'|\"){1}/g


// *******************************************function used to unzip****************************************************

async function main() {
    await fs.promises.mkdir(`./${tempDirectory}/`);
    const zipfiles = await fs.promises.readdir(zipDirectory);
    const files = zipfiles.filter((file) => {
        return file !== ".DS_Store";
    });
    console.log(
        `These are the files found in the zipped folder to be unzipped ${files}`
    );

    await fs.promises.mkdir(`./${directory}`);

    for (var j = 0; j < files.length; j++) {
        await fs.promises.mkdir(`./${tempDirectory}/${j}/`);
        await extract(`${zipDirectory}/${files[j]}`, {
            dir: `${tempDirectory}/${j}/`,
        });
        const currentFile = await fs.promises.readdir(`./${tempDirectory}/${j}`);
        console.log(
            `renaming ${tempDirectory}/${j}/${currentFile} to ./${directory}/${files[
                j
            ].slice(0, -4)}/`
        );
        await fs.promises.rename(
            `${tempDirectory}/${j}/${currentFile}`,
            `./${directory}/${files[j].slice(0, -4)}/`,
            () => {
                console.log("...");
            }
        );
        await fs.promises.rmdir(`${tempDirectory}/${j}/`);
        
    }
    await fs.promises.rmdir(`${tempDirectory}/`);
}
// *******************************************function used to remove zipped folders****************************************************

async function rmZipped() {
    try {
        console.log(
            `this is the zipped file directory to be cleaned 🧹 :${zipDirectory}`
        );
        const zippedFiles = await fs.promises.readdir(zipDirectory);
        console.log(`These are the zipped filed being destroyed 🔥 ${zippedFiles}`);

        for (var i = 1; i < zippedFiles.length; i++) {
            await fs.promises.rm(`${zipDirectory}/${zippedFiles[i]}`, {
                recursive: true,
                force: true,
            });
        }

        console.log("Delete Successful 🧨");
    } catch (err) {
        console.log(`There was an error deleting all zipped files ${err}`);
    }
}

// *******************************************function used to remove to be graded folders****************************************************

async function rmtoBeGraded() {
    try {
        console.log(
            `this is the to be graded file directory to be cleaned 🧹 :${directory}`
        );
        const files = await fs.promises.readdir(directory);
        console.log(`These are the files being destroyed 🔥 ${files}`);

        for (var i = 1; i < files.length; i++) {
            await fs.promises.rm(`${directory}/${files[i]}`, {
                recursive: true,
                force: true,
            });
        }

        console.log("Delete Successful 🧨");
    } catch (err) {
        console.log(`There was an error deleting all to be graded files ${err}`);
    }
}

// **************************************************************readFiles******************************************************

async function readFiles() {
    const files = await fs.promises.readdir(directory);

    files.forEach(function (file) {
        if (file !== ".DS_Store" & file !== ".gitignore") {
            const unfilteredOutput = fs.readdirSync(`${directory}/${file}`);

            const output = unfilteredOutput.filter((file) => {
                return file !== ".DS_Store";
            });

            folderArray.push([file, output]);
        }
        // console.log("Found super annoying .DS_Store file, I would trash that sucker 🗑️") Uncomment to get this little message
    });
}

// **************************************************************readHTML******************************************************

async function readHTML() {
    // **************************************READS THE RUBRIC AND STRINGIFY'S IT TO COMPARE **************************************
    var errors = "None";
    const buffer = fs.readFileSync(`./${rubricDirectory}/index.html`);
    const rubricHTMLString = buffer.toString();

    // **************************************READS EACH HTML SUBMISSION AND STRINGIFY'S IT TO COMPARE**************************************
    for (var i = 0; i < folderArray.length; i++) {
        const AllFiles = folderArray[i][1];
        // console.log(AllFiles)

        var HTML = AllFiles.filter((file) => {
            return file.includes(".html");
        });

        if (HTML.length > 1) {
            console.log(
                ` ${folderArray[i][0]} has more than one html file, chose first html file`
            );
            errors = ` ${folderArray[i][0]} has more than one html file, chose first html file`;
            HTML = HTML[0];
        }

        

        if(HTML.length !== 0){
            const readHTML = await fs.promises.readFile(
                `${directory}/${folderArray[i][0]}/${HTML}`
            );

            const HTMLString = readHTML.toString();

            let imageInfo = imageStringHandler(HTMLString)

            const perc = (100 * compare(rubricHTMLString, HTMLString)).toFixed(2);

            var vHTML = await verifyHTML(`${directory}/${folderArray[i][0]}/${HTML}`);

            

            
            if (errors.length > 1) {
                errors  = `${errors}`;
            }

            studentArray.push({
                Name: folderArray[i][0],
                HTML: perc,
                HTMLVerificationError: { array: `${vHTML[1]}`, errorsFound: vHTML[0] },
                GoodCSS:"",
                BadCSS:"",
                CSS: "",
                JS: "",
                Img: imageInfo,
                atRisk: " 🙂 Low 👍",
                DuplicatePageErrors: errors,
            });
            errors = "None";
            
        }else{
            studentArray.push({
                Name: folderArray[i][0],
                HTML: "No HTML File Found",
                HTMLVerificationError: "No HTML page to base it on" ,
                CSS: "",
                JS: "",
                Img: "No HTML page to pull src string from",
                atRisk: " 🙂 High ",
                DuplicatePageErrors: errors,
                errors:"No HTML File Found" 
            });
            errors = ""
        }

    }
}

async function verifyHTML(path) {
    const options = {
        format: "json",
        data: readFileSync(path, "utf8"),
    };

    try {
        var errorArray = [];
        const result = await validator(options);
        //   console.log(result)
        //   console.log("HTML Validator ran Successfully")
        var counter = 0;
        var x = result["messages"];
        x = x.forEach((item) => {
            errorArray.push(`${item.message}`);
            //   console.log(`Errors: ${item.message}`)
            counter++;
        });

        // console.log(`${counter} errors found`)
        if (errorArray.length < 1) {
            return [counter, "No Errors Found"];
        }
        return [counter, errorArray];
    } catch (error) {
        console.error(error);
    }
}

// **************************************************************readCSS******************************************************
function readCSS() {

    try{
        var errors = "";
        // READS THE RUBRIC AND STRINGIFY'S IT TO COMPARE
        const buffer = fs.readFileSync(`./${rubricDirectory}/style.css`);
    
        const rubricCSSString = buffer.toString();
    
        for (var i = 0; i < folderArray.length; i++) {
            const AllFiles = folderArray[i][1];
    
            var CSS = AllFiles.filter((file) => {
                return file.includes(".css");
            });

             const idx = studentArray.findIndex((student) => {
                return student.Name == folderArray[i][0];
            });
            
            

            if (CSS.length > 1) {
                console.log(
                    ` ${folderArray[i][0]} has more than one css file, chose first css file`
                );
                CSS = CSS[0];
                errors = ` ${folderArray[i][0]} has more than one css file, chose first css file`;
            }

            if(CSS.length !== 0){
                const buffer = fs.readFileSync(`${directory}/${folderArray[i][0]}/${CSS}`);
    
                const studentCSSString = buffer.toString();

                let wordArray = {
                    good:[],
                    bad:[]
                }
                
                let wordCount = {
                    good:0,
                    bad:0
                }
                
                
                    badWords.map((item,index)=>{
                        let myMatch = [...studentCSSString.matchAll(badWords[index])]
                
                        myMatch.map((item,index)=>{
                            wordCount.bad++
                            wordArray.bad.push(item[0])
                            return item['index'];
                        })
                    })
                
                    goodWords.map((item,index)=>{
                        let myMatch = [...studentCSSString.matchAll(goodWords[index])]
                
                        myMatch.map((item,index)=>{
                            wordArray.good.push(item[0])
                            wordCount.good++
                            return item['index'];
                        })
                    })

                const perc = (100 * compare(rubricCSSString, studentCSSString)).toFixed(2);

                studentArray[idx]["CSS"] = perc;
                studentArray[idx]["GoodCSS"] = `Good: ${wordArray.good}`
                studentArray[idx]["BadCSS"] = wordArray.length > 0 ? `Bad: ${wordArray.bad}`:`None`
                
                if (errors.length > 1) {
                    studentArray[idx]["DuplicatePageErrors"] = `${studentArray[idx]["DuplicatePageErrors"]}, and ${errors}`;
                }
                errors = "";
                
            }else{
                errors = ""
                studentArray[idx]["errors"] = `${studentArray[idx]["errors"]} ,No CSS File Found`;
                studentArray[idx]["CSS"] = "No CSS File Found"
                errors = ""
            }
    
            


        }


    }
    catch(err){
        console.log(`ReadCSS function failed : ${err}`)
    }
    
}
// **************************************************************readJS******************************************************

function readJS() {
    try{
        var errors = "";
        // READS THE RUBRIC AND STRINGIFY'S IT TO COMPARE
        const buffer = fs.readFileSync(`./${rubricDirectory}/script.js`);
    
        const rubricJSString = buffer.toString();
    
        for (var i = 0; i < folderArray.length; i++) {
            const AllFiles = folderArray[i][1];
    
            var JS = AllFiles.filter((file) => {
                return file.includes(".js");
            });

            const idx = studentArray.findIndex((student) => {
                return student.Name == folderArray[i][0];
            });


    
            if (JS.length > 1) {
                console.log(
                    ` ${folderArray[i][0]} has more than one javascript file, chose first j.s. file`
                );
                JS = JS[0];
                errors = ` ${folderArray[i][0]} has more than one javascript file, chose first j.s. file`;
            }

            if(JS.length !== 0){
                const buffer = fs.readFileSync(`${directory}/${folderArray[i][0]}/${JS}`);
    
                const JSString = buffer.toString();

                const perc = (100 * compare(rubricJSString, JSString)).toFixed(2);

                studentArray[idx]["JS"] = perc;
                
                if (errors.length > 1) {
                    studentArray[idx]["DuplicatePageErrors"] = `${studentArray[idx]["DuplicatePageErrors"]}, and ${errors}`;
                }
                errors = "";
                
            }else{
                errors = ""
                studentArray[idx]["errors"] = `${studentArray[idx]["errors"]} ,No JS File Found`;
                studentArray[idx]["JS"] = "No JS File Found"
                errors = ""
            }
    
            
        }
    }catch(err){
        console.log(`readJS function failed : ${err}`)
    }
}

function atRisk() {


    try{
            // CHECKS TO SEE IF SUBMISSION IS AT RISK OF BEING COPIED OR NOT TURNED IN
        for (var i = 0; i < studentArray.length; i++) {
            if (studentArray[i]["HTML"] < 20 || studentArray[i]["HTML"] > 80) {
                studentArray[i]["atRisk"] = "🚨 High 👎";
            } else if (studentArray[i]["CSS"] < 20 || studentArray[i]["CSS"] > 80) {
                studentArray[i]["atRisk"] = "🚨 High 👎";
            } else if (studentArray[i]["CSS"] < 60 || studentArray[i]["CSS"] > 65) {
                studentArray[i]["atRisk"] = " 👀 Med ⚠️";
            } else if (studentArray[i]["HTML"] < 60 || studentArray[i]["HTML"] > 65) {
                studentArray[i]["atRisk"] = " 👀 Med ⚠️";
            }
        }
    }catch(err){
        console.log(`Error at the atRisk function : ${err}`)
    }
    
}

function compare(str1, str2) {

    try{
        return stringSimilarity.compareTwoStrings(str1, str2);

    }
    catch(err){
        console.log(`Error at the compare function : ${err}`)
    }
}


function imageStringHandler(HTMLString) {

    try{
        const userImages = [...HTMLString.matchAll(imgRegex)].map((item,idx)=>(item[0]))
                    if(userImages.length !==0){
                        return (`Images ${userImages} `)

                    }

    }catch(err){
        console.log(`There has been an error at imageStringHandler : ${err}`)
    }
    
}

async function runGrader() {

    try{
        await main()
        await readFiles();
        await readHTML();
        readCSS();
        readJS();
        atRisk();
        console.log(studentArray);

    }catch(err){
        console.log(`Error at the runGrader function: ${err}`)
    }
    
}

runGrader();

