async function startMakeAnim(result,element){
    const res=10
    const cps=(Array.from(result).length-1)/res    
    for(var i=1;i<=res;i++){     
        var out=Array.from(result).slice(0, cps*i).join('')   
        out+=getRandomChar(cps)
        if(out.length>result.length)        
            out=Array.from(out).slice(0, Array.from(result).length).join('')
        if (out.length==0)
            out=result 
        element.innerHTML=out
        await delay(500/res)
    }
    
    element.innerHTML=result
}

async function startDelAnim(element){
    var result=element.innerHTML;
    const res=10
    const cps=(Array.from(result).length-1)/res    
    for(var i=1;i<=res;i++){        
        var out=Array.from(result).slice(0, Array.from(result).length-cps*i).join('')
        out+=getRandomChar(cps)
        if(out.length>result.length)
            out=Array.from(out).slice(0, Array.from(result).length).join('')
        if (out.length==0)
            out=result
        element.innerHTML=out
        await delay(500/res)
    }
    
    element.innerHTML="⠀";
}

async function expandSidebar(){
    
    document.getElementById("sidebar").classList.remove("collapseSidebar")
    document.getElementById("content").classList.remove("expandContent")
    document.getElementById("sidebar").classList.add("expandSidebar")
    document.getElementById("content").classList.add("collapseContent")
    var animList=[['Profile','profileItem1'],['Projects','profileItem2']]
    for(element in animList){
        startDelAnim(document.getElementById(animList[element][1]))
    }
    await delay(500);
    for(element in animList){
        startMakeAnim(animList[element][0],document.getElementById(animList[element][1]))
    }
}

async function collapseSidebar(){
    
    
    document.getElementById("sidebar").classList.remove("expandSidebar")
    document.getElementById("content").classList.remove("collapseContent")
    document.getElementById("sidebar").classList.add("collapseSidebar")
    document.getElementById("content").classList.add("expandContent")
    var animList=[['👤','profileItem1'],['📄','profileItem2']]
    for(element in animList){
        startDelAnim(document.getElementById(animList[element][1]))
    }
    await delay(500);
    for(element in animList){
        startMakeAnim(animList[element][0],document.getElementById(animList[element][1]))
    }
}

function delay(milliseconds){
    return new Promise(resolve => {
        setTimeout(resolve, milliseconds);
    });
}

function getRandomChar(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}

window.onload = function(){
    var onloadAnimItems=[['Ved Suthar','title']]
    for(element in onloadAnimItems){
        startMakeAnim(onloadAnimItems[element][0],document.getElementById(onloadAnimItems[element][1]))
    }
    document.getElementById("sidebar").addEventListener("mouseover",expandSidebar);
    document.getElementById("sidebar").addEventListener("mouseleave",collapseSidebar);
    collapseSidebar();
}
