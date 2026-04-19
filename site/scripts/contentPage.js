import { stopProfile } from './profileContent.js';

const cache = new Map();

export async function setInnerContent(page, call_func = null) {
    const validPages = ['profile', 'projects'];
    if (!validPages.includes(page)) {
        console.error("Invalid page requested:", page);
        return;
    }

    // Stop background tasks from other pages
    stopProfile();

    const contentDiv = document.getElementById("innerContent");
    
    // Add a quick fade-out
    contentDiv.style.opacity = '0';

    let text;
    if (cache.has(page)) {
        text = cache.get(page);
    } else {
        try {
            const response = await fetch(page);
            text = await response.text();
            cache.set(page, text);
        } catch (error) {
            console.error("Failed to fetch page:", error);
            contentDiv.style.opacity = '1';
            return;
        }
    }

    // Wait for the fade-out to complete or just small delay for smoothness
    setTimeout(() => {
        contentDiv.innerHTML = text;
        if (call_func != null) {
            call_func();
        }
        // Fade back in
        contentDiv.style.opacity = '1';
    }, 50);
}

// Make it available globally for the inline HTML handlers
window.setInnerContent = setInnerContent;
