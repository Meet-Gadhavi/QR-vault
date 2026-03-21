
const JSZip = require('jszip');
const fs = require('fs');

async function testZip() {
    const zip = new JSZip();
    const folder = zip.folder("Maze_POS");
    // folder.file("test.txt", "hello"); // Uncommenting this makes it larger
    const content = await zip.generateAsync({ type: "nodebuffer" });
    console.log("Empty folder zip size:", content.length);
    fs.writeFileSync("test_empty.zip", content);
}

testZip();
