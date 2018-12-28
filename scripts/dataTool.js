var fs = require("fs");

const presidents = require("../data/presidents.json");

const presidentCards = presidents.map((item)=>{
    item.front = item.name;
    item.back = item.birthday;
    return item;
});

writeJson(presidentCards);

function writeJson(data) {
    console.log(data);
    var outputFileName = './data/presidents.json';
    fs.writeFile(outputFileName, JSON.stringify(data), function (error) {
        if (error) {
            console.error("write error: " + error.message);
        } else {
            console.log("Written: " + outputFileName)
        }
    });
}
