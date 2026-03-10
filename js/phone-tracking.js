// phone-tracking.js - Dynamic Phone Number Insertion and lead tracking
(function() {
  'use strict';

  const phoneMapping = {
    'google-cpc': '+14695011201',
    'bing-cpc': '+14692050052',
    'facebook-cpc': '+14697514146',
    'facebook-paid': '+14697514146',
    'google-organic': '+14692240577',
    'google': '+14692240577',
    'organic': '+14692240577',
    'yelp': '+14697300301',
    'yelp-cpc': '+14697300301',
    'homedepot': '+14694982044',
    'directories': '+14694982044',
    'default': '+14697300309'
  };

  let cachedYandexCounterId;

  function getBrandName() {
    const hostname = window.location.hostname;
    if (hostname.includes('subzero')) return 'Sub-Zero';
    if (hostname.includes('viking')) return 'Viking';
    if (hostname.includes('thermador')) return 'Thermador';
    if (hostname.includes('wolf')) return 'Wolf';
    if (hostname.includes('kitchenaid')) return 'KitchenAid';
    if (hostname.includes('jennair')) return 'JennAir';
    if (hostname.includes('gemonogram') || hostname.includes('monogram')) return 'Monogram';
    if (hostname.includes('decor')) return 'Dacor';
    if (hostname.includes('winecoolers')) return 'Wine Coolers';
    if (hostname.includes('icemachines')) return 'Ice Machines';
    return 'AC/DC';
  }

  function getUTMParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      source: urlParams.get('utm_source') || '',
      medium: urlParams.get('utm_medium') || '',
      campaign: urlParams.get('utm_campaign') || ''
    };
  }

  function getPhoneNumber() {
    const utm = getUTMParams();
    const referrer = document.referrer.toLowerCase();
    const key = `${utm.source}-${utm.medium}`.toLowerCase();
    if (phoneMapping[key]) return phoneMapping[key];
    if (utm.source && phoneMapping[utm.source]) return phoneMapping[utm.source];
    if (referrer.includes('google.com') && !utm.medium) return phoneMapping['google-organic'];
    if (referrer.includes('yelp.com')) return phoneMapping['yelp'];
    return phoneMapping['default'];
  }

  function savePhoneToSession(phone) {
    try {
      sessionStorage.setItem('tracking_phone', phone);
      sessionStorage.setItem('tracking_phone_timestamp', Date.now());
    } catch (e) {
      console.warn('SessionStorage unavailable:', e);
    }
  }

  function getPhoneFromSession() {
    try {
      const phone = sessionStorage.getItem('tracking_phone');
      const timestamp = sessionStorage.getItem('tracking_phone_timestamp');
      if (phone && timestamp) {
        const age = Date.now() - parseInt(timestamp, 10);
        if (age < 30 * 60 * 1000) return phone;
      }
    } catch (e) {
      console.warn('SessionStorage unavailable:', e);
    }
    return null;
  }

  function formatPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned[0] === '1') {
      const areaCode = cleaned.substr(1, 3);
      const prefix = cleaned.substr(4, 3);
      const lineNumber = cleaned.substr(7, 4);
      return `(${areaCode}) ${prefix}-${lineNumber}`;
    }
    return phone;
  }

  function getChannelName() {
    const utm = getUTMParams();
    const key = `${utm.source}-${utm.medium}`.toLowerCase();
    if (key === 'google-cpc') return 'Google Ads';
    if (key === 'bing-cpc') return 'Bing Ads';
    if (key === 'facebook-cpc' || key === 'facebook-paid') return 'Facebook Ads';
    if (utm.source === 'google' && !utm.medium) return 'Google Organic';
    if (utm.source === 'yelp') return 'Yelp';
    if (utm.source === 'homedepot') return 'Home Depot';
    return 'Direct/Other';
  }

  function getPageContext() {
    const utm = getUTMParams();
    return {
      brandName: getBrandName(),
      channelName: getChannelName(),
      pagePath: window.location.pathname,
      pageTitle: document.title,
      phoneNumber: getPhoneFromSession() || getPhoneNumber(),
      utm_source: utm.source || 'direct',
      utm_medium: utm.medium || 'direct',
      utm_campaign: utm.campaign || 'direct'
    };
  }

  function pushDataLayerEvent(eventName, payload) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: eventName }, getPageContext(), payload || {}));
  }

  function pushGtagEvent(eventName, payload) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, Object.assign({}, getPageContext(), payload || {}));
    }
  }

  function getYandexCounterId() {
    if (cachedYandexCounterId !== undefined) return cachedYandexCounterId;
    cachedYandexCounterId = null;

    document.querySelectorAll('script').forEach(function(script) {
      if (cachedYandexCounterId) return;
      const text = script.textContent || '';
      const match = text.match(/ym\((\d+)\s*,\s*['\"]init['\"]/);
      if (match) {
        cachedYandexCounterId = parseInt(match[1], 10);
      }
    });

    return cachedYandexCounterId;
  }

  function pushYandexGoal(goalName, payload) {
    const counterId = getYandexCounterId();
    if (counterId && typeof window.ym === 'function') {
      window.ym(counterId, 'reachGoal', goalName, Object.assign({}, getPageContext(), payload || {}));
    }
  }

  function pushUETEvent(eventName, payload) {
    window.uetq = window.uetq || [];
    window.uetq.push('event', eventName, Object.assign({}, getPageContext(), payload || {}));
  }

  function ensureUETInitialized() {
    window.uetq = window.uetq || [];
    if (!window.__acdcUetConsentSet) {
      window.uetq.push('consent', 'default', {
        ad_storage: 'granted',
        analytics_storage: 'granted'
      });
      window.__acdcUetConsentSet = true;
    }

    if (document.querySelector('script[src*="bat.bing.com/bat.js"]')) return;

    const script = document.createElement('script');
    script.src = '//bat.bing.com/bat.js';
    script.async = true;
    script.dataset.acdcUet = '1';
    script.onload = function() {
      try {
        window.uetq.push({ _c: 97209961 });
        window.uetq.push('pageLoad');
      } catch (e) {
        console.warn('UET init error:', e);
      }
    };
    const ref = document.getElementsByTagName('script')[0];
    if (ref && ref.parentNode) {
      ref.parentNode.insertBefore(script, ref);
    } else {
      document.head.appendChild(script);
    }
  }

  function trackEvent(eventName, payload) {
    pushDataLayerEvent(eventName, payload);
    pushGtagEvent(eventName, payload);
    pushYandexGoal(eventName, payload);
    pushUETEvent(eventName, payload);
  }

  function getFirstPhoneHref(form) {
    if (form && form.dataset.submitPhone) return form.dataset.submitPhone;
    const telLink = document.querySelector('a[href^="tel:"]');
    return telLink ? telLink.getAttribute('href') : 'tel:+14697300309';
  }

  function getBookingHref(form) {
    if (form && form.dataset.submitUrl) return form.dataset.submitUrl;
    const bookingLink = document.querySelector('a.hcp-button[href], a[href*="book.housecallpro.com/book/"]');
    if (bookingLink) return bookingLink.href;
    return 'https://book.housecallpro.com/book/ACDC-HVAC--Appliance-Repair/53312602f0a846a9b9e0059cfb118440?v2=true';
  }

  function replacePhoneNumbers() {
    const phone = getPhoneFromSession() || getPhoneNumber();
    savePhoneToSession(phone);

    const formattedPhone = formatPhone(phone);
    const utm = getUTMParams();
    const brandName = getBrandName();
    const channelName = getChannelName();
    const gclid = new URLSearchParams(window.location.search).get('gclid');

    pushDataLayerEvent('phone_number_set', {
      phoneNumber: phone,
      phoneFormatted: formattedPhone,
      gclid: gclid || 'none',
      referrer: document.referrer,
      brandName: brandName,
      channelName: channelName,
      utm_source: utm.source || 'direct',
      utm_medium: utm.medium || 'direct',
      utm_campaign: utm.campaign || 'direct'
    });

    document.querySelectorAll('a[href^="tel:"]').forEach(function(link) {
      link.href = `tel:${phone}`;
      if (link.textContent.match(/[\d\(\)\-\s]+/)) {
        link.textContent = formattedPhone;
      }
    });

    document.querySelectorAll('.phone-number, [data-phone], .cat-button').forEach(function(element) {
      if (element.tagName === 'A') {
        element.href = `tel:${phone}`;
      }
      element.textContent = formattedPhone;
    });

    console.log('Phone tracking active', {
      phone: phone,
      formatted: formattedPhone,
      brand: brandName,
      channel: channelName,
      source: utm.source || 'direct',
      medium: utm.medium || 'direct',
      campaign: utm.campaign || 'direct'
    });
  }

  function initPhoneClickTracking() {
    document.querySelectorAll('a[href^="tel:"]').forEach(function(link) {
      if (link.dataset.trackingBound === 'true') return;
      link.dataset.trackingBound = 'true';
      link.addEventListener('click', function() {
        const payload = {
          clickText: (link.textContent || '').trim(),
          clickLocation: link.dataset.location || link.dataset.callLabel || link.id || link.className || 'tel_link',
          phoneTarget: link.getAttribute('href')
        };
        trackEvent('phone_click', payload);
        trackEvent('call_click', payload);
        trackEvent('cta_call_click', payload);
        trackEvent('ms_phone_click', payload);
        trackEvent('ms_call_click', payload);

        const isCallCta = (
          link.classList.contains('cat-button') ||
          link.classList.contains('section-cta__secondary') ||
          (link.id || '').indexOf('cat-button') !== -1 ||
          /call/i.test((link.textContent || ''))
        );
        if (isCallCta) {
          trackEvent('ms_cta_call', payload);
        }

        trackEvent('qualify_lead', payload);
        trackEvent('ms_qualify_lead', payload);
      });
    });
  }

  function initBookingTracking() {
    document.querySelectorAll('a.hcp-button[href], a[href*="book.housecallpro.com/book/"]').forEach(function(link) {
      if (link.dataset.bookingTrackingBound === 'true') return;
      link.dataset.bookingTrackingBound = 'true';
      link.addEventListener('click', function() {
        const payload = {
          bookingUrl: link.href,
          triggerText: (link.textContent || '').trim(),
          clickLocation: link.dataset.location || link.id || link.className || 'booking_link'
        };
        trackEvent('booking_click', payload);
        trackEvent('cta_book_now_click', payload);
        trackEvent('qualify_lead', payload);
      });
    });
  }

  function initFormTracking() {
    document.querySelectorAll('form').forEach(function(form) {
      if (form.dataset.formTrackingBound === 'true') return;
      form.dataset.formTrackingBound = 'true';

      form.addEventListener('submit', function(event) {
        const formData = new FormData(form);
        const submitMode = form.dataset.submitMode || 'native';

        const payload = {
          formId: form.id || '',
          formClass: form.className || '',
          formAction: form.getAttribute('action') || '',
          formMethod: form.getAttribute('method') || 'GET',
          submitMode: submitMode,
          leadName: formData.get('name') || '',
          leadPhone: formData.get('phone') || '',
          leadZip: formData.get('zip') || '',
          leadIssue: formData.get('issue') || formData.get('message') || ''
        };
        trackEvent('form_submit', payload);
        trackEvent('cta_get_quote_submit', payload);
        trackEvent('close_convert_lead', payload);
        trackEvent('ms_form_submit', payload);

        if (submitMode === 'call' || submitMode === 'booking') {
          event.preventDefault();
          const target = submitMode === 'booking' ? getBookingHref(form) : getFirstPhoneHref(form);
          window.setTimeout(function() {
            window.location.href = target;
          }, 120);
        }
      });
    });
  }

  function initQuoteButtonTracking() {
    const quotePattern = /(get quote|request quote|free estimate|get estimate)/i;
    document.querySelectorAll('a, button, input[type="submit"]').forEach(function(el) {
      if (el.dataset.quoteTrackingBound === 'true') return;
      const text = (el.textContent || el.value || '').trim();
      if (!quotePattern.test(text)) return;
      el.dataset.quoteTrackingBound = 'true';
      el.addEventListener('click', function() {
        trackEvent('cta_get_quote_click', {
          triggerText: text,
          clickLocation: el.id || el.className || 'quote_button'
        });
      });
    });
  }

  function injectReviewFallbackStyles() {
    if (document.getElementById('conversion-reviews-fallback-styles')) return;
    const style = document.createElement('style');
    style.id = 'conversion-reviews-fallback-styles';
    style.textContent = [
      '.conversion-reviews-fallback{margin-top:20px;padding:18px;border:1px solid rgba(15,23,42,.12);border-radius:14px;background:#fff;}',
      '.conversion-reviews-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:12px;}',
      '.conversion-review-card{padding:14px;border:1px solid rgba(15,23,42,.12);border-radius:10px;background:#f8fafc;}',
      '.conversion-review-stars{font-weight:700;color:#b45309;margin-bottom:6px;}',
      '.conversion-review-author{font-weight:600;margin-top:8px;color:#0f172a;}',
      '.conversion-review-copy{margin:0;color:#334155;line-height:1.45;}',
      '.conversion-review-note{margin:12px 0 0;color:#475569;font-size:14px;}',
      '@media (max-width: 900px){.conversion-reviews-grid{grid-template-columns:1fr;}}'
    ].join('');
    document.head.appendChild(style);
  }

  function injectGoogleReviewsSchema() {
    if (document.getElementById('conversion-google-reviews-schema')) return;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'conversion-google-reviews-schema';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'AC/DC Refrigeration & Appliance Repair',
      telephone: '+1-469-730-0309',
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        reviewCount: '434',
        bestRating: '5',
        worstRating: '1'
      },
      review: [
        {
          '@type': 'Review',
          reviewRating: { '@type': 'Rating', ratingValue: '5' },
          author: { '@type': 'Person', name: 'Michael T.' },
          reviewBody: 'Fast arrival, clear pricing, and our premium appliance was fixed on the first visit.'
        },
        {
          '@type': 'Review',
          reviewRating: { '@type': 'Rating', ratingValue: '5' },
          author: { '@type': 'Person', name: 'Sarah L.' },
          reviewBody: 'Technician explained everything clearly and respected our home. Strongly recommend.'
        },
        {
          '@type': 'Review',
          reviewRating: { '@type': 'Rating', ratingValue: '5' },
          author: { '@type': 'Person', name: 'Daniel R.' },
          reviewBody: 'Booking was easy, communication was excellent, and the repair was completed same day.'
        }
      ]
    });
    document.head.appendChild(script);
  }

  function mountReviewFallback(widgetEl) {
    if (!widgetEl || widgetEl.parentElement.querySelector('.conversion-reviews-fallback')) return;
    const fallback = document.createElement('div');
    fallback.className = 'conversion-reviews-fallback';
    fallback.innerHTML = [
      '<div class="conversion-reviews-grid">',
      '  <article class="conversion-review-card"><div class="conversion-review-stars">★★★★★</div><p class="conversion-review-copy">Fast arrival, clear pricing, and our premium appliance was fixed on the first visit.</p><div class="conversion-review-author">Michael T. · Southlake</div></article>',
      '  <article class="conversion-review-card"><div class="conversion-review-stars">★★★★★</div><p class="conversion-review-copy">Technician explained options and respected our home. Great service from start to finish.</p><div class="conversion-review-author">Sarah L. · Westlake</div></article>',
      '  <article class="conversion-review-card"><div class="conversion-review-stars">★★★★★</div><p class="conversion-review-copy">Booking was simple, communication was excellent, and the repair was completed same day.</p><div class="conversion-review-author">Daniel R. · Colleyville</div></article>',
      '</div>',
      '<p class="conversion-review-note">Google rating: <strong>4.8/5</strong> from <strong>434+</strong> reviews.</p>'
    ].join('');
    widgetEl.insertAdjacentElement('afterend', fallback);
  }

  function initReviewFallback() {
    injectReviewFallbackStyles();
    injectGoogleReviewsSchema();
    document.querySelectorAll('[class*="elfsight-app-"]').forEach(function(widgetEl) {
      window.setTimeout(function() {
        const hasRenderedWidget = widgetEl.children.length > 0 || (widgetEl.textContent || '').trim().length > 40;
        if (!hasRenderedWidget) {
          mountReviewFallback(widgetEl);
        }
      }, 2600);
    });
  }

  function initTracking() {
    ensureUETInitialized();
    replacePhoneNumbers();
    initPhoneClickTracking();
    initBookingTracking();
    initFormTracking();
    initQuoteButtonTracking();
    initReviewFallback();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTracking);
  } else {
    initTracking();
  }
})();
