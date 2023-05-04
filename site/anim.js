async function startMakeAnim(result,element){
    length=1
    res=20
    cps=(result.length-1)/res
    for(let i=1;i<=res;i++){
        var out=result.substring(0,cps*i)
        out+=getRandomChar(cps)
        if(out.length>result.length)
            out=out.substring(0,result.length)
        element.innerHTML=out
        await delay(1000/res)
    }
    
    element.innerHTML=result
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
    startMakeAnim('Ved Suthar',document.getElementById('title'))
    startMakeAnim('Profile',document.getElementById('profileItem1'))
}
