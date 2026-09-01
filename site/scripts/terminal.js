// site/scripts/terminal.js
// Interactive Linux GNOME-style CLI Terminal for Ved Suthar's Portfolio

import { Haptics } from './haptics';

let terminalEl = null;
let terminalBodyEl = null;
let terminalInputEl = null;
let promptPathEl = null;
let isOpen = false;

const history = [];
let historyIndex = -1;
let currentPath = '~';

const isMobile = () => (typeof window !== 'undefined' && window.innerWidth < 640);

// Simulated Virtual Filesystem for cd, ls, cat
const VIRTUAL_FS = {
    '~': {
        type: 'dir',
        children: {
            'projects': {
                type: 'dir',
                children: {
                    'grand-sim-pro.md': {
                        type: 'file',
                        content: `# Grand Sim Pro
Tech: Rust, wgpu, WGSL, Compute Shaders, Hebbian Learning
Desc: GPU-accelerated survival simulator with 2D spatial CNN vision, compute shaders, and AMM micro-economies.
URL: https://github.com/GoVed/grand-sim-pro`
                    },
                    'resim.md': {
                        type: 'file',
                        content: `# Resim
Tech: Rust, WebAssembly, Genetic Algorithms, DSL Parser
Desc: Discrete-time resource & process simulation engine with custom .reson DSL and multi-core genetic optimizer.
URL: https://goved.github.io/resim/`
                    },
                    'open-ink-bridge.md': {
                        type: 'file',
                        content: `# OpenInkBridge
Tech: Rust, Android NDK, Linux epoll, Onyx/reMarkable SDKs
Desc: Open-source SDK & protocol for ultra low-latency stylus drawing across E-Ink hardware platforms.
URL: https://github.com/GoVed/OpenInkBridge`
                    },
                    'ar-gravity-simulator.md': {
                        type: 'file',
                        content: `# AR Gravity Simulator
Tech: Unity, C#, AR Foundation, Solar System Physics
Desc: Augmented Reality solar system physics simulator available on Google Play Store.
URL: https://play.google.com/store/apps/details?id=com.VEAM.ARGravitySimulator`
                    },
                    'elemental.md': {
                        type: 'file',
                        content: `# Elemental
Tech: Android, Java/Kotlin, Game Architecture
Desc: Android survival and resource management game with discrete simulation loop.
URL: https://github.com/GoVed/elemental`
                    },
                    'traffic-simulation.md': {
                        type: 'file',
                        content: `# Real-Time Traffic Simulation
Tech: Rust, Bevy ECS, A* Pathfinding
Desc: Multi-threaded traffic flow simulation with dynamic routing and road network generator.
URL: https://github.com/GoVed/trafast`
                    },
                    'gravity-simulator-2d.md': {
                        type: 'file',
                        content: `# 2D Gravity Simulator
Tech: Python, CUDA, NumPy, Numba JIT
Desc: Highly optimized N-body gravitational simulator benchmarking CPU JIT vs CUDA GPU acceleration.
URL: https://github.com/GoVed/gravitySim`
                    }
                }
            },
            'skills.json': {
                type: 'file',
                content: `{
  "languages": ["Rust", "Python", "TypeScript/JavaScript", "C# (Unity)", "WGSL/GLSL", "C/C++", "SQL"],
  "frameworks_and_graphics": ["wgpu (Compute Shaders)", "Rocket", "Axum", "Tokio", "Bevy", "PyTorch", "NumPy"],
  "tools_and_platforms": ["Linux", "Android NDK", "Docker", "Git", "GitHub Actions CI/CD", "Unity AR Foundation"]
}`
            },
            'about.txt': {
                type: 'file',
                content: `Ved Suthar — Systems Programmer, AI Enthusiast & Game Developer
Chasing the butterfly of curiosity every day. Passionate about building high-performance simulators, GPU compute shaders, low-latency cross-platform protocols, and interactive graphics engines.`
            },
            'contact.txt': {
                type: 'file',
                content: `Email:    vedhsuthardeveloper@gmail.com
GitHub:   https://github.com/GoVed
LinkedIn: https://linkedin.com/in/vedsuthar
Kaggle:   https://kaggle.com/vedsuthar`
            },
            'Cargo.toml': {
                type: 'file',
                content: `[package]
name = "profile"
version = "0.1.0"
edition = "2021"
authors = ["Ved Suthar <vedhsuthardeveloper@gmail.com>"]

[dependencies]
rocket = "0.5.1"
lazy_static = "1.4.0"`
            }
        }
    }
};

const COMMANDS = {
    'help': { desc: 'Show list of available commands and usage', usage: 'help [command]' },
    'neofetch': { desc: 'Display system specs, uptime, and ASCII logo', usage: 'neofetch' },
    'skills': { desc: 'Display categorized tech stack & expertise matrix', usage: 'skills' },
    'projects': { desc: 'List portfolio projects with interactive links', usage: 'projects [--rust|--ai|--all]' },
    'cat': { desc: 'Concatenate and print file contents', usage: 'cat <filename>' },
    'ls': { desc: 'List directory files and folders', usage: 'ls [-l|-a] [dir]' },
    'cd': { desc: 'Change working directory', usage: 'cd <dir>' },
    'pwd': { desc: 'Print working directory', usage: 'pwd' },
    'whoami': { desc: 'Print current user identity and permissions', usage: 'whoami' },
    'uname': { desc: 'Print system and kernel information', usage: 'uname [-a]' },
    'top': { desc: 'Display live simulated system processes', usage: 'top' },
    'gravity': { desc: 'Control physics gravity: normal, zero, anti, or number', usage: 'gravity <normal|zero|anti>' },
    'spawn': { desc: 'Spawn bouncing balls on the canvas', usage: 'spawn [count 1-6]' },
    'sound': { desc: 'Toggle or configure Web Audio effects', usage: 'sound [on|off]' },
    'theme': { desc: 'Switch theme: default, matrix, cyberpunk, dark', usage: 'theme <name>' },
    'matrix': { desc: 'Toggle digital matrix rain easter egg', usage: 'matrix' },
    'cowsay': { desc: 'Have the ASCII cow deliver custom wisdom', usage: 'cowsay <text>' },
    'fortune': { desc: 'Print a random tech quote or fortune', usage: 'fortune' },
    'haptics': { desc: 'Toggle or check mobile haptic feedback status', usage: 'haptics [on|off]' },
    'sudo': { desc: 'Execute command with elevated privileges', usage: 'sudo <command>' },
    'hire': { desc: 'Recruiter fast-track & direct email contact', usage: 'hire' },
    'clear': { desc: 'Clear the terminal output screen', usage: 'clear' },
    'exit': { desc: 'Close the terminal window', usage: 'exit' }
};

const FORTUNES = [
    // Systems & Computer Science Pioneers
    '"Simplicity is prerequisite for reliability." — Edsger W. Dijkstra',
    '"Talk is cheap. Show me the code." — Linus Torvalds',
    '"There are only two hard things in Computer Science: cache invalidation and naming things." — Phil Karlton',
    '"There are two ways of constructing a software design: One way is to make it so simple that there are obviously no deficiencies, and the other way is to make it so complicated that there are no obvious deficiencies." — C.A.R. Hoare',
    '"Premature optimization is the root of all evil (or at least most of it) in programming." — Donald Knuth',
    '"Debugging is twice as hard as writing the code in the first place. Therefore, if you write the code as cleverly as possible, you are, by definition, not smart enough to debug it." — Brian Kernighan',
    '"The best performance improvement is the transition from the nonworking state to the working state." — John Ousterhout',
    '"Programs must be written for people to read, and only incidentally for machines to execute." — Harold Abelson & Gerald Jay Sussman',
    '"Any fool can write code that a computer can understand. Good programmers write code that humans can understand." — Martin Fowler',
    '"First, solve the problem. Then, write the code." — John Johnson',
    '"Sometimes it pays to stay in bed on Monday, rather than spending the rest of the week debugging Monday\'s code." — Dan Salomon',
    '"If debugging is the process of removing software bugs, then programming must be the process of putting them in." — Edsger W. Dijkstra',
    '"Measuring programming progress by lines of code is like measuring aircraft building progress by weight." — Bill Gates',
    '"The function of good software is to make the complex appear simple." — Grady Booch',
    '"UNIX is basically a simple operating system, but you have to be a genius to understand the simplicity." — Dennis Ritchie',
    '"C is quirky, flawed, and an enormous success." — Dennis Ritchie',
    '"You can\'t trust code that you did not totally create yourself." — Ken Thompson',
    '"The most effective debugging tool is still careful thought, coupled with judiciously placed print statements." — Brian Kernighan',
    '"Controlling complexity is the essence of computer programming." — Brian Kernighan',
    '"Computer science is no more about computers than astronomy is about telescopes." — Edsger W. Dijkstra',
    '"It is not enough for code to work." — Robert C. Martin',
    '"The only way to go fast, is to go well." — Robert C. Martin',
    '"Make it work, make it right, make it fast." — Kent Beck',
    '"Before software can be reusable it first has to be usable." — Ralph Johnson',
    '"Deleted code is debugged code." — Jeff Sickel',
    '"Walking on water and developing software from a specification are easy if both are frozen." — Edward V. Berard',
    '"Software undergoes beta testing shortly before it’s released. Beta is Latin for \'still doesn’t work\'." — Anonymous',
    '"Nine people can\'t make a baby in a month." — Fred Brooks',
    '"Adding manpower to a late software project makes it later." — Fred Brooks (Brooks\' Law)',
    '"Good judgment comes from experience, and experience comes from bad judgment." — Fred Brooks',
    '"The most disastrous requirement mistakes are the ones where someone asked for something they didn\'t really need." — Anonymous',
    '"Simplicity does not precede complexity, but follows it." — Alan Perlis',
    '"Fools ignore complexity. Pragmatists suffer it. Some can avoid it. Geniuses remove it." — Alan Perlis',
    '"A language that doesn\'t affect the way you think about programming, is not worth knowing." — Alan Perlis',
    '"Optimization is like salt: a little makes things great, too much ruins everything." — Anonymous',

    // Rust & Systems Programming
    '"Rust: Fearless concurrency, memory safety without garbage collection, and zero-cost abstractions."',
    '"If it compiles in Rust, it usually works on the first try." — Every Rust Developer Ever',
    '"The borrow checker is not an obstacle; it is a strict mentor keeping you safe at 3:00 AM." — Rust Proverb',
    '"In C, shooting yourself in the foot is easy. In C++, it\'s harder, but when you do, it blows your whole leg off. In Rust, the compiler stops you from even aiming at your foot."',
    '"Ownership and Lifetimes: How Rust gave programmers superpowers without the memory leaks."',
    '"Why do systems programmers love Rust? Because segfaults belong in the history books."',
    '"A Result<T, E> in the hand is worth two panics in the bush."',
    '"Zero-cost abstractions: What you don\'t use, you don\'t pay for. What you do use, you couldn\'t hand code any better." — Bjarne Stroustrup',
    '"Concurrency without data races is not just a dream; it\'s the Send and Sync guarantee."',
    '"RAII: Resource Acquisition Is Initialization — the greatest gift to systems programming."',
    '"Unsafe Rust is like a chainsaw: incredibly powerful when needed, but respect the safety guard."',
    '"cargo build --release — transforming pure logic into blazing machine code."',
    '"When in doubt, let the type system prove your invariant."',
    '"Async Rust with Tokio: Multiplexing millions of tasks with zero threads wasted."',
    '"SIMD and Compute Shaders: Why do one calculation per clock when you can do sixteen?"',

    // AI, Deep Learning & Math
    '"Artificial Intelligence is the new electricity." — Andrew Ng',
    '"The question of whether a computer can think is no more interesting than the question of whether a submarine can swim." — Edsger W. Dijkstra',
    '"Gradient descent is the optimizer that moves mountains, one epsilon at a time."',
    '"A neural network is just a bunch of matrix multiplications that learned how to dream."',
    '"In mathematics, you don\'t understand things. You just get used to them." — John von Neumann',
    '"Deep learning is representation learning: finding the geometric coordinates where problems become simple."',
    '"Intelligence is the computational ability to achieve goals in complex environments." — Max Tegmark',
    '"Backpropagation: The unsung hero turning high-dimensional loss surfaces into intelligent representations."',
    '"Compute is the ultimate leverage. With enough GPUs and the right loss function, magic happens."',
    '"Attention is all you need? No, attention + compute + residual connections + layer norm is what you need."',
    '"The bitter lesson of AI: General methods that leverage computation are ultimately the most effective." — Rich Sutton',
    '"Hebbian Learning: Neurons that fire together, wire together."',
    '"Spatial CNNs and vision models: Translating raw photon grids into structured semantic world models."',
    '"Mathematics is the language with which God has written the universe." — Galileo Galilei',
    '"Truth is much too complicated to allow anything but approximations." — John von Neumann',
    '"We can only see a short distance ahead, but we can see plenty there that needs to be done." — Alan Turing',

    // Game Dev, Physics & Graphics
    '"Focus is a matter of deciding what things you\'re not going to do." — John Carmack',
    '"Story in a game is like a story in an adult movie. It\'s expected to be there, but it\'s not that important." — John Carmack',
    '"Low-level graphics programming is where art and physics merge at 60 frames per second."',
    '"A delayed game is eventually good, but a rushed game is forever bad." — Shigeru Miyamoto',
    '"Game mechanics are physics with emotional feedback loops."',
    '"Compute shaders turn your GPU into a massively parallel supercomputer in the palm of your hand."',
    '"Every pixel on your screen represents millions of floating-point operations executed in nanoseconds."',
    '"In game engines, performance isn\'t an optimization — it\'s the foundation of immersion."',
    '"Discrete-event simulations allow us to test a thousand alternate universes before breakfast."',
    '"Ray marching, signed distance fields, and compute shaders: The modern sorcery of demoscene graphics."',
    '"The secret to real-time graphics is not calculating everything — it\'s knowing what to fake convincingly." — Michael Abrash',
    '"Physics engines don\'t simulate reality; they simulate believable momentum under constraints."',
    '"ECS (Entity Component System): Cache locality is king, and arrays of data reign supreme."',

    // Hacker Culture & Unix Philosophy
    '"This is the Unix philosophy: Write programs that do one thing and do it well. Write programs to work together." — Doug McIlroy',
    '"Rule of Modularity: Developers should build a program out of simple parts connected by well-defined interfaces." — Eric S. Raymond',
    '"Given enough eyeballs, all bugs are shallow." — Linus\'s Law (Eric S. Raymond)',
    '"Do not fear the terminal; it is the most expressive interface ever created by humankind."',
    '"The Unix philosophy: Small tools, text streams, and composable pipelines."',
    '"An engineer who masters the command line holds a lever capable of moving the world."',
    '"Every good work of software starts by scratching a developer\'s personal itch." — Eric S. Raymond',
    '"Open source is not just about sharing code; it is about compounding human innovation."',
    '"Git: The time machine that allows engineers to take courageous architectural risks."',

    // Developer Fortunes & Witty Realities
    '"Fortune: You will soon find a missing semicolon, and everything will make sense."',
    '"Fortune: Today is a great day to refactor that function you wrote at 2 AM."',
    '"Fortune: The bug you have been chasing for three hours is an off-by-one error."',
    '"Fortune: Your next git push --force will not be needed, for your branch is clean."',
    '"Fortune: A pull request approved with \'LGTM\' brings eternal peace."',
    '"Fortune: Remember to hydrate: your brain is a neural network running on water and coffee."',
    '"Fortune: Beware of code comments that start with \'// TODO: fix this later (temporary)\' — 2018."',
    '"Fortune: May your compile times be short and your cache hits be 100%."',
    '"Fortune: You will write a unit test today that catches a bug before production does."',
    '"Fortune: The best documentation is a clean API and self-describing variable names."',
    '"There are 10 types of people in the world: those who understand binary, and those who don\'t."',
    '"A code is like humor. When you have to explain it, it’s bad." — Cory House',
    '"Code never lies, comments sometimes do." — Ron Jeffries',
    '"It works on my machine! — Standard Developer Certificate of Quality"',
    '"Documentation is like oxygen: you only notice when it’s completely missing."',
    '"Real programmers count from 0."',
    '"A SQL query walks into a bar, walks up to two tables and asks: \'Can I join you?\'"',
    '"Hardware: The parts of a computer system that can be kicked." — Jeff Pesis',
    '"A user interface is like a joke. If you have to explain it, it’s not that good."',
    '"Experience is what you get when you didn\'t get what you wanted." — Randy Pausch',

    // Ved\'s Personal Philosophy & Project Mantras
    '"Chasing the butterfly of curiosity every day. Something interesting? Day=Gone!" — Ved Suthar',
    '"If a simulation can run at 60 FPS on CPU, imagine what it does with compute shaders on the GPU." — Ved Suthar',
    '"Build systems not for the sake of complexity, but for the thrill of raw, unadulterated performance." — Ved Suthar',
    '"The best way to understand an algorithm is to simulate 10,000 entities living inside it." — Ved Suthar',
    '"Low latency is not a luxury; it is respect for the user\'s perception of reality." — Ved Suthar',
    '"Curiosity is the compiler of creativity; feed it good inputs, and the outputs will astonish you." — Ved Suthar'
];

function printLine(html, type = 'output') {
    if (!terminalBodyEl) return;
    const line = document.createElement('div');
    line.className = `term-line term-${type}`;
    line.innerHTML = html;
    terminalBodyEl.appendChild(line);
    terminalBodyEl.scrollTop = terminalBodyEl.scrollHeight;
}

function resolvePath(target) {
    if (!target || target === '~' || target === '/home/ved') return '~';
    if (target === 'projects' || target === '~/projects' || target === '/home/ved/projects') return '~/projects';
    if (target === '..' && currentPath === '~/projects') return '~';
    if (target === '.' || target === './') return currentPath;
    return null;
}

function getDirEntries(path) {
    if (path === '~') {
        return Object.keys(VIRTUAL_FS['~'].children);
    }
    if (path === '~/projects') {
        return Object.keys(VIRTUAL_FS['~'].children.projects.children);
    }
    return [];
}

function getFileContent(filename) {
    if (currentPath === '~') {
        const item = VIRTUAL_FS['~'].children[filename];
        if (item && item.type === 'file') return item.content;
    } else if (currentPath === '~/projects') {
        const item = VIRTUAL_FS['~'].children.projects.children[filename];
        if (item && item.type === 'file') return item.content;
    }
    // Try global lookup
    if (filename.startsWith('projects/')) {
        const sub = filename.replace('projects/', '');
        const item = VIRTUAL_FS['~'].children.projects.children[sub];
        if (item && item.type === 'file') return item.content;
    }
    return null;
}

function getLevenshteinDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

function findDidYouMean(cmd) {
    const list = Object.keys(COMMANDS);
    let bestMatch = null;
    let minDistance = 3;

    for (const item of list) {
        const d = getLevenshteinDistance(cmd, item);
        if (d < minDistance) {
            minDistance = d;
            bestMatch = item;
        }
    }
    return bestMatch;
}

function wrapText(text, maxLen = 30) {
    const words = text.split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) {
        if ((cur + ' ' + w).trim().length > maxLen) {
            if (cur) lines.push(cur.trim());
            cur = w;
        } else {
            cur += (cur ? ' ' : '') + w;
        }
    }
    if (cur) lines.push(cur.trim());
    return lines;
}

function executeCommand(inputRaw) {
    const raw = inputRaw.trim();
    if (!raw) return;

    // Save to history
    history.push(raw);
    historyIndex = history.length;

    // Echo command with GNOME prompt styling
    printLine(`<span class="term-gnome-prompt">[<span class="prompt-user">ved</span><span class="prompt-at">@</span><span class="prompt-host">portfolio</span> <span class="prompt-path">${currentPath}</span>]$</span> <span class="term-cmd-text">${escapeHtml(raw)}</span>`, 'command');

    const parts = raw.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);
    const mobile = isMobile();

    switch (cmd) {
        case 'help':
        case '?': {
            if (args.length > 0) {
                const targetCmd = args[0].toLowerCase();
                if (COMMANDS[targetCmd]) {
                    printLine(`
<div class="term-box">
  <span class="term-gnome-blue font-bold">COMMAND:</span> <span class="term-highlight">${targetCmd}</span>
  <span class="term-cyan">Usage:</span>       ${COMMANDS[targetCmd].usage}
  <span class="term-cyan">Description:</span> ${COMMANDS[targetCmd].desc}
</div>`);
                } else {
                    printLine(`<span class="term-error">help: no help entry for "${escapeHtml(args[0])}"</span>`);
                }
                return;
            }

            let helpHtml = '';
            if (mobile) {
                helpHtml = `<pre class="term-box-pre"><span class="term-gnome-blue font-bold">─── COMMAND REFERENCE ───</span>

<span class="term-section-title">📂 Filesystem:</span>
  <span class="term-cyan">ls</span>       - list files
  <span class="term-cyan">cd &lt;dir&gt;</span> - change folder
  <span class="term-cyan">cat &lt;f&gt;</span>  - read file
  <span class="term-cyan">pwd</span>      - print path
  <span class="term-cyan">whoami</span>   - user identity

<span class="term-section-title">💼 Portfolio:</span>
  <span class="term-cyan">skills</span>   - tech stack
  <span class="term-cyan">projects</span> - project list
  <span class="term-cyan">hire</span>     - contact Ved

<span class="term-section-title">🎮 Tools & Fun:</span>
  <span class="term-cyan">neofetch</span> - system info
  <span class="term-cyan">gravity</span>  - physics mode
  <span class="term-cyan">spawn</span>    - drop balls
  <span class="term-cyan">sound</span>    - toggle audio
  <span class="term-cyan">fortune</span>  - random quote
  <span class="term-cyan">cowsay</span>   - ascii cow
  <span class="term-cyan">clear</span>    - clear screen
  <span class="term-cyan">exit</span>     - close terminal</pre>`;
            } else {
                helpHtml = `<pre class="term-box-pre"><span class="term-gnome-blue font-bold">TERMINAL COMMAND REFERENCE:</span>

<span class="term-section-title">📂 System & Filesystem:</span>
  <span class="term-cyan">ls [-l|-a]</span>         List directory files
  <span class="term-cyan">cd &lt;dir&gt;</span>           Change directory (~ or ~/projects)
  <span class="term-cyan">cat &lt;file&gt;</span>         View file content (e.g. cat Cargo.toml, cat skills.json)
  <span class="term-cyan">pwd</span>                Print current directory path
  <span class="term-cyan">whoami</span>             Print current user identity
  <span class="term-cyan">uname [-a]</span>         Print OS kernel information
  <span class="term-cyan">neofetch</span>           Display system specs and ASCII art

<span class="term-section-title">💼 Portfolio & Work:</span>
  <span class="term-cyan">skills</span>             Detailed technical skills and stack breakdown
  <span class="term-cyan">projects</span>           List interactive engineering projects
  <span class="term-cyan">hire</span> / <span class="term-cyan">sudo hire</span>   Recruiter fast-track and direct contact

<span class="term-section-title">🎮 Physics & Utilities:</span>
  <span class="term-cyan">gravity &lt;val&gt;</span>      Set gravity (normal, zero, anti, or float)
  <span class="term-cyan">spawn [n]</span>          Spawn bouncing balls on the canvas
  <span class="term-cyan">sound [on|off]</span>     Toggle procedural audio synthesizer
  <span class="term-cyan">theme &lt;name&gt;</span>       Change UI theme (default, matrix, cyberpunk, dark)
  <span class="term-cyan">matrix</span>             Toggle falling digital rain overlay
  <span class="term-cyan">top</span>                Show live system process monitor
  <span class="term-cyan">cowsay &lt;msg&gt;</span>       ASCII cow with speech bubble
  <span class="term-cyan">fortune</span>            Random software engineering quote
  <span class="term-cyan">clear</span>              Clear terminal screen
  <span class="term-cyan">exit</span>               Close terminal drawer</pre>`;
            }
            printLine(helpHtml);
            break;
        }

        case 'neofetch':
        case 'fastfetch':
        case 'fetch': {
            if (mobile) {
                const compactFetch = `<pre class="term-box-pre"><span class="prompt-user font-bold">ved</span><span class="prompt-at">@</span><span class="prompt-host font-bold">portfolio</span>
<span class="term-dim">------------------------</span>
<span class="term-gnome-blue font-bold">OS:</span>      Linux x86_64
<span class="term-gnome-blue font-bold">Host:</span>    Portfolio SPA
<span class="term-gnome-blue font-bold">Kernel:</span>  6.14.0-ved-engine
<span class="term-gnome-blue font-bold">Shell:</span>   goved-sh 2.0.0
<span class="term-gnome-blue font-bold">DE/WM:</span>   GNOME / Canvas
<span class="term-gnome-blue font-bold">CPU:</span>     WASM + wgpu
<span class="term-gnome-blue font-bold">Memory:</span>  42MiB
<span class="term-gnome-blue font-bold">Focus:</span>   Systems, AI & Games
<span class="term-dim">Colors:</span>  <span style="color:#e01b24">██</span><span style="color:#33d17a">██</span><span style="color:#f5c211">██</span><span style="color:#3584e4">██</span><span style="color:#33c7de">██</span></pre>`;
                printLine(compactFetch);
            } else {
                const logo = [
                    '       .---.      ',
                    '      /     \\     ',
                    '     | () () |    ',
                    '      \\  _  /     ',
                    '       /   \\      ',
                    '      /|   |\\     ',
                    '     / |   | \\    ',
                    '    (  |===|  )   ',
                    '     \\ \\   / /    ',
                    '      \\_____/     '
                ];

                const info = [
                    `<span class="prompt-user font-bold">ved</span><span class="prompt-at">@</span><span class="prompt-host font-bold">portfolio</span>`,
                    `<span class="term-dim">------------------------------------</span>`,
                    `<span class="term-gnome-blue font-bold">OS:</span> Linux x86_64 (Custom Web Runtime)`,
                    `<span class="term-gnome-blue font-bold">Host:</span> Portfolio Engine (Rust Rocket 0.5)`,
                    `<span class="term-gnome-blue font-bold">Kernel:</span> 6.14.0-ved-engine`,
                    `<span class="term-gnome-blue font-bold">Uptime:</span> 100% Focused on Innovation`,
                    `<span class="term-gnome-blue font-bold">Shell:</span> goved-sh 2.0.0`,
                    `<span class="term-gnome-blue font-bold">DE/WM:</span> GNOME 47 / Canvas Compositor`,
                    `<span class="term-gnome-blue font-bold">CPU:</span> WebAssembly JIT + wgpu Shaders`,
                    `<span class="term-gnome-blue font-bold">Memory:</span> 42MiB / Browser Heap`
                ];

                let fetchLines = [];
                const maxLines = Math.max(logo.length, info.length);
                for (let i = 0; i < maxLines; i++) {
                    const l = logo[i] || '                  ';
                    const inf = info[i] || '';
                    fetchLines.push(`<span class="gnome-blue">${l}</span>  ${inf}`);
                }
                fetchLines.push(`                  <span class="term-dim">Colors:</span> <span style="color:#000">██</span><span style="color:#e01b24">██</span><span style="color:#33d17a">██</span><span style="color:#f5c211">██</span><span style="color:#3584e4">██</span><span style="color:#c061cb">██</span><span style="color:#33c7de">██</span><span style="color:#ffffff">██</span>`);

                printLine(`<pre class="term-fetch-pre">${fetchLines.join('\n')}</pre>`);
            }
            break;
        }

        case 'skills':
        case 'stack': {
            if (mobile) {
                const mobileSkills = `<pre class="term-box-pre"><span class="term-gnome-blue font-bold">─── TECHNICAL STACK ───</span>

<span class="term-cyan font-bold">Languages:</span>
  <span class="term-highlight">▶ Rust (98%)</span>
    Tokio • wgpu • Rocket • Bevy
  <span class="term-highlight">▶ Python (92%)</span>
    PyTorch • CUDA • NumPy • JIT
  <span class="term-highlight">▶ TypeScript (88%)</span>
    Canvas • Web Audio • Node.js
  <span class="term-highlight">▶ C# & Unity (85%)</span>
    AR Foundation • Game Mechanics
  <span class="term-highlight">▶ WGSL / GLSL (82%)</span>
    Compute Shaders • GPGPU

<span class="term-cyan font-bold">Systems & Graphics:</span>
  • <span class="term-highlight">wgpu & GPGPU</span>: Compute shaders
  • <span class="term-highlight">Simulations</span>: Genetic opt & DSL
  • <span class="term-highlight">Protocols</span>: Low-latency stylus
  • <span class="term-highlight">DevOps</span>: Docker, CI/CD, POSIX</pre>`;
                printLine(mobileSkills);
            } else {
                const skillsHtml = `<pre class="term-box-pre"><span class="term-gnome-blue font-bold">─── CORE TECHNICAL EXPERTISE & STACK ─────────────────────────────────</span>

<span class="term-cyan font-bold">Languages:</span>
  • <span class="term-highlight">Rust</span>         [████████████████████] 98% — Tokio, wgpu, Rocket, Axum, Bevy, NDK
  • <span class="term-highlight">Python</span>       [██████████████████  ] 92% — PyTorch, NumPy, CUDA, Numba JIT, DL
  • <span class="term-highlight">TypeScript</span>   [████████████████    ] 88% — Canvas API, Web Audio API, Modern ES6+
  • <span class="term-highlight">C# (Unity)</span>   [████████████████    ] 85% — AR Foundation, Physics, Game Mechanics
  • <span class="term-highlight">WGSL / GLSL</span>  [███████████████     ] 82% — Compute Shaders, GPGPU, Parallel Reduction

<span class="term-cyan font-bold">Systems & Graphics:</span>
  • <span class="term-highlight">wgpu & GPGPU:</span>       Compute shaders, spatial Hebbian vision, survival sims
  • <span class="term-highlight">Simulation Engines:</span> Discrete-event engines, genetic optimization, DSLs
  • <span class="term-highlight">Protocols & I/O:</span>     Low-latency stylus protocols across E-Ink & Linux
  • <span class="term-highlight">Linux & Systems:</span>    Docker multi-stage builds, CI/CD, Epoll, POSIX</pre>`;
                printLine(skillsHtml);
            }
            break;
        }

        case 'projects': {
            const filter = args[0] ? args[0].toLowerCase() : '';
            const projects = [
                {
                    name: 'Grand Sim Pro',
                    slug: 'grand-sim-pro',
                    tags: ['rust', 'wgpu', 'ai', 'gpu'],
                    desc: 'GPU-accelerated survival simulator with 2D spatial CNN vision & compute shaders.',
                    url: 'https://github.com/GoVed/grand-sim-pro'
                },
                {
                    name: 'Resim',
                    slug: 'resim',
                    tags: ['rust', 'wasm', 'simulation'],
                    desc: 'Discrete-time simulation engine with custom DSL & genetic optimizer.',
                    url: 'https://goved.github.io/resim/'
                },
                {
                    name: 'OpenInkBridge',
                    slug: 'open-ink-bridge',
                    tags: ['rust', 'linux', 'android', 'hardware'],
                    desc: 'Low-latency stylus drawing protocol across E-Ink hardware platforms.',
                    url: 'https://github.com/GoVed/OpenInkBridge'
                },
                {
                    name: 'AR Gravity Simulator',
                    slug: 'ar-gravity-sim',
                    tags: ['unity', 'c#', 'ar', 'physics'],
                    desc: 'Augmented Reality solar system physics visualizer on Google Play.',
                    url: 'https://play.google.com/store/apps/details?id=com.VEAM.ARGravitySimulator'
                },
                {
                    name: 'Real-Time Traffic Simulation',
                    slug: 'traffic-sim',
                    tags: ['rust', 'bevy', 'simulation'],
                    desc: 'Multi-threaded traffic flow simulation in Rust & Bevy with A* routing.',
                    url: 'https://github.com/GoVed/trafast'
                },
                {
                    name: '2D Gravity Simulator',
                    slug: 'gravity-sim',
                    tags: ['python', 'cuda', 'physics', 'gpu'],
                    desc: 'Optimized N-body gravitational simulator benchmarking JIT vs CUDA.',
                    url: 'https://github.com/GoVed/gravitySim'
                }
            ];

            let projHtml = `<pre class="term-box-pre"><span class="term-gnome-blue font-bold">${mobile ? '─── PROJECTS ───' : '─── FEATURED PROJECTS ────────────────────────────────────────────────'}</span>\n\n`;

            let matchedCount = 0;
            for (const p of projects) {
                if (filter && !p.tags.some(t => filter.includes(t)) && !p.name.toLowerCase().includes(filter.replace('--', ''))) {
                    continue;
                }
                matchedCount++;
                if (mobile) {
                    projHtml += `  <span class="term-highlight font-bold">▶ ${p.name}</span>\n`;
                    projHtml += `    <span class="term-dim">${p.tags.join(' • ')}</span>\n`;
                    projHtml += `    ${p.desc}\n`;
                    projHtml += `    <a href="${p.url}" target="_blank" class="term-link">🔗 View Project</a>\n\n`;
                } else {
                    projHtml += `  <span class="term-highlight">▶ ${p.name}</span> <span class="term-dim">[${p.tags.join(', ')}]</span>\n`;
                    projHtml += `    ${p.desc}\n`;
                    projHtml += `    <span class="term-cyan">Link:</span> <a href="${p.url}" target="_blank" class="term-link">${p.url}</a>\n\n`;
                }
            }

            if (matchedCount === 0) {
                projHtml += `  <span class="term-dim">No projects matched filter "${escapeHtml(filter)}".</span>\n`;
            } else {
                projHtml += `<span class="term-dim">Tip: Try </span><span class="term-cyan">cat projects/grand-sim-pro.md</span></pre>`;
            }
            printLine(projHtml);
            break;
        }

        case 'ls': {
            const showAll = args.includes('-a') || args.includes('-la') || args.includes('-al');
            const showLong = args.includes('-l') || args.includes('-la') || args.includes('-al');
            const targetDir = args.find(a => !a.startsWith('-')) || currentPath;
            const resolvedDir = resolvePath(targetDir);

            if (!resolvedDir) {
                printLine(`<span class="term-error">ls: cannot access '${escapeHtml(targetDir)}': No such file or directory</span>`);
                return;
            }

            let entries = getDirEntries(resolvedDir);
            if (showAll) {
                entries = ['.', '..', ...entries];
            }

            if (showLong) {
                let out = `<div class="term-code">total ${entries.length * 4}\n`;
                for (const name of entries) {
                    const isDir = name === '.' || name === '..' || name === 'projects';
                    const perms = isDir ? 'drwxr-xr-x' : '-rw-r--r--';
                    const colorClass = isDir ? 'term-gnome-blue font-bold' : (name.endsWith('.json') || name.endsWith('.toml') ? 'term-cyan' : 'term-default');
                    if (mobile) {
                        out += `${perms} <span class="${colorClass}">${name}${isDir ? '/' : ''}</span>\n`;
                    } else {
                        const size = isDir ? '4096' : '1024';
                        out += `${perms}  1 ved ved ${size.padStart(5)} Aug 31 21:00 <span class="${colorClass}">${name}</span>\n`;
                    }
                }
                out += '</div>';
                printLine(out);
            } else {
                const formatted = entries.map(name => {
                    const isDir = name === '.' || name === '..' || name === 'projects';
                    const colorClass = isDir ? 'term-gnome-blue font-bold' : (name.endsWith('.json') || name.endsWith('.toml') ? 'term-cyan' : 'term-default');
                    return `<span class="${colorClass}">${name}${isDir ? '/' : ''}</span>`;
                }).join(mobile ? '\n' : '  ');
                printLine(formatted);
            }
            break;
        }

        case 'cd': {
            if (args.length === 0 || args[0] === '~' || args[0] === '') {
                currentPath = '~';
                updatePromptPath();
                return;
            }
            const dest = resolvePath(args[0]);
            if (dest) {
                currentPath = dest;
                updatePromptPath();
            } else {
                printLine(`<span class="term-error">bash: cd: ${escapeHtml(args[0])}: No such file or directory</span>`);
            }
            break;
        }

        case 'pwd': {
            printLine(currentPath === '~' ? '/home/ved' : '/home/ved/projects');
            break;
        }

        case 'cat': {
            if (args.length === 0) {
                printLine('<span class="term-error">cat: missing operand. Usage: cat &lt;filename&gt;</span>');
                return;
            }
            const content = getFileContent(args[0]);
            if (content !== null) {
                printLine(`<pre class="term-pre">${escapeHtml(content)}</pre>`);
            } else {
                printLine(`<span class="term-error">cat: ${escapeHtml(args[0])}: No such file or directory</span>`);
            }
            break;
        }

        case 'whoami': {
            printLine('<span class="term-success font-bold">ved</span> (Ved Suthar — Systems Programmer & AI Dev)\n<span class="term-dim">groups=wheel,rustaceans,gamedevelopers</span>');
            break;
        }

        case 'uname': {
            if (args.includes('-a')) {
                printLine(mobile ? 'Linux portfolio 6.14.0-ved x86_64 GNU/Linux' : 'Linux portfolio 6.14.0-ved-x86_64 #1 SMP PREEMPT_DYNAMIC Wed Aug 26 14:10:00 UTC 2026 x86_64 GNU/Linux');
            } else if (args.includes('-r')) {
                printLine('6.14.0-ved-x86_64');
            } else {
                printLine('Linux');
            }
            break;
        }

        case 'top':
        case 'htop': {
            let topOutput = '';
            if (mobile) {
                topOutput = `<pre class="term-box-pre"><span class="term-gnome-blue font-bold">LIVE PROCESS MONITOR:</span>
<span class="term-table-header">PID   COMMAND      %CPU  MEM </span>
<span class="term-cyan">1042  gravity_sim  12.5  48M </span>
<span class="term-cyan">1043  chibi_guy    4.2   24M </span>
<span class="term-cyan">1044  audio_synth  1.0   16M </span>
<span class="term-cyan">1045  rocket_srv   0.5   12M </span></pre>`;
            } else {
                topOutput = `<pre class="term-box-pre"><span class="term-gnome-blue font-bold">top - 21:38:00 up continuous, 1 user, load average: 0.12, 0.08, 0.05</span>
<span class="term-dim">Tasks: 4 total, 1 running, 3 sleeping, 0 stopped, 0 zombie</span>
<span class="term-dim">%Cpu(s):  4.2 us,  1.1 sy,  0.0 ni, 94.7 id,  0.0 wa,  0.0 hi,  0.0 si</span>
<span class="term-dim">MiB Mem :   7842.4 total,   4120.8 free,   1842.1 used,   1879.5 buff/cache</span>

<span class="term-table-header">  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND      </span>
<span class="term-cyan"> 1042 ved       20   0  142.4m  48.2m  12.0m R  12.5   0.6   0:18.42 gravity_sim  </span>
<span class="term-cyan"> 1043 ved       20   0   88.1m  24.6m   8.4m S   4.2   0.3   0:06.15 chibi_guy_ai </span>
<span class="term-cyan"> 1044 ved       20   0   42.0m  16.2m   6.1m S   1.0   0.2   0:01.89 audio_synth  </span>
<span class="term-cyan"> 1045 ved       20   0   32.0m  12.1m   4.5m S   0.5   0.1   0:00.94 rocket_srv   </span></pre>`;
            }
            printLine(topOutput);
            break;
        }

        case 'gravity': {
            if (args.length === 0) {
                printLine('<span class="term-error">Usage: gravity &lt;normal | zero | anti&gt;</span>');
                return;
            }
            const gVal = args[0].toLowerCase();
            if (gVal === 'normal' || gVal === 'earth' || gVal === '1') {
                if (window.govedGame) {
                    while (window.govedGame.cycleGravity() !== 1.0) {}
                }
                printLine('<span class="term-success">🌍 Gravity set to Normal (1.0G)</span>');
            } else if (gVal === 'zero' || gVal === '0' || gVal === 'space') {
                if (window.govedGame) {
                    while (window.govedGame.cycleGravity() !== 0.0) {}
                }
                printLine('<span class="term-success">🛸 Gravity set to Zero-G (0.0G)</span>');
            } else if (gVal === 'anti' || gVal === '-1' || gVal === 'antigravity') {
                if (window.govedGame) {
                    while (window.govedGame.cycleGravity() !== -1.0) {}
                }
                printLine('<span class="term-success">🪐 Gravity set to Antigravity (-1.0G)</span>');
            } else {
                printLine('<span class="term-error">Options: normal, zero, anti</span>');
            }
            break;
        }

        case 'spawn': {
            const spawnCount = parseInt(args[0], 10) || 1;
            const clamped = Math.min(Math.max(spawnCount, 1), 6);
            if (window.govedGame) {
                for (let i = 0; i < clamped; i++) {
                    window.govedGame.spawnBall();
                }
                printLine(`<span class="term-success">⚡ Spawned ${clamped} ball(s)!</span>`);
            }
            break;
        }

        case 'sound': {
            if (args[0] === 'on' || args[0] === 'enable') {
                if (window.govedGame && !window.govedGame.toggleSound()) {
                    window.govedGame.toggleSound();
                }
                printLine('<span class="term-success">🔊 Sound enabled.</span>');
            } else if (args[0] === 'off' || args[0] === 'mute') {
                if (window.govedGame && window.govedGame.toggleSound()) {
                    window.govedGame.toggleSound();
                }
                printLine('<span class="term-success">🔇 Sound muted.</span>');
            } else {
                const state = window.govedGame ? window.govedGame.toggleSound() : false;
                printLine(`<span class="term-success">Sound is ${state ? 'ON 🔊' : 'OFF 🔇'}</span>`);
            }
            break;
        }

        case 'theme': {
            const theme = args[0] ? args[0].toLowerCase() : '';
            if (theme === 'matrix') {
                document.body.classList.remove('theme-cyberpunk');
                document.body.classList.add('theme-matrix');
                printLine('<span class="term-success">🟩 Matrix Theme activated!</span>');
            } else if (theme === 'cyberpunk') {
                document.body.classList.remove('theme-matrix');
                document.body.classList.add('theme-cyberpunk');
                printLine('<span class="term-success">🟪 Cyberpunk Theme activated!</span>');
            } else if (theme === 'dark' || theme === 'default') {
                document.body.classList.remove('theme-matrix', 'theme-cyberpunk');
                printLine('<span class="term-success">Standard dark theme restored.</span>');
            } else {
                printLine('<span class="term-error">Available: default, matrix, cyberpunk, dark</span>');
            }
            break;
        }

        case 'matrix': {
            toggleMatrixRain();
            printLine('<span class="term-success">Digital Rain toggled!</span>');
            break;
        }

        case 'cowsay': {
            let msg = args.length > 0 ? args.join(' ') : null;
            if (!msg) {
                const randomFortune = FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
                msg = randomFortune.replace(/^"|"$/g, '');
            }
            
            const maxW = mobile ? 24 : 50;
            const lines = wrapText(msg, maxW);
            const lineLen = Math.max(...lines.map(l => l.length), 10);
            const topBar = ' ' + '_'.repeat(lineLen + 2);
            const botBar = ' ' + '-'.repeat(lineLen + 2);
            const bubble = lines.map(l => `< ${escapeHtml(l.padEnd(lineLen))} >`).join('\n');

            const cow = `<pre class="term-box-pre term-cow">
${topBar}
${bubble}
${botBar}
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||</pre>`;
            printLine(cow);
            break;
        }

        case 'fortune':
        case 'quote': {
            const filterKeyword = args.length > 0 ? args.join(' ').toLowerCase() : '';
            let pool = FORTUNES;
            if (filterKeyword) {
                const filtered = FORTUNES.filter(q => q.toLowerCase().includes(filterKeyword));
                if (filtered.length > 0) {
                    pool = filtered;
                }
            }
            const q = pool[Math.floor(Math.random() * pool.length)];
            printLine(`<pre class="term-box-pre"><span class="term-highlight">${escapeHtml(q)}</span></pre>`);
            break;
        }

        case 'haptics': {
            const supported = Haptics.isSupported();
            if (args[0] === 'test') {
                const fired = Haptics.test();
                if (supported) {
                    printLine(`<span class="term-success">📳 Sent vibration test pulse [120ms, 60ms, 120ms] (Result: ${fired ? 'SUCCESS' : 'BLOCKED_BY_BROWSER'})</span>`);
                } else {
                    printLine(`<span class="term-error">⚠️ navigator.vibrate is not available on this browser/OS. (Requires mobile device with hardware motor)</span>`);
                }
            } else if (args[0] === 'on' || args[0] === 'enable') {
                if (!Haptics.isEnabled()) Haptics.toggle();
                printLine(`<span class="term-success">📳 Mobile Haptics ENABLED. (Hardware Support: ${supported ? 'YES ✅' : 'NO ❌'})</span>`);
            } else if (args[0] === 'off' || args[0] === 'disable') {
                if (Haptics.isEnabled()) Haptics.toggle();
                printLine('<span class="term-success">📴 Mobile Haptics DISABLED.</span>');
            } else {
                const state = Haptics.toggle();
                printLine(`<span class="term-success">Mobile Haptics: ${state ? 'ENABLED 📳' : 'DISABLED 📴'}</span>\n<span class="term-dim">Hardware API Supported: ${supported ? 'YES ✅' : 'NO (Desktop or unsupported browser) ❌'}</span>\n<span class="term-dim">Run </span><span class="term-cyan">haptics test</span><span class="term-dim"> to fire a physical test pulse.</span>`);
            }
            break;
        }

        case 'sudo': {
            if (args[0] === 'hire') {
                handleHireCommand();
            } else {
                Haptics.medium();
                printLine(`[sudo] password for ved: \n<span class="term-error">Access granted. Try "sudo hire" 😉</span>`);
            }
            break;
        }

        case 'hire': {
            handleHireCommand();
            break;
        }

        case 'clear':
        case 'cls': {
            if (terminalBodyEl) {
                terminalBodyEl.innerHTML = '';
            }
            Haptics.light();
            break;
        }

        case 'exit':
        case 'quit': {
            closeTerminal();
            Haptics.light();
            break;
        }

        default: {
            Haptics.error();
            const suggestion = findDidYouMean(cmd);
            let errHtml = `<span class="term-error">bash: ${escapeHtml(cmd)}: command not found</span>`;
            if (suggestion) {
                errHtml += `\n<span class="term-dim">Did you mean: </span><span class="term-cyan">${suggestion}</span><span class="term-dim">? Type </span><span class="term-cyan">help</span><span class="term-dim">.</span>`;
            }
            printLine(errHtml);
            break;
        }
    }
}

function handleHireCommand() {
    const mobile = isMobile();
    Haptics.highScore();
    let hireBox = '';
    if (mobile) {
        hireBox = `<pre class="term-box-pre term-hire-card"><span class="term-gnome-blue font-bold">┌──────────────────────────┐</span>
<span class="term-gnome-blue font-bold">│</span>  <span class="term-highlight font-bold">EXCELLENT DECISION!</span>     <span class="term-gnome-blue font-bold">│</span>
<span class="term-gnome-blue font-bold">│</span>  Connecting with Ved...  <span class="term-gnome-blue font-bold">│</span>
<span class="term-gnome-blue font-bold">└──────────────────────────┘</span></pre>`;
    } else {
        hireBox = `<pre class="term-box-pre term-hire-card"><span class="term-gnome-blue font-bold">┌─────────────────────────────────────────────────────────────┐</span>
<span class="term-gnome-blue font-bold">│</span>  <span class="term-highlight font-bold">EXCELLENT DECISION!</span>                                        <span class="term-gnome-blue font-bold">│</span>
<span class="term-gnome-blue font-bold">│</span>  Opening default email client to connect with Ved...        <span class="term-gnome-blue font-bold">│</span>
<span class="term-gnome-blue font-bold">└─────────────────────────────────────────────────────────────┘</span></pre>`;
    }
    printLine(hireBox);
    setTimeout(() => {
        window.location.href = 'mailto:vedhsuthardeveloper@gmail.com?subject=Exciting%20Opportunity%20-%20Let%27s%20Connect!&body=Hi%20Ved,%0A%0AI%20explored%20your%20portfolio%20terminal%20and%20was%20very%20impressed%20by%20your%20work!';
    }, 600);
}

function updatePromptPath() {
    if (promptPathEl) {
        promptPathEl.textContent = currentPath;
    }
}

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function openTerminal() {
    if (!terminalEl) initTerminal();
    terminalEl.classList.add('open');
    isOpen = true;
    Haptics.light();
    if (terminalInputEl) {
        terminalInputEl.focus();
    }
}

export function closeTerminal() {
    if (terminalEl) {
        terminalEl.classList.remove('open');
        isOpen = false;
        Haptics.light();
    }
}

export function toggleTerminal() {
    if (isOpen) {
        closeTerminal();
    } else {
        openTerminal();
    }
}

let matrixCanvas = null;
let matrixInterval = null;

function toggleMatrixRain() {
    if (matrixInterval) {
        clearInterval(matrixInterval);
        matrixInterval = null;
        if (matrixCanvas && matrixCanvas.parentNode) {
            matrixCanvas.parentNode.removeChild(matrixCanvas);
        }
        matrixCanvas = null;
        Haptics.light();
        return;
    }

    Haptics.matrix();
    matrixCanvas = document.createElement('canvas');
    matrixCanvas.id = 'matrix-canvas';
    matrixCanvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:999;opacity:0.35;';
    document.body.appendChild(matrixCanvas);

    const ctx = matrixCanvas.getContext('2d');
    matrixCanvas.width = window.innerWidth;
    matrixCanvas.height = window.innerHeight;

    const chars = '0123456789ABCDEFVEDSUTHARRUSTWGPUAI';
    const fontSize = 14;
    const columns = Math.floor(matrixCanvas.width / fontSize);
    const drops = Array(columns).fill(1);

    matrixInterval = setInterval(() => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
        ctx.fillStyle = '#00ff66';
        ctx.font = `${fontSize}px monospace`;

        for (let i = 0; i < drops.length; i++) {
            const text = chars.charAt(Math.floor(Math.random() * chars.length));
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            if (drops[i] * fontSize > matrixCanvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }, 33);
}

export function initTerminal() {
    terminalEl = document.getElementById('terminal-modal');
    if (!terminalEl) {
        terminalEl = document.createElement('div');
        terminalEl.id = 'terminal-modal';
        terminalEl.className = 'terminal-drawer gnome-terminal';
        terminalEl.innerHTML = `
            <div class="term-header gnome-header">
                <div class="term-header-left">
                    <span class="term-tab-pill">ved@portfolio: ${currentPath}</span>
                </div>
                <div class="term-header-right">
                    <span class="term-close-hint">[ESC]</span>
                    <button class="gnome-close-btn" onclick="window.closeTerminal && window.closeTerminal()" title="Close (ESC)" aria-label="Close">
                        <svg width="10" height="10" viewBox="0 0 10 10">
                            <path d="M1 1 L9 9 M9 1 L1 9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div id="term-body" class="term-body gnome-body">
                <div class="term-welcome">
                    <span class="term-gnome-blue font-bold">Portfolio Terminal (Linux x86_64) — goved-sh</span>
                    <span class="term-dim">Type <span class="term-cyan">help</span> or tap quick buttons below.</span>
                </div>
            </div>
            <div class="term-quick-bar">
                <button class="term-quick-chip" onclick="window.runQuickCommand && window.runQuickCommand('help')">help</button>
                <button class="term-quick-chip" onclick="window.runQuickCommand && window.runQuickCommand('skills')">skills</button>
                <button class="term-quick-chip" onclick="window.runQuickCommand && window.runQuickCommand('projects')">projects</button>
                <button class="term-quick-chip" onclick="window.runQuickCommand && window.runQuickCommand('neofetch')">neofetch</button>
                <button class="term-quick-chip" onclick="window.runQuickCommand && window.runQuickCommand('fortune')">fortune</button>
                <button class="term-quick-chip" onclick="window.runQuickCommand && window.runQuickCommand('hire')">hire</button>
                <button class="term-quick-chip" onclick="window.runQuickCommand && window.runQuickCommand('clear')">clear</button>
            </div>
            <div class="term-input-bar gnome-input-bar">
                <span class="term-gnome-prompt">[<span class="prompt-user">ved</span><span class="prompt-at">@</span><span class="prompt-host">portfolio</span> <span id="prompt-path" class="prompt-path">${currentPath}</span>]$</span>
                <input type="text" id="term-input" class="term-input" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="Type command..." />
            </div>
        `;
        document.body.appendChild(terminalEl);
    }

    terminalBodyEl = document.getElementById('term-body');
    terminalInputEl = document.getElementById('term-input');
    promptPathEl = document.getElementById('prompt-path');

    if (terminalInputEl) {
        terminalInputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const val = terminalInputEl.value;
                terminalInputEl.value = '';
                Haptics.light();
                executeCommand(val);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                Haptics.light();
                if (history.length > 0 && historyIndex > 0) {
                    historyIndex--;
                    terminalInputEl.value = history[historyIndex] || '';
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                Haptics.light();
                if (historyIndex < history.length - 1) {
                    historyIndex++;
                    terminalInputEl.value = history[historyIndex] || '';
                } else {
                    historyIndex = history.length;
                    terminalInputEl.value = '';
                }
            } else if (e.key === 'Tab') {
                e.preventDefault();
                Haptics.light();
                const raw = terminalInputEl.value;
                const tokens = raw.split(/\s+/);
                
                if (tokens.length === 1) {
                    // Autocomplete command name
                    const current = tokens[0].toLowerCase();
                    if (!current) return;
                    const match = Object.keys(COMMANDS).find(c => c.startsWith(current));
                    if (match) {
                        terminalInputEl.value = match + ' ';
                    }
                } else if (tokens.length >= 2) {
                    // Autocomplete file or directory path
                    const currentArg = tokens[tokens.length - 1];
                    const entries = getDirEntries(currentPath);
                    const match = entries.find(f => f.startsWith(currentArg));
                    if (match) {
                        tokens[tokens.length - 1] = match;
                        terminalInputEl.value = tokens.join(' ');
                    }
                }
            }
        });
    }

    // Global Key Listener for ` or ~ or Escape
    window.addEventListener('keydown', (e) => {
        if (e.key === '`' || e.key === '~') {
            if (e.target.tagName === 'INPUT' && e.target !== terminalInputEl) return;
            e.preventDefault();
            toggleTerminal();
        } else if (e.key === 'Escape' && isOpen) {
            closeTerminal();
        }
    });
}

// Global window bindings
if (typeof window !== 'undefined') {
    window.openTerminal = openTerminal;
    window.closeTerminal = closeTerminal;
    window.toggleTerminal = toggleTerminal;
    window.initTerminal = initTerminal;
    window.runQuickCommand = (cmd) => {
        Haptics.light();
        executeCommand(cmd);
    };
}
