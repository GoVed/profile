async function test(){
    const response = await fetch("profile.html")
    const text = await response.text()
    document.getElementById("innerContent").innerHTML=text;
    loadProfile();
}
test()
