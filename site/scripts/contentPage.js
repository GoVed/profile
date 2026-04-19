 
async function setInnerContent(page,call_func=null){
    const validPages = ['profile', 'projects'];
    if (!validPages.includes(page)) {
        console.error("Invalid page requested:", page);
        return;
    }
    const response = await fetch(page)
    const text = await response.text()
    document.getElementById("innerContent").innerHTML=text;
    if (call_func!=null){
        call_func();
    }
    
}