 
async function setInnerContent(page){
    const response = await fetch(page)
    const text = await response.text()
    document.getElementById("innerContent").innerHTML=text;
    loadProfile();
}
setInnerContent("profile")
