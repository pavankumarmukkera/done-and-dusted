
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

    // --- Section Headers Animation ---
    gsap.utils.toArray('.section-header').forEach(header => {
        gsap.from(header, {
            scrollTrigger: {
                trigger: header,
                start: "top 80%",
                toggleActions: "play none none reverse"
            },
            y: 30,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out"
        });
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

    // --- Service Card Toggle ---
    const serviceCards = document.querySelectorAll('.service-card');

    function toggleServiceCard(card) {
        const isExpanded = card.classList.contains('expanded');

        serviceCards.forEach(c => {
            c.classList.remove('expanded');
            c.setAttribute('aria-expanded', 'false');
            const label = c.querySelector('.service-toggle span');
            if (label) label.textContent = 'Tap to read more';
        });

        if (!isExpanded) {
            card.classList.add('expanded');
            card.setAttribute('aria-expanded', 'true');
            const label = card.querySelector('.service-toggle span');
            if (label) label.textContent = 'Tap to hide details';
        }
    }

    serviceCards.forEach(card => {
        card.addEventListener('click', () => toggleServiceCard(card));
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleServiceCard(card);
            }
        });
    });

    // --- Enhanced Booking Form Handling ---
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formStatus = document.getElementById('formStatus');
            const btn = bookingForm.querySelector('button');
            const originalText = btn.innerText;

            // Collect form data
            const formData = new FormData(bookingForm);
            const booking = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                service: formData.get('service'),
                date: formData.get('date'),
                notes: formData.get('message') || '',
                status: 'Pending'
            };

            const setFormStatus = (message, type = 'info') => {
                if (!formStatus) return;
                formStatus.textContent = message;
                formStatus.className = `form-status ${type === 'error' ? 'error' : type === 'success' ? 'success' : ''}`;
            };

            // Client-side validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const phoneDigits = (booking.phone || '').replace(/\D/g, '');

            if (!booking.name || !booking.email || !booking.phone || !booking.service || !booking.date) {
                setFormStatus('Please complete all required fields.', 'error');
                return;
            }

            if (!emailRegex.test(booking.email)) {
                setFormStatus('Enter a valid email address.', 'error');
                return;
            }

            if (phoneDigits.length < 10 || phoneDigits.length > 15) {
                setFormStatus('Enter a valid phone number (10–15 digits).', 'error');
                return;
            }

            // Visual feedback state
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            btn.style.opacity = '0.8';
            btn.disabled = true;
            setFormStatus('Submitting your request...', 'info');

            // Save to Supabase Database
            try {
                const { error } = await supabase
                    .from('bookings')
                    .insert([booking]);

                if (error) throw error;

                // Success State
                btn.innerHTML = '<i class="fas fa-check"></i> Request Sent!';
                btn.style.backgroundColor = '#10b981'; // Green color
                btn.style.opacity = '1';
                setFormStatus('Request received! We will contact you shortly.', 'success');

                // Show Toast Notification
                showToast('Booking request received! We will contact you shortly.', 'success');

                bookingForm.reset();

                // Reset button after delay
                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.style.backgroundColor = '';
                    btn.disabled = false;
                    setFormStatus('');
                }, 3000);

            } catch (error) {
                console.error('Booking Error:', error);
                btn.innerHTML = '<i class="fas fa-times"></i> Error. Try Again.';
                btn.style.backgroundColor = '#ef4444'; // Red color
                setFormStatus('Failed to submit booking. Please try again.', 'error');

                showToast('Failed to submit booking. Please try again.', 'error');

                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.style.backgroundColor = '';
                    btn.disabled = false;
                    setFormStatus('');
                }, 3000);
            }
        });
    }

    // Toast Notification Helper
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const bgColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6';
        const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';

        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${bgColor};
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
        toast.innerHTML = `<i class="fas ${icon}"></i> ${message}`;

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
    // --- Chat Widget Logic ---
    const chatWidget = document.getElementById('chat-widget');
    const chatToggle = document.getElementById('chat-toggle');
    const chatWindow = document.getElementById('chat-window');
    const chatClose = document.getElementById('chat-close');
    const chatMessages = document.getElementById('chat-messages');
    const chatInputArea = document.getElementById('chat-input-area');

    let chatState = {
        step: 'init',
        data: {}
    };

    if (chatWidget) {
        // Auto-open chat after 2 seconds
        setTimeout(() => {
            if (!chatWindow.classList.contains('active')) {
                chatWindow.classList.add('active');
                startConversation();
            }
        }, 2000);

        // Toggle Chat Window
        chatToggle.addEventListener('click', () => {
            chatWindow.classList.toggle('active');
            if (chatWindow.classList.contains('active') && chatMessages.children.length === 0) {
                startConversation();
            }
        });

        chatClose.addEventListener('click', () => {
            chatWindow.classList.remove('active');
        });

        // Helper: Add Message
        function addMessage(text, sender = 'bot') {
            const msgDiv = document.createElement('div');
            msgDiv.className = `message ${sender}`;
            msgDiv.innerText = text;
            chatMessages.appendChild(msgDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        // Helper: Clear Input Area
        function clearInputArea() {
            chatInputArea.innerHTML = '';
        }

        // Helper: Show Options
        function showOptions(options) {
            clearInputArea();
            const optionsDiv = document.createElement('div');
            optionsDiv.className = 'chat-options';

            options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'chat-option-btn';
                btn.innerText = opt.label;
                btn.onclick = () => handleInput(opt.value, opt.label);
                optionsDiv.appendChild(btn);
            });

            chatInputArea.appendChild(optionsDiv);
        }

        // Helper: Show Input Field
        function showInput(type = 'text', placeholder = '') {
            clearInputArea();
            const group = document.createElement('div');
            group.className = 'chat-input-group';

            const input = document.createElement(type === 'textarea' ? 'textarea' : 'input');
            input.className = 'chat-input-field';
            if (type !== 'textarea') input.type = type;
            input.placeholder = placeholder;

            const sendBtn = document.createElement('button');
            sendBtn.className = 'chat-send-btn';
            sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';

            const submit = () => {
                const val = input.value.trim();
                if (val) handleInput(val);
            };

            sendBtn.onclick = submit;
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                }
            });

            group.appendChild(input);
            group.appendChild(sendBtn);
            chatInputArea.appendChild(group);
            input.focus();
        }

        // Start Conversation
        function startConversation() {
            chatState = { step: 'init', data: {} };
            chatMessages.innerHTML = '';
            addMessage("Hello! How can we help you today?");
            setTimeout(() => {
                showOptions([
                    { label: 'Request a Quote', value: 'quote' },
                    { label: 'Contact Us', value: 'contact' },
                    { label: 'Bulk Enquiry', value: 'bulk' }
                ]);
            }, 500);
        }

        // Handle User Input
        async function handleInput(value, label = null) {
            // Display user choice
            addMessage(label || value, 'user');
            clearInputArea();

            // Process based on current step
            setTimeout(async () => {
                switch (chatState.step) {
                    case 'init':
                        if (value === 'contact') {
                            addMessage("You can reach us at:");
                            addMessage("📞 01923 549026");
                            addMessage("✉️ info@doneanddusted.co.uk");
                            showOptions([{ label: 'Start Over', value: 'restart' }]);
                            chatState.step = 'finished';
                        } else {
                            // Quote or Bulk
                            chatState.data.type = value === 'bulk' ? 'Bulk Enquiry' : 'Quote Request';
                            chatState.step = 'name';
                            addMessage("Great! Let's get some details. What is your full name?");
                            showInput('text', 'John Doe');
                        }
                        break;

                    case 'name':
                        chatState.data.name = value;
                        chatState.step = 'email';
                        addMessage(`Nice to meet you, ${value}. What is your email address?`);
                        showInput('email', 'john@example.com');
                        break;

                    case 'email':
                        if (!value.includes('@')) {
                            addMessage("Please enter a valid email address.");
                            showInput('email', 'john@example.com');
                            return;
                        }
                        chatState.data.email = value;
                        chatState.step = 'phone';
                        addMessage("And your phone number?");
                        showInput('tel', '07700 900000');
                        break;

                    case 'phone':
                        chatState.data.phone = value;
                        chatState.step = 'service';
                        addMessage("Which service do you require?");
                        showOptions([
                            { label: 'Domestic Cleaning', value: 'Domestic Cleaning' },
                            { label: 'Commercial Cleaning', value: 'Commercial Cleaning' },
                            { label: 'Deep Clean', value: 'Deep Clean' },
                            { label: 'End of Tenancy', value: 'End of Tenancy' },
                            { label: 'Other', value: 'Other' }
                        ]);
                        break;

                    case 'service':
                        chatState.data.service = value;
                        chatState.step = 'date';
                        addMessage("When would you like this service? (Preferred Date)");
                        showInput('date');
                        break;

                    case 'date':
                        chatState.data.date = value;
                        chatState.step = 'details';
                        addMessage("Any additional details we should know?");
                        showInput('textarea', 'Number of rooms, specific requests...');
                        break;

                    case 'details':
                        chatState.data.notes = value;
                        chatState.step = 'submitting';
                        addMessage("Thank you! Submitting your request...");

                        // Submit to Supabase
                        try {
                            const booking = {
                                name: chatState.data.name,
                                email: chatState.data.email,
                                phone: chatState.data.phone,
                                service: chatState.data.service,
                                date: chatState.data.date,
                                notes: `[${chatState.data.type}] ${chatState.data.notes}`,
                                status: 'Pending'
                            };

                            const { error } = await supabase
                                .from('bookings')
                                .insert([booking]);

                            if (error) throw error;

                            addMessage("✅ Request received! We will be in touch shortly.");
                            showOptions([{ label: 'Close Chat', value: 'close' }]);
                        } catch (err) {
                            console.error(err);
                            addMessage("❌ There was an error submitting your request. Please try again or call us.");
                            showOptions([{ label: 'Try Again', value: 'restart' }]);
                        }
                        break;

                    case 'finished':
                        if (value === 'restart') startConversation();
                        break;

                    default:
                        if (value === 'close') {
                            chatWindow.classList.remove('active');
                        } else if (value === 'restart') {
                            startConversation();
                        }
                        break;
                }
            }, 500);
        }
    }
});