document.addEventListener('DOMContentLoaded', () => {
    // Register GSAP ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // Initialize AOS (Animate On Scroll) as a fallback/complement
    AOS.init({
        duration: 800,
        easing: 'ease-out-cubic',
        once: true,
        offset: 50
    });

    // --- Hero Section Animations ---
    const heroTimeline = gsap.timeline();

    heroTimeline
        .from('.hero-bg-overlay', {
            duration: 1.5,
            opacity: 0,
            ease: 'power2.inOut'
        })
        .from('.gsap-hero-text', {
            duration: 1,
            y: 50,
            opacity: 0,
            stagger: 0.2,
            ease: 'power3.out'
        }, '-=0.5')
        .from('.gsap-hero-btns', {
            duration: 0.8,
            y: 30,
            opacity: 0,
            ease: 'back.out(1.7)'
        }, '-=0.3');

    // Hero Parallax Effect
    gsap.to('.hero', {
        backgroundPosition: "50% 100%",
        ease: "none",
        scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: true
        }
    });

    // --- Founder Section Animation ---
    gsap.from('.founder-image', {
        scrollTrigger: {
            trigger: '.founder-content',
            start: "top 70%"
        },
        x: -50,
        opacity: 0,
        duration: 1,
        ease: "power3.out"
    });

    gsap.from('.founder-text', {
        scrollTrigger: {
            trigger: '.founder-content',
            start: "top 70%"
        },
        x: 50,
        opacity: 0,
        duration: 1,
        delay: 0.2,
        ease: "power3.out"
    });

    // --- Navbar Scroll Effect ---
    const header = document.querySelector('.header');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // --- Mobile Menu Toggle ---
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const links = document.querySelectorAll('.nav-links a');

    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const icon = hamburger.querySelector('i');
        if (navLinks.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });

    // Close mobile menu when a link is clicked
    links.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            const icon = hamburger.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        });
    });

    // --- Smooth Scrolling for Anchor Links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // --- Enhanced Booking Form Handling ---
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = bookingForm.querySelector('button');
            const originalText = btn.innerText;

            // Visual feedback state
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            btn.style.opacity = '0.8';
            btn.disabled = true;

            // Collect form data
            const formData = new FormData(bookingForm);
            const booking = {
                id: Date.now(),
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                service: formData.get('service'),
                date: formData.get('date'),
                message: formData.get('message'),
                status: 'Pending',
                timestamp: new Date().toISOString()
            };

            // Save to LocalStorage (Simulating Database)
            try {
                const bookings = JSON.parse(localStorage.getItem('dd_bookings') || '[]');
                bookings.push(booking);
                localStorage.setItem('dd_bookings', JSON.stringify(bookings));

                // Simulate Network Delay
                setTimeout(() => {
                    // Success State
                    btn.innerHTML = '<i class="fas fa-check"></i> Request Sent!';
                    btn.style.backgroundColor = '#10b981'; // Green color
                    btn.style.opacity = '1';

                    // Show Toast Notification
                    showToast('Booking request received! We will contact you shortly.', 'success');

                    bookingForm.reset();

                    // Reset button after delay
                    setTimeout(() => {
                        btn.innerText = originalText;
                        btn.style.backgroundColor = '';
                        btn.disabled = false;
                    }, 3000);

                }, 1500);
            } catch (error) {
                console.error('Booking Error:', error);
                btn.innerText = 'Error. Try Again.';
                btn.style.backgroundColor = '#ef4444'; // Red color

                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.style.backgroundColor = '';
                    btn.disabled = false;
                }, 3000);
            }
        });
    }

    // Toast Notification Helper
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : '#3b82f6'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            font-weight: 600;
            transform: translateY(100px);
            opacity: 0;
            transition: all 0.3s ease;
        `;
        toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i> ${message}`;

        document.body.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.style.transform = 'translateY(0)';
            toast.style.opacity = '1';
        });

        // Remove after 4 seconds
        setTimeout(() => {
            toast.style.transform = 'translateY(100px)';
            toast.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 4000);
    }
});