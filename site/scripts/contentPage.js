import { loadProfile, stopProfile } from './profileContent';

const pages = ['profile', 'projects', 'skills', 'contact'];

export async function initAllPages() {
    for (const page of pages) {
        const container = document.getElementById(`${page}-page`);
        if (container) {
            try {
                const response = await fetch(page);
                const text = await response.text();
                container.innerHTML = text;
                
                if (page === 'profile') {
                    loadProfile();
                }
            } catch (error) {
                console.error(`Failed to load ${page}:`, error);
            }
        }
    }
    setupScrollObserver();
}

function setupScrollObserver() {
    const observerOptions = {
        root: document.getElementById('innerContent'),
        threshold: 0.6 // TikTok-style trigger when 60% visible
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const pageId = entry.target.id.replace('-page', '');
                
                // Management of animation loop
                if (pageId === 'profile') {
                    loadProfile();
                } else {
                    stopProfile();
                }
                
                // Update sidebar active state if needed
                console.log(`Now viewing: ${pageId}`);
            }
        });
    }, observerOptions);

    pages.forEach(page => {
        const el = document.getElementById(`${page}-page`);
        if (el) observer.observe(el);
    });
}

export function scrollToPage(id) {
    const el = document.getElementById(id);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        
        // Auto-collapse sidebar on mobile/small screens
        if (window.innerWidth < 800 && window.collapseSidebar) {
            window.collapseSidebar(true);
        }
    }
}

window.scrollToPage = scrollToPage;
window.initAllPages = initAllPages;
