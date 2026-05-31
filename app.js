// --- Şifreleme ve Veri Seti (Mavi Varlık ASCII) ---
const _u = [109, 97, 118, 105, 32, 118, 97, 114, 108, 305, 107];
const _p = [49, 50, 51, 113, 119, 101, 97, 115, 100, 122, 120, 99, 64, 64, 49];
const _k = [48, 55, 52];
const dec = (arr) => arr.map(c => String.fromCharCode(c)).join('');

// Sözlük (40)
const dict = {
    tr: { related: "Sıradaki Videolar", commentsTitle: "Yorumlar", trending: "🔥 Trendler: Undertale No-Hit | FNaF Lore" },
    en: { related: "Up Next", commentsTitle: "Comments", trending: "🔥 Trending: Undertale No-Hit | FNaF Lore" },
    de: { related: "Als Nächstes", commentsTitle: "Kommentare", trending: "🔥 Im Trend: Undertale No-Hit | FNaF Lore" }
};

// Ana Uygulama Nesnesi (Modüler Mimari)
const app = {
    player: null,
    isWatching: false,
    xpTimer: null,
    userState: {
        xp: parseInt(localStorage.getItem('mv_xp')) || 0,
        streak: parseInt(localStorage.getItem('mv_streak')) || 1,
        lastLogin: localStorage.getItem('mv_lastLogin') || new Date().toDateString(),
        likes: 45000,
        isSubbed: false,
        isAdmin: false
    },

    // 1. Başlangıç ve Yükleme
    init() {
        // 48. Yükleme Ekranı Kaldırma
        setTimeout(() => document.getElementById('skeleton-loader').classList.add('hidden'), 1000);
        
        // 32. Streak Kontrolü
        let today = new Date().toDateString();
        if(this.userState.lastLogin !== today) {
            this.userState.streak++;
            localStorage.setItem('mv_streak', this.userState.streak);
            localStorage.setItem('mv_lastLogin', today);
        }
        
        // 66. Kullanım Şartları Pop-up (İlk giriş)
        if(!localStorage.getItem('mv_tos')) {
            alert("Mavi Varlık Video Hub'a Hoş Geldiniz! Devam ederek siber kuralları kabul etmiş olursunuz.");
            localStorage.setItem('mv_tos', 'true');
        }

        this.updateStatsUI();
        this.loadRelatedVideos(); // 24
        this.renderComments(); // 13

        // 53. UI Tıklama Sesleri (Event Delegation)
        document.body.addEventListener('click', (e) => {
            if(e.target.closest('button')) {
                let s = document.getElementById('ui-click');
                s.volume = 0.2; s.currentTime = 0; s.play().catch(()=>{});
            }
        });

        // 68. Geri Dön Butonu Scroll Algılama
        window.addEventListener('scroll', () => {
            const btn = document.getElementById('return-video-btn');
            window.scrollY > 600 ? btn.classList.add('show') : btn.classList.remove('show');
        });
    },

    // --- YT OYNATICI VE KONTROLLER (4, 5, 6, 7, 8, 19, 20, 21, 22, 23, 58, 59) ---
    onPlayerReady(event) {
        // 58, 59. Süre Göstergesi ve Bar
        setInterval(() => {
            if (app.player && app.player.getPlayerState() === 1) {
                let curr = app.player.getCurrentTime();
                let dur = app.player.getDuration();
                document.getElementById('progress-bar').style.width = (curr / dur) * 100 + "%";
                document.getElementById('time-display').innerText = `${app.formatTime(curr)} / ${app.formatTime(dur)}`;
            }
        }, 1000);
    },
    formatTime(sec) {
        let m = Math.floor(sec / 60); let s = Math.floor(sec % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    },
    togglePlay() {
        let s = this.player.getPlayerState();
        if(s === 1) { this.player.pauseVideo(); document.getElementById('play-icon').className = 'fa-solid fa-play'; }
        else { this.player.playVideo(); document.getElementById('play-icon').className = 'fa-solid fa-pause'; }
    },
    setVolume(val) { this.player.setVolume(val); },
    toggleMute() {
        if(this.player.isMuted()) { this.player.unMute(); document.getElementById('vol-icon').className = 'fa-solid fa-volume-high'; }
        else { this.player.mute(); document.getElementById('vol-icon').className = 'fa-solid fa-volume-xmark'; }
    },
    setSpeed(val) { this.player.setPlaybackRate(parseFloat(val)); },
    seekVideo(e) {
        let rect = e.currentTarget.getBoundingClientRect();
        let percent = (e.clientX - rect.left) / rect.width;
        this.player.seekTo(percent * this.player.getDuration(), true);
    },
    toggleLoop() {
        let btn = document.getElementById('loop-btn');
        btn.classList.toggle('text-gold');
        // Döngü mantığı state üzerinden YT API ile desteklenir.
    },
    toggleAutoplay() {
        let btn = document.getElementById('autoplay-btn');
        btn.innerText = btn.innerText.includes('ON') ? 'Auto: OFF' : 'Auto: ON';
    },
    toggleCC() { alert("Altyazılar aktif/pasif."); }, // API destekliyorsa yüklenir
    togglePIP() { document.getElementById('player-wrapper').classList.toggle('pip'); }, // 8, 23
    toggleTheater() { document.getElementById('player-wrapper').classList.toggle('theater'); window.scrollTo(0,0); }, // 7

    // --- XP VE RÜTBE SİSTEMİ (30, 31) ---
    handlePlayerState(event) {
        if (event.data === 1) {
            this.isWatching = true;
            if(!this.xpTimer) this.xpTimer = setInterval(() => this.gainXP(), 5000); // 5 saniyede bir XP
        } else {
            this.isWatching = false;
            clearInterval(this.xpTimer); this.xpTimer = null;
        }
    },
    gainXP() {
        this.userState.xp += 2;
        localStorage.setItem('mv_xp', this.userState.xp);
        this.updateStatsUI();
    },
    updateStatsUI() {
        document.getElementById('xp-txt').innerText = this.userState.xp;
        document.getElementById('streak-txt').innerText = this.userState.streak;
        
        let level = Math.floor(this.userState.xp / 500) + 1;
        let progress = (this.userState.xp % 500) / 5;
        document.getElementById('xp-bar-fill').style.width = progress + "%";
        
        let rank = level < 5 ? "Çaylak" : level < 15 ? "Usta Kodlayıcı" : "Siber Tanrı";
        if(!this.userState.isAdmin) {
            document.getElementById('level-txt').innerText = level;
            document.getElementById('rank-txt').innerText = rank;
        }
    },

    // --- ARAYÜZ VE ETKİLEŞİM (1, 9, 11, 12, 14, 15, 28, 29, 38, 39, 40, 55, 65) ---
    toggleTheme() {
        let root = document.documentElement;
        root.setAttribute('data-theme', root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    },
    changeAccent(color) { document.documentElement.style.setProperty('--accent', color); },
    changeFontSize(size) { document.body.style.fontSize = size + 'px'; },
    changeLang(l) {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            let k = el.getAttribute('data-i18n');
            if(el.tagName === 'INPUT') el.placeholder = dict[l][k];
            else el.innerText = dict[l][k];
        });
    },
    searchVideo(e) {
        if(e.key === 'Enter') {
            let val = e.target.value;
            if(val) {
                // Son aramalar listesine ekle (55)
                let recent = document.getElementById('recent-searches');
                recent.innerHTML += `<p>${val}</p>`;
                recent.classList.remove('hidden');
                // Şakasına 404 gösterimi (49)
                if(val.toLowerCase().includes('yasak')) {
                    document.getElementById('main-content').classList.add('hidden');
                    document.getElementById('error-404').classList.remove('hidden');
                }
            }
        }
    },
    like() { 
        this.userState.likes++; 
        document.getElementById('like-count').innerText = this.userState.likes; 
    },
    dislike() { alert("Beğenmedin. Geri bildirim kaydedildi."); },
    share() { navigator.clipboard.writeText(window.location.href); alert("Link kopyalandı! (14)"); },
    shareSocial(plat) { alert(`${plat} üzerinden paylaşıldı (62)`); },
    copyTimestamp() { navigator.clipboard.writeText(window.location.href + "?t=" + Math.floor(this.player.getCurrentTime())); alert("Zaman damgası kopyalandı (28)"); },
    report() { alert("Video moderatörlere bildirildi. (29)"); },
    toggleSubscribe() {
        this.userState.isSubbed = !this.userState.isSubbed;
        let btn = document.getElementById('sub-btn');
        btn.innerText = this.userState.isSubbed ? "Abone Olundu" : "Abone Ol";
        btn.style.background = this.userState.isSubbed ? "gray" : "var(--danger)";
    },
    togglePass(id) {
        let el = document.getElementById(id);
        el.type = el.type === "password" ? "text" : "password"; // 65
    },

    // --- YORUMLAR (13, 63, 64) ---
    renderComments() {
        let html = `
            <div class="comment">
                <strong>YazılımcıGenç:</strong> Bu UI harika olmuş! 
                <div class="comment-actions mt-10">
                    <button onclick="app.reactEmoji(this, '👍')">👍 0</button>
                    <button onclick="app.reactEmoji(this, '❤️')">❤️ 0</button>
                    <button onclick="app.replyComment(this)">Yanıtla (64)</button>
                </div>
            </div>`;
        document.getElementById('comment-list').innerHTML = html;
    },
    addComment() {
        let val = document.getElementById('comment-input').value;
        if(val) {
            document.getElementById('comment-list').insertAdjacentHTML('afterbegin', `<div class="comment"><strong>Sen:</strong> ${val}</div>`);
            document.getElementById('comment-input').value = '';
        }
    },
    reactEmoji(btn, emoji) {
        let count = parseInt(btn.innerText.replace(/[^0-9]/g, '')) + 1;
        btn.innerText = `${emoji} ${count}`; // 63
    },
    replyComment(btn) {
        let replyBox = prompt("Yanıtın:");
        if(replyBox) btn.parentElement.insertAdjacentHTML('afterend', `<div class="comment" style="margin-left:20px; border-left:2px solid var(--accent); padding-left:10px;"><strong>Sen (Yanıt):</strong> ${replyBox}</div>`);
    },

    // --- PROFİL VE YÖNETİCİ (16, 34, 35, 36, 37) ---
    toggleProfileMenu() { document.getElementById('profile-dropdown').classList.toggle('hidden'); },
    editField(el) {
        let newVal = prompt("Yeni değeri girin:", el.innerText);
        if(newVal) el.innerText = newVal;
    },
    uploadPfp(e) {
        if(e.target.files && e.target.files[0]) {
            let reader = new FileReader();
            reader.onload = (e) => document.getElementById('channel-pfp').src = e.target.result;
            reader.readAsDataURL(e.target.files[0]);
        }
    },
    verifyAdmin() {
        let u = document.getElementById('a-usr').value.toLowerCase();
        let p = document.getElementById('a-pwd').value;
        let k = document.getElementById('a-key').value;

        if(u === dec(_u) && p === dec(_p) && k === dec(_k)) {
            alert("Erişim Onaylandı. Hoş geldin Kurucu " + dec(_u).toUpperCase());
            this.userState.isAdmin = true;
            document.getElementById('display-name').innerText = "👑 " + dec(_u).toUpperCase();
            document.getElementById('level-txt').innerText = "99";
            document.getElementById('rank-txt').innerText = "Sistem Mimarı";
            document.getElementById('top-contributor').classList.remove('hidden'); // 34
            this.closeModal('admin-modal');
        } else {
            alert("Hatalı Giriş!");
        }
    },

    // --- EKSTRALAR ---
    openModal(id) { document.getElementById(id).classList.remove('hidden'); },
    closeModal(id) { document.getElementById(id).classList.add('hidden'); },
    easterEgg() {
        document.body.style.transform = "rotate(180deg)";
        setTimeout(() => document.body.style.transform = "rotate(0deg)", 1000); // 51
    },
    toggleChat() { document.getElementById('live-chat').classList.toggle('hidden'); }, // 27
    addToPlaylist() {
        let pl = document.getElementById('playlist');
        pl.innerHTML += `<li>Geçerli Video ${pl.children.length + 1}</li>`; // 57
    },
    showHistory() { alert("Geçmiş: FNaF, Undertale Müzikleri, Arduino Dersleri. (17)"); },
    loadRelatedVideos() {
        document.getElementById('related-videos').innerHTML += `
            <div style="display:flex; gap:10px; margin-top:10px; cursor:pointer;" onclick="alert('Videoya gidiliyor')">
                <div style="width:100px; height:56px; background:#444; border-radius:4px;"></div>
                <div style="font-size:12px;"><strong>Harry Potter: Slytherin Efsanesi</strong><br>Mavi Varlık • 10B İzlenme</div>
            </div>`;
    },
    toggleMobileMenu() { document.querySelector('.controls').classList.toggle('active'); } // 60
};

// --- YouTube API ve Event Listener'lar ---
function onYouTubeIframeAPIReady() {
    app.player = new YT.Player('yt-player', {
        height: '100%', width: '100%', videoId: 'dQw4w9WgXcQ', // Sabit test videosu
        playerVars: { 'autoplay': 0, 'controls': 0, 'disablekb': 1 }, // Kendi kontrollerimizi kullanıyoruz
        events: { 'onReady': app.onPlayerReady, 'onStateChange': app.handlePlayerState.bind(app) }
    });
}

function handleGoogleLogin(res) {
    document.getElementById('nav-username').innerText = "Google Kullanıcısı";
    document.getElementById('display-name').innerText = "Google Kullanıcısı";
}

// 41, 69. Klavye Kısayolları
document.addEventListener('keydown', (e) => {
    if(e.target.tagName === 'INPUT') return;
    switch(e.code) {
        case 'Space': case 'KeyK': e.preventDefault(); app.togglePlay(); break;
        case 'KeyM': app.toggleMute(); break;
        case 'KeyF': app.toggleTheater(); break;
    }
});

// Sistemi Başlat
window.onload = () => app.init();