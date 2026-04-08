import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// --- GLOBAL STATE ---
// Standard INR prices: 30k, 50k, 90k
let currentCurrency = { code: 'INR', symbol: '₹', rate: 1.0 };
const baseMonthlyPrices = [30000, 50000, 90000]; // Base prices in INR
let isYearly = false;

// --- MODULAR SECTION LOADER ---
const sectionRegistry = {
  'navbar-root': 'sections/navbar.html',
  'mobile-menu-root': 'sections/mobile-menu.html',
  'hero-root': 'sections/hero.html',
  'philosophy-root': 'sections/philosophy.html',
  'features-root': 'sections/features.html',
  'brands-root': 'sections/cryptos.html',
  'video-reels-root': 'sections/video-reels.html',
  'how-it-works-root': 'sections/how-it-works.html',
  'testimonials-root': 'sections/testimonials.html',
  'pricing-root': 'sections/pricing.html',
  'faq-root': 'sections/faq.html',
  'cta-root': 'sections/cta.html',
  'footer-root': 'sections/footer.html',
  // New Page Sections
  'about-hero-root': 'sections/about-hero.html',
  'about-mission-root': 'sections/about-mission.html',
  'about-team-root': 'sections/about-team.html',
  'contact-hero-root': 'sections/contact-hero.html',
  'contact-form-root': 'sections/contact-form.html',
  'contact-process-root': 'sections/contact-process.html',
  'case-studies-hero-root': 'sections/case-studies-hero.html',
  'case-studies-root': 'sections/case-studies-list.html',
  'case-studies-methodology-root': 'sections/case-studies-methodology.html',
  'privacy-root': 'sections/privacy-content.html',
  'terms-root': 'sections/terms-content.html',
  'cookie-root': 'sections/cookie-content.html',
  'refund-root': 'sections/refund-content.html',
  'service-smm-root': 'sections/service-smm.html',
  'service-perf-root': 'sections/service-perf.html',
  'service-web-root': 'sections/service-web.html',
  'service-conv-root': 'sections/service-conv.html',
  'service-ai-root': 'sections/service-ai.html',
  'process-hero-root': 'sections/process-hero.html',
  'process-steps-root': 'sections/process-steps.html'
};

async function loadSections() {
  const elements = document.querySelectorAll('[id$="-root"]');
  const loads = Array.from(elements).map(el => {
    // Handle paths correctly if on sub-pages (like services/)
    let file = sectionRegistry[el.id];
    if (!file) return;

    // Check if we are in a subdirectory like /services/
    const pathPrefix = window.location.pathname.includes('/services/') ? '../' : './';
    const filePath = pathPrefix + file;

    return fetch(filePath)
      .then(res => {
        if (!res.ok) throw new Error(`Could not load ${file}`);
        return res.text();
      })
      .then(html => {
        el.innerHTML = html;
      })
      .catch(err => console.error(err));
  });
  await Promise.all(loads);

  // Handle URL anchors after all sections are loaded
  if (window.location.hash) {
    const target = document.querySelector(window.location.hash);
    if (target) {
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  }

  // Detect currency before initializing UI
  await detectCurrency();

  initApp(); // Run animations ONLY after HTML is ready
  initFormSubmission(); // Link form logic after injection
  initBrandTicker(); // Populate brand logos dynamically
  initReelEngine(); // Populate influencer reels dynamically
}

function initReelEngine() {
  const track = document.getElementById('reel-track');
  const modal = document.getElementById('reel-modal');
  const modalVideo = document.getElementById('modal-video');
  const closeBtn = document.getElementById('modal-close');
  const nextBtn = document.getElementById('reel-next');
  const prevBtn = document.getElementById('reel-prev');
  const playPauseBtn = document.getElementById('modal-play-pause');
  const muteBtn = document.getElementById('modal-mute');

  if (!track || !modal || !playPauseBtn || !muteBtn) return;

  track.innerHTML = '';
  const videoCount = 15;
  let html = '';

  for (let i = 1; i <= videoCount; i++) {
    html += `
      <div class="reel-item" data-video="/Influencersvds/${i}.mp4">
        <video src="/Influencersvds/${i}.mp4" muted loop playsinline autoplay></video>
      </div>
    `;
  }

  // Multiply for true infinite feel (3 sets for center-loop stability)
  track.innerHTML = html + html + html;

  // Initialize GSAP Marquee for TRUE infinite scroll
  // We start at -33.33% (the middle set) and animate to -66.66%
  // This allows manual nudges to go left/right without hitting 'seams'
  gsap.set(track, { xPercent: -33.33 });

  let marquee = gsap.to(track, {
    xPercent: -66.66,
    duration: 50, // Slightly faster default
    ease: "none",
    repeat: -1,
    overwrite: true
  });

  // Manual Navigation Logic
  nextBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    marquee.resume();
    gsap.to(marquee, { timeScale: 8, duration: 0.5, onComplete: () => gsap.to(marquee, { timeScale: 1, duration: 1.5, ease: "power2.inOut" }) });
  });

  prevBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    marquee.resume();
    gsap.to(marquee, { timeScale: -8, duration: 0.5, onComplete: () => gsap.to(marquee, { timeScale: 1, duration: 1.5, ease: "power2.inOut" }) });
  });

  // Precise Hover Mechanics
  track.addEventListener('mouseenter', () => {
    if (!modal.classList.contains('active')) marquee.pause();
  });
  
  track.addEventListener('mouseleave', () => {
    if (!modal.classList.contains('active')) marquee.play();
  });

  // Click handler for reels
  track.querySelectorAll('.reel-item').forEach(item => {
    item.addEventListener('click', () => {
      const videoSrc = item.getAttribute('data-video');
      modalVideo.src = videoSrc;
      modalVideo.muted = false;
      modalVideo.loop = false; // Disable loop to show replay at end
      modalVideo.classList.remove('video-finished');
      document.getElementById('reel-replay-btn').classList.remove('active');
      
      modal.classList.add('active');
      
      // Mobile-only fixes: DOM move and Scroll Lock
      if (window.innerWidth <= 768) {
        if (modal.parentNode !== document.body) document.body.appendChild(modal);
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
      }

      marquee.pause();
      modalVideo.play();
      updateIcons();
    });
  });

  // Replay Logic
  const replayBtn = document.getElementById('reel-replay-btn');
  modalVideo.addEventListener('ended', () => {
    modalVideo.classList.add('video-finished');
    replayBtn.classList.add('active');
  });

  replayBtn.addEventListener('click', () => {
    modalVideo.classList.remove('video-finished');
    replayBtn.classList.remove('active');
    modalVideo.currentTime = 0;
    modalVideo.play();
    updateIcons();
  });

  // Progress Bar Logic
  const progressContainer = document.getElementById('modal-progress-container');
  const progressBar = document.getElementById('modal-progress-bar');

  modalVideo.addEventListener('timeupdate', () => {
    const percentage = (modalVideo.currentTime / modalVideo.duration) * 100;
    progressBar.style.width = `${percentage}%`;
  });

  progressContainer.addEventListener('click', (e) => {
    const width = progressContainer.clientWidth;
    const clickX = e.offsetX;
    const duration = modalVideo.duration;
    modalVideo.currentTime = (clickX / width) * duration;
  });

  // Modal Controls
  closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
    
    // Mobile-only fixes: Unlock scroll
    if (window.innerWidth <= 768) {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }

    marquee.play();
    modalVideo.pause();
    modalVideo.src = '';
  });

  // Close on backdrop click (Mobile Only)
  modal.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && e.target === modal) {
      closeBtn.click();
    }
  });

  playPauseBtn.addEventListener('click', () => {
    if (modalVideo.paused) {
      modalVideo.play();
    } else {
      modalVideo.pause();
    }
    updateIcons();
  });

  muteBtn.addEventListener('click', () => {
    modalVideo.muted = !modalVideo.muted;
    updateIcons();
  });

  function updateIcons() {
    document.getElementById('play-icon').style.display = modalVideo.paused ? 'block' : 'none';
    document.getElementById('pause-icon').style.display = modalVideo.paused ? 'none' : 'block';
    document.getElementById('mute-icon').style.display = modalVideo.muted ? 'block' : 'none';
    document.getElementById('unmute-icon').style.display = modalVideo.muted ? 'none' : 'block';
  }
}

async function detectCurrency() {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();

    // Exchange rates relative to 1 INR (using slightly conservative rates for safety)
    const ratesFromINR = {
      'INR': 1.0,
      'USD': 0.012,
      'EUR': 0.011,
      'GBP': 0.0094,
      'CAD': 0.0163,
      'AUD': 0.0182,
      'SGD': 0.0162,
      'AED': 0.0441
    };

    const symbols = {
      'INR': '₹',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'CAD': 'CA$',
      'AUD': 'A$',
      'SGD': 'S$',
      'AED': 'AED '
    };

    if (data.currency && ratesFromINR[data.currency]) {
      currentCurrency = {
        code: data.currency,
        symbol: symbols[data.currency],
        rate: ratesFromINR[data.currency]
      };
      console.log(`Region detected: ${data.country_name}. Using ${data.currency} (${symbols[data.currency]}).`);
    } else {
      // Fallback or unsupported currency: stick to INR or maybe USD?
      // User specified INR base, so we fallback to INR if detection is unsure.
      console.log(`Region ${data.country_name} detected, but applying base INR for precision.`);
    }
  } catch (e) {
    console.warn('Currency detection failed or blocked. Defaulting to base ₹ (INR).');
  }
}

function initApp() {
  // --- HERO ANIMATIONS ---
  gsap.fromTo('.hero-title', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.2 });
  gsap.fromTo('.hero-subtitle', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.4 });
  gsap.fromTo('.hero-cta', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.5 });
  gsap.fromTo('.hero-rating', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.6 });
  gsap.fromTo('.hero-image-wrapper', { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', delay: 0.8 });

  // --- PHILOSOPHY TEXT REVEAL ---
  const philosophyEl = document.querySelector('.philosophy-text');
  if (philosophyEl) {
    const originalHTML = philosophyEl.innerHTML;
    philosophyEl.innerHTML = '';
    const parts = originalHTML.split(/(<br\s*\/?>)/i);
    parts.forEach(part => {
      if (part.toLowerCase().startsWith('<br')) {
        philosophyEl.appendChild(document.createElement('br'));
      } else {
        const words = part.split(' ');
        words.forEach(word => {
          if (word.trim() !== '') {
            const span = document.createElement('span');
            span.innerHTML = word + ' ';
            span.style.color = 'rgba(255, 255, 255, 0.1)';
            if (window.innerWidth > 768) {
              span.style.filter = 'blur(4px)';
            }
            // Removing transition to avoid fighting with GSAP scroll-scrub
            philosophyEl.appendChild(span);
          }
        });
      }
    });

    const isMobile = window.innerWidth <= 768;
    gsap.to('.philosophy-text span', {
      scrollTrigger: {
        trigger: '.philosophy',
        start: 'top 85%',
        end: 'bottom 40%',
        scrub: 0.5,
      },
      color: '#ffffff',
      filter: isMobile ? 'none' : 'blur(0px)',
      stagger: 0.05
    });
  }

  // --- REFRESH ON RESIZE ---
  window.addEventListener('resize', () => {
    ScrollTrigger.refresh();
  });

  // --- GLOBAL FADE UPS ---
  gsap.utils.toArray('section').forEach(section => {
    gsap.fromTo(section,
      { opacity: 0, y: 40 },
      {
        scrollTrigger: {
          trigger: section,
          start: 'top 85%',
          toggleActions: 'play none none none'
        },
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out'
      });
  });

  // --- FEATURES CARD STAGGER ---
  gsap.fromTo('.feature-card',
    { opacity: 0, y: 30 },
    {
      scrollTrigger: {
        trigger: '.features-grid',
        start: 'top 80%'
      },
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power3.out'
    });

  // --- TESTIMONIAL SLIDER ---
  initSlider();

  // --- PRICING TOGGLE ---
  initPricing();

  // --- FAQ ACCORDION ---
  initFAQ();

  // --- MOBILE MENU ---
  initMobileMenu();

  // --- WORD SWAPPER ---
  initWordSwapper();

  // --- BACKGROUND FLOATING ELEMENTS ---
  initFloatingElements();

  // --- CONTACT FORM LOCALIZATION ---
  initContactForm();

  // Fix "Work with us" / "Scale your brand" links to point to contact page
  document.querySelectorAll('a[href="#contact"]').forEach(a => {
    const isOnContactPage = window.location.pathname.includes('contact.html');
    if (!isOnContactPage) {
       // Check if on a subpage (like services/)
       const isSubpage = window.location.pathname.includes('/services/');
       a.setAttribute('href', isSubpage ? '../contact.html' : '/contact.html');
    }
  });

  console.log(`Pixora Modular Framework Loaded Successfully (${currentCurrency.code} Pricing).`);
}

// --- HELPER FUNCTIONS ---

function initWordSwapper() {
  const swapper = document.getElementById('word-swapper');
  if (!swapper) return;

  const words = ['Results.', 'Growth.', 'Impact.', 'Scalability.', 'Precision.', 'Excellence.'];
  let index = 0;

  // Measurement shadow with fully identical styling
  const shadowSpan = document.createElement('span');
  shadowSpan.style.cssText = 'position:absolute; visibility:hidden; font-weight:600; font-family:inherit; font-size:inherit; white-space:nowrap; letter-spacing:inherit; will-change: width;';
  document.body.appendChild(shadowSpan);

  // Set alignment to left so the start of word stays put
  gsap.set(swapper, { textAlign: 'left', willChange: 'width, opacity, filter' });

  // Safety buffer to ensure no clipping (shadows and subpixels)
  const buffer = 8;

  // Initial width
  shadowSpan.textContent = words[0];
  gsap.set(swapper, { width: shadowSpan.getBoundingClientRect().width + buffer });

  setInterval(() => {
    index = (index + 1) % words.length;

    // Measure new target width
    shadowSpan.textContent = words[index];
    const newWidth = shadowSpan.getBoundingClientRect().width + buffer;

    // Premium silky transition
    // Mobile optimized: remove blur on mobile because it lags the GPU
    const isMobile = window.innerWidth <= 768;
    const tl = gsap.timeline();
    tl.to(swapper, {
      opacity: 0,
      filter: isMobile ? 'none' : 'blur(12px)',
      duration: 0.5,
      ease: 'power2.inOut'
    })
      .set(swapper, { textContent: words[index] })
      .to(swapper, {
        width: newWidth, // Fluidly slide rest of sentence
        opacity: 1,
        filter: 'blur(0px)',
        duration: 0.8, // Slightly longer for "premium" sliding feel
        ease: 'expo.out'
      });
  }, 2500); // 2.5s for readability
}

function initFloatingElements() {
  gsap.utils.toArray('.floating-element').forEach((el, i) => {
    gsap.to(el, {
      x: 'random(-50, 50)',
      y: 'random(-50, 50)',
      duration: 'random(5, 10)',
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: i * 0.5
    });
  });
}

function initSlider() {
  const prevBtn = document.querySelector('.prev-btn');
  const nextBtn = document.querySelector('.next-btn');
  const testCount = document.querySelector('.testimonial-count');
  const quoteEl = document.querySelector('.testimonial-quote');
  const authorEl = document.querySelector('.testimonial-author');
  const roleEl = document.querySelector('.testimonial-role');
  const avatarImgEl = document.querySelector('.testimonial-avatar-img');

  const testimonialsData = [
    { quote: "“Pixora completely transformed our<br>online presence. Our ROI has never<br>been higher.d rahul is the amazing persion we ever meet and hue hue hue hueb d rahul is the amazing persion we ever meet and hue hue hue hueb”", author: "Sarah J.", role: "CEO at FashionHub", img: "https://i.pravatar.cc/150?img=1" },
    { quote: "“The AI automations they implemented<br>saved us 20+ hours a week. Truly a<br>game-changer for our team.The AI automations they implemented<br>saved us 20+ hours a week. Truly a<br>game-changer for our team.The AI automations they implemented<br>saved us 20+ hours a week. Truly a<br>game-changer for our team.The AI automations they implemented<br>saved us 20+ hours a week. Truly a<br>game-changer for our team.The AI automations they implemented<br>saved us 20+ hours a week. Truly a<br>game-changer for our team.”", author: "Mark R.", role: "Operations Manager at TechStart", img: "https://i.pravatar.cc/150?img=2" },
    { quote: "“Their performance marketing strategy<br>doubled our lead generation in just<br>two months. Highly recommend.”", author: "Elena V.", role: "Marketing Director at Globalli", img: "https://i.pravatar.cc/150?img=3" },
    { quote: "“The website they built for us is not only<br>stunning but also a conversion machine.<br>Best investment this year.”", author: "David K.", role: "Founder at EcoStore", img: "https://i.pravatar.cc/150?img=4" },
    { quote: "“Professional, results-driven, and truly<br>experts in the digital landscape. They<br>are our go-to for all things growth.”", author: "Michael T.", role: "Head of Growth at SolarEdge", img: "https://i.pravatar.cc/150?img=5" },
    { quote: "“Working with Pixora was the best decision<br>for our business expansion into<br>international markets.”", author: "Julia B.", role: "Expansion Lead at GlobalVentures", img: "https://i.pravatar.cc/150?img=6" },
    { quote: "“The conversion optimization they did on<br>our checkout flow increased sales by<br>35% overnight.”", author: "Robert S.", role: "E-comm Manager at LuxuryGifts", img: "https://i.pravatar.cc/150?img=7" },
    { quote: "“Their AI-driven ad bidding saved us<br>thousands in wasted ad spend while<br>improving overall performance.”", author: "Linda W.", role: "Brand Manager at InnovateCo", img: "https://i.pravatar.cc/150?img=8" },
    { quote: "“From start to finish, Pixora delivered<br>excellence. Their team is truly top-tier<br>and deeply professional.”", author: "Chris P.", role: "COO at FutureGroup", img: "https://i.pravatar.cc/150?img=9" },
    { quote: "“I've worked with many agencies, but<br>Pixora's focus on actual data sets them<br>apart from the rest.”", author: "Amanda H.", role: "Growth Strategist at StartupLabs", img: "https://i.pravatar.cc/150?img=10" }
  ];

  let currentSlide = 1;
  const totalSlides = testimonialsData.length;

  function updateSlider() {
    if (!testCount || !quoteEl || !authorEl || !roleEl || !avatarImgEl) return;
    const data = testimonialsData[currentSlide - 1];
    const matrixEl = document.querySelector('.testimonial-matrix');

    gsap.to([quoteEl, authorEl, testCount, roleEl, avatarImgEl], {
      opacity: 0, x: -8, duration: 0.2,
      onComplete: () => {
        const oldHeight = matrixEl.offsetHeight;
        testCount.textContent = `${currentSlide}/${totalSlides}`;
        quoteEl.innerHTML = data.quote;
        authorEl.textContent = data.author;
        roleEl.textContent = data.role;
        avatarImgEl.src = data.img;
        const newHeight = matrixEl.offsetHeight;
        if (oldHeight !== newHeight) {
          gsap.fromTo(matrixEl, { height: oldHeight }, { height: newHeight, duration: 0.4, ease: 'power2.out', clearProps: 'height' });
        }
        gsap.fromTo([quoteEl, authorEl, testCount, roleEl, avatarImgEl], { opacity: 0, x: 15 }, { opacity: 1, x: 0, duration: 0.4, stagger: 0.05 });
      }
    });
  }

  if (prevBtn && nextBtn) {
    prevBtn.addEventListener('click', () => { currentSlide = currentSlide > 1 ? currentSlide - 1 : totalSlides; updateSlider(); });
    nextBtn.addEventListener('click', () => { currentSlide = currentSlide < totalSlides ? currentSlide + 1 : 1; updateSlider(); });
  }

  // Set initial slider state correctly based on testimonialsData length
  if (testCount) testCount.textContent = `${currentSlide}/${totalSlides}`;
}

function initPricing() {
  const pricingSwitch = document.getElementById('pricing-switch');
  const toggleOptions = document.querySelectorAll('.pricing-toggle .toggle-option');
  const plansState = baseMonthlyPrices.map(p => ({ current: p }));

  const updateAllPrices = (instant = false) => {
    const priceElements = document.querySelectorAll('.plan-price');
    const suffix = `<span>/${isYearly ? 'year' : 'month'}</span>`;

    // Yearly discount: 12 months * 0.8 (20% off)
    const multiplier = isYearly ? 12 * 0.8 : 1.0;

    plansState.forEach((plan, i) => {
      const targetPriceInINR = baseMonthlyPrices[i] * multiplier;
      const targetPriceInLocal = targetPriceInINR * currentCurrency.rate;

      if (instant) {
        plan.current = targetPriceInLocal;
        const formattedPrice = Math.round(plan.current).toLocaleString(currentCurrency.code === 'INR' ? 'en-IN' : 'en-US');
        if (priceElements[i]) priceElements[i].innerHTML = `${currentCurrency.symbol}${formattedPrice}${suffix}`;
      } else {
        gsap.to(plan, {
          current: targetPriceInLocal, duration: 0.8, ease: 'expo.out',
          onUpdate: () => {
            const formattedPrice = Math.round(plan.current).toLocaleString(currentCurrency.code === 'INR' ? 'en-IN' : 'en-US');
            if (priceElements[i]) priceElements[i].innerHTML = `${currentCurrency.symbol}${formattedPrice}${suffix}`;
          }
        });
      }
    });
  };

  // Initial call with detected currency
  updateAllPrices(true);

  if (pricingSwitch) {
    pricingSwitch.addEventListener('click', () => {
      isYearly = !isYearly;
      const handle = pricingSwitch.querySelector('.switch-handle');
      gsap.to(handle, {
        x: isYearly ? 22 : 0,
        backgroundColor: isYearly ? '#FFFFFF' : '#00ffb2',
        duration: 0.3,
        ease: 'power2.out'
      });
      gsap.to(pricingSwitch, {
        backgroundColor: isYearly ? '#00ffb2' : 'rgba(255, 255, 255, 0.08)',
        duration: 0.3
      });
      document.getElementById('pricing-root').classList.toggle('is-yearly', isYearly);

      toggleOptions[0].classList.toggle('active', !isYearly);
      toggleOptions[1].classList.toggle('active', isYearly);

      updateAllPrices();
    });
  }
}

function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const answer = item.querySelector('.faq-answer');
    const icon = item.querySelector('.faq-icon');
    item.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      faqItems.forEach(otherItem => {
        if (otherItem !== item && otherItem.classList.contains('open')) {
          otherItem.classList.remove('open');
          gsap.to(otherItem.querySelector('.faq-answer'), { height: 0, opacity: 0, duration: 0.5 });
          gsap.to(otherItem.querySelector('.faq-icon'), { rotation: 0, duration: 0.4 });
        }
      });
      if (!isOpen) {
        item.classList.add('open');
        gsap.to(icon, { rotation: 45, duration: 0.4, ease: 'back.out(1.7)' });
        gsap.to(answer, { 
          height: 'auto', 
          opacity: 1, 
          duration: 0.6, 
          ease: 'power3.out',
          onStart: () => {
            gsap.fromTo(answer, { height: 0 }, { height: answer.scrollHeight, duration: 0.6, ease: 'power3.out' });
          }
        });
      } else {
        item.classList.remove('open');
        gsap.to(icon, { rotation: 0, duration: 0.4, ease: 'power3.in' });
        gsap.to(answer, { height: 0, opacity: 0, duration: 0.5, ease: 'power3.inOut' });
      }
    });
  });
}

function initMobileMenu() {
  const mobileToggle = document.getElementById('mobile-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileClose = document.getElementById('mobile-close');
  const mobileLinks = document.querySelectorAll('.mobile-links a');

  if (mobileToggle && mobileMenu) {
    const tl = gsap.timeline({ paused: true });
    
    tl.to(mobileMenu, {
      y: 0,
      opacity: 1,
      visibility: 'visible',
      duration: 0.6,
      ease: 'expo.inOut'
    });

    mobileToggle.addEventListener('click', () => {
      mobileMenu.classList.add('active');
      tl.play();
      document.body.style.overflow = 'hidden';
    });

    const closeMenu = () => {
      mobileMenu.classList.remove('active');
      tl.reverse();
      document.body.style.overflow = '';
    };

    mobileClose && mobileClose.addEventListener('click', closeMenu);
    mobileLinks.forEach(link => link.addEventListener('click', closeMenu));
  }
}

function initContactForm() {
  const spendLabel = document.getElementById('spend-label');
  const spendSelect = document.getElementById('spend-select');
  if (!spendLabel || !spendSelect) return;

  // Update label
  spendLabel.textContent = `Current Monthly Spend (${currentCurrency.code})`;

  // Base INR breaks: 50k, 200k, 1M
  const breaks = [50000, 200000, 1000000];
  const converted = breaks.map(b => b * currentCurrency.rate);
  
  const formatter = new Intl.NumberFormat(currentCurrency.code === 'INR' ? 'en-IN' : 'en-US', {
    style: 'decimal',
    maximumFractionDigits: 0
  });

  const options = [
    `0 - ${formatter.format(converted[0])}`,
    `${formatter.format(converted[0])} - ${formatter.format(converted[1])}`,
    `${formatter.format(converted[1])} - ${formatter.format(converted[2])}`,
    `${formatter.format(converted[2])}+`
  ];

  const values = ['low', 'medium', 'high', 'enterprise'];

  spendSelect.innerHTML = options.map((opt, i) => `<option value="${currentCurrency.code} ${opt}">${currentCurrency.symbol}${opt}</option>`).join('');
}

function initFormSubmission() {
  const form = document.getElementById('modern-contact-form');
  if (!form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = document.getElementById('submit-btn');
    const successMsg = document.getElementById('form-success');
    if (!btn || !successMsg) return;
    
    btn.innerText = 'Sending...';
    btn.disabled = true;

    fetch("https://formspree.io/f/xjgprrde", {
      method: 'POST',
      body: new FormData(form),
      headers: {
        'Accept': 'application/json'
      }
    }).then(response => {
      if (response.ok) {
        form.style.display = 'none';
        successMsg.style.display = 'block';
        successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        btn.innerText = 'Error Occurred';
        btn.disabled = false;
        alert("Sorry, there was a problem submitting your form. Please try again.");
      }
    }).catch(error => {
      btn.innerText = 'Error Occurred';
      btn.disabled = false;
    });
  });
}

function initBrandTicker() {
  const brandLogos = [
    'ahoora.png', 'beyou.png', 'broadstar.png', 'bunaiwala.png', 'feranoid.png',
    'gulabri.png', 'gulmohar.png', 'hum.png', 'ichaa.png', 'khsual.png',
    'kurti.png', 'laad.png', 'ls.png', 'miramaar.png', 'nehamta.png',
    'nook.png', 'ph.png', 'pink.png', 'pirul.png', 'quickflo.png',
    'Rimika.png', 'rr.png', 'stylm.png', 'zeyora.png'
  ];

  const rows = [
    document.getElementById('brand-row-1'),
    document.getElementById('brand-row-2')
  ];

  if (!rows[0]) return;

  // Clear existing
  rows.forEach(r => r.innerHTML = '');

  // Distribute across 2 rows for maximum impact
  const rowCount = rows.length;
  brandLogos.forEach((logo, index) => {
    const rowIndex = index % rowCount;
    const logoHtml = `
      <div class="brand-item">
        <img src="/Trustedbrands/brands/${logo}" alt="Trusted Brand">
      </div>
    `;
    rows[rowIndex].innerHTML += logoHtml;
  });

  // Doubling ensures the row is wide enough for -50% shift without gaps
  rows.forEach((row, i) => {
    const content = row.innerHTML;
    row.innerHTML = content + content;
    
    // Set explicit smooth timing in JS to override any CSS jitter
    row.style.animation = `scroll-left ${30 + (i * 10)}s linear infinite`;
    if (i === 1) row.style.animationDirection = 'reverse';
  });
}

// Kick off the loading process
loadSections();
