class Animator {
    /**
     * 
     * @param {HTMLElement} element 
     * @returns Nothing
     * 
     * Constructor for the Animator class
     */
    constructor(element) {
        this.element = element;
        this.currentState = "";
        this.targetState = "";
    }

    /*
        @param target: End string to be shown
        @returns Nothing

        Animates the element to show the target string
    */
    async targetAnimation(target) {
        this.targetState = target;
        const totalTime = 500;
        const res = 10;
        const startState = this.element.innerHTML;
        let commonStartLength = 0;
        while (commonStartLength < startState.length && commonStartLength < target.length && startState[commonStartLength] === target[commonStartLength]) {
            commonStartLength++;
        }

        const startRemaining = startState.substring(commonStartLength);
        const targetRemaining = target.substring(commonStartLength);

        const diffLength = Math.abs(startRemaining.length - targetRemaining.length);
        const cps = diffLength / res;

        for (var i = 1; i <= res; i++) {
            if (this.targetState !== target) {
                return;
            }

            let out = startState.substring(0, commonStartLength);
            const currentDiff = Math.round(cps * i);

            if (startRemaining.length > targetRemaining.length) {
                // Removing characters
                const currentStartRemaining = Array.from(startRemaining).slice(0, startRemaining.length - currentDiff).join('');
                out += currentStartRemaining;
                if (out.length < target.length) { // If we removed too many, add back from target
                    out = target.substring(0, out.length);
                }
                out += getRandomChar(1);
            } else {
                // Adding characters
                const currentTargetRemaining = Array.from(targetRemaining).slice(0, currentDiff).join('');
                out += currentTargetRemaining;
                if (out.length < target.length) { // If we haven't added enough, add a random char
                    out += getRandomChar(1);
                }
            }
            if (out.length > Math.max(startState.length, target.length))
                out = Array.from(out).slice(0, Math.max(startState.length, target.length)).join('');

            this.element.innerHTML = out;
            await delay(totalTime / res);
        }

        //After the animation
        this.element.innerHTML = target;
    }
}

class SidebarAnimator {
    /**
     * 
     * @param Nothing
     * @returns Nothing
     */
    constructor() {
        
        this.sidebar = document.getElementById("sidebar");
        this.content = document.getElementById("content");
        this.profileItems = [new Animator(document.getElementById('profileItem1')), new Animator(document.getElementById('profileItem2'))];
    }

    /*
        @returns Nothing

        Animates the sidebar to expand
    */
    async expandSidebar() {
        this.sidebar.classList.remove("collapseSidebar");
        this.content.classList.remove("expandContent");
        this.sidebar.classList.add("expandSidebar");
        this.content.classList.add("collapseContent");

        this.profileItems[0].targetAnimation('Profile');
        this.profileItems[1].targetAnimation('Projects');
    }

    /*
        @returns Nothing

        Animates the sidebar to collapse
    */
    async collapseSidebar() {
        this.sidebar.classList.remove("expandSidebar");
        this.content.classList.remove("collapseContent");
        this.sidebar.classList.add("collapseSidebar");
        this.content.classList.add("expandContent");
        
        this.profileItems[0].targetAnimation('👤');
        this.profileItems[1].targetAnimation('📄');
    }

    /*
        @returns Nothing

        Toggles the sidebar
    */
    toggleSidebar() {
        if (this.sidebar.classList.contains("expandSidebar")) {
            this.collapseSidebar(true);
        } else {
            this.expandSidebar();
        }
    }

    /*
        @returns Nothing

        Starts the animation on load
    */
    set_sidebar_anim() {
        title = document.getElementById('title');
        const titleAnimator = new Animator(title);
        title.innerHTML = '';
        titleAnimator.targetAnimation('Ved Suthar');

        this.sidebar.addEventListener("mouseover", () => this.expandSidebar());
        this.sidebar.addEventListener("mouseleave", () => this.collapseSidebar());
        this.collapseSidebar();
    }
}

/**
 * 
 * @param {Number} milliseconds 
 * @returns Promise
 */
/*
    @param milliseconds: Time in milliseconds
    @returns Promise

    Returns a promise that resolves after the given time
*/
function delay(milliseconds) {
    return new Promise(resolve => {
        setTimeout(resolve, milliseconds);
    });
}

const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * 
 * @param {Number} length 
 * @returns String
 */
/*
    @param length: Length of random string
    @returns String

    Returns a random string of given length
*/
function getRandomChar(length) {
    let result = '';
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
        counter += 1;
    }
    return result;
}
/**
 * @type {SidebarAnimator}
 */
let sidebarAnimator = null;
/**
 * 
 * @param Nothing
 * @returns Nothing
 * 
 * Starts the animation on load
 */
function onLoadAnim() {
    sidebarAnimator = new SidebarAnimator();
    sidebarAnimator.set_sidebar_anim();    
}
/**
 * 
 * @param Nothing
 * @returns Nothing
 */
function toggleSidebar() {
    if (sidebarAnimator)
        sidebarAnimator.toggleSidebar();
}
/**
 * @returns Nothing
 */
function collapseSidebar(){
    if (sidebarAnimator)
        sidebarAnimator.collapseSidebar();
}