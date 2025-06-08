// scripts/utils.js
export function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getLines(ctx, text, maxWidth) {
    var words = text.split(" ");
    var lines = [];
    var currentLine = words[0];

    for (var i = 1; i < words.length; i++) {
        var word = words[i];
        if(word=="\n"){
            lines.push(currentLine.trim());
            currentLine="";
            continue;
        }
        var width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine.trim());
            currentLine = word;
        }
    }
    if (currentLine.length > 0) { // Ensure last line is added only if it has content
        lines.push(currentLine.trim());
    }
    return lines;
}