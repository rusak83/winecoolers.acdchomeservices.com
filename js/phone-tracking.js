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
        trackEvent('phone_click', {
          clickText: (link.textContent || '').trim(),
          clickLocation: link.dataset.location || link.dataset.callLabel || link.id || link.className || 'tel_link',
          phoneTarget: link.getAttribute('href')
        });
      });
    });
  }

  function initBookingTracking() {
    document.querySelectorAll('a.hcp-button[href], a[href*="book.housecallpro.com/book/"]').forEach(function(link) {
      if (link.dataset.bookingTrackingBound === 'true') return;
      link.dataset.bookingTrackingBound = 'true';
      link.addEventListener('click', function() {
        trackEvent('booking_click', {
          bookingUrl: link.href,
          triggerText: (link.textContent || '').trim(),
          clickLocation: link.dataset.location || link.id || link.className || 'booking_link'
        });
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

        trackEvent('form_submit', {
          formId: form.id || '',
          formClass: form.className || '',
          formAction: form.getAttribute('action') || '',
          formMethod: form.getAttribute('method') || 'GET',
          submitMode: submitMode,
          leadName: formData.get('name') || '',
          leadPhone: formData.get('phone') || '',
          leadZip: formData.get('zip') || '',
          leadIssue: formData.get('issue') || formData.get('message') || ''
        });

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

  function initTracking() {
    replacePhoneNumbers();
    initPhoneClickTracking();
    initBookingTracking();
    initFormTracking();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTracking);
  } else {
    initTracking();
  }
})();
