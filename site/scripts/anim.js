/*
    @param result: End string to be shown
    @param element: Element to be animated
    @returns Nothing

    Animates the element to show the result
*/
var current_state = "";

async function startMakeAnim(result,element){
    //Calculating temporal resolution for animation 
    const totalTime=500
    const res=10
    const cps=(Array.from(result).length-1)/res    

    start_state = current_state;
    for(var i=1;i<=res;i++){  
        //Intital starting original substring of result   
        var out=Array.from(result).slice(0, cps*i).join('')   

        //Random chars after initial part
        out+=getRandomChar(cps)

        //Clip to max length
        if(out.length>result.length)        
            out=Array.from(out).slice(0, Array.from(result).length).join('')

        //For visual purpose
        if (out.length==0)
            out=result 

        element.innerHTML=out
        await delay(totalTime/res)
        if (start_state != current_state) {
            return;
        }
    }
  
    //After the animation
    element.innerHTML=result
}

/*
    @param element: Element to be animated
    @returns Nothing

    Animates the element to remove the result
*/
async function startDelAnim(element){
    
    var result=element.innerHTML;

    //Calculating resolution for animation in time 
    const totalTime=500
    const res=10
    const cps=(Array.from(result).length-1)/res
    start_state = current_state;
    for(var i=1;i<=res;i++){        
        //Intital starting original substring of result
        var out=Array.from(result).slice(0, Array.from(result).length-cps*i).join('')
        //Random chars after initial part
        out+=getRandomChar(cps)
        //Clip to max length
        if(out.length>result.length)
            out=Array.from(out).slice(0, Array.from(result).length).join('')
        //For visual purpose
        if (out.length==0)
            out=result

        element.innerHTML=out
        await delay(totalTime/res)
        if (start_state != current_state) {
            return;
        }
    }
    
    //After the animation
    element.innerHTML="⠀";

}

/*
    @param Nothing
    @returns Nothing

    Animates the sidebar to expand
*/
async function expandSidebar(){   
    if (current_state == "manual_collapsing") {
        return;
    }

    document.getElementById("sidebar").classList.remove("collapseSidebar")
    document.getElementById("content").classList.remove("expandContent")
    document.getElementById("sidebar").classList.add("expandSidebar")
    document.getElementById("content").classList.add("collapseContent")

    if (current_state == "expanded" || current_state == "expanding") {
        return;
    }
    current_state = "expanding"
    
    var animList=[['Profile','profileItem1'],['Projects','profileItem2']]
    await Promise.all(animList.map(element => startDelAnim(document.getElementById(element[1]))));
    if (current_state != "expanding") {
        return;
    }
    current_state = "empty_expanding"
    await Promise.all(animList.map(element => startMakeAnim(element[0], document.getElementById(element[1]))));
    current_state = "expanded";
}

/*
    @param Nothing
    @returns Nothing

    Animates the sidebar to collapse
*/
async function collapseSidebar(manual=false){
    document.getElementById("sidebar").classList.remove("expandSidebar")
    document.getElementById("content").classList.remove("collapseContent")
    document.getElementById("sidebar").classList.add("collapseSidebar")
    document.getElementById("content").classList.add("expandContent")

    if (current_state == "collapsed" || current_state == "collapsing" || current_state == "manual_collapsing") {
        return;
    }
    current_state = "collapsing"
    if (manual == true ){
        current_state = "manual_collapsing"
    }
    var animList=[['👤','profileItem1'],['📄','profileItem2']]

    await Promise.all(animList.map(element => startDelAnim(document.getElementById(element[1]))));
    if (current_state != "collapsing" && current_state != "manual_collapsing") {
        return;
    }
    current_state = "empty_collapsing"
    await Promise.all(animList.map(element => startMakeAnim(element[0], document.getElementById(element[1]))));
    current_state = "collapsed";
}

/*
    @param milliseconds: Time in milliseconds
    @returns Promise

    Returns a promise that resolves after the given time
*/
function delay(milliseconds){
    return new Promise(resolve => {
        setTimeout(resolve, milliseconds);
    });
}


/*
    @param length: Length of random string
    @returns String

    Returns a random string of given length
*/
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

/*
    @param Nothing
    @returns Nothing

    Starts the animation on load
*/
function set_sidebar_anim(){
    var onloadAnimItems=[['Ved Suthar','title']]
    for(element in onloadAnimItems){
        startMakeAnim(onloadAnimItems[element][0],document.getElementById(onloadAnimItems[element][1]))
    }
    document.getElementById("sidebar").addEventListener("mouseover",expandSidebar);
    document.getElementById("sidebar").addEventListener("mouseleave",collapseSidebar);
    collapseSidebar();
    
}
